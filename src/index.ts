import { moduleName, shuffleWallets, sleepBetweenWalletsFrom, sleepBetweenWalletsTo } from './utils/const/config.const';
import { importETHWallets, importProxies, randomIntInRange, shuffle, sleep } from './utils/helpers';
import { log } from './utils/logger/logger';
import { mainLoop } from './mainLoop';
import { Debank } from './modules/checkers/debank.module';

async function main() {
  let ethWallets = await importETHWallets();
  const proxies = await importProxies();

  if (shuffleWallets) {
    ethWallets = shuffle(ethWallets);
  }

  const debank = new Debank(proxies);

  if (!ethWallets) {
    console.log(`${moduleName}. No wallets found.`);
    process.exit(0);
  }

  for (let i = 0; i < ethWallets.length; i++) {
    let privateKey = ethWallets[i];
    await mainLoop(privateKey, debank);

    const sleepDuration = randomIntInRange(sleepBetweenWalletsFrom, sleepBetweenWalletsTo);
    log('Main', `Waiting for ${sleepDuration} seconds before next wallet...`);

    await sleep(sleepDuration * 1000);
  }

  process.exit(0);
}

main();
