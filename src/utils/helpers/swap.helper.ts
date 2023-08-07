import { slippage } from '../const/config.const';
import { getTokenPriceCryptoCompare } from './price.helper';

export const getMinOutAmount = async (fromTokenName: string, toTokenName: string, fromTokenAmount: number) => {
  const fromTokenPrice = await getTokenPriceCryptoCompare(fromTokenName);
  const toTokenPrice = await getTokenPriceCryptoCompare(toTokenName);

  return ((fromTokenAmount * fromTokenPrice) / toTokenPrice) * slippage;
};
