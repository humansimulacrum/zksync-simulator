import Web3 from 'web3';
import { choose, getTokenPriceCryptoCompare, importProxies, logWithFormatting } from '../../utils/helpers';
import { fetchData, postData } from '../../utils/helpers/fetch.helper';
import { TransactionDataItem } from '../../utils/interfaces/transaction-item.interface';
import { Activity } from '../../entity/activity.entity';
import { ActivityRepository } from '../../repositories/activity.repository';
import { Account } from '../../entity/account.entity';
import { ERA } from '../../utils/const/chains.const';
import { fromWei } from '../../utils/helpers/wei.helper';
import { AccountRepository } from '../../repositories';

export class ActivityModule {
  moduleName = 'ActivityModule';
  proxies: string[];
  web3: Web3;

  private constructor(proxies: string[], web3: Web3) {
    this.proxies = proxies;
    this.web3 = web3;
  }

  static async create(): Promise<ActivityModule> {
    const proxies = await importProxies();
    const web3 = new Web3(ERA.rpc);

    return new ActivityModule(proxies, web3);
  }

  async getActivity(walletAddr: string): Promise<Partial<Activity>> {
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

  async actualizeActivity(account: Account): Promise<Activity> {
    const currentActivity = await this.getActivity(account.walletAddress);

    if (!account.activity) {
      const newActivity = ActivityRepository.create(currentActivity);
      await ActivityRepository.save(newActivity);

      return newActivity;
    }

    return ActivityRepository.updateAndReturnOneById(account.activity.id, { ...currentActivity });
  }

  async setAccountActivityRelationship(accountId: string, activityId: string) {
    await ActivityRepository.updateById(activityId, { account: { id: accountId } });
    await AccountRepository.updateById(accountId, { activity: { id: activityId } });
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

    let gasSpentInUsd = fromWei(sumInWei) * etherPrice;

    if (gasSpentInUsd && isNaN(gasSpentInUsd)) {
      gasSpentInUsd = 0;
    }

    return gasSpentInUsd;
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
      logWithFormatting(this.moduleName, `${walletAddr}. Ranking fetch failed. ${e.message}`);
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
      logWithFormatting(this.moduleName, `${walletAddr}. Transaction fetch failed. ${e.message}`);
    }

    return [];
  }
}
