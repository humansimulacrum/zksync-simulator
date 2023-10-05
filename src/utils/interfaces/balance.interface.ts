import { TokenSymbol } from '../types/token-symbol.type';

export interface TokenBalance {
  symbol: TokenSymbol;
  decimals: number;
  valueInToken: number;
  valueInUsd: number;
}
