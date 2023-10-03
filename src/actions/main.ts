import { sleepBetweenWalletsFrom, sleepBetweenWalletsTo } from '../utils/const/config.const';
import { importProxies, randomIntInRange, sleepLogWrapper, waitForGas } from '../utils/helpers';
import { accountPicker } from '../utils/helpers/picker.helper';
import { ActivityModule } from '../modules/checkers/activity.module';
import Web3 from 'web3';
import { ERA } from '../utils/const/chains.const';
import { ethers } from 'ethers';
import { connectToDatabase } from '../utils/helpers/db.helper';
import { executeSwap } from '../modules/swaps/execute.module';
import { Account } from '../entity/account.entity';

export async function main() {
  await connectToDatabase();

  const proxies = await importProxies();
  const accounts = await accountPicker();

  const web3 = new Web3(ERA.rpc);

  const activityModule = new ActivityModule(proxies, web3);

  for (let i = 0; i < accounts.length; i++) {
    await executeActivity(accounts[i], web3, activityModule);
  }

  process.exit(0);
}

async function executeActivity(account: Account, web3: Web3, activityModule: ActivityModule) {
  await waitForGas(web3, account.walletAddress);
  await executeSwap(account, activityModule);

  const sleepDuration = randomIntInRange(sleepBetweenWalletsFrom, sleepBetweenWalletsTo);
  await sleepLogWrapper(sleepDuration * 1000, ethers.constants.AddressZero, 'between wallets.');
}

main();
