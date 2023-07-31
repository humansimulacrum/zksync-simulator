import Web3 from 'web3';

import { SPACEFI_ROUTER_CONTRACT_ADDR } from './spacefi-contract.const.js';
import { SPACEFI_SUPPORTED_COINS } from './spacefi-supported-coins.const.js';

import { ERA } from '../../../utils/const/chains.const.js';
import { maxPriorityFeePerGas } from '../../../config.js';

import {
  approveToken,
  extractNumbersFromString,
  getAbiByRelativePath,
  getAmountWithPrecision,
  getBalanceWithTokenContract,
  getMinOutAmount,
  getSwapDeadline,
  getTokenContractsFromCode,
  randomFloatInRange,
} from '../../../utils/helpers/index.js';

export class SpaceFiSwap {
  constructor(privateKey) {
    this.protocolName = 'SpaceFi';

    this.protocolRouterContract = SPACEFI_ROUTER_CONTRACT_ADDR;
    this.supportedCoins = SPACEFI_SUPPORTED_COINS;

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

    try {
      const [fromTokenContractAddress, toTokenContractAddress] = getTokenContractsFromCode(
        [fromToken, toToken],
        this.chain.name,
        this.web3
      );

      let balanceInFromToken;

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

      const spaceFiAbi = getAbiByRelativePath('./utils/abi/spaceFiRouter.json');
      const spaceFiRouter = new this.web3.eth.Contract(spaceFiAbi, this.protocolRouterContract);

      let swapFunctionCall;

      if (fromToken === 'ETH') {
        swapFunctionCall = spaceFiRouter.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(
          minOutAmountWithPrecision,
          path,
          this.walletAddress,
          swapDeadline
        );
      } else if (toToken === 'ETH') {
        swapFunctionCall = spaceFiRouter.methods.swapExactTokensForETHSupportingFeeOnTransferTokens(
          amountWithPrecision,
          minOutAmountWithPrecision,
          path,
          this.walletAddress,
          swapDeadline
        );
      } else {
        swapFunctionCall = spaceFiRouter.methods.swapExactTokensForTokensSupportingFeeOnTransferTokens(
          amountWithPrecision,
          minOutAmountWithPrecision,
          path,
          this.walletAddress,
          swapDeadline
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
