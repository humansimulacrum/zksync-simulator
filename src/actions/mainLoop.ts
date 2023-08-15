import { MuteSwap } from '../modules/swaps/muteswap.module';
import { SpaceFiSwap } from '../modules/swaps/spacefi.module';
import { SyncSwap } from '../modules/swaps/syncswap.module';
import { choose, waitForGas } from '../utils/helpers';
import { updateActivity } from '../utils/helpers/activity.helper';
import { calculateSwapParameters } from '../utils/helpers/pre-swap.helper';

const SWAPS = [SyncSwap, SpaceFiSwap, MuteSwap];

export const mainLoop = async (account, debankInstance, activityModule) => {
  const swapClass = choose(SWAPS);
  const swapInstance = new swapClass(account.privateKey);
  let swapParams;

  try {
    while (!swapParams) {
      swapParams = await calculateSwapParameters(swapInstance, debankInstance);
    }

    await swapInstance.swap(swapParams.fromToken, swapParams.toToken, swapParams.amountFrom, swapParams.amountTo);
    await updateActivity(account, activityModule);
  } catch (e) {
    return false;
  }

  return true;
};
