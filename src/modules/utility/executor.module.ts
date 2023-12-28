import { ERA, ETH } from '../../utils/const/chains.const';
import {
  accountPicker,
  choose,
  logSuccessfullAction,
  logWithFormatting,
  sleepBetweenWallets,
  sleepLogWrapper,
} from '../../utils/helpers';
import { Account } from '../../entity';
import { maxGwei, sleepOnHighGas } from '../../utils/const/config.const';
import { ExecutableModule } from '../../utils/interfaces/execute.interface';
import { SyncSwap } from '../swaps/syncswap.module';
import { MuteSwap } from '../swaps/muteswap.module';
import { SpaceFiSwap } from '../swaps/spacefi.module';
import { ActionType } from '../../utils/enums/action-type.enum';
import { Dmail } from '../abuse/dmailer.module';
import { ZkSyncBridge } from '../bridges/zksync-bridge.module';
import { Velocore } from '../swaps/velocore.module';
import { ZkSyncNameService } from '../name-services/zksync-name.module';
import { TierModule } from './tier.module';
import { ethers.providers.JsonRpcProvider } from 'ethers';
import { TransactionModule } from './transaction.module';
import { fromWei } from 'web3-utils';

export class Executor {
  provider: ethers.providers.JsonRpcProvider;
  mainnetProvider: ethers.providers.JsonRpcProvider;
  accounts: Account[];

  constructor(provider: ethers.providers.JsonRpcProvider, mainnetProvider: ethers.providers.JsonRpcProvider, accounts: Account[]) {
    this.provider = provider;
    this.mainnetProvider = mainnetProvider;
    this.accounts = accounts;
  }

  static async create() {
    const web3 = new ethers.providers.JsonRpcProvider(ERA.rpc);
    const mainnetWeb3 = new ethers.providers.JsonRpcProvider(ETH.rpc);
    const accounts = await accountPicker();

    return new Executor(web3, mainnetWeb3, accounts);
  }

  async executeActionsOnBatch() {
    for (let i = 0; i < this.accounts.length; i++) {
      await this.executeAction(this.accounts[i]);
    }
  }

  private async executeAction(account: Account) {
    const executableModule = await this.getExecutableForAccount(account);
    await this.waitForGas(account);

    const executeOutput = await executableModule.execute();
    logSuccessfullAction(executeOutput, account.walletAddress);

    await sleepBetweenWallets();
  }

  private async getExecutableForAccount(account: Account): Promise<ExecutableModule> {
    const tierModule = new TierModule(account);
    const actionType = tierModule.findActionForAccount();

    let executableModule;

    if (actionType === ActionType.RandomCheap) {
      executableModule = this.pickRandomCheapActivity(account);
    } else {
      executableModule = this.actionTypeToExecutableMapper[actionType];
    }

    const initializedExecutable = new executableModule(account.privateKey);
    return initializedExecutable;
  }

  actionTypeToExecutableMapper = {
    [ActionType.RandomSwap]: this.pickRandomSwap(),
    [ActionType.RandomCheap]: this.pickRandomSwap(),
    [ActionType.Dmail]: Dmail,
    [ActionType.OfficialBridge]: ZkSyncBridge,
    [ActionType.Mute]: MuteSwap,
    [ActionType.SpaceFi]: SpaceFiSwap,
    [ActionType.SyncSwap]: SyncSwap,
    [ActionType.Velocore]: Velocore,
    [ActionType.ZkNS]: ZkSyncNameService,
  };

  private pickRandomSwap() {
    const SWAPS = [SpaceFiSwap, MuteSwap, SyncSwap, Velocore];
    return choose(SWAPS);
  }

  private pickRandomCheapActivity(account: Account) {
    if (account.tier?.dmailerAllowed) {
      return this.actionTypeToExecutableMapper[ActionType.Dmail];
    }

    return this.pickRandomSwap();
  }

  private isGasOkay = async (account: Account) => {
    const gasPrice = await TransactionModule.getGasPrice(this.mainnetProvider);
    const currentGas = Number(fromWei(gasPrice, 'Gwei'));

    const isGasHigher = currentGas <= maxGwei;

    if (!isGasHigher) {
      logWithFormatting(
        'Gas Checker',
        `${account.walletAddress}: gas is too high. ${currentGas} gwei now vs ${maxGwei} gwei limit.`
      );

      await sleepLogWrapper(sleepOnHighGas * 1000, account.walletAddress, 'on high gas.');
    }

    return isGasHigher;
  };

  private waitForGas = async (account: Account) => {
    let gasOkay = false;
    while (!gasOkay) {
      gasOkay = await this.isGasOkay(account);
    }

    return;
  };
}
