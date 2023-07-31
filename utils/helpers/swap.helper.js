import { slippage } from '../../config.js';
import { getTokenPrice } from './price.helper.js';

export const getMinOutAmount = async (fromTokenName, toTokenName, fromTokenAmount) => {
  const fromTokenPrice = await getTokenPrice(fromTokenName);
  const toTokenPrice = await getTokenPrice(toTokenName);

  return ((fromTokenAmount * fromTokenPrice) / toTokenPrice) * slippage;
};
