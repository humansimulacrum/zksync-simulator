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
import { ZkSyncNameService } from '../name-services/zksync-name.module';
import { TransferDataItem } from '../../utils/interfaces/transfer-item.interface';
import { isSelfTransaction } from '../../utils/helpers/address.helper';
import { TokenModule } from './token.module';
import { TokenMap } from '../../utils/types/token-map.type';

export class ActivityModule {
  moduleName = 'ActivityModule';
  proxies: string[];
  web3: Web3;

  tokenModule: TokenModule;

  private constructor(proxies: string[], web3: Web3, tokenModule: TokenModule) {
    this.proxies = proxies;
    this.web3 = web3;
    this.tokenModule = tokenModule;
  }

  static async create(): Promise<ActivityModule> {
    const proxies = await importProxies();
    const web3 = new Web3(ERA.rpc);

    const tokenModule = await TokenModule.create();

    return new ActivityModule(proxies, web3, tokenModule);
  }

  async getActivity(walletAddress: string): Promise<Partial<Activity>> {
    const transactionCount = await this.getTransactionCount(walletAddress);

    if (!transactionCount) {
      return {
        transactionCount: 0,
        lastTransactionDate: new Date(0).toISOString(),
        gasSpentInUsd: 0,
      };
    }

    const transactions = await this.getTransactions(walletAddress);
    const { contracts: uniqueContracts, count: uniqueContractCount } = this.getUniqueContractsAndCount(transactions);

    const volumesPromise = this.getVolumes(walletAddress);
    const oneTimePromise = this.getOneTimeActivities(transactions, walletAddress);
    const gasSpentInUsdPromise = this.getGasSpentInUsd(transactions);
    const lastTransactionDatePromise = this.getLastTransactionDate(transactions);

    const [{ bridgeVolume, transactionVolume }, { officialBridge, zkSyncDomain }, gasSpentInUsd, lastTransactionDate] =
      await Promise.all([volumesPromise, oneTimePromise, gasSpentInUsdPromise, lastTransactionDatePromise]);

    return {
      gasSpentInUsd,
      lastTransactionDate,
      bridgeVolume,
      transactionVolume,
      officialBridge,
      zkSyncDomain,
      transactionCount,
      uniqueContractArray: JSON.stringify(uniqueContracts),
      uniqueContractCount,
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

  async getUsedContracts(accountId: string) {
    const usedContracts = await ActivityRepository.getUniqueContractsForAccount(accountId);
    return usedContracts;
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

    let gasSpentInUsd = Number(fromWei(sumInWei.toFixed(0))) * etherPrice;

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

  private async getTransactions(walletAddress: string): Promise<TransactionDataItem[]> {
    const proxyStr = choose(this.proxies);
    const urlString = `https://block-explorer-api.mainnet.zksync.io/transactions?limit=100&address=${walletAddress}`;

    try {
      const data = await fetchData(urlString, proxyStr);
      return data.items;
    } catch (e: any) {
      logWithFormatting(this.moduleName, `${walletAddress}. Transaction fetch failed. ${e.message}`);
    }

    return [];
  }

  private async getVolumes(walletAddress: string): Promise<{ bridgeVolume: number; transactionVolume: number }> {
    const transfers = await this.getTransfers(walletAddress);
    const tokenMap = await this.tokenModule.getTokenMap();

    let bridgeVolume = 0;
    let transactionVolume = 0;

    transfers.forEach((transfer) => {
      if (this.isBridgeTransfer(transfer, walletAddress)) {
        bridgeVolume += Number(transfer.amount);
      }

      if (this.isTokenTransfer(transfer, tokenMap)) {
        const transferAmountInUsd = this.tokenModule.calculateValueInUsd(
          tokenMap[transfer.token!.symbol],
          transfer.amount
        );

        transactionVolume += transferAmountInUsd;
      }
    });

    return {
      bridgeVolume,
      transactionVolume,
    };
  }

  private async getTransfers(walletAddress: string): Promise<TransferDataItem[]> {
    const proxyStr = choose(this.proxies);
    const urlString = `https://block-explorer-api.mainnet.zksync.io/address/${walletAddress}/transfers`;

    try {
      const data = await fetchData(urlString, proxyStr);
      return data.items;
    } catch (e: any) {
      logWithFormatting(this.moduleName, `${walletAddress}. Transaction fetch failed. ${e.message}`);
    }

    return [];
  }

  private getUniqueContractsAndCount(transactions: TransactionDataItem[]) {
    const allContracts = transactions.map((transaction) => transaction.to);
    const uniqueContracts = [...new Set(allContracts)];

    return { contracts: uniqueContracts, count: uniqueContracts.length };
  }

  private async getOneTimeActivities(transactions: TransactionDataItem[], walletAddress: string) {
    return {
      officialBridge: this.hasOfficialBridge(transactions),
      zkSyncDomain: await this.hasZkDomainName(walletAddress),
    };
  }

  private hasOfficialBridge(transactions: TransactionDataItem[]): boolean {
    return transactions.some((transaction) => transaction.isL1Originated) || false;
  }

  private async hasZkDomainName(walletAddress: string): Promise<boolean> {
    const zkNameService = new ZkSyncNameService(undefined, walletAddress);
    return zkNameService.isAlreadyMinted() !== '0';
  }

  private isBridgeTransfer = (transfer: TransferDataItem, walletAddress: string) =>
    (transfer.type === 'deposit' || transfer.type === 'withdrawal') &&
    isSelfTransaction(transfer.from, transfer.to, walletAddress);

  private isTokenTransfer = (transfer: TransferDataItem, tokenMap: TokenMap) =>
    transfer.token && tokenMap[transfer.token.symbol];
}
