import Web3 from 'web3';
import { ActivityModule } from '../modules/utility/activity.module';
import { connectToDatabase, importETHWallets, logWithFormatting } from '../utils/helpers';
import { AccountRepository, ActivityRepository } from '../repositories';

const PROTOCOL_NAME = 'Account DB Import';

async function importAccounts() {
  await connectToDatabase();

  const ethWallets = await importETHWallets();

  if (!ethWallets) {
    logWithFormatting(PROTOCOL_NAME, `No wallets found on the import.`);
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
    logWithFormatting(PROTOCOL_NAME, `${walletAddress}: Already in the DB.`);
    return;
  }

  const account = await AccountRepository.createAccount(privateKey, walletAddress);
  const activity = await activityModule.actualizeActivity(account);

  await setAccountActivityRelationship(account.id, activity.id);
  logWithFormatting(PROTOCOL_NAME, `${walletAddress}: Saved to DB.`);
}

async function setAccountActivityRelationship(accountId: string, activityId: string) {
  await ActivityRepository.updateById(activityId, { account: { id: accountId } });
  await AccountRepository.updateById(accountId, { activity: { id: activityId } });
}

importAccounts();
