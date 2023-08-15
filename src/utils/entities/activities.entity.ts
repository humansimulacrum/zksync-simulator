import mongoose, { Document } from 'mongoose';

export interface AccountActivity {
  transactionCount: number;
  rank: number;
  lastTransactionDate: string;
  gasSpentInUsd: number;
  officialBridge: boolean;
  zkSyncDomain: boolean;
}

export type ActivityDocument = AccountActivity & Document;

// should be decoupled into several entities
const activitySchema = new mongoose.Schema({
  transactionCount: { type: 'number' },
  rank: { type: 'number' },
  lastTransactionDate: { type: 'string' },
  gasSpentInUsd: { type: 'number' },
  officialBridge: { type: 'boolean', default: false },
  zkSyncDomain: { type: 'boolean', default: false },
});

export const ActivityModel = mongoose.model('Activity', activitySchema);
