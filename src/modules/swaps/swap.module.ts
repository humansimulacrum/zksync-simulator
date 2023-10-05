import Web3 from 'web3';
import { Account } from 'web3-core';

import { Chain, ERA } from '../../utils/const/chains.const';
import { extractNumbersFromString } from '../../utils/helpers/string.helper';
import { log } from '../../utils/logger/logger';
import { Transaction } from '../checkers/transaction.module';
import { FunctionCall } from '../../utils/types/function-call.type';
import { fromWei } from '../../utils/helpers/wei.helper';
import { TokenSymbol } from '../../utils/types/token-symbol.type';
import { ExecutableModule } from '../executor.module';
import { GenerateFunctionCallInput, SwapInput } from '../../utils/interfaces/swap-input.interface';
import { TokenModule } from '../checkers/token.module';
import { Token } from '../../entity/token.entity';
import { slippage } from '../../utils/const/config.const';
import { SwapCalculator } from '../../utils/helpers/pre-swap.helper';

export abstract class Swap implements ExecutableModule {
  protocolName: string;
  protocolRouterContract: string;

  supportedCoins: TokenSymbol[];
  chain: Chain;
  web3: Web3;

  account: Account;
  walletAddress: string;

  constructor(privateKey: string, protocolName: string, protocolRouterContract: string, supportedCoins: TokenSymbol[]) {
    this.protocolName = protocolName;
    this.protocolRouterContract = protocolRouterContract;
    this.supportedCoins = supportedCoins;

    this.web3 = new Web3(ERA.rpc);

    this.account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
    this.walletAddress = this.account.address;
  }

  async execute() {
    const swapCalculator = await this.createSwapCalculator();
    const swapInput = await swapCalculator.calculateSwapParameters();
    await this.swap(swapInput);
  }

  async swap(swapInput: SwapInput): Promise<string> {
    try {
      const { fromToken, toToken, amountWithPrecision, minOutAmountWithPrecision } = await this.prepareTokens(
        swapInput
      );

      const swapDeadline = await this.getSwapDeadline();

      const functionCall = this.generateFunctionCall({
        fromToken,
        toToken,
        amountWithPrecision,
        minOutAmountWithPrecision,
        swapDeadline,
      });

      return this.sendSwapTransaction(functionCall, fromToken.symbol, amountWithPrecision);
    } catch (e: any) {
      this.errorHandler(e, swapInput.fromToken.symbol, swapInput.toToken.symbol);
      throw e;
    }
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

  errorHandler(e: Error, fromToken: string, toToken: string) {
    if (e.message.includes('insufficient funds')) {
      const [balance, fee, value] = extractNumbersFromString(e.message);
      const feeInEther = fromWei(Number(fee));
      const balanceInEther = fromWei(Number(balance));
      const valueInEther = fromWei(Number(value));

      log(
        this.protocolName,
        `${this.walletAddress}: ${fromToken} => ${toToken} | Insufficient funds for transaction. Fee - ${feeInEther}, Value - ${valueInEther}, Balance - ${balanceInEther}`
      );
    } else {
      log(this.protocolName, `${this.walletAddress}. ${e}`);
    }
  }

  private validateTokens(fromToken: Token, toToken: Token) {
    if (fromToken.symbol === toToken.symbol) {
      throw new Error(`Somehow same tokens are set to be swapped: ${fromToken.symbol}`);
    }
  }

  private getMinOutAmount(fromToken: Token, toToken: Token, fromTokenAmount: number) {
    return ((fromTokenAmount * fromToken.priceIsUsd) / toToken.priceIsUsd) * slippage;
  }
}
