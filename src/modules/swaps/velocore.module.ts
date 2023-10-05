import Web3 from 'web3';
import { getAbiByRelativePath } from '../../utils/helpers';
import { Swap } from './swap.module';
import { TokenSymbol } from '../../utils/types/token-symbol.type';
import { SwapCalculator } from '../../utils/helpers/pre-swap.helper';
import { GenerateFunctionCallInput } from '../../utils/interfaces/swap-input.interface';
import { FunctionCall } from '../../utils/types/function-call.type';

export const VELOCORE_SUPPORTED_COINS = ['ETH', 'USDC', 'WBTC'] as TokenSymbol[];
export const VELOCORE_ROUTER_CONTRACT_ADDR = Web3.utils.toChecksumAddress('0xd999e16e68476bc749a28fc14a0c3b6d7073f50c');

export class Velocore extends Swap {
  constructor(privateKey: string) {
    super(privateKey, 'Velocore', VELOCORE_ROUTER_CONTRACT_ADDR, VELOCORE_SUPPORTED_COINS);
  }

  async generateFunctionCall(functionCallInput: GenerateFunctionCallInput): Promise<FunctionCall> {
    const { fromToken, toToken, amountWithPrecision, minOutAmountWithPrecision, swapDeadline } = functionCallInput;

    const velocoreAbi = getAbiByRelativePath('../abi/velocoreRouter.json');
    const velocoreRouter = new this.web3.eth.Contract(velocoreAbi, this.protocolRouterContract);

    const path = [fromToken.contractAddress, toToken.contractAddress];
    const steps = [path];

    if (fromToken.symbol === 'ETH') {
      return velocoreRouter.methods.swapExactETHForTokens(
        minOutAmountWithPrecision,
        steps,
        this.walletAddress,
        swapDeadline
      );
    }

    if (toToken.symbol === 'ETH') {
      return velocoreRouter.methods.swapExactTokensForETH(
        amountWithPrecision,
        minOutAmountWithPrecision,
        steps,
        this.walletAddress,
        swapDeadline
      );
    }

    return velocoreRouter.methods.swapExactTokensForTokens(
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
