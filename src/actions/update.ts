import Web3 from 'web3';
import { importProxies } from '../utils/helpers';
import { ActivityModule } from '../modules/checkers/activity.module';
import { ERA } from '../utils/const/chains.const';
import { log } from '../utils/logger/logger';
import { updateActivity } from '../utils/helpers/activity.helper';
import { Account } from '../entity/account.entity';
import { connectToDatabase } from '../utils/helpers/db.helper';
import { AccountRepository } from '../repositories/account.repository';

async function updateActivityAll() {
  await connectToDatabase();

  const proxies = await importProxies();
  const web3 = new Web3(ERA.rpc);
  const activityModule = new ActivityModule(proxies, web3);

  const accounts = await AccountRepository.find();

  const promiseArray = accounts.map(async (account) => {
    await updateActivity(account as unknown as Account, activityModule);
    log('Account Activity Updator', `${account.walletAddress!}: Activity Updated!`);
  });

  await Promise.all(promiseArray);
  process.exit(0);
}

updateActivityAll();
