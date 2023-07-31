import { SyncSwap } from './modules/swaps/syncswap/syncswap.js';
import { SpaceFiSwap } from './modules/swaps/spacefi/spacefi.js';
import { MuteSwap } from './modules/swaps/muteswap/muteswap.js';
import { choose } from './utils/helpers/index.js';
import { calculateSwapParameters } from './utils/helpers/pre-swap.helper.js';
import { sleep } from 'zksync-web3/build/src/utils.js';

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
