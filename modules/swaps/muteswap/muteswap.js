import Web3 from 'web3';

import { MUTE_ROUTER_CONTRACT_ADDR } from './muteswap-contract.const.js';
import { MUTE_SUPPORTED_COINS } from './muteswap-supported-coins.const.js';

import { ERA } from '../../../utils/const/chains.const.js';

import {
  approveToken,
  getAbiByRelativePath,
  getAmountWithPrecision,
  getBalanceWithTokenContract,
  getMinOutAmount,
  getSwapDeadline,
  getTokenContractsFromCode,
  randomFloatInRange,
} from '../../../utils/helpers/index.js';
import { zkSyncEraTokenCodeToContractMapper } from '../../../utils/const/token-contacts/era.js';

import { maxPriorityFeePerGas } from '../../../config.js';

export class MuteSwap {
  constructor(privateKey) {
    this.protocolName = 'Mute';
    this.protocolRouterContract = MUTE_ROUTER_CONTRACT_ADDR;
    this.supportedCoins = MUTE_SUPPORTED_COINS;

    this.chain = ERA;
    this.web3 = new Web3(this.chain.rpc);

    this.privateKey = privateKey;
    this.account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
    this.walletAddress = this.account.address;
  }

  async swap(fromToken, toToken, amountFrom, amountTo) {
    if (!this.supportedCoins.includes(fromToken) || !this.supportedCoins.includes(toToken)) {
      `ZkSync AIO - ${this.protocolName}. ${this.walletAddress}: Not supported token pair ${fromToken}->${toToken}`;
      return false;
    }

    if (fromToken === toToken) {
      console.error(
        `ZkSync AIO - ${this.protocolName}. ${this.walletAddress}: Somehow same tokens set to be swapped: ${fromToken}`
      );
      return false;
    }

    const amountToSwap = randomFloatInRange(amountFrom, amountTo, 6);

    const [fromTokenContractAddress, toTokenContractAddress] = getTokenContractsFromCode(
      [fromToken, toToken],
      this.chain.name,
      this.web3
    );

    let balanceInFromToken;

    try {
      if (fromToken === 'ETH') {
        balanceInFromToken = await this.web3.eth.getBalance(this.walletAddress);
      } else {
        balanceInFromToken = await getBalanceWithTokenContract(fromTokenContractAddress, this.walletAddress, this.web3);
      }

      const amountWithPrecision = await getAmountWithPrecision(fromTokenContractAddress, amountToSwap, this.web3);
      if (amountWithPrecision > balanceInFromToken) {
        console.error(
          `ZkSync AIO - ${this.protocolName}. ${
            this.walletAddress
          }: Not enough money in the token ${fromToken}. Wanted -> ${amountToSwap} ${fromToken.toUpperCase()}, Balance -> ${balanceInFromToken} ${fromToken.toUpperCase()}`
        );
      }

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

      const minOutAmount = await getMinOutAmount(fromToken, toToken, amountToSwap);
      const minOutAmountWithPrecision = (
        await getAmountWithPrecision(toTokenContractAddress, minOutAmount, this.web3)
      ).toString();

      const swapDeadline = await getSwapDeadline(this.web3);

      const path = [fromTokenContractAddress, toTokenContractAddress];

      // currently mute supports only USDC token as stable, so check can be more complicated later
      const usdcContractAddress = zkSyncEraTokenCodeToContractMapper.USDC;

      const stablesInThePath = [
        fromTokenContractAddress === usdcContractAddress,
        toTokenContractAddress === usdcContractAddress,
      ];

      const muteRouterAbi = getAbiByRelativePath('./utils/abi/muteRouter.json');
      const muteRouter = new this.web3.eth.Contract(muteRouterAbi, this.protocolRouterContract);

      let swapFunctionCall;

      if (fromToken === 'ETH') {
        swapFunctionCall = muteRouter.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(
          minOutAmountWithPrecision,
          path,
          this.walletAddress,
          swapDeadline,
          stablesInThePath
        );
      } else if (toToken === 'ETH') {
        swapFunctionCall = muteRouter.methods.swapExactTokensForETHSupportingFeeOnTransferTokens(
          amountWithPrecision,
          minOutAmountWithPrecision,
          path,
          this.walletAddress,
          swapDeadline,
          stablesInThePath
        );
      } else {
        swapFunctionCall = muteRouter.methods.swapExactTokensForTokensSupportingFeeOnTransferTokens(
          amountWithPrecision,
          minOutAmountWithPrecision,
          path,
          this.walletAddress,
          swapDeadline,
          stablesInThePath
        );
      }

      const estimatedGas = await swapFunctionCall.estimateGas({
        from: this.walletAddress,
        value: fromToken === 'ETH' ? amountWithPrecision.toString() : 0,
        maxPriorityFeePerGas,
      });

      const tx = {
        from: this.walletAddress,
        to: this.protocolRouterContract,
        value: fromToken === 'ETH' ? amountWithPrecision.toString() : 0,
        nonce: await this.web3.eth.getTransactionCount(this.walletAddress),
        maxPriorityFeePerGas,
        gas: estimatedGas,
        data: swapFunctionCall.encodeABI(),
      };

      const signedTx = await this.web3.eth.accounts.signTransaction(tx, this.privateKey);
      const sendTransactionResult = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);

      console.log(
        `ZkSync AIO - ${this.protocolName}. ${this.walletAddress}: ${amountToSwap} ${fromToken} => ${toToken} | TX: ${this.chain.explorer}/${sendTransactionResult.transactionHash}`
      );

      return sendTransactionResult;
    } catch (e) {
      if (e.message.includes('insufficient funds')) {
        const [balance, fee, value] = extractNumbersFromString(e.message);
        const feeInEther = this.web3.utils.fromWei(fee, 'ether');
        const balanceInEther = this.web3.utils.fromWei(balance, 'ether');
        const valueInEther = this.web3.utils.fromWei(value, 'ether');

        console.error(
          `ZkSync AIO - ${this.protocolName}. ${this.walletAddress}: ${amountToSwap} ${fromToken} => ${toToken} | Insufficient funds for transaction. Fee - ${feeInEther}, Value - ${valueInEther}, Balance - ${balanceInEther}`
        );
      } else {
        console.error(e);
      }
    }
  }
}
