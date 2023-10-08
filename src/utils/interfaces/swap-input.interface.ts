import { Token } from '../../entity/token.entity';

export interface SwapInput {
  fromToken: Token;
  toToken: Token;
  amountToSwap: string;
}

export interface GenerateFunctionCallInput {
  fromToken: Token;
  toToken: Token;
  amountWithPrecision: string;
  minOutAmountWithPrecision: string;
  swapDeadline: number;
}
