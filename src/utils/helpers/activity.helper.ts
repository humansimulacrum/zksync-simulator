import { getRepository } from 'typeorm';
import { Account } from '../../entities/account.entity';
import { ZkSyncActivityModule } from '../../modules/checkers/zksync-activity.module';
import { AccountActivity } from '../../entities/activities.entity';

export const updateActivity = async (account: Account, activityModule: ZkSyncActivityModule) => {
  const activityRepository = getRepository(AccountActivity);
  const updatedActivity = await activityModule.getActivity(account.walletAddress);

  if (updatedActivity.gasSpentInUsd && isNaN(updatedActivity.gasSpentInUsd)) {
    updatedActivity.gasSpentInUsd = 0;
  }

  if (!account.activity) {
    return activityRepository.create(updatedActivity);
  }

  return activityRepository.update({ id: account.activity.id }, { ...updatedActivity });
};
