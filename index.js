import { sleep } from 'zksync-web3/build/src/utils.js';
import { mainLoop } from './mainLoop.js';
import { Debank } from './modules/checkers/debank/debank.js';
import { importETHWallets } from './utils/helpers/account-import.helper.js';
import { importProxies } from './utils/helpers/proxy-import.helper.js';
import { sleepFrom, sleepTo } from './config.js';
import { randomIntInRange } from './utils/helpers/random.helper.js';

const ethWallets = await importETHWallets();
const proxies = await importProxies();

if (!ethWallets) {
  console.log('ZkSync AIO. No wallets found.');
  process.exit(0);
}

const debank = new Debank(proxies);

for (let i = 0; i < ethWallets.length; i++) {
  let privateKey = ethWallets[i];
  await mainLoop(privateKey, debank);

  const sleepDuration = randomIntInRange(sleepFrom, sleepTo);
  console.log(`ZkSync AIO. Main loop. Sleeping for ${sleepDuration} seconds before next wallet...`);

  await sleep(sleepDuration * 1000);
}
