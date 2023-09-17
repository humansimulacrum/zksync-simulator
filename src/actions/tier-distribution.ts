import { getRepository } from 'typeorm';
import { tiers } from '../utils/const/tiers.const';
import { tierAssigner } from '../utils/helpers/tier.helper';
import { Tier } from '../entities/tier.entity';
import { Account } from '../entities/account.entity';
import { connectToDatabase } from '../utils/helpers/db.helper';

async function tierDistribution() {
  await connectToDatabase();

  const accountRepository = getRepository(Account);
  const tierRepository = getRepository(Tier);

  await tierRepository.createQueryBuilder('tier').delete().from(Tier).where('id = :id', { id: 1 }).execute();
  await tierRepository.save(tiers);

  const accounts = await accountRepository
    .createQueryBuilder('account')
    .leftJoinAndSelect('account.activity', 'activities')
    .getMany();

  const tiersCreated = await tierRepository.find();
  const assignedTiers = await tierAssigner(accounts, tiersCreated);

  await accountRepository.save(accounts);
  process.exit(0);
}

tierDistribution();
