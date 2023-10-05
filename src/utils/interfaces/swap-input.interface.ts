import { Token } from '../../entity/token.entity';

export interface SwapInput {
  fromToken: Token;
  toToken: Token;
  amountToSwap: number;
}

export interface GenerateFunctionCallInput {
  fromToken: Token;
  toToken: Token;
  amountWithPrecision: number;
  minOutAmountWithPrecision: number;
  swapDeadline: number;
}
