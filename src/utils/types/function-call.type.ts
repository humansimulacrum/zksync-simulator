import { TransactionRequest } from 'ethers';

export type FunctionCall = {
  encodeABI: () => any;
  estimateGas: (transactionConfig: Partial<TransactionRequest>) => string;
};
