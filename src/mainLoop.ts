import { MuteSwap } from './modules/swaps/muteswap.module';
import { SpaceFiSwap } from './modules/swaps/spacefi.module';
import { SyncSwap } from './modules/swaps/syncswap.module';
import { choose } from './utils/helpers';
import { calculateSwapParameters } from './utils/helpers/pre-swap.helper';

const SWAPS = [SyncSwap, SpaceFiSwap, MuteSwap];

export const mainLoop = async (privateKey, debankInstance) => {
  const swapClass = choose(SWAPS);
  const swapInstance = new swapClass(privateKey);

  let swapParams;

  try {
    while (!swapParams) {
      swapParams = await calculateSwapParameters(swapInstance, debankInstance);
    }

    await swapInstance.swap(swapParams.fromToken, swapParams.toToken, swapParams.amountFrom, swapParams.amountTo);
  } catch (e) {
    return false;
  }

  return true;
};
