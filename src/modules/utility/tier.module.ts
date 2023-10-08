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
    [ActivityType.OfficialBridge]: this.isOfficialBridgeRequirementSatisfied.bind(this),
    [ActivityType.Transactions]: this.isTransactionsRequirementSatisfied.bind(this),
    [ActivityType.ENS]: this.isEnsRequirementSatisfied.bind(this),
    [ActivityType.ContractAmount]: this.isContractsAmountRequirementSatisfied.bind(this),
    [ActivityType.Volume]: this.isVolumeRequirementSatisfied.bind(this),
    [ActivityType.ZkDomain]: this.isDomainRequirementSatisfied.bind(this),
  };

  activityToActionTypeFinderMapper: Record<ExecutableActivity, () => ActionType> = {
    [ActivityType.Transactions]: this.findActionTypeForTransactions.bind(this),
    [ActivityType.ContractAmount]: this.findActionTypeForTransactions.bind(this),
    [ActivityType.ENS]: this.findActionTypeForTransactions.bind(this),
    [ActivityType.Volume]: this.findActionTypeForTransactions.bind(this),
    [ActivityType.ZkDomain]: this.findActionTypeForTransactions.bind(this),
    [ActivityType.OfficialBridge]: this.findActionTypeForTransactions.bind(this),
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

      const isRequirementSatisfied = checker();

      if (!isRequirementSatisfied) {
        return activity;
      }
    }

    return null;
  }

  private isOfficialBridgeRequirementSatisfied() {
    return true;
  }

  private isTransactionsRequirementSatisfied() {
    return this.account.activity?.transactionCount! >= this.account.tier?.transactionCountNeeded!;
  }

  private isEnsRequirementSatisfied() {
    return true;
  }

  private isContractsAmountRequirementSatisfied() {
    return true;
  }

  private isVolumeRequirementSatisfied() {
    return true;
  }

  private isDomainRequirementSatisfied() {
    return true;
  }

  private findActionTypeForTransactions() {
    return ActionType.RandomSwap;
  }
}
