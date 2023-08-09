import Web3 from 'web3';
import { ZkSyncActivityModule } from './modules/checkers/zksync-activity.module';
import { importETHWallets, importProxies } from './utils/helpers';
import { log } from './utils/logger/logger';
import { ERA } from './utils/const/chains.const';
import { AccountModel } from './utils/entities/account.entity';
import { connectToDb } from './utils/helpers/mongoose.helper';
import { base64Encode } from './utils/helpers/encode.helper';

async function importAccounts() {
  await connectToDb();

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
    const walletAddr = web3.eth.accounts.privateKeyToAccount(privateKey).address;

    const walletActivity = await checker.getActivity(walletAddr);

    const account = new AccountModel({
      privateKey: base64Encode(privateKey),
      walletAddress: walletAddr,
      ...walletActivity,
    });

    await account.save();

    log('Account DB Import', `${walletAddr}: Saved to DB.`);
  }

  process.exit(0);
}

importAccounts();
