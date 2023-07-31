export const transformDebankDataToNeededFormat = (data) => {
  return data.map((record) => ({
    chain: record.chain,
    decimals: record.decimals,
    symbol: record.symbol,
    amount: record.amount,
    rawAmount: record.raw_amount,
    price: record.amount * record.price,
  }));
};
