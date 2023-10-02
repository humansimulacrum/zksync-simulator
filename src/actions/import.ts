import Web3 from 'web3';
import { ZkSyncActivityModule } from '../modules/checkers/zksync-activity.module';
import { importETHWallets, importProxies } from '../utils/helpers';
import { log } from '../utils/logger/logger';
import { ERA } from '../utils/const/chains.const';
import { Account } from '../entity/account.entity';
import { AccountActivity } from '../entity/activities.entity';
import { connectToDatabase } from '../utils/helpers/db.helper';
import { getRepository } from 'typeorm';
import { AccountRepository } from '../repositories/account.repository';
import { ActivityRepository } from '../repositories/activity.repository';

async function importAccounts() {
  await connectToDatabase();

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

    const existingAccount = await AccountRepository.findOneBy({ walletAddress });

    if (existingAccount) {
      log('Account DB Import', `${walletAddress}: Already in the DB.`);
      continue;
    }

    const currentActivityInfo = await checker.getActivity(walletAddress);
    const activity = await ActivityRepository.save(currentActivityInfo);

    const createAccountPayload = {
      privateKey,
      walletAddress,
      activity,
      tier: null,
    };

    const createdAccount = await AccountRepository.save(createAccountPayload);
    await ActivityRepository.updateById(activity.id, { account: createdAccount });

    log('Account DB Import', `${walletAddress}: Saved to DB.`);
  }

  process.exit(0);
}

importAccounts();
