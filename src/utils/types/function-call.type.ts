import { TransactionConfig } from 'web3-core';

export type FunctionCall = {
  encodeABI: () => any;
  estimateGas: (transactionConfig: Partial<TransactionConfig>) => string;
};
