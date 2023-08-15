import { ActivityType } from '../helpers/tier.helper';

export const maxGwei = 15;
export const shuffleWallets = true;

export const sleepOnHighGas = 60000;
export const sleepBetweenWalletsFrom = 300;
export const sleepBetweenWalletsTo = 600;

export const maxPriorityFeePerGas = 1500000000; // 1.5 gwei

export const slippage = 0.98; // 98% from token price is set as minimum out amount on swap

export const minAmountOfTokenToSwapInUsd = 0.15;

export const moduleName = 'ZkSync-Simulator';
export const logFilePath = 'logs.txt';

// picker options

export const daysBetweenTransactionsOnAccount = 30; // one transaction each week, when activity is kept
export const accountsInBatch = 3;

export const tierAssignmentActivityPriorities: ActivityType[] = ['Official Bridge', 'ZkDomain', 'Transactions', 'Rank'];
