import Web3 from 'web3';
import { ethers } from 'ethers';

import { SYNCSWAP_CLASSIC_POOL_FACTORY_ADDR, SYNCSWAP_ROUTER_ADDR } from './syncswap-contract.const.js';
import { SYNCSWAP_SUPPORTED_COINS } from './syncswap-supported-coins.const.js';

import { ERA } from '../../../utils/const/chains.const.js';

import { maxPriorityFeePerGas } from '../../../config.js';

import {
  approveToken,
  getAbiByRelativePath,
  getAmountInReadableFormat,
  getAmountWithPrecision,
  getBalanceWithTokenContract,
  getMinOutAmount,
  getSwapDeadline,
  getTokenContractsFromCode,
  randomFloatInRange,
} from '../../../utils/helpers/index.js';

export class SyncSwap {
  constructor(privateKey) {
    this.protocolName = 'SyncSwap';

    this.protocolRouterContract = SYNCSWAP_ROUTER_ADDR;
    this.supportedCoins = SYNCSWAP_SUPPORTED_COINS;

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

    const syncSwapClassicPoolFactoryAbi = getAbiByRelativePath('./utils/abi/syncSwapClassicPoolFactory.json');

    const classicPoolFactory = new this.web3.eth.Contract(
      syncSwapClassicPoolFactoryAbi,
      SYNCSWAP_CLASSIC_POOL_FACTORY_ADDR
    );

    try {
      const poolAddress = await classicPoolFactory.methods
        .getPool(fromTokenContractAddress, toTokenContractAddress)
        .call();

      if (poolAddress === ethers.constants.AddressZero) {
        console.error(
          `ZkSync AIO - ${this.protocolName}. ${this.walletAddress}: There aren't any pools available for those tokens ${fromToken} => ${toToken}`
        );
        return false;
      }

      let fromTokenWalletInfo;

      if (fromToken === 'ETH') {
        fromTokenWalletInfo = { tokenBalance: await this.web3.eth.getBalance(this.walletAddress), decimals: 18 };
      } else {
        fromTokenWalletInfo = await getBalanceWithTokenContract(
          fromTokenContractAddress,
          this.walletAddress,
          this.web3
        );
      }

      const amountWithPrecision = await getAmountWithPrecision(fromTokenContractAddress, amountToSwap, this.web3);

      const readableAmount = getAmountInReadableFormat(fromTokenWalletInfo);
      if (amountWithPrecision > fromTokenWalletInfo.tokenBalance) {
        console.error(
          `ZkSync AIO - ${this.protocolName}. ${
            this.walletAddress
          }: Not enough money in the token ${fromToken}. Wanted -> ${amountToSwap} ${fromToken.toUpperCase()}, Balance -> ${readableAmount} ${fromToken.toUpperCase()}`
        );
      }

      const encoder = new ethers.utils.AbiCoder();

      // swapData => [tokenIn, addressOfTheRecipient, withdrawMode]
      // https://discord.com/channels/953301763811840000/1083613544832041090/1083623247930724393
      const swapData = encoder.encode(
        ['address', 'address', 'uint8'],
        [fromTokenContractAddress, this.walletAddress, 1]
      );

      const steps = [
        {
          pool: poolAddress,
          data: swapData,
          callback: ethers.constants.AddressZero,
          callbackData: '0x',
        },
      ];

      const paths = [
        {
          steps: steps,
          tokenIn: fromToken === 'ETH' ? ethers.constants.AddressZero : fromTokenContractAddress,
          amountIn: amountWithPrecision,
        },
      ];

      const routerAbi = getAbiByRelativePath('./utils/abi/syncSwapRouter.json');
      const routerContractInstance = new this.web3.eth.Contract(routerAbi, this.protocolRouterContract);

      if (fromToken !== 'ETH') {
        await approveToken(
          amountWithPrecision,
          this.privateKey,
          this.chain,
          fromTokenContractAddress,
          SYNCSWAP_ROUTER_ADDR,
          this.walletAddress,
          this.web3
        );
      }

      const minOutAmount = await getMinOutAmount(fromToken, toToken, amountToSwap);
      const minOutAmountWithPrecision = await getAmountWithPrecision(toTokenContractAddress, minOutAmount, this.web3);

      const swapDeadline = await getSwapDeadline(this.web3);

      const swapFunctionCall = routerContractInstance.methods.swap(
        paths,
        minOutAmountWithPrecision.toString(),
        swapDeadline
      );

      const estimatedGas = await swapFunctionCall.estimateGas({
        from: this.walletAddress,
        value: fromToken === 'ETH' ? amountWithPrecision.toString() : 0,
        maxPriorityFeePerGas,
      });

      const tx = {
        from: this.walletAddress,
        to: SYNCSWAP_ROUTER_ADDR,
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
