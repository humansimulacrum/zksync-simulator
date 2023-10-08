import Web3 from 'web3';
import { TransactionConfig, Account } from 'web3-core';
import { FunctionCall } from '../../utils/types/function-call.type';
import { ERA } from '../../utils/const/chains.const';

export class Transaction {
  web3: Web3;
  account: Account;

  to: string;
  value: string;

  functionCall: FunctionCall;
  transactionConfig?: Partial<TransactionConfig>;

  constructor(
    web3: Web3,
    to: string,
    value: string,
    functionCall: FunctionCall,
    account: Account,
    transactionConfig?: Partial<TransactionConfig>
  ) {
    this.web3 = web3;
    this.to = to;
    this.functionCall = functionCall;
    this.account = account;
    this.value = value;
    this.transactionConfig = transactionConfig;
  }

  async sendTransaction(): Promise<string> {
    const tx = await this.formTransactionConfig();
    const signedTx = await this.account.signTransaction(tx);

    if (!signedTx || !signedTx.rawTransaction) {
      throw new Error('Transaction signature failed.');
    }

    const transactionResult = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    return transactionResult.transactionHash;
  }

  async formTransactionConfig() {
    const nonce = await this.getTransactionCount();
    const gas = await this.estimateGas();
    const gasPrice = await this.getGasPrice();

    const tx: TransactionConfig = {
      from: this.account.address,
      to: this.to,
      data: this.functionCall.encodeABI(),
      chainId: ERA.chainId,
      nonce,
      value: this.value,
      gas,
      gasPrice,
      ...this.transactionConfig,
    };

    return tx;
  }

  async getTransactionCount() {
    return this.web3.eth.getTransactionCount(this.account.address);
  }

  async estimateGas() {
    return this.functionCall.estimateGas({ from: this.account.address, to: this.to, value: this.value });
  }

  async getGasPrice() {
    return this.web3.eth.getGasPrice();
  }
}
