import Web3 from 'web3';
import { Chain, ERA } from '../../utils/const/chains.const';
import { Account } from 'web3-core';
import { generateName, generateSentence, getAbiByRelativePath, randomIntInRange } from '../../utils/helpers';
import { Transaction } from '../utility/transaction.module';
import { ExecuteOutput, ModuleOutput } from '../../utils/interfaces/execute.interface';
import { ActionType } from '../../utils/enums/action-type.enum';

const DMAIL_PROTOCOL_CONTRACT = '0x981F198286E40F9979274E0876636E9144B8FB8E';

export class Dmail {
  protocolName: string;
  protocolContractAddr = DMAIL_PROTOCOL_CONTRACT;
  chain: Chain;
  web3: Web3;

  privateKey: string;
  account: Account;
  walletAddress: string;

  constructor(privateKey: string) {
    this.protocolName = ActionType.Dmail;

    this.chain = ERA;
    this.web3 = new Web3(this.chain.rpc);

    this.privateKey = privateKey;
    this.account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
    this.walletAddress = this.account.address;
  }

  async execute(): Promise<ExecuteOutput> {
    const { transactionHash, message } = await this.sendMail();
    return { transactionHash, message, chain: this.chain, protocolName: this.protocolName };
  }

  async sendMail(): Promise<ModuleOutput> {
    const dmailAbi = getAbiByRelativePath('../abi/dmail.json');
    const dmailContractInstance = new this.web3.eth.Contract(dmailAbi, this.protocolContractAddr);

    const destinationEmailAddr = this.generateEmail();
    const emailSubject = this.generateSubject();

    const dmailFunctionCall = dmailContractInstance.methods.send_mail(destinationEmailAddr, emailSubject);

    const tx = new Transaction(this.web3, this.protocolContractAddr, '0', dmailFunctionCall, this.account);
    const transactionHash = await tx.sendTransaction();

    const message = `Sent message to ${destinationEmailAddr}`;

    return {
      transactionHash,
      message,
    };
  }

  generateEmail() {
    const name = generateName();
    return `${name}@dmail.ai`;
  }

  generateSubject() {
    const messageLength = randomIntInRange(4, 8);
    return generateSentence(messageLength);
  }
}
