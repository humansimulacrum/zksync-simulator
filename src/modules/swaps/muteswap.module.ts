import Web3 from 'web3';
import { getAbiByRelativePath } from '../../utils/helpers';
import { Swap } from './swap.module';
import { SwapCalculator } from './swap-calculator.module';
import { TokenSymbol } from '../../utils/types/token-symbol.type';
import { GenerateFunctionCallInput, SwapInput } from '../../utils/interfaces/swap-input.interface';
import { Token } from '../../entity/token.entity';
import { FunctionCall } from '../../utils/types/function-call.type';

export const MUTE_ROUTER_CONTRACT_ADDR = Web3.utils.toChecksumAddress('0x8B791913eB07C32779a16750e3868aA8495F5964');
export const MUTE_SUPPORTED_COINS = ['ETH', 'USDC', 'WBTC'] as TokenSymbol[];

export class MuteSwap extends Swap {
  constructor(privateKey: string) {
    super(privateKey, 'Mute', MUTE_ROUTER_CONTRACT_ADDR, MUTE_SUPPORTED_COINS);
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
