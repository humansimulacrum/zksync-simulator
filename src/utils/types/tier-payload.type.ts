import { Tier } from '../../entity';

export type TierPayload = Omit<Tier, 'accounts' | 'id'>;
