import { getAbiByRelativePath } from '../../utils/helpers';
import { Swap } from './swap.module';
import { SwapCalculator } from './swap-calculator.module';
import { GenerateFunctionCallInput, SwapInput } from '../../utils/interfaces/swap-input.interface';
import { Token } from '../../entity/token.entity';
import { FunctionCall } from '../../utils/types/function-call.type';
import { ActionType } from '../../utils/enums/action-type.enum';

export class MuteSwap extends Swap {
  constructor(privateKey: string) {
    super(privateKey, ActionType.Mute);
  }

  async generateFunctionCall(functionCallInput: GenerateFunctionCallInput): Promise<FunctionCall> {
    const { fromToken, toToken, amountWithPrecision, minOutAmountWithPrecision, swapDeadline } = functionCallInput;

    const path = [fromToken.contractAddress, toToken.contractAddress];
    const stablesInThePath = this.areStablesInThePath(fromToken, toToken);

    const muteRouterAbi = getAbiByRelativePath('../abi/muteRouter.json');
    const muteRouter = new this.web3.eth.Contract(muteRouterAbi, this.protocolRouterContract);

    if (fromToken.symbol === 'ETH') {
      return muteRouter.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(
        minOutAmountWithPrecision,
        path,
        this.walletAddress,
        swapDeadline,
        stablesInThePath
      );
    }

    if (toToken.symbol === 'ETH') {
      return muteRouter.methods.swapExactTokensForETHSupportingFeeOnTransferTokens(
        amountWithPrecision,
        minOutAmountWithPrecision,
        path,
        this.walletAddress,
        swapDeadline,
        stablesInThePath
      );
    }

    return muteRouter.methods.swapExactTokensForTokensSupportingFeeOnTransferTokens(
      amountWithPrecision,
      minOutAmountWithPrecision,
      path,
      this.walletAddress,
      swapDeadline,
      stablesInThePath
    );
  }

  async createSwapCalculator(): Promise<SwapCalculator> {
    return SwapCalculator.create(this);
  }

  areStablesInThePath(fromToken: Token, toToken: Token): [boolean, boolean] {
    // currently mute supports only USDC token as stable, so check can be more complicated later
    return [fromToken.symbol === 'USDC', toToken.symbol === 'USDC'];
  }
}
