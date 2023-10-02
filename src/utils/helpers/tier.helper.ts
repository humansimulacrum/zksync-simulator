import { Account } from '../../entity/account.entity';
import { Tier } from '../../entity/tier.entity';
import { tierAssignmentActivityPriorities } from '../const/config.const';
import { tierDistributionInPercents, tiers } from '../const/tiers.const';

export type ActivityType =
  | 'Official Bridge'
  | 'ZkDomain'
  | 'Transactions'
  | 'Rank'
  | 'ENS'
  | 'Volume'
  | 'Smart Contract Amount';

export function tierAssigner(accounts: Account[], tiers: Tier[]) {
  const tiersToAccountAmount = getTierToAccountAmount(accounts.length);
  const accountsSortedByPriority = accounts.sort(sortByActivityPriority).reverse();
  const tierMap = getTierToTierRankMap(tiers);

  let currentAccountPointer = 0;
  Object.entries(tiersToAccountAmount).forEach(([tierRank, accountAmount]) => {
    for (let i = 0; i < accountAmount; i++) {
      accountsSortedByPriority[currentAccountPointer].tier = tierMap[tierRank];
      currentAccountPointer++;
    }
  });

  return accountsSortedByPriority;
}

function getTierToAccountAmount(accountAmount: number): Record<string, number> {
  const tiersToAccountAmount: Record<string, number> = {};
  let tierDistributedAccounts = 0;

  Object.entries(tierDistributionInPercents).forEach(([tier, percentage]) => {
    const accountsOfTierAmount = Math.floor((accountAmount * percentage) / 100);
    tiersToAccountAmount[tier] = accountsOfTierAmount;

    tierDistributedAccounts += accountsOfTierAmount;
  });

  let leftoverAccounts = accountAmount - tierDistributedAccounts;

  if (!leftoverAccounts) {
    return tiersToAccountAmount;
  }

  // leftover accounts (max 5) will be divided between 3,4,5 tiers
  let currentTierPointer = 3;
  while (leftoverAccounts) {
    // overflow
    if (currentTierPointer === 6) {
      currentTierPointer = 3;
    }

    tiersToAccountAmount[currentTierPointer] += 1;
    currentTierPointer++;
    leftoverAccounts--;
  }

  return tiersToAccountAmount;
}

function getTierToTierRankMap(tiers: Tier[]) {
  const result: Record<string, Tier> = {};
  tiers.forEach((tier) => (result[tier.tierRank] = tier));

  return result;
}

function sortByActivityPriority(accountA, accountB) {
  const activityPriorityA = activityToActivityPriorityMatcher(accountA);
  const activityPriorityB = activityToActivityPriorityMatcher(accountB);

  for (let i = 0; i < activityPriorityA.length; i++) {
    const activityResultA = activityPriorityA[i];
    const activityResultB = activityPriorityB[i];

    if (typeof activityResultA === 'number' && typeof activityResultB === 'number') {
      if (activityResultA === activityResultB) continue;

      // On the rank and negative comparisons that's the only way to go
      if (!activityResultA) return 1;
      if (!activityResultB) return -1;

      return activityResultA - activityResultB;
    }

    if (typeof activityResultA === 'boolean' && typeof activityResultB === 'boolean') {
      if (activityResultA === activityResultB) continue;
      if (activityResultA) return 1;
      if (activityResultB) return -1;
    }
  }

  return 0;
}

function activityToActivityPriorityMatcher(account: Account) {
  const { activity } = account;
  return tierAssignmentActivityPriorities.map((activityType) => {
    if (activityType === 'Official Bridge') {
      return activity.officialBridge;
    }

    if (activityType === 'Transactions') {
      return activity.transactionCount;
    }

    if (activityType === 'Rank') {
      return activity.rank * -1;
    }

    if (activityType === 'ZkDomain') {
      return activity.zkSyncDomain;
    }

    return false;
  });
}
