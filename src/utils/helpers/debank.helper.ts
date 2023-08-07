import { DebankTokenBalance, DebankTokenBalanceResponse } from '../interfaces/debank.interface';

export const transformDebankDataToNeededFormat = (data: DebankTokenBalanceResponse[]): DebankTokenBalance[] => {
  return data.map((record) => ({
    chain: record.chain,
    decimals: record.decimals,
    symbol: record.symbol,
    amount: record.amount,
    rawAmount: record.raw_amount,
    price: record.price,
    valueInToken: record.amount * record.price,
  }));
};
