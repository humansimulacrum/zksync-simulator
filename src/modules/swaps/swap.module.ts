import Web3 from 'web3';
import { Account } from 'web3-core';

import { Chain, ERA } from '../../utils/const/chains.const';
import {
  approveToken,
  getAmountWithPrecision,
  getBalanceAndDecimalsWithTokenContract,
  getMinOutAmount,
  randomFloatInRange,
} from '../../utils/helpers';
import { getTokenContractsFromCode } from '../../utils/helpers/token-contract.helper';
import { extractNumbersFromString } from '../../utils/helpers/string.helper';
import { log } from '../../utils/logger/logger';

export class Swap {
  protocolName: string;
  protocolRouterContract: string;

  supportedCoins: string[];
  chain: Chain;
  web3: Web3;

  privateKey: string;
  account: Account;
  walletAddress: string;

  constructor(privateKey: string, protocolName: string, protocolRouterContract: string, supportedCoins: string[]) {
    this.protocolName = protocolName;
    this.protocolRouterContract = protocolRouterContract;
    this.supportedCoins = supportedCoins;

    this.chain = ERA;
    this.web3 = new Web3(this.chain.rpc);

    this.privateKey = privateKey;
    this.account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
    this.walletAddress = this.account.address;
  }

  async prepareTokens(fromToken: string, toToken: string, amountFrom, amountTo) {
    if (!this.supportedCoins.includes(fromToken) || !this.supportedCoins.includes(toToken)) {
      throw new Error(`Not supported token pair ${fromToken}->${toToken}`);
    }

    if (fromToken === toToken) {
      throw new Error(`Somehow same tokens set to be swapped: ${fromToken}`);
    }

    const amountToSwap = randomFloatInRange(amountFrom, amountTo, 10);

    const [fromTokenContractAddress, toTokenContractAddress] = getTokenContractsFromCode(
      [fromToken, toToken],
      this.chain.name,
      this.web3
    );

    let balanceInFromToken;

    if (fromToken === 'ETH') {
      balanceInFromToken = await this.web3.eth.getBalance(this.walletAddress);
    } else {
      const { tokenBalance } = await getBalanceAndDecimalsWithTokenContract(
        fromTokenContractAddress,
        this.walletAddress,
        this.web3
      );

      balanceInFromToken = tokenBalance;
    }

    const amountWithPrecision = String(await getAmountWithPrecision(fromTokenContractAddress, amountToSwap, this.web3));

    if (Number(amountWithPrecision) > Number(balanceInFromToken)) {
      throw new Error(
        `Not enough money in the token ${fromToken}. Wanted -> ${amountToSwap} ${fromToken.toUpperCase()}, Balance -> ${Web3.utils.fromWei(
          balanceInFromToken,
          'ether'
        )} ${fromToken.toUpperCase()}`
      );
    }

    const minOutAmount = await getMinOutAmount(fromToken, toToken, amountToSwap);
    const minOutAmountWithPrecision = (
      await getAmountWithPrecision(toTokenContractAddress, minOutAmount, this.web3)
    ).toString();

    if (fromToken !== 'ETH') {
      await approveToken(
        amountWithPrecision,
        this.privateKey,
        this.chain,
        fromTokenContractAddress,
        this.protocolRouterContract,
        this.walletAddress,
        this.web3
      );
    }

    return {
      fromTokenContractAddress,
      toTokenContractAddress,
      amountToSwap,
      amountWithPrecision,
      minOutAmountWithPrecision,
    };
  }

  async sendTransaction(swapFunctionCall, fromToken, toToken, amountWithPrecision, amountToSwap) {
    const estimatedGas = await swapFunctionCall.estimateGas({
      from: this.walletAddress,
      value: fromToken === 'ETH' ? amountWithPrecision.toString() : 0,
    });

    const tx = {
      from: this.walletAddress,
      to: this.protocolRouterContract,
      value: fromToken === 'ETH' ? amountWithPrecision.toString() : 0,
      nonce: await this.web3.eth.getTransactionCount(this.walletAddress),
      gas: estimatedGas,
      data: swapFunctionCall.encodeABI(),
    };

    const signedTx = await this.web3.eth.accounts.signTransaction(tx, this.privateKey);
    if (!signedTx || !signedTx.rawTransaction) {
      throw new Error('Transaction is not generated');
    }

    const sendTransactionResult = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    log(
      this.protocolName,
      `${this.walletAddress}: ${amountToSwap} ${fromToken} => ${toToken} | TX: ${this.chain.explorer}/${sendTransactionResult.transactionHash}`
    );

    return sendTransactionResult;
  }

  errorHandler(e, fromToken, toToken) {
    if (e.message.includes('insufficient funds')) {
      const [balance, fee, value] = extractNumbersFromString(e.message);
      const feeInEther = this.web3.utils.fromWei(fee, 'ether');
      const balanceInEther = this.web3.utils.fromWei(balance, 'ether');
      const valueInEther = this.web3.utils.fromWei(value, 'ether');

      log(
        this.protocolName,
        `${this.walletAddress}: ${fromToken} => ${toToken} | Insufficient funds for transaction. Fee - ${feeInEther}, Value - ${valueInEther}, Balance - ${balanceInEther}`
      );
    } else {
      log(this.protocolName, `${this.walletAddress}. ${e}`);
    }
  }
}
