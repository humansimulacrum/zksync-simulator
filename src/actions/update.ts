import { ActivityModule } from '../modules/checkers/activity.module';
import { log } from '../utils/logger/logger';
import { connectToDatabase } from '../utils/helpers/db.helper';
import { AccountRepository } from '../repositories/account.repository';

async function actualizeActivityAll() {
  await connectToDatabase();
  const activityModule = await ActivityModule.create();

  const accounts = await AccountRepository.find();

  const promiseArray = accounts.map(async (account) => {
    await activityModule.actualizeActivity(account);
    log('Account Activity Actualizer', `${account.walletAddress!}: Activity Actualized!`);
  });

  await Promise.all(promiseArray);
  process.exit(0);
}

actualizeActivityAll();
