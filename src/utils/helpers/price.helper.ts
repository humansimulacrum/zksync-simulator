import fetch from 'make-fetch-happen';
// import { coinMarketCapApiKey } from '../const/config.const';
// import { getParameterCaseInsensitive } from './object.helper';

export const getTokenPriceCryptoCompare = async (tokenName: string) => {
  const price = await fetch(`https://min-api.cryptocompare.com/data/price?fsym=${tokenName.toUpperCase()}&tsyms=USDT`);

  const priceInUsd = (await price.json())['USDT'];
  return priceInUsd;
};

// export const getTokenPriceCMC = async (tokenSymbol: string) => {
//   try {
//     const response = await fetch(
//       `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${tokenSymbol.toUpperCase()}`,
//       {
//         headers: {
//           'X-CMC_PRO_API_KEY': coinMarketCapApiKey,
//         },
//       }
//     );

//     const data = (await response.json()).data;
//     const tokenData = getParameterCaseInsensitive(data, tokenSymbol.toLowerCase());

//     const priceInUsd = tokenData.quote?.USD?.price;

//     return priceInUsd;
//   } catch (error) {
//     console.log(error);
//   }
// };
