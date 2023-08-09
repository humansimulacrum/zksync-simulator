import Web3 from 'web3';
import { Account, AccountModel } from './utils/entities/account.entity';
import { importProxies } from './utils/helpers';
import { connectToDb } from './utils/helpers/mongoose.helper';
import { ZkSyncActivityModule } from './modules/checkers/zksync-activity.module';
import { ERA } from './utils/const/chains.const';
import { log } from './utils/logger/logger';
import { updateActivity } from './utils/helpers/activity.helper';

async function updateActivityAll() {
  await connectToDb();

  const proxies = await importProxies();
  const web3 = new Web3(ERA.rpc);
  const activityModule = new ZkSyncActivityModule(proxies, web3);

  const accounts = await AccountModel.find().lean();

  const promiseArray = accounts.map(async (account) => {
    await updateActivity(account as unknown as Account, activityModule);
    log('Account Activity Updator', `${account.walletAddress!}: Activity Updated!`);
  });

  await Promise.all(promiseArray);
  process.exit(0);
}

updateActivityAll();
