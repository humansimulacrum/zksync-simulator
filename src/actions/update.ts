import { ActivityModule } from '../modules/utility/activity.module';
import { connectToDatabase } from '../utils/helpers/db.helper';
import { AccountRepository } from '../repositories/account.repository';
import { logWithFormatting } from '../utils/helpers';

async function actualizeActivityAll() {
  await connectToDatabase();
  const activityModule = await ActivityModule.create();

  const accounts = await AccountRepository.find();

  const promiseArray = accounts.map(async (account) => {
    await activityModule.actualizeActivity(account);
    logWithFormatting('Account Activity Actualizer', `${account.walletAddress!}: Activity Actualized!`);
  });

  await Promise.all(promiseArray);
  process.exit(0);
}

actualizeActivityAll();
