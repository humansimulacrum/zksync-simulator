// import Web3 from 'web3';
// import { Token } from '../../entity';
// import { ActionType } from '../../utils/enums/action-type.enum';
// import { getAbiByRelativePath, logWithFormatting } from '../../utils/helpers';
// import { GenerateFunctionCallInput } from '../../utils/interfaces';
// import { FunctionCall } from '../../utils/types';
// import { SwapCalculator } from './swap-calculator.module';
// import { Swap } from './swap.module';
// import { ethers } from 'ethers';
// import { slippage } from '../../utils/const/config.const';
// import { substractPercentage } from '../../utils/helpers/number.helper';

// export const PANCAKE_FACTORY_ADDR = Web3.utils.toChecksumAddress('0x1BB72E0CbbEA93c08f535fc7856E0338D7F7a8aB');
// export const PANCAKE_QUOTER_ADDR = Web3.utils.toChecksumAddress('0x3d146FcE6c1006857750cBe8aF44f76a28041CCc');

// export class PancakeSwap extends Swap {
//   constructor(privateKey: string) {
//     super(privateKey, ActionType.PancakeSwap);
//   }

//   async generateFunctionCall(functionCallInput: GenerateFunctionCallInput): Promise<FunctionCall> {
//     const { fromToken, toToken, amountWithPrecision, swapDeadline } = functionCallInput;
//     const minAmountOut = await this.getMinAmountOutWithQuoter(fromToken, toToken, amountWithPrecision);
//     const poolAddress = await this.getPoolAddress(fromToken, toToken);

//     if (!poolAddress) {
//       logWithFormatting(
//         this.protocolName,
//         `${this.walletAddress}: There aren't any pools available for those tokens ${fromToken.symbol} => ${toToken.symbol}`
//       );
//     }

//     const routerAbi = getAbiByRelativePath('../abi/pancakeRouter.json');
//     const routerContractInstance = new this.web3.eth.Contract(routerAbi, this.protocolRouterContract);

//     const params = {
//       fromToken: fromToken.contractAddress,
//       toToken: toToken.contractAddress,
//       fee: 500,
//       recipient: this.walletAddress,
//       amountIn: amountWithPrecision,
//       amountOutMinimum: minAmountOut,
//       sqrtPriceLimitX96: 0,
//     };

//     return routerContractInstance.methods.exactInputSingle([
//       params.fromToken,
//       params.toToken,
//       params.fee,
//       params.recipient,
//       params.amountIn,
//       params.amountOutMinimum,
//       params.sqrtPriceLimitX96,
//     ]);
//   }

//   private async getMinAmountOutWithQuoter(fromToken: Token, toToken: Token, fromTokenAmount: string) {
//     const quoterAbi = getAbiByRelativePath('../abi/pancakeQuoter.json');
//     const quoter = new this.web3.eth.Contract(quoterAbi, PANCAKE_QUOTER_ADDR);

//     const quoterFunctionResult = await quoter.methods
//       .quoteExactInputSingle([fromToken.contractAddress, toToken.contractAddress, fromTokenAmount, 500, 0])
//       .call();

//     const quoterPredictedAmount = quoterFunctionResult[0];
//     const minAmountOut = substractPercentage(quoterPredictedAmount, 1 - slippage);
//     return minAmountOut;
//   }

//   private async getPoolAddress(fromToken: Token, toToken: Token) {
//     const factoryAbi = getAbiByRelativePath('../abi/pancakeFactory.json');
//     const factory = new this.web3.eth.Contract(factoryAbi, PANCAKE_FACTORY_ADDR);

//     const poolAddress = await factory.methods.getPool(fromToken.contractAddress, toToken.contractAddress, 500).call();

//     if (poolAddress === ethers.constants.AddressZero) {
//       logWithFormatting(
//         this.protocolName,
//         `${this.walletAddress}: There aren't any pools available for those tokens ${fromToken.symbol} => ${toToken.symbol}`
//       );
//       throw new Error(`There aren't any pools available for those tokens ${fromToken.symbol} => ${toToken.symbol}`);
//     }

//     return poolAddress;
//   }

//   async createSwapCalculator(): Promise<SwapCalculator> {
//     return SwapCalculator.create(this);
//   }
// }
