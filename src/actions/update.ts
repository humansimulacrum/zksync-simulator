import { ActivityModule } from '../modules/utility/activity.module';
import { connectToDatabase } from '../utils/helpers/db.helper';
import { AccountRepository } from '../repositories/account.repository';
import { logWithFormatting } from '../utils/helpers';
import { TokenModule } from '../modules/utility/token.module';

async function actualizeActivityAll() {
  await connectToDatabase();

  const tokenModule = await TokenModule.create();
  await tokenModule.upsertTokens();

  const activityModule = await ActivityModule.create();
  const accounts = await AccountRepository.find({ relations: ['activity'] });

  const promiseArray = accounts.map(async (account) => {
    const activity = await activityModule.actualizeActivity(account);
    await activityModule.setAccountActivityRelationship(account.id, activity.id);

    logWithFormatting('Account Activity Actualizer', `${account.walletAddress!}: Activity Actualized!`);
  });

  await Promise.all(promiseArray);
  process.exit(0);
}

actualizeActivityAll();
