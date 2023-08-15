import Web3 from 'web3';
import { choose, getTokenPriceCryptoCompare } from '../../utils/helpers';
import { fetchData, postData } from '../../utils/helpers/fetch.helper';
import { log } from '../../utils/logger/logger';
import { TransactionDataItem } from '../../utils/interfaces/transaction-item.interface';
import { AccountActivity } from '../../utils/interfaces/activity.interface';

export class ZkSyncActivityModule {
  moduleName = 'ZkSyncActivityModule';
  proxies: string[];
  web3: Web3;

  constructor(proxies: string[], web3: Web3) {
    this.proxies = proxies;
    this.web3 = web3;
  }

  private async getTransactionCount(walletAddr: string) {
    const transactionCount = await this.web3.eth.getTransactionCount(walletAddr);
    return transactionCount;
  }

  private async getGasSpentInUsd(transactions: TransactionDataItem[]) {
    const sumInWei = transactions.reduce((acc: number, transaction) => {
      const fee = Number(Web3.utils.hexToNumber(transaction.fee));
      return acc + fee;
    }, 0);

    const etherPrice = await getTokenPriceCryptoCompare('ETH');

    return Number(Web3.utils.fromWei(String(sumInWei), 'ether')) * etherPrice;
  }

  private async getLastTransactionDate(transactions: TransactionDataItem[]) {
    const lastTransaction = transactions.reduce(
      (currentLastTransaction, currentTransaction) => {
        return new Date(currentLastTransaction.receivedAt) > new Date(currentTransaction.receivedAt)
          ? currentLastTransaction
          : currentTransaction;
      },
      {
        receivedAt: new Date(0).toISOString(),
      }
    );

    return lastTransaction.receivedAt;
  }

  private async getLeaderboardPosition(walletAddr: string): Promise<number> {
    const proxyStr = choose(this.proxies);
    const urlString = `https://minitoolkit.org/api/leaderboard`;

    const body = { addresses: [walletAddr] };

    try {
      const ranking = await postData(urlString, proxyStr, body);

      if (!ranking || !ranking.length || !ranking[0] || !ranking[0].rank) {
        return 0;
      }

      return ranking[0].rank;
    } catch (e: any) {
      log(this.moduleName, `${walletAddr}. Ranking fetch failed. ${e.message}`);
    }

    return 0;
  }

  private async getTransactions(walletAddr: string): Promise<TransactionDataItem[]> {
    const proxyStr = choose(this.proxies);
    const urlString = `https://block-explorer-api.mainnet.zksync.io/transactions?limit=100&address=${walletAddr}`;

    try {
      const data = await fetchData(urlString, proxyStr);
      return data.items;
    } catch (e: any) {
      log(this.moduleName, `${walletAddr}. Transaction fetch failed. ${e.message}`);
    }

    return [];
  }

  async getActivity(walletAddr: string): Promise<AccountActivity> {
    const transactionCount = await this.getTransactionCount(walletAddr);

    if (!transactionCount) {
      return {
        rank: 0,
        transactionCount: 0,
        lastTransactionDate: new Date(0).toISOString(),
        gasSpentInUsd: 0,
      };
    }

    const transactions = await this.getTransactions(walletAddr);
    const rank = await this.getLeaderboardPosition(walletAddr);

    const gasSpentInUsd = await this.getGasSpentInUsd(transactions);
    const lastTransactionDate = await this.getLastTransactionDate(transactions);

    return {
      rank,
      gasSpentInUsd,
      lastTransactionDate,
      transactionCount,
    };
  }
}
