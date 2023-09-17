import Web3 from 'web3';
import { importProxies } from '../utils/helpers';
import { ZkSyncActivityModule } from '../modules/checkers/zksync-activity.module';
import { ERA } from '../utils/const/chains.const';
import { log } from '../utils/logger/logger';
import { updateActivity } from '../utils/helpers/activity.helper';
import { getRepository } from 'typeorm';
import { Account } from '../entities/account.entity';

async function updateActivityAll() {
  const accountRepository = getRepository(Account);

  const proxies = await importProxies();
  const web3 = new Web3(ERA.rpc);
  const activityModule = new ZkSyncActivityModule(proxies, web3);

  const accounts = await accountRepository.find();

  const promiseArray = accounts.map(async (account) => {
    await updateActivity(account as unknown as Account, activityModule);
    log('Account Activity Updator', `${account.walletAddress!}: Activity Updated!`);
  });

  await Promise.all(promiseArray);
  process.exit(0);
}

updateActivityAll();
