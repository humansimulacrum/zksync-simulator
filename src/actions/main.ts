import { sleepBetweenWalletsFrom, sleepBetweenWalletsTo } from '../utils/const/config.const';
import { importProxies, randomIntInRange, shuffle, sleep, waitForGas } from '../utils/helpers';
import { Debank } from '../modules/checkers/debank.module';
import { accountPicker } from '../utils/helpers/picker.helper';
import { ZkSyncActivityModule } from '../modules/checkers/zksync-activity.module';
import Web3 from 'web3';
import { ERA } from '../utils/const/chains.const';
import { ethers } from 'ethers';
import { connectToDatabase } from '../utils/helpers/db.helper';
import { executeSwap } from '../modules/swaps/execute.module';

export async function main() {
  await connectToDatabase();

  const proxies = await importProxies();
  const accounts = await accountPicker();

  const web3 = new Web3(ERA.rpc);

  const debank = new Debank(proxies);
  const activityModule = new ZkSyncActivityModule(proxies, web3);

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];

    await waitForGas(web3, account.walletAddress);
    await executeSwap(account, debank, activityModule);

    const sleepDuration = randomIntInRange(sleepBetweenWalletsFrom, sleepBetweenWalletsTo);
    await sleep(sleepDuration * 1000, ethers.constants.AddressZero, 'between wallets.');
  }

  process.exit(0);
}

main();
