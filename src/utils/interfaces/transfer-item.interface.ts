import { TokenSymbol } from '../types';

export interface TransferDataItem {
  from: string;
  to: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: string;
  amount: string;
  tokenAddress: string;
  type: 'transfer' | 'deposit' | 'withdrawal';
  fields: { tokenId: string } | null;
  token: {
    l2Address: string;
    l1Address: string;
    symbol: TokenSymbol;
    name: string;
    decimals: number;
  } | null;
}
