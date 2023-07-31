import fetch from 'make-fetch-happen';

export const getTokenPrice = async (tokenName) => {
  const price = await fetch(`https://min-api.cryptocompare.com/data/price?fsym=${tokenName.toUpperCase()}&tsyms=USDT`);

  const priceInUsd = (await price.json())['USDT'];
  return priceInUsd;
};
