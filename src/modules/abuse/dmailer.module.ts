import Web3 from 'web3';
import { Chain, ERA } from '../../utils/const/chains.const';
import { Account } from 'web3-core';
import { log } from '../../utils/logger/logger';
import { getAbiByRelativePath } from '../../utils/helpers';
import { Transaction } from '../checkers/transaction.module';

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
    this.protocolName = 'Dmail';
    this.web3 = new Web3(ERA.rpc);

    this.privateKey = privateKey;
    this.account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
    this.walletAddress = this.account.address;
  }

  async execute() {
    const dmailAbi = getAbiByRelativePath('../abi/dmail.json');
    const dmailContractInstance = new this.web3.eth.Contract(dmailAbi, this.protocolContractAddr);

    const destinationEmailAddr = `${this.walletAddress}@dmail.ai`;
    const emailSubject = 'Email for a friend';

    const dmailFunctionCall = dmailContractInstance.methods.send_mail(destinationEmailAddr, emailSubject);

    const tx = new Transaction(this.web3, this.protocolContractAddr, 0, dmailFunctionCall, this.account);
    const transactionHash = await tx.sendTransaction();

    log(
      this.protocolName,
      `${this.walletAddress}: Sent message to ${destinationEmailAddr}. TX: ${ERA.explorer}/${transactionHash}`
    );
  }
}
