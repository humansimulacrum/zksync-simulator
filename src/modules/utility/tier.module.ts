import { Account } from '../../entity';
import { activitiesSortedByPriority } from '../../utils/const/tiers.const';
import { ActionType } from '../../utils/enums/action-type.enum';
import { ActivityType } from '../../utils/enums/activity-type.enum';

export class TierModule {
  account: Account;

  constructor(account: Account) {
    this.account = account;
  }

  activityToCheckerMapper: Record<ActivityType, () => boolean> = {
    [ActivityType.OfficialBridge]: this.isOfficialBridgeRequirementSatisfied.bind(this),
    [ActivityType.Transactions]: this.isTransactionsRequirementSatisfied.bind(this),
    [ActivityType.ContractAmount]: this.isContractsAmountRequirementSatisfied.bind(this),
    [ActivityType.Volume]: this.isVolumeRequirementSatisfied.bind(this),
    [ActivityType.ZkDomain]: this.isDomainRequirementSatisfied.bind(this),
  };

  activityToActionTypeFinderMapper: Record<ActivityType, () => ActionType> = {
    [ActivityType.Transactions]: this.findActionTypeForTransactions.bind(this),
    [ActivityType.ContractAmount]: this.findActionTypeForContractAmount.bind(this),
    [ActivityType.Volume]: this.findActionTypeForVolume.bind(this),
    [ActivityType.ZkDomain]: this.findActionTypeForZkDomain.bind(this),
    [ActivityType.OfficialBridge]: this.findActionTypeForOfficialBridge.bind(this),
  };

  findActionForAccount(): ActionType {
    const neededActivity = this.findNeededActivities();

    if (!neededActivity) {
      return ActionType.RandomCheap;
    }

    return this.activityToActionTypeFinderMapper[neededActivity]();
  }

  findNeededActivities() {
    for (const activity of activitiesSortedByPriority) {
      const checker = this.activityToCheckerMapper[activity];

      const isRequirementSatisfied = checker();

      if (!isRequirementSatisfied) {
        return activity;
      }
    }

    return null;
  }

  private findActionTypeForTransactions() {
    return ActionType.RandomSwap;
  }

  private findActionTypeForContractAmount() {
    return ActionType.RandomSwap;
  }

  private findActionTypeForVolume() {
    return ActionType.RandomSwap;
  }

  private findActionTypeForZkDomain() {
    return ActionType.ZkNS;
  }

  private findActionTypeForOfficialBridge() {
    return ActionType.OfficialBridge;
  }

  private isOfficialBridgeRequirementSatisfied() {
    if (!this.account.tier?.officialBridgeNeeded!) {
      return true;
    }

    return this.account.activity?.officialBridge || false;
  }

  private isTransactionsRequirementSatisfied() {
    return this.account.activity?.transactionCount! >= this.account.tier?.transactionCountNeeded!;
  }

  private isContractsAmountRequirementSatisfied() {
    return this.account.activity?.uniqueContractCount! >= this.account.tier?.uniqueSmartContracts!;
  }

  private isVolumeRequirementSatisfied() {
    return this.account.activity?.transactionVolume! >= this.account.tier?.volume!;
  }

  private isDomainRequirementSatisfied() {
    if (!this.account.tier?.zkSyncDomainNeeded!) {
      return true;
    }

    return this.account.activity?.zkSyncDomain || false;
  }
}
