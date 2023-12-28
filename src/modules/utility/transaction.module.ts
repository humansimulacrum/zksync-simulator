import { BigNumberish, ethers } from 'ethers';
import { ethers.providers.JsonRpcProvider, TransactionRequest } from 'ethers/providers';
import { FunctionCall } from '../../utils/types/function-call.type';
import { ERA } from '../../utils/const/chains.const';

export class TransactionModule {
  private readonly provider: ethers.providers.JsonRpcProvider;
  private readonly wallet: ethers.Wallet;

  private readonly to: string;
  private readonly value: BigNumberish;

  private readonly functionCall: FunctionCall;
  private readonly transactionConfig?: Partial<TransactionRequest>;

  constructor(
    provider: ethers.providers.JsonRpcProvider,
    to: string,
    value: string,
    functionCall: FunctionCall,
    wallet: ethers.Wallet,
    transactionConfig?: Partial<TransactionRequest>
  ) {
    this.provider = provider;
    this.to = to;
    this.value = ethers.parseEther(value);
    this.functionCall = functionCall;
    this.wallet = wallet;
    this.transactionConfig = transactionConfig;
  }

  async sendTransaction(): Promise<string> {
    const tx = await this.formTransactionConfig();

    const transactionResult = await this.wallet.sendTransaction(tx);
    return transactionResult.hash;
  }

  async formTransactionConfig(): Promise<TransactionRequest> {
    const nonce = await this.getTransactionCount();
    const gasLimit = await this.estimateGas();
    const gasPrice = await TransactionModule.getGasPrice(this.provider);

    const tx: TransactionRequest = {
      from: this.wallet.address,
      to: this.to,
      data: this.functionCall.encodeABI(),
      chainId: ERA.chainId,
      nonce,
      value: this.value,
      gasLimit,
      gasPrice,
      ...this.transactionConfig,
    };

    return tx;
  }

  async getTransactionCount(): Promise<number> {
    return this.provider.getTransactionCount(this.wallet.address);
  }

  async estimateGas(): Promise<ethers.BigNumberish> {
    return this.functionCall.estimateGas({ from: this.wallet.address, value: this.value });
  }

  static async getGasPrice(provider: ethers.providers.JsonRpcProvider): Promise<ethers.BigNumberish> {
    const gasPrice = (await provider.getFeeData()).gasPrice;

    if (!gasPrice) {
      throw new Error('Gas price cannot be retrieved.');
    }

    return gasPrice;
  }
}
