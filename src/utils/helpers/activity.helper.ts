import { Account } from '../../entity/account.entity';
import { ActivityModule } from '../../modules/checkers/activity.module';
import { ActivityRepository } from '../../repositories/activity.repository';

export const updateActivity = async (account: Account, activityModule: ActivityModule) => {
  const updatedActivity = await activityModule.getActivity(account.walletAddress);

  if (updatedActivity.gasSpentInUsd && isNaN(updatedActivity.gasSpentInUsd)) {
    updatedActivity.gasSpentInUsd = 0;
  }

  if (!account.activity) {
    return ActivityRepository.create(updatedActivity);
  }

  return ActivityRepository.update({ id: account.activity.id }, { ...updatedActivity });
};

// TODO: Remove update duplication, strip out account update code into the repo
