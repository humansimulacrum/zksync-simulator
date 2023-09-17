import Web3 from 'web3';
import { Swap } from './swap.module.ts';
import { approveToken, getAbiByRelativePath, getSwapDeadline } from '../../utils/helpers';
import { zkSyncEraTokenCodeToContractMapper } from '../../utils/const/token-contacts/era.contracts';

export const MUTE_ROUTER_CONTRACT_ADDR = Web3.utils.toChecksumAddress('0x8B791913eB07C32779a16750e3868aA8495F5964');
export const MUTE_SUPPORTED_COINS = ['ETH', 'USDC', 'WBTC'];

export class MuteSwap extends Swap {
  constructor(privateKey) {
    super(privateKey, 'Mute', MUTE_ROUTER_CONTRACT_ADDR, MUTE_SUPPORTED_COINS);
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

      // currently mute supports only USDC token as stable, so check can be more complicated later
      const usdcContractAddress = zkSyncEraTokenCodeToContractMapper.USDC;

      const stablesInThePath = [
        fromTokenContractAddress === usdcContractAddress,
        toTokenContractAddress === usdcContractAddress,
      ];

      const muteRouterAbi = getAbiByRelativePath('../abi/muteRouter.json');
      const muteRouter = new this.web3.eth.Contract(muteRouterAbi, this.protocolRouterContract);

      let swapFunctionCall;

      if (fromToken === 'ETH') {
        swapFunctionCall = muteRouter.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(
          minOutAmountWithPrecision,
          path,
          this.walletAddress,
          swapDeadline,
          stablesInThePath
        );
      } else if (toToken === 'ETH') {
        swapFunctionCall = muteRouter.methods.swapExactTokensForETHSupportingFeeOnTransferTokens(
          amountWithPrecision,
          minOutAmountWithPrecision,
          path,
          this.walletAddress,
          swapDeadline,
          stablesInThePath
        );
      } else {
        swapFunctionCall = muteRouter.methods.swapExactTokensForTokensSupportingFeeOnTransferTokens(
          amountWithPrecision,
          minOutAmountWithPrecision,
          path,
          this.walletAddress,
          swapDeadline,
          stablesInThePath
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
