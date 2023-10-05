import { fromWei } from '../helpers/wei.helper';
import { TokenSymbol } from '../types/token-symbol.type';

export const notEnoughMoneyMessage = (tokenSymbol: TokenSymbol, wantedAmount: number, gotAmount: number) =>
  `Not enough money in the token. Wanted -> ${wantedAmount} ${tokenSymbol.toUpperCase()}, Balance -> ${fromWei(
    gotAmount
  )} ${tokenSymbol.toUpperCase()}`;
