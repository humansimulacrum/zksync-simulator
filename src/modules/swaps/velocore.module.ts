import { FunctionCall, TokenSymbol } from '../../utils/types';
import { Swap } from './swap.module';
import { GenerateFunctionCallInput } from '../../utils/interfaces';
import { getAbiByRelativePath } from '../../utils/helpers';
import { SwapCalculator } from './swap-calculator.module';
import { ActionType } from '../../utils/enums/action-type.enum';
import { Contract } from 'ethers';

export class Velocore extends Swap {
  constructor(privateKey: string) {
    super(privateKey, ActionType.Velocore);
  }

  async generateFunctionCall(functionCallInput: GenerateFunctionCallInput): Promise<FunctionCall> {
    const { fromToken, toToken, amountWithPrecision, minOutAmountWithPrecision, swapDeadline } = functionCallInput;

    const velocoreAbi = getAbiByRelativePath('../abi/velocoreRouter.json');
    const velocoreRouter = new Contract(velocoreAbi, this.protocolRouterContract);

    // since now auto swap doesn't give routes for stable swap (USDC => USDT)
    const isStableRoute = false;

    const path = [fromToken.contractAddress, toToken.contractAddress, isStableRoute];
    const steps = [path];

    if (fromToken.symbol === 'ETH') {
      return velocoreRouter.swapExactETHForTokens(minOutAmountWithPrecision, steps, this.walletAddress, swapDeadline);
    }

    if (toToken.symbol === 'ETH') {
      return velocoreRouter.swapExactTokensForETH(
        amountWithPrecision,
        minOutAmountWithPrecision,
        steps,
        this.walletAddress,
        swapDeadline
      );
    }

    return velocoreRouter.swapExactTokensForTokens(
      amountWithPrecision,
      minOutAmountWithPrecision,
      steps,
      this.walletAddress,
      swapDeadline
    );
  }

  async createSwapCalculator(): Promise<SwapCalculator> {
    return SwapCalculator.create(this);
  }
}
