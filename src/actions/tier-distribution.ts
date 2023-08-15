import { tiers } from '../utils/const/tiers.const';
import { Account, AccountDocument, AccountModel } from '../utils/entities/account.entity';
import { ActivityModel } from '../utils/entities/activities.entity';
import { Tier, TierDocument, TierModel } from '../utils/entities/tier.entity';
import { tierAssigner } from '../utils/helpers/tier.helper';
import { connectToDb } from '../utils/helpers/mongoose.helper';

async function tierDistribution() {
  await connectToDb();

  await TierModel.deleteMany();
  await Promise.all(tiers.map(async (tier) => await TierModel.create(tier)));

  const accounts = (await AccountModel.find().populate({
    path: 'activity',
    model: ActivityModel,
  })) as AccountDocument[];
  const tiersCreated = (await TierModel.find().lean()) as TierDocument[];

  const assignedTiers = await tierAssigner(accounts, tiersCreated);
  await Promise.all(accounts.map(async (account) => account.save()));

  process.exit(0);
}

tierDistribution();
