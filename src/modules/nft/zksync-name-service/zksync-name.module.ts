import Web3 from 'web3';
import { Account } from 'web3-core';
import Contract from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';

import { Chain, ERA } from '../../../utils/const/chains.const';
import { getAbiByRelativePath, log, randomIntInRange } from '../../../utils/helpers';
import { englishWords } from '../../../utils/const/words.const';
import { toWei } from '../../../utils/helpers/wei.helper';
import { ExecutableModule } from '../../executor.module';
import { Transaction } from '../../checkers/transaction.module';

const ZKSYNC_NAME_CONTRACT = Web3.utils.toChecksumAddress('0x935442AF47F3dc1c11F006D551E13769F12eab13');

export class ZkSyncNameService implements ExecutableModule {
  protocolName: string;
  chain: Chain;
  web3: Web3;

  privateKey: string;
  account: Account;
  walletAddress: string;

  contractAddr: string;
  contractAbi: AbiItem[];
  contract: Contract;

  constructor(privateKey: string) {
    this.protocolName = 'ZkSyncNameService';
    this.web3 = new Web3(ERA.rpc);

    this.account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
    this.walletAddress = this.account.address;

    this.contractAddr = ZKSYNC_NAME_CONTRACT;
    this.contractAbi = getAbiByRelativePath('../abi/eraNameService.json');

    this.contract = new this.web3.eth.Contract(this.contractAbi, this.contractAddr);
  }

  async execute() {
    if (await this.isAlreadyMinted()) {
      return;
    }

    const name = await this.chooseName();

    await this.mint(name);
  }

  async mint(name: string) {
    const mintFunctionCall = this.contract.methods.register(name);
    const valueToMint = toWei(0.0026);

    const transaction = new Transaction(this.web3, this.contractAddr, valueToMint, mintFunctionCall, this.account);
    const transactionResult = await transaction.sendTransaction();

    log(
      this.protocolName,
      `${this.walletAddress}: Minted ZkSync Domain Name ${name}.zk | TX: ${ERA.explorer}/${transactionResult}`
    );
  }

  generateName() {
    const wordCount = englishWords.length;
    return englishWords[randomIntInRange(0, wordCount)] + englishWords[randomIntInRange(0, wordCount)];
  }

  async chooseName() {
    let name;

    while (true) {
      name = this.generateName();
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
