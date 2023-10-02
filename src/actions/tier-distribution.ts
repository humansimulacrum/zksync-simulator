import { Repository, getRepository } from 'typeorm';
import { tiers } from '../utils/const/tiers.const';
import { tierAssigner } from '../utils/helpers/tier.helper';
import { Tier } from '../entity/tier.entity';
import { Account } from '../entity/account.entity';
import { connectToDatabase } from '../utils/helpers/db.helper';
import { TierRepository } from '../repositories/tier.repository';
import { AppDataSource } from '../data-source';
import { AccountRepository } from '../repositories/account.repository';

async function tierDistribution() {
  await connectToDatabase();

  await AccountRepository.removeAllAssignedTiers();
  await TierRepository.removeAllExistingTiers();

  await TierRepository.addNewTiersFromConfig();

  const accountsWithActivities = await AccountRepository.getAccountsWithActivities();
  const tiersCreated = await TierRepository.getAllTiers();

  const accountsWithAssignedTiers = await tierAssigner(accountsWithActivities, tiersCreated);

  await AccountRepository.save(accountsWithAssignedTiers);
  process.exit(0);
}

tierDistribution();
