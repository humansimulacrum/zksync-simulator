import { fetchData } from './fetch.helper';

export const getTokenPriceCryptoCompare = async (tokenName: string) => {
  const price = await fetchData(
    `https://min-api.cryptocompare.com/data/price?fsym=${tokenName.toUpperCase()}&tsyms=USDT`
  );

  const priceInUsd = price['USDT'];
  return priceInUsd;
};
