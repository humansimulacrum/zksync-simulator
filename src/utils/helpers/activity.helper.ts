import { ZkSyncActivityModule } from '../../modules/checkers/zksync-activity.module';
import { Account } from '../entities/account.entity';
import { ActivityModel } from '../entities/activities.entity';

export const updateActivity = async (account: Account, activityModule: ZkSyncActivityModule) => {
  const updatedActivity = await activityModule.getActivity(account.walletAddress);

  if (isNaN(updatedActivity.gasSpentInUsd)) {
    updatedActivity.gasSpentInUsd = 0;
  }

  return ActivityModel.updateOne({ _id: account.activity._id }, { ...updatedActivity });
};
