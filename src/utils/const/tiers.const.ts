import { ActivityType } from '../enums/activity-type.enum';
import { TierPayload } from '../types/tier-payload.type';

export const tierAssignmentActivityPriorities: ActivityType[] = [
  ActivityType.OfficialBridge,
  ActivityType.ZkDomain,
  ActivityType.ContractAmount,
  ActivityType.Volume,
  ActivityType.Transactions,
];

export const activitiesSortedByPriority: ActivityType[] = [
  ActivityType.OfficialBridge,
  ActivityType.ZkDomain,
  ActivityType.ContractAmount,
  ActivityType.Volume,
  ActivityType.Transactions,
];

export const tiers: TierPayload[] = [
  {
    tierRank: 1,
    transactionCountNeeded: 50,
    officialBridgeNeeded: true,
    zkSyncDomainNeeded: true,
    dmailerAllowed: false,
    volume: 20000,
    uniqueSmartContracts: 20,
  },
  {
    tierRank: 2,
    transactionCountNeeded: 40,
    officialBridgeNeeded: true,
    zkSyncDomainNeeded: false,
    dmailerAllowed: false,
    volume: 15000,
    uniqueSmartContracts: 15,
  },
  {
    tierRank: 3,
    transactionCountNeeded: 30,
    officialBridgeNeeded: false,
    zkSyncDomainNeeded: false,
    dmailerAllowed: false,
    volume: 5000,
    uniqueSmartContracts: 10,
  },
  {
    tierRank: 4,
    transactionCountNeeded: 20,
    officialBridgeNeeded: false,
    zkSyncDomainNeeded: false,
    dmailerAllowed: true,
    volume: 1000,
    uniqueSmartContracts: 7,
  },
  {
    tierRank: 5,
    transactionCountNeeded: 10,
    officialBridgeNeeded: false,
    zkSyncDomainNeeded: false,
    dmailerAllowed: true,
    volume: 100,
    uniqueSmartContracts: 5,
  },
];

export const tierDistributionInPercents = {
  1: 5,
  2: 15,
  3: 20,
  4: 30,
  5: 30,
};
