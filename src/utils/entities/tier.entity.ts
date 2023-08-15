import mongoose, { Document } from 'mongoose';

export interface Tier {
  tierRank: number;
  transactionCountNeeded: number;
  officialBridgeNeeded: boolean;
  zkSyncDomainNeeded: boolean;
  dmailerAllowed: boolean;

  // in future
  // volume: number;
  // uniqueSmartContracts: number;
}

export type TierDocument = Tier & Document;

const tierSchema = new mongoose.Schema({
  tierRank: { type: 'number' },
  transactionCountNeeded: { type: 'number' },
  officialBridgeNeeded: { type: 'boolean', default: false },
  zkSyncDomainNeeded: { type: 'boolean', default: false },
  dmailerAllowed: { type: 'boolean', default: false },
});

export const TierModel = mongoose.model('Tier', tierSchema);
