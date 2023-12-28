import { Chain, ERA } from '../../utils/const/chains.const';
import { generateName, generateSentence, randomIntInRange } from '../../utils/helpers';
import { TransactionModule } from '../utility/transaction.module';
import { ExecuteOutput, ModuleOutput } from '../../utils/interfaces/execute.interface';
import { ActionType } from '../../utils/enums/action-type.enum';
import { Contract, Wallet, ethers } from 'ethers';
import { toChecksumAddress } from 'web3-utils';
import { DMAIL_ABI } from '../../utils/abi/dmail';

const DMAIL_PROTOCOL_CONTRACT = toChecksumAddress('0x981F198286E40F9979274E0876636E9144B8FB8E');

export class Dmail {
  protocolName: string;
  protocolContractAddr = DMAIL_PROTOCOL_CONTRACT;
  chain: Chain;

  provider: ethers.providers.JsonRpcProvider;
  privateKey: string;
  wallet: Wallet;
  walletAddress: string;

  constructor(privateKey: string) {
    this.protocolName = ActionType.Dmail;

    this.chain = ERA;

    this.provider = new ethers.providers.JsonRpcProvider(this.chain.rpc);
    this.wallet = new ethers.Wallet(privateKey, this.provider);

    this.walletAddress = this.wallet.address;
  }

  async execute(): Promise<ExecuteOutput> {
    const { transactionHash, message } = await this.sendMail();
    return { transactionHash, message, chain: this.chain, protocolName: this.protocolName };
  }

  async sendMail(): Promise<ModuleOutput> {
    const dmailContractInstance = new Contract(this.protocolContractAddr, DMAIL_ABI, this.provider);

    const destinationEmailAddr = this.generateEmail();
    const emailSubject = this.generateSubject();

    const dmailFunctionCall = dmailContractInstance.send_mail(destinationEmailAddr, emailSubject);
    const tx = new TransactionModule(this.provider, this.protocolContractAddr, '0', dmailFunctionCall, this.wallet);

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
