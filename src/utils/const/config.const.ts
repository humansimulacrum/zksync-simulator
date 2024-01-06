export const maxGwei = 18;
export const shuffleWallets = true;

export const sleepOnHighGas = 60;
export const sleepBetweenWalletsFrom = 300;
export const sleepBetweenWalletsTo = 600;

export const slippage = 0.97; // 97% from token price is set as minimum out amount on swap

export const minAmountOfTokenToSwapInUsd = 0.15;

export const logFilePath = 'logs.txt';

// picker options
export const ONLY_INACTIVE_ACCOUNTS_PICKED = false;
export const daysBetweenTransactionsOnAccount = 30; // one transaction each month, when activity is kept
export const ACCOUNTS_IN_BATCH = 4;

// swap config
export const partOfEthToSwapMin = 0.4; // 40% of current eth balance
export const partOfEthToSwapMax = 0.6; // 60% of current eth balance

// bridge config
export const partOfEthToBridgeMin = 0.4; // 40% of current eth balance
export const partOfEthToBridgeMax = 0.6; // 60% of current eth balance
