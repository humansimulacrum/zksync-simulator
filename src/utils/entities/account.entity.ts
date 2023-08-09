import mongoose, { Document } from 'mongoose';

export interface Account {
  walletAddress: string;
  privateKey: string;
  transactionCount: number;
  rank: number;
  lastTransactionDate: string;
  gasSpentInUsd: number;
}

const accountSchema = new mongoose.Schema({
  walletAddress: { type: 'string' },
  privateKey: { type: 'string' },
  transactionCount: { type: 'number' },
  rank: { type: 'number' },
  lastTransactionDate: { type: 'string' },
  gasSpentInUsd: { type: 'number' },
});

export const AccountModel = mongoose.model('Account', accountSchema);
