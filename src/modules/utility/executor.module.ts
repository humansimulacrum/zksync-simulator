import Web3 from 'web3';
import { ERA } from '../../utils/const/chains.const';
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

export class Executor {
  web3: Web3;
  accounts: Account[];

  constructor(web3: Web3, accounts: Account[]) {
    this.web3 = web3;
    this.accounts = accounts;
  }

  static async create() {
    const web3 = new Web3(ERA.rpc);
    const accounts = await accountPicker();

    return new Executor(web3, accounts);
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

    const executableModule = this.actionTypeToExecutableMapper[actionType];
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
    const SWAPS = [SyncSwap, MuteSwap, SpaceFiSwap];
    return choose(SWAPS);
  }

  private isGasOkay = async (account: Account) => {
    const baseFee = (await this.web3.eth.getBlock('latest')).baseFeePerGas;
    const currentGas = Number(Web3.utils.fromWei(String(baseFee), 'Gwei'));

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
