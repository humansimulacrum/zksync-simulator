import { Tier } from '../entities/tier.entity';

export const tiers: Tier[] = [
  {
    tierRank: 1,
    transactionCountNeeded: 50,
    officialBridgeNeeded: true,
    zkSyncDomainNeeded: true,
    dmailerAllowed: false,
  },
  {
    tierRank: 2,
    transactionCountNeeded: 40,
    officialBridgeNeeded: true,
    zkSyncDomainNeeded: false,
    dmailerAllowed: false,
  },
  {
    tierRank: 3,
    transactionCountNeeded: 30,
    officialBridgeNeeded: false,
    zkSyncDomainNeeded: false,
    dmailerAllowed: false,
  },
  {
    tierRank: 4,
    transactionCountNeeded: 20,
    officialBridgeNeeded: false,
    zkSyncDomainNeeded: false,
    dmailerAllowed: true,
  },
  {
    tierRank: 5,
    transactionCountNeeded: 10,
    officialBridgeNeeded: false,
    zkSyncDomainNeeded: false,
    dmailerAllowed: true,
  },
];

export const tierDistributionInPercents = {
  1: 5,
  2: 15,
  3: 20,
  4: 30,
  5: 30,
};
