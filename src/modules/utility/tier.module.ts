import { Account } from '../../entity';
import { executableActivitiesSortedByPriority } from '../../utils/const/tiers.const';
import { ActionType } from '../../utils/enums/action-type.enum';
import { ActivityType } from '../../utils/enums/activity-type.enum';
import { ExecutableActivity } from '../../utils/types/executable-activities.type';

export class TierModule {
  account: Account;

  constructor(account: Account) {
    this.account = account;
  }

  activityToCheckerMapper: Record<ExecutableActivity, () => boolean> = {
    [ActivityType.OfficialBridge]: this.checkForOfficialBridge,
    [ActivityType.Transactions]: this.checkForTransactions,
    [ActivityType.ENS]: this.checkForEns,
    [ActivityType.ContractAmount]: this.checkForContractAmount,
    [ActivityType.Volume]: this.checkForVolume,
    [ActivityType.ZkDomain]: this.checkForZkDomain,
  };

  activityToActionTypeFinderMapper: Record<ExecutableActivity, () => ActionType> = {
    [ActivityType.Transactions]: this.findActionTypeForTransactions,
    [ActivityType.ContractAmount]: this.findActionTypeForTransactions,
    [ActivityType.ENS]: this.findActionTypeForTransactions,
    [ActivityType.Volume]: this.findActionTypeForTransactions,
    [ActivityType.ZkDomain]: this.findActionTypeForTransactions,
    [ActivityType.OfficialBridge]: this.findActionTypeForTransactions,
  };

  findActionForAccount(): ActionType {
    const neededActivity = this.findNeededActivities();

    if (!neededActivity) {
      // keeping account alive by random swap transaction
      return ActionType.RandomSwap;
    }

    return this.activityToActionTypeFinderMapper[neededActivity]();
  }

  findNeededActivities() {
    for (const activity of executableActivitiesSortedByPriority) {
      const checker = this.activityToCheckerMapper[activity];

      const isActivityNeeded = checker();

      if (isActivityNeeded) {
        return activity;
      }
    }

    return null;
  }

  private checkForOfficialBridge() {
    return true;
  }

  private checkForTransactions() {
    return this.account.activity?.transactionCount! >= this.account.tier?.transactionCountNeeded!;
  }

  private checkForEns() {
    return true;
  }

  private checkForContractAmount() {
    return true;
  }

  private checkForVolume() {
    return true;
  }

  private checkForZkDomain() {
    return true;
  }

  private findActionTypeForTransactions() {
    return ActionType.RandomSwap;
  }
}
