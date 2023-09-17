import Web3 from 'web3';
import { Chain, ERA } from '../../utils/const/chains.const';
import { Account } from 'web3-core';
import { log } from '../../utils/logger/logger';
import { getAbiByRelativePath } from '../../utils/helpers';

const DMAIL_PROTOCOL_CONTRACT = '0x981F198286E40F9979274E0876636E9144B8FB8E';

export class Dmail {
  protocolName: string;
  protocolContractAddr = DMAIL_PROTOCOL_CONTRACT;
  chain: Chain;
  web3: Web3;

  privateKey: string;
  account: Account;
  walletAddress: string;

  constructor(privateKey) {
    this.protocolName = 'Dmail';
    this.chain = ERA;
    this.web3 = new Web3(this.chain.rpc);

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
    await this.sendTransaction(dmailFunctionCall);
  }

  async sendTransaction(functionCall) {
    try {
      const estimatedGas = await functionCall.estimateGas({
        from: this.walletAddress,
        value: 0,
      });

      const tx = {
        from: this.walletAddress,
        to: this.protocolContractAddr,
        value: 0,
        nonce: await this.web3.eth.getTransactionCount(this.walletAddress),
        gas: estimatedGas,
        data: functionCall.encodeABI(),
      };

      const signedTx = await this.web3.eth.accounts.signTransaction(tx, this.privateKey);
      if (!signedTx || !signedTx.rawTransaction) {
        throw new Error('Transaction is not generated');
      }

      const sendTransactionResult = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);

      log(
        this.protocolName,
        `${this.walletAddress} | TX: ${this.chain.explorer}/${sendTransactionResult.transactionHash}`
      );

      return sendTransactionResult;
    } catch (error) {
      log(this.protocolName, `${this.walletAddress}. ${error}`);
    }
  }
}

// //     def send_mail(self):
// //         data = self.contract.encodeABI("send_mail", args=(f"{self.address}@dmail.ai", f"{self.address}@dmail.ai"))
// //         tx.update({"data": data})

// //         signed_txn = self.sign(tx)

// //         txn_hash = self.send_raw_transaction(signed_txn)

// //         self.wait_until_tx_finished(txn_hash.hex())
