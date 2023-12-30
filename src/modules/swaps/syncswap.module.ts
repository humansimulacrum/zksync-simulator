import Web3 from 'web3';

import { getAbiByRelativePath, logWithFormatting } from '../../utils/helpers';
import { ethers } from 'ethers';
import { Swap } from './swap.module';
import { SwapCalculator } from './swap-calculator.module';
import { FunctionCall, TokenSymbol } from '../../utils/types';
import { GenerateFunctionCallInput } from '../../utils/interfaces';
import { Token } from '../../entity';
import { ActionType } from '../../utils/enums/action-type.enum';

// those contracts were taken from https://syncswap.gitbook.io/api-documentation/resources/smart-contract
export const SYNCSWAP_CLASSIC_POOL_FACTORY_ADDR = Web3.utils.toChecksumAddress(
  '0xf2dad89f2788a8cd54625c60b55cd3d2d0aca7cb'
);
export class SyncSwap extends Swap {
  constructor(privateKey: string) {
    super(privateKey, ActionType.SyncSwap);
  }

  async generateFunctionCall(functionCallInput: GenerateFunctionCallInput): Promise<FunctionCall> {
    const { fromToken, toToken, amountWithPrecision, minOutAmountWithPrecision, swapDeadline } = functionCallInput;
    const poolAddress = await this.getPoolAddress(fromToken, toToken);

    const encoder = new ethers.utils.AbiCoder();

    // swapData => [tokenIn, addressOfTheRecipient, withdrawMode]
    // https://discord.com/channels/953301763811840000/1083613544832041090/1083623247930724393
    const swapData = encoder.encode(
      ['address', 'address', 'uint8'],
      [fromToken.contractAddress, this.walletAddress, 1]
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
        tokenIn: fromToken.symbol === 'ETH' ? ethers.constants.AddressZero : fromToken.contractAddress,
        amountIn: amountWithPrecision,
      },
    ];

    const routerAbi = getAbiByRelativePath('../abi/syncSwapRouter.json');
    const routerContractInstance = new this.web3.eth.Contract(routerAbi, this.protocolRouterContract);

    return routerContractInstance.methods.swap(paths, minOutAmountWithPrecision.toString(), swapDeadline);
  }

  private async getPoolAddress(fromToken: Token, toToken: Token) {
    const syncSwapClassicPoolFactoryAbi = getAbiByRelativePath('../abi/syncSwapClassicPoolFactory.json');
    const classicPoolFactory = new this.web3.eth.Contract(
      syncSwapClassicPoolFactoryAbi,
      SYNCSWAP_CLASSIC_POOL_FACTORY_ADDR
    );

    const poolAddress = await classicPoolFactory.methods
      .getPool(fromToken.contractAddress, toToken.contractAddress)
      .call();

    if (poolAddress === ethers.constants.AddressZero) {
      logWithFormatting(
        this.protocolName,
        `${this.walletAddress}: There aren't any pools available for those tokens ${fromToken.symbol} => ${toToken.symbol}`
      );
      throw new Error(`There aren't any pools available for those tokens ${fromToken.symbol} => ${toToken.symbol}`);
    }

    return poolAddress;
  }

  async createSwapCalculator(): Promise<SwapCalculator> {
    return SwapCalculator.create(this);
  }
}
