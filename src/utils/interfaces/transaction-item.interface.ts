export interface TransactionDataItem {
  hash: string;
  to: string;
  from: string;
  data: string;
  value: string;
  fee: string;
  nonce: number;
  blockNumber: number;
  l1BatchNumber: number;
  blockHash: string;
  transactionIndex: number;
  receivedAt: string;
  status: string;
  commitTxHash: string;
  executeTxHash: string;
  proveTxHash: string;
  isL1Originated: boolean;
  isL1BatchSealed: true;
}
