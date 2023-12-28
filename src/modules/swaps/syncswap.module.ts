import { logWithFormatting } from '../../utils/helpers';
import { ethers } from 'ethers';
import { Swap } from './swap.module';
import { SwapCalculator } from './swap-calculator.module';
import { FunctionCall } from '../../utils/types';
import { GenerateFunctionCallInput } from '../../utils/interfaces';
import { Token } from '../../entity';
import { ActionType } from '../../utils/enums/action-type.enum';
import { toChecksumAddress } from 'web3-utils';

// those contracts were taken from https://syncswap.gitbook.io/api-documentation/resources/smart-contract
export const SYNCSWAP_CLASSIC_POOL_FACTORY_ADDR = toChecksumAddress('0xf2dad89f2788a8cd54625c60b55cd3d2d0aca7cb');
export class SyncSwap extends Swap {
  constructor(privateKey: string) {
    super(privateKey, ActionType.SyncSwap);
  }

  async generateFunctionCall(functionCallInput: GenerateFunctionCallInput): Promise<FunctionCall> {
    const { fromToken, toToken, amountWithPrecision, minOutAmountWithPrecision, swapDeadline } = functionCallInput;
    const poolAddress = await this.getPoolAddress(fromToken, toToken);

    const encoder = new ethers.AbiCoder();

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
        callback: ethers.ZeroAddress,
        callbackData: '0x',
      },
    ];

    const paths = [
      {
        steps: steps,
        tokenIn: fromToken.symbol === 'ETH' ? ethers.ZeroAddress : fromToken.contractAddress,
        amountIn: amountWithPrecision,
      },
    ];

    const routerAbi = getAbiByRelativePath('../abi/syncSwapRouter.json');
    const routerContractInstance = new ethers.Contract(this.protocolRouterContract, routerAbi, this.provider);

    const swapMethod = await routerContractInstance.swap(paths, minOutAmountWithPrecision.toString(), swapDeadline);
    return swapMethod;
  }

  private async getPoolAddress(fromToken: Token, toToken: Token) {
    const syncSwapClassicPoolFactoryAbi = getAbiByRelativePath('../abi/syncSwapClassicPoolFactory.json');
    const classicPoolFactory = new ethers.Contract(
      syncSwapClassicPoolFactoryAbi,
      SYNCSWAP_CLASSIC_POOL_FACTORY_ADDR,
      this.provider
    );

    const poolAddress = await classicPoolFactory.getPool(fromToken.contractAddress, toToken.contractAddress);

    if (poolAddress === ethers.ZeroAddress) {
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
