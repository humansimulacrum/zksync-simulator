import mongoose, { Document } from 'mongoose';
import { ActivityDocument } from './activities.entity';
import { TierDocument } from './tier.entity';

export interface Account {
  walletAddress: string;
  privateKey: string;
  activity: ActivityDocument;
  tier: TierDocument | mongoose.Types.ObjectId;
}

export type AccountDocument = Account & Document;

// should be decoupled into several entities
const accountSchema = new mongoose.Schema({
  walletAddress: { type: 'string' },
  privateKey: { type: 'string' },
  activity: {
    type: mongoose.Types.ObjectId,
    ref: 'Activity',
  },
  tier: {
    type: mongoose.Types.ObjectId,
    ref: 'Tier',
  },
});

export const AccountModel = mongoose.model('Account', accountSchema);
