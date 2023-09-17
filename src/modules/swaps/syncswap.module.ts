import Web3 from 'web3';

import { getAbiByRelativePath, getSwapDeadline } from '../../utils/helpers';
import { ethers } from 'ethers';
import { Swap } from './swap.module.ts';

// those contracts were taken from https://syncswap.gitbook.io/api-documentation/resources/smart-contract
export const SYNCSWAP_CLASSIC_POOL_FACTORY_ADDR = Web3.utils.toChecksumAddress(
  '0xf2dad89f2788a8cd54625c60b55cd3d2d0aca7cb'
);
export const SYNCSWAP_ROUTER_ADDR = Web3.utils.toChecksumAddress('0x2da10A1e27bF85cEdD8FFb1AbBe97e53391C0295');
export const SYNCSWAP_SUPPORTED_COINS = ['ETH', 'USDC', 'WBTC'];

export class SyncSwap extends Swap {
  constructor(privateKey) {
    super(privateKey, 'SyncSwap', SYNCSWAP_ROUTER_ADDR, SYNCSWAP_SUPPORTED_COINS);
  }

  async swap(fromToken, toToken, amountFrom, amountTo) {
    try {
      const {
        fromTokenContractAddress,
        toTokenContractAddress,
        amountToSwap,
        amountWithPrecision,
        minOutAmountWithPrecision,
      } = await this.prepareTokens(fromToken, toToken, amountFrom, amountTo);

      const syncSwapClassicPoolFactoryAbi = getAbiByRelativePath('../abi/syncSwapClassicPoolFactory.json');
      const classicPoolFactory = new this.web3.eth.Contract(
        syncSwapClassicPoolFactoryAbi,
        SYNCSWAP_CLASSIC_POOL_FACTORY_ADDR
      );

      const poolAddress = await classicPoolFactory.methods
        .getPool(fromTokenContractAddress, toTokenContractAddress)
        .call();

      if (poolAddress === ethers.constants.AddressZero) {
        console.error(
          `ZkSync AIO - ${this.protocolName}. ${this.walletAddress}: There aren't any pools available for those tokens ${fromToken} => ${toToken}`
        );
        return false;
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

      const routerAbi = getAbiByRelativePath('../abi/syncSwapRouter.json');
      const routerContractInstance = new this.web3.eth.Contract(routerAbi, this.protocolRouterContract);

      const swapDeadline = await getSwapDeadline(this.web3);

      const swapFunctionCall = routerContractInstance.methods.swap(
        paths,
        minOutAmountWithPrecision.toString(),
        swapDeadline
      );

      const transactionResult = await this.sendTransaction(
        swapFunctionCall,
        fromToken,
        toToken,
        amountWithPrecision,
        amountToSwap
      );

      return transactionResult;
    } catch (e: any) {
      this.errorHandler(e, fromToken, toToken);
    }
  }
}
