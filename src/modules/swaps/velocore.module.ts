import Web3 from 'web3';
import { getAbiByRelativePath, getSwapDeadline } from '../../utils/helpers';
import { Swap } from './swap.module.ts';

export const VELOCORE_SUPPORTED_COINS = ['ETH', 'USDC', 'WBTC'];
export const VELOCORE_ROUTER_CONTRACT_ADDR = Web3.utils.toChecksumAddress('0xd999e16e68476bc749a28fc14a0c3b6d7073f50c');

export class VelocoreSwap extends Swap {
  constructor(privateKey) {
    super(privateKey, 'Velocore', VELOCORE_ROUTER_CONTRACT_ADDR, VELOCORE_SUPPORTED_COINS);
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

      const swapDeadline = await getSwapDeadline(this.web3);

      const velocoreAbi = getAbiByRelativePath('../abi/velocoreRouter.json');
      const velocoreRouter = new this.web3.eth.Contract(velocoreAbi, this.protocolRouterContract);

      const path = [fromTokenContractAddress, toTokenContractAddress];
      const steps = [path];

      let swapFunctionCall;

      if (fromToken === 'ETH') {
        swapFunctionCall = velocoreRouter.methods.swapExactETHForTokens(
          minOutAmountWithPrecision,
          steps,
          this.walletAddress,
          swapDeadline
        );
      } else if (toToken === 'ETH') {
        swapFunctionCall = velocoreRouter.methods.swapExactTokensForETH(
          amountWithPrecision,
          minOutAmountWithPrecision,
          steps,
          this.walletAddress,
          swapDeadline
        );
      } else {
        swapFunctionCall = velocoreRouter.methods.swapExactTokensForTokens(
          amountWithPrecision,
          minOutAmountWithPrecision,
          steps,
          this.walletAddress,
          swapDeadline
        );
      }

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
