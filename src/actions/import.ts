import Web3 from 'web3';
import { ZkSyncActivityModule } from '../modules/checkers/zksync-activity.module';
import { importETHWallets, importProxies } from '../utils/helpers';
import { log } from '../utils/logger/logger';
import { ERA } from '../utils/const/chains.const';
import { Account } from '../entities/account.entity';
import { AccountActivity } from '../entities/activities.entity';
import { connectToDatabase } from '../utils/helpers/db.helper';
import { getRepository } from 'typeorm';

async function importAccounts() {
  await connectToDatabase();

  const accountRepository = getRepository(Account);
  const activityRepository = getRepository(AccountActivity);

  const ethWallets = await importETHWallets();
  const proxies = await importProxies();

  if (!ethWallets) {
    log('Account DB Import', `No wallets found on the import.`);
    process.exit(0);
  }

  const web3 = new Web3(ERA.rpc);
  const checker = new ZkSyncActivityModule(proxies, web3);

  for (let i = 0; i < ethWallets.length; i++) {
    const privateKey = ethWallets[i];
    const walletAddress = web3.eth.accounts.privateKeyToAccount(privateKey).address;

    const existingAccount = await accountRepository.findOneBy({ walletAddress });

    if (existingAccount) {
      log('Account DB Import', `${walletAddress}: Already in the DB.`);
      continue;
    }

    const currentActivityInfo = await checker.getActivity(walletAddress);
    const activity = await activityRepository.save(currentActivityInfo);

    const createAccountPayload = {
      privateKey,
      walletAddress,
      activity,
      tier: null,
    };

    const createdAccount = await accountRepository.save(createAccountPayload);

    activity.account = createdAccount;
    await activityRepository.update({ id: activity.id }, { account: createdAccount });

    log('Account DB Import', `${walletAddress}: Saved to DB.`);
  }

  process.exit(0);
}

importAccounts();
