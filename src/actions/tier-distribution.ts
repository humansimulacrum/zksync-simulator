import { tierAssigner } from '../utils/helpers/tier.helper';
import { connectToDatabase } from '../utils/helpers/db.helper';
import { AccountRepository, TierRepository } from '../repositories';

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
