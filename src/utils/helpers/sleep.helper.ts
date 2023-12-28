import { sleepBetweenWalletsFrom, sleepBetweenWalletsTo } from '../const/config.const';
import { randomIntInRange, sleepLogWrapper } from '.';
import { ethers } from 'ethers';

export async function sleepBetweenWallets() {
  const sleepDuration = randomIntInRange(sleepBetweenWalletsFrom, sleepBetweenWalletsTo);
  await sleepLogWrapper(sleepDuration * 1000, ethers.ZeroAddress, 'between wallets.');
}

export async function sleep(millis: number) {
  return new Promise((resolve) => setTimeout(resolve, millis));
}
