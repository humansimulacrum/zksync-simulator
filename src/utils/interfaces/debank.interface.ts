export interface DebankTokenBalanceResponse {
  amount: number;
  chain: string;
  decimals: number;
  id: string;
  name: string;
  price: number;
  raw_amount: number;
  raw_amount_hex_str: string;
  raw_amount_str: string;
  symbol: string;
}

export interface DebankWalletBalanceResponse {
  data: DebankTokenBalanceResponse[] | [];
}

export interface DebankTokenBalance {
  chain: string;
  decimals: number;
  symbol: string;
  amount: number;
  rawAmount: number;
  price: number;
  valueInToken: number;
}
