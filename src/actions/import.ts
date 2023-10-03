import Web3 from 'web3';
import { ActivityModule } from '../modules/checkers/activity.module';
import { importETHWallets, importProxies } from '../utils/helpers';
import { log } from '../utils/logger/logger';
import { ERA } from '../utils/const/chains.const';
import { connectToDatabase } from '../utils/helpers/db.helper';
import { AccountRepository } from '../repositories/account.repository';
import { ActivityRepository } from '../repositories/activity.repository';
import { Account } from '../entity/account.entity';
import { Activity } from '../entity/activities.entity';

const PROTOCOL_NAME = 'Account DB Import';

async function importAccounts() {
  await connectToDatabase();

  const ethWallets = await importETHWallets();
  const proxies = await importProxies();

  if (!ethWallets) {
    log(PROTOCOL_NAME, `No wallets found on the import.`);
    process.exit(0);
  }

  const web3 = new Web3(ERA.rpc);
  const checker = new ActivityModule(proxies, web3);

  const promiseList = ethWallets.map((privateKey) => importAccountAndActivities(privateKey, web3, checker));
  await Promise.allSettled(promiseList);

  process.exit(0);
}

async function importAccountAndActivities(privateKey, web3: Web3, checker: ActivityModule) {
  const walletAddress = web3.eth.accounts.privateKeyToAccount(privateKey).address;
  const existingAccount = await AccountRepository.findOneBy({ walletAddress });

  if (existingAccount) {
    log(PROTOCOL_NAME, `${walletAddress}: Already in the DB.`);
    return;
  }

  const account = await createAccount(privateKey, walletAddress);
  const activity = await fetchAndSaveActivity(checker, walletAddress);

  await appendActivityToAccount(account, activity);
  log(PROTOCOL_NAME, `${walletAddress}: Saved to DB.`);
}

async function createAccount(privateKey: string, walletAddress: string) {
  const createAccountPayload = {
    privateKey,
    walletAddress,
    activity: null,
    tier: null,
  };

  const createdAccount = await AccountRepository.save(createAccountPayload);
  return createdAccount;
}

async function fetchAndSaveActivity(checker: ActivityModule, walletAddress: string) {
  const currentActivityInfo = await checker.getActivity(walletAddress);
  const activity = await ActivityRepository.save(currentActivityInfo);

  return activity;
}

async function appendActivityToAccount(account: Account, activity: Activity) {
  await ActivityRepository.updateById(activity.id, { account });
  await AccountRepository.updateById(account.id, { activity });
}

importAccounts();
