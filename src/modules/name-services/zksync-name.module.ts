import Web3 from 'web3';
import { Account } from 'web3-core';
import Contract from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';

import { Chain, ERA } from '../../utils/const/chains.const';
import { generateName, getAbiByRelativePath } from '../../utils/helpers';
import { toWei } from '../../utils/helpers/wei.helper';
import { Transaction } from '../utility/transaction.module';
import { ExecutableModule, ExecuteOutput, ModuleOutput } from '../../utils/interfaces/execute.interface';
import { ActionType } from '../../utils/enums/action-type.enum';

const ZKSYNC_NAME_CONTRACT = Web3.utils.toChecksumAddress('0x935442AF47F3dc1c11F006D551E13769F12eab13');

export class ZkSyncNameService implements ExecutableModule {
  protocolName: string;
  web3: Web3;
  chain: Chain;

  privateKey: string;
  account: Account;
  walletAddress: string;

  contractAddr: string;
  contractAbi: AbiItem[];
  contract: Contract;

  constructor(privateKey?: string, walletAddress?: string) {
    this.protocolName = ActionType.ZkNS;

    this.chain = ERA;
    this.web3 = new Web3(this.chain.rpc);

    if (privateKey) {
      this.account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
      this.walletAddress = this.account.address;
    }

    if (walletAddress) {
      this.walletAddress = walletAddress;
    }

    this.contractAddr = ZKSYNC_NAME_CONTRACT;
    this.contractAbi = getAbiByRelativePath('../abi/eraNameService.json');

    this.contract = new this.web3.eth.Contract(this.contractAbi, this.contractAddr);
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

    const mintFunctionCall = this.contract.methods.register(name);

    const transaction = new Transaction(this.web3, this.contractAddr, mintPriceWei, mintFunctionCall, this.account);
    const transactionHash = await transaction.sendTransaction();

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
    return this.contract.methods.tokenAddressandID(name).call();
  }

  isAlreadyMinted() {
    return this.contract.methods.balanceOf(this.walletAddress).call();
  }
}
