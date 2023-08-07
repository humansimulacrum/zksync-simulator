import Web3 from 'web3';
import { Account } from 'web3-core';
import { Chain } from '../const/chains.const';

export interface Swap {
  protocolName: string;
  protocolRouterContract: string;

  supportedCoins: string[];
  chain: Chain;
  web3: Web3;

  privateKey: string;
  account: Account;
  walletAddress: string;

  swap(fromToken: string, toToken: string, amountFrom: number, amountTo: number): any;
}
