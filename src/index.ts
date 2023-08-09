import { moduleName, shuffleWallets, sleepBetweenWalletsFrom, sleepBetweenWalletsTo } from './utils/const/config.const';
import { importETHWallets, importProxies, randomIntInRange, shuffle, sleep } from './utils/helpers';
import { log } from './utils/logger/logger';
import { mainLoop } from './mainLoop';
import { Debank } from './modules/checkers/debank.module';
import { connectToDb } from './utils/helpers/mongoose.helper';
import { accountPicker } from './utils/helpers/picker.helper';
import { ZkSyncActivityModule } from './modules/checkers/zksync-activity.module';
import Web3 from 'web3';
import { ERA } from './utils/const/chains.const';

export async function main() {
  await connectToDb();

  const proxies = await importProxies();
  const accounts = await accountPicker();
  const web3 = new Web3(ERA.rpc);

  const debank = new Debank(proxies);
  const activityModule = new ZkSyncActivityModule(proxies, web3);

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    await mainLoop(account, debank, activityModule);

    const sleepDuration = randomIntInRange(sleepBetweenWalletsFrom, sleepBetweenWalletsTo);
    log('Main', `Waiting for ${sleepDuration} seconds before next wallet...`);
    await sleep(sleepDuration * 1000);
  }

  process.exit(0);
}

main();
