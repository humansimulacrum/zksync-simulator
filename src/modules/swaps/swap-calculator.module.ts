import { TokenModule } from '../utility/token.module';
import { Swap } from './swap.module';
import { minAmountOfTokenToSwapInUsd, partOfEthToSwapMax, partOfEthToSwapMin } from '../../utils/const/config.const';
import { TokenBalance } from '../../utils/interfaces/balance.interface';
import { SwapInput } from '../../utils/interfaces/swap-input.interface';
import { TokenSymbol } from '../../utils/types/token-symbol.type';
import { choose, randomFloatInRange, randomIntInRange } from '../../utils/helpers/random.helper';
import { Token } from '../../entity';

export class SwapCalculator {
  swapInstance: Swap;
  tokenModule: TokenModule;

  walletAddress: string;
  tokensOnWallet: TokenBalance[];

  private constructor(
    swapInstance: Swap,
    walletAddress: string,
    tokensOnWallet: TokenBalance[],
    tokenModule: TokenModule
  ) {
    this.swapInstance = swapInstance;
    this.walletAddress = walletAddress;
    this.tokensOnWallet = tokensOnWallet;
    this.tokenModule = tokenModule;
  }

  static async create(swapInstance: Swap) {
    const tokenModule = await TokenModule.create();
    const walletAddress = swapInstance.walletAddress;

    const tokensOnWallet = await tokenModule.getBalanceAll(walletAddress);
    return new SwapCalculator(swapInstance, walletAddress, tokensOnWallet, tokenModule);
  }

  async calculateSwapParameters(): Promise<SwapInput> {
    const suitableTokens = this.getSuitableTokensForSwap();
    return this.getSwapInput(suitableTokens);
  }

  private async getSwapInput(suitableTokens: TokenBalance[]) {
    const nonEthSupportedTokens = this.swapInstance.supportedCoins.filter((symbol) => symbol !== 'ETH');

    let fromTokenSymbol;
    let toTokenSymbol;
    let amountToSwap;

    if (suitableTokens.length === 1) {
      const ethBalance = suitableTokens[0];

      const amountFrom = Number(ethBalance.valueInToken) * partOfEthToSwapMin;
      const amountTo = Number(ethBalance.valueInToken) * partOfEthToSwapMax;

      amountToSwap = this.getAmountToSwap(amountFrom, amountTo);

      fromTokenSymbol = 'ETH' as TokenSymbol;
      toTokenSymbol = choose(nonEthSupportedTokens);
    } else {
      const nonEthTokens = suitableTokens.filter((token) => token.symbol !== 'ETH');
      const tokenToSwapFrom = choose(nonEthTokens);

      fromTokenSymbol = tokenToSwapFrom.symbol;
      toTokenSymbol = 'ETH' as TokenSymbol;

      amountToSwap = tokenToSwapFrom.valueInToken;
    }

    const { fromToken, toToken } = await this.getTokenInstances(fromTokenSymbol, toTokenSymbol);

    return {
      fromToken,
      toToken,
      amountToSwap,
    };
  }

  private getSuitableTokensForSwap() {
    if (!this.tokensOnWallet || !this.tokensOnWallet.length) {
      throw new Error('There are not any tokens available on this wallet');
    }

    const supportedTokens = this.tokensOnWallet.filter((token) =>
      this.swapInstance.supportedCoins.includes(token.symbol)
    );

    const supportedTokensWithMinBalanceSufficed = supportedTokens.filter(
      (token) => token.valueInUsd >= minAmountOfTokenToSwapInUsd
    );

    if (supportedTokensWithMinBalanceSufficed.length === 0) {
      throw new Error(
        `There aren't any liquidity to swap on the walllet. Min amount of token to swap = ${minAmountOfTokenToSwapInUsd}`
      );
    }

    if (!supportedTokensWithMinBalanceSufficed.some((token) => token.symbol === 'ETH')) {
      throw new Error(`There are not enough ETH to perform a swap.`);
    }

    return supportedTokensWithMinBalanceSufficed;
  }

  private getAmountToSwap(amountFrom: number, amountTo: number): string {
    return String(randomIntInRange(amountFrom, amountTo));
  }

  private async getTokenInstances(fromTokenSymbol: TokenSymbol, toTokenSymbol: TokenSymbol) {
    const tokenInstances = await this.tokenModule.getTokensBySymbols([fromTokenSymbol, toTokenSymbol]);

    const fromToken = tokenInstances.find((token) => token.symbol === fromTokenSymbol);
    const toToken = tokenInstances.find((token) => token.symbol === toTokenSymbol);

    if (!fromToken || !toToken) {
      throw new Error('Something went wrong on the getTokenInstances stage');
    }

    return this.switchContractForEthToWeth(fromToken, toToken);
  }

  private async switchContractForEthToWeth(fromToken: Token, toToken: Token) {
    const wethInstance = (await this.tokenModule.getTokensBySymbols(['WETH']))[0];

    if (fromToken.symbol === 'ETH') {
      fromToken.contractAddress = wethInstance.contractAddress;
    }

    if (toToken.symbol === 'ETH') {
      toToken.contractAddress = wethInstance.contractAddress;
    }

    return { fromToken, toToken };
  }
}
