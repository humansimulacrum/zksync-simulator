import {
  sleepBetweenTransactionsFrom,
  sleepBetweenTransactionsTo,
  sleepBetweenWalletsFrom,
  sleepBetweenWalletsTo,
} from '../const/config.const';
import { randomIntInRange, sleepLogWrapper } from '.';
import { ethers } from 'ethers';

export async function sleepBetweenWallets(amountOfAccounts: number) {
  let sleepDuration: number;

  if (process.env.SCHEDULE_MODE) {
    const secondsUntilEndOfDay = getTimeUntilEndOfDay();
    sleepDuration = secondsUntilEndOfDay / amountOfAccounts;
  } else {
    sleepDuration = randomIntInRange(sleepBetweenWalletsFrom, sleepBetweenWalletsTo);
  }

  await sleepLogWrapper(sleepDuration * 1000, ethers.constants.AddressZero, 'between wallets.');
}

export async function sleepBetweenTransactions(walletAddress: string) {
  const sleepDuration = randomIntInRange(sleepBetweenTransactionsFrom, sleepBetweenTransactionsTo);

  await sleepLogWrapper(sleepDuration * 1000, walletAddress, 'between transactions.');
  return sleep(sleepDuration);
}

export async function sleep(millis: number) {
  return new Promise((resolve) => setTimeout(resolve, millis));
}

function getTimeUntilEndOfDay() {
  const now = new Date();

  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999 // Set to last millisecond before midnight
  );

  const diff = endOfDay.getTime() - now.getTime(); // Difference in milliseconds
  return Math.floor(diff / 1000); // Convert milliseconds to seconds
}
