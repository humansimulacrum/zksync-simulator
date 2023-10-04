import Web3 from 'web3';
import { ActivityModule } from '../modules/checkers/activity.module';
import { connectToDatabase, importETHWallets } from '../utils/helpers';
import { log } from '../utils/logger/logger';
import { AccountRepository, ActivityRepository } from '../repositories';

const PROTOCOL_NAME = 'Account DB Import';

async function importAccounts() {
  await connectToDatabase();

  const ethWallets = await importETHWallets();

  if (!ethWallets) {
    log(PROTOCOL_NAME, `No wallets found on the import.`);
    process.exit(0);
  }

  const activityModule = await ActivityModule.create();

  const promiseList = ethWallets.map((privateKey) => importAccountAndActivities(privateKey, activityModule));
  await Promise.allSettled(promiseList);

  process.exit(0);
}

async function importAccountAndActivities(privateKey: string, activityModule: ActivityModule) {
  const walletAddress = new Web3().eth.accounts.privateKeyToAccount(privateKey).address;
  const existingAccount = await AccountRepository.findOneBy({ walletAddress });

  if (existingAccount) {
    log(PROTOCOL_NAME, `${walletAddress}: Already in the DB.`);
    return;
  }

  const account = await AccountRepository.createAccount(privateKey, walletAddress);
  const activity = await activityModule.actualizeActivity(account);

  await setAccountActivityRelationship(account.id, activity.id);
  log(PROTOCOL_NAME, `${walletAddress}: Saved to DB.`);
}

async function setAccountActivityRelationship(accountId: string, activityId: string) {
  await ActivityRepository.updateById(activityId, { account: { id: accountId } });
  await AccountRepository.updateById(accountId, { activity: { id: activityId } });
}

importAccounts();
