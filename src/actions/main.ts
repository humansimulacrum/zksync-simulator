import { sleepBetweenWalletsFrom, sleepBetweenWalletsTo } from '../utils/const/config.const';
import { importProxies, randomIntInRange, sleepLogWrapper, waitForGas } from '../utils/helpers';
import { accountPicker } from '../utils/helpers/picker.helper';
import { ActivityModule } from '../modules/checkers/activity.module';
import Web3 from 'web3';
import { ERA } from '../utils/const/chains.const';
import { ethers } from 'ethers';
import { connectToDatabase } from '../utils/helpers/db.helper';
import { executeSwap } from '../modules/executor.module';
import { Account } from '../entity/account.entity';

export async function main() {
  await connectToDatabase();
  const web3 = new Web3(ERA.rpc);

  const accounts = await accountPicker();

  for (let i = 0; i < accounts.length; i++) {
    await executeAction(accounts[i], web3);
  }

  process.exit(0);
}

async function executeAction(account: Account, web3: Web3) {
  await waitForGas(web3, account.walletAddress);
  await executeSwap(account);

  const sleepDuration = randomIntInRange(sleepBetweenWalletsFrom, sleepBetweenWalletsTo);
  await sleepLogWrapper(sleepDuration * 1000, ethers.constants.AddressZero, 'between wallets.');
}

main();
