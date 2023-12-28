import { getAbiByRelativePath } from '../../utils/helpers';
import { Swap } from './swap.module';
import { GenerateFunctionCallInput } from '../../utils/interfaces/swap-input.interface';
import { FunctionCall } from '../../utils/types/function-call.type';
import { SwapCalculator } from './swap-calculator.module';
import { ActionType } from '../../utils/enums/action-type.enum';
import { Contract } from 'ethers';

export class SpaceFiSwap extends Swap {
  constructor(privateKey: string) {
    super(privateKey, ActionType.SpaceFi);
  }

  async generateFunctionCall(functionCallInput: GenerateFunctionCallInput): Promise<FunctionCall> {
    const { fromToken, toToken, amountWithPrecision, minOutAmountWithPrecision, swapDeadline } = functionCallInput;

    const path = [fromToken.contractAddress, toToken.contractAddress];

    const spaceFiAbi = getAbiByRelativePath('../abi/spaceFiRouter.json');
    const spaceFiRouter = new Contract(spaceFiAbi, this.protocolRouterContract);

    if (fromToken.symbol === 'ETH') {
      return spaceFiRouter.swapExactETHForTokensSupportingFeeOnTransferTokens(
        minOutAmountWithPrecision,
        path,
        this.walletAddress,
        swapDeadline
      );
    }

    if (toToken.symbol === 'ETH') {
      return spaceFiRouter.swapExactTokensForETHSupportingFeeOnTransferTokens(
        amountWithPrecision,
        minOutAmountWithPrecision,
        path,
        this.walletAddress,
        swapDeadline
      );
    }

    return spaceFiRouter.swapExactTokensForTokensSupportingFeeOnTransferTokens(
      amountWithPrecision,
      minOutAmountWithPrecision,
      path,
      this.walletAddress,
      swapDeadline
    );
  }

  async createSwapCalculator(): Promise<SwapCalculator> {
    return SwapCalculator.create(this);
  }
}
