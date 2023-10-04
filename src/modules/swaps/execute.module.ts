import { Account } from '../../entity/account.entity';
import { choose } from '../../utils/helpers';
import { calculateSwapParameters } from '../../utils/helpers/pre-swap.helper';
import { MuteSwap } from './muteswap.module';
import { SpaceFiSwap } from './spacefi.module';
import { SyncSwap } from './syncswap.module';

const SWAPS = [SyncSwap, SpaceFiSwap, MuteSwap];

export const executeSwap = async (account: Account) => {
  const swapClass = choose(SWAPS);
  const swapInstance = new swapClass(account.privateKey);
  let swapParams;

  try {
    while (!swapParams) {
      swapParams = await calculateSwapParameters(swapInstance);
    }

    await swapInstance.swap(swapParams.fromToken, swapParams.toToken, swapParams.amountFrom, swapParams.amountTo);
  } catch (e) {
    return false;
  }

  return true;
};
