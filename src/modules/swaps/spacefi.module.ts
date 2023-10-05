import Web3 from 'web3';
import { getAbiByRelativePath } from '../../utils/helpers';
import { Swap } from './swap.module';
import { TokenSymbol } from '../../utils/types/token-symbol.type';
import { GenerateFunctionCallInput } from '../../utils/interfaces/swap-input.interface';
import { FunctionCall } from '../../utils/types/function-call.type';
import { SwapCalculator } from './swap-calculator.module';

export const SPACEFI_SUPPORTED_COINS = ['ETH', 'USDC', 'WBTC'] as TokenSymbol[];
export const SPACEFI_ROUTER_CONTRACT_ADDR = Web3.utils.toChecksumAddress('0xbE7D1FD1f6748bbDefC4fbaCafBb11C6Fc506d1d');

export class SpaceFiSwap extends Swap {
  constructor(privateKey: string) {
    super(privateKey, 'SpaceFi', SPACEFI_ROUTER_CONTRACT_ADDR, SPACEFI_SUPPORTED_COINS);
  }

  async generateFunctionCall(functionCallInput: GenerateFunctionCallInput): Promise<FunctionCall> {
    const { fromToken, toToken, amountWithPrecision, minOutAmountWithPrecision, swapDeadline } = functionCallInput;

    const path = [fromToken.contractAddress, toToken.contractAddress];

    const spaceFiAbi = getAbiByRelativePath('../abi/spaceFiRouter.json');
    const spaceFiRouter = new this.web3.eth.Contract(spaceFiAbi, this.protocolRouterContract);

    if (fromToken.symbol === 'ETH') {
      return spaceFiRouter.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(
        minOutAmountWithPrecision,
        path,
        this.walletAddress,
        swapDeadline
      );
    }

    if (toToken.symbol === 'ETH') {
      return spaceFiRouter.methods.swapExactTokensForETHSupportingFeeOnTransferTokens(
        amountWithPrecision,
        minOutAmountWithPrecision,
        path,
        this.walletAddress,
        swapDeadline
      );
    }

    return spaceFiRouter.methods.swapExactTokensForTokensSupportingFeeOnTransferTokens(
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
