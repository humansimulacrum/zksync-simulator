import Web3 from 'web3';
import { Account } from 'web3-core';
import { FunctionCall, TokenSymbol } from '../../utils/types';
import { Chain, ERA } from '../../utils/const/chains.const';
import { SwapCalculator } from './swap-calculator.module';
import { TokenModule } from '../utility/token.module';
import { Transaction } from '../utility/transaction.module';
import { Token } from '../../entity';
import { SWAP_CONTRACT_ADDRESSES, SWAP_SUPPORTED_COINS } from '../../utils/const/swap.const';
import { ExecutableModule, ExecuteOutput, ModuleOutput } from '../../utils/interfaces/execute.interface';
import { GenerateFunctionCallInput, SwapInput } from '../../utils/interfaces';
import { slippage } from '../../utils/const/config.const';

export abstract class Swap extends ExecutableModule {
  protocolName: string;
  protocolRouterContract: string;

  supportedCoins: TokenSymbol[];
  chain: Chain;
  web3: Web3;

  account: Account;
  walletAddress: string;

  constructor(privateKey: string, protocolName: string) {
    super();

    this.protocolName = protocolName;
    this.protocolRouterContract = SWAP_CONTRACT_ADDRESSES[protocolName];
    this.supportedCoins = SWAP_SUPPORTED_COINS[protocolName];

    this.chain = ERA;
    this.web3 = new Web3(this.chain.rpc);

    this.account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
    this.walletAddress = this.account.address;
  }

  async execute(): Promise<ExecuteOutput> {
    const swapCalculator = await this.createSwapCalculator();
    const swapInput = await swapCalculator.calculateSwapParameters();

    const { transactionHash, message } = await this.swap(swapInput);

    return {
      transactionHash,
      message,
      chain: this.chain,
      protocolName: this.protocolName,
    };
  }

  async swap(swapInput: SwapInput): Promise<ModuleOutput> {
    const { fromToken, toToken, amountToSwap, amountWithPrecision, minOutAmountWithPrecision } =
      await this.prepareTokens(swapInput);

    const swapDeadline = await this.getSwapDeadline();

    const functionCall = await this.generateFunctionCall({
      fromToken,
      toToken,
      amountWithPrecision,
      minOutAmountWithPrecision,
      swapDeadline,
    });

    const transactionHash = await this.sendSwapTransaction(functionCall, fromToken.symbol, amountWithPrecision);
    const message = `Swapped ${amountToSwap} ${fromToken} => ${toToken}`;

    return { transactionHash, message };
  }

  abstract createSwapCalculator(): Promise<SwapCalculator>;
  abstract generateFunctionCall(functionCallInput: GenerateFunctionCallInput): Promise<FunctionCall>;

  async prepareTokens({ fromToken, toToken, amountToSwap }: SwapInput) {
    const tokenModule = await TokenModule.create();

    this.validateTokens(fromToken, toToken);

    const amountWithPrecision = tokenModule.getAmountWithPrecisionWithDecimals(amountToSwap, fromToken.decimals);

    const minOutAmount = this.getMinOutAmount(fromToken, toToken, amountToSwap);
    const minOutAmountWithPrecision = tokenModule.getAmountWithPrecisionWithDecimals(minOutAmount, toToken.decimals);

    if (fromToken.symbol !== 'ETH') {
      await tokenModule.approveToken(
        amountWithPrecision,
        this.account,
        fromToken.contractAddress,
        this.protocolRouterContract
      );
    }

    return {
      fromToken,
      toToken,
      amountToSwap,
      amountWithPrecision,
      minOutAmountWithPrecision,
    };
  }

  async sendSwapTransaction(swapFunctionCall: FunctionCall, fromTokenSymbol: string, amountWithPrecision: number) {
    const value = fromTokenSymbol === 'ETH' ? amountWithPrecision : 0;
    const swapTransaction = new Transaction(
      this.web3,
      this.protocolRouterContract,
      value,
      swapFunctionCall,
      this.account
    );
    return swapTransaction.sendTransaction();
  }

  getSwapDeadline = async () => {
    const currentTimestamp = (await this.web3.eth.getBlock('latest')).timestamp;
    return parseInt(String(currentTimestamp)) + 1200;
  };

  private validateTokens(fromToken: Token, toToken: Token) {
    if (fromToken.symbol === toToken.symbol) {
      throw new Error(`Somehow same tokens are set to be swapped: ${fromToken.symbol}`);
    }
  }

  private getMinOutAmount(fromToken: Token, toToken: Token, fromTokenAmount: number) {
    return ((fromTokenAmount * fromToken.priceIsUsd) / toToken.priceIsUsd) * slippage;
  }
}
