import Web3 from 'web3';
import { getAbiByRelativePath, getSwapDeadline } from '../../utils/helpers';
import { Swap } from './swap.module';

export const SPACEFI_SUPPORTED_COINS = ['ETH', 'USDC', 'WBTC'];
export const SPACEFI_ROUTER_CONTRACT_ADDR = Web3.utils.toChecksumAddress('0xbE7D1FD1f6748bbDefC4fbaCafBb11C6Fc506d1d');

export class SpaceFiSwap extends Swap {
  constructor(privateKey) {
    super(privateKey, 'SpaceFi', SPACEFI_ROUTER_CONTRACT_ADDR, SPACEFI_SUPPORTED_COINS);
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

      const path = [fromTokenContractAddress, toTokenContractAddress];

      const spaceFiAbi = getAbiByRelativePath('../abi/spaceFiRouter.json');
      const spaceFiRouter = new this.web3.eth.Contract(spaceFiAbi, this.protocolRouterContract);

      let swapFunctionCall;

      if (fromToken === 'ETH') {
        swapFunctionCall = spaceFiRouter.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(
          minOutAmountWithPrecision,
          path,
          this.walletAddress,
          swapDeadline
        );
      } else if (toToken === 'ETH') {
        swapFunctionCall = spaceFiRouter.methods.swapExactTokensForETHSupportingFeeOnTransferTokens(
          amountWithPrecision,
          minOutAmountWithPrecision,
          path,
          this.walletAddress,
          swapDeadline
        );
      } else {
        swapFunctionCall = spaceFiRouter.methods.swapExactTokensForTokensSupportingFeeOnTransferTokens(
          amountWithPrecision,
          minOutAmountWithPrecision,
          path,
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
