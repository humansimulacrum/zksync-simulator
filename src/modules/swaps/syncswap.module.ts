import Web3 from 'web3';

import { getAbiByRelativePath } from '../../utils/helpers';
import { ethers } from 'ethers';
import { Swap } from './swap.module';
import { TokenSymbol } from '../../utils/types/token-symbol.type';
import { GenerateFunctionCallInput } from '../../utils/interfaces/swap-input.interface';
import { FunctionCall } from '../../utils/types/function-call.type';
import { SwapCalculator } from '../../utils/helpers/pre-swap.helper';
import { Token } from '../../entity/token.entity';
import { log } from '../../utils/logger/logger';

// those contracts were taken from https://syncswap.gitbook.io/api-documentation/resources/smart-contract
export const SYNCSWAP_CLASSIC_POOL_FACTORY_ADDR = Web3.utils.toChecksumAddress(
  '0xf2dad89f2788a8cd54625c60b55cd3d2d0aca7cb'
);
export const SYNCSWAP_ROUTER_ADDR = Web3.utils.toChecksumAddress('0x2da10A1e27bF85cEdD8FFb1AbBe97e53391C0295');
export const SYNCSWAP_SUPPORTED_COINS = ['ETH', 'USDC', 'WBTC'] as TokenSymbol[];

export class SyncSwap extends Swap {
  constructor(privateKey: string) {
    super(privateKey, 'SyncSwap', SYNCSWAP_ROUTER_ADDR, SYNCSWAP_SUPPORTED_COINS);
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
      log(
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
