import { Contract, ethers, Wallet } from 'ethers';
import { toChecksumAddress } from 'web3-utils';

import { Chain, ERA } from '../../utils/const/chains.const';
import { generateName } from '../../utils/helpers';
import { toWei } from '../../utils/helpers/wei.helper';
import { TransactionModule } from '../utility/transaction.module';
import { ExecutableModule, ExecuteOutput, ModuleOutput } from '../../utils/interfaces/execute.interface';
import { ActionType } from '../../utils/enums/action-type.enum';
import { ERA_NAME_SERVICE_ABI } from '../../utils/abi/eraNameService';

const ZKSYNC_NAME_CONTRACT = toChecksumAddress('0x935442AF47F3dc1c11F006D551E13769F12eab13');

export class ZkSyncNameService implements ExecutableModule {
  protocolName: string;
  provider: ethers.providers.JsonRpcProvider;
  chain: Chain;

  privateKey: string;
  wallet: Wallet;
  walletAddress: string;

  contractAddr: string;
  contractAbi: typeof ERA_NAME_SERVICE_ABI;
  contract: Contract;

  constructor(privateKey?: string, walletAddress?: string) {
    this.protocolName = ActionType.ZkNS;

    this.chain = ERA;
    this.provider = new ethers.providers.JsonRpcProvider(this.chain.rpc);

    if (privateKey) {
      this.wallet = new Wallet(privateKey, this.provider);
      this.walletAddress = this.wallet.address;
    }

    if (walletAddress) {
      this.walletAddress = walletAddress;
    }

    this.contractAddr = ZKSYNC_NAME_CONTRACT;
    this.contractAbi = ERA_NAME_SERVICE_ABI;

    this.contract = new Contract(this.contractAddr, this.contractAbi, this.provider);
  }

  async execute(): Promise<ExecuteOutput> {
    if (await this.isAlreadyMinted()) {
      throw new Error('Already minted');
    }

    const { transactionHash, message } = await this.mint();

    return {
      transactionHash,
      chain: ERA,
      message,
      protocolName: this.protocolName,
    };
  }

  async mint(): Promise<ModuleOutput> {
    const name = await this.chooseName();

    const mintPrice = 0.0026;
    const mintPriceWei = toWei(mintPrice);

    const tx = await this.contract.register(name, { value: mintPriceWei });

    const transactionHash = tx.hash;

    return { transactionHash, message: `Minted ZkSync Domain Name ${name}.zk` };
  }

  async chooseName() {
    let name;

    while (true) {
      name = generateName();
      const isTaken = await this.checkEligibility(name);
      if (isTaken === 0) {
        break;
      }
    }

    return name;
  }

  checkEligibility(name: string) {
    return this.contract.tokenAddressandID(name);
  }

  isAlreadyMinted() {
    return this.contract.balanceOf(this.walletAddress);
  }
}
