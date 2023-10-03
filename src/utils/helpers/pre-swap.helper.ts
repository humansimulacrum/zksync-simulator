import { Swap } from '../../modules/swaps/swap.module';
import { minAmountOfTokenToSwapInUsd } from '../const/config.const';
import { choose } from './random.helper';
import { sleepLogWrapper } from './sleep.helper';

export const calculateSwapParameters = async (swapInstance: Swap) => {
  const swapChain = swapInstance.chain.name;
  const walletAddr = swapInstance.walletAddress;

  const swapSupportedTokens = swapInstance.supportedCoins;
  const nonEthSupportedTokens = swapSupportedTokens.filter((symbol) => symbol !== 'ETH');

  const tokensOnChain = await debankInstance.getTokenValueInChain(walletAddr, swapChain);
  if (!tokensOnChain) {
    sleepLogWrapper(10 * 1000, walletAddr, 'when swap params calculation failed.');
    return false;
  }

  const supportedTokensWithBalance = tokensOnChain.filter((token) => swapSupportedTokens.includes(token.symbol));
  const supportedTokensWithMinBalanceSufficed = supportedTokensWithBalance.filter(
    (token) => token.valueInToken >= minAmountOfTokenToSwapInUsd
  );

  if (supportedTokensWithMinBalanceSufficed.length === 0) {
    throw new Error(
      `There aren't any liquidity to swap on the walllet. Min amount of token to swap = ${minAmountOfTokenToSwapInUsd}`
    );
  }

  if (!supportedTokensWithMinBalanceSufficed.some((token) => token.symbol === 'ETH')) {
    throw new Error(`There are not enough ETH to perform a swap.`);
  }

  let fromToken;
  let toToken;

  let amountFrom;
  let amountTo;

  // only ETH is on the wallet
  if (supportedTokensWithMinBalanceSufficed.length === 1) {
    fromToken = 'ETH';
    toToken = choose(nonEthSupportedTokens);

    amountFrom = supportedTokensWithMinBalanceSufficed[0].amount * 0.4;
    amountTo = supportedTokensWithMinBalanceSufficed[0].amount * 0.6;
  } else {
    // another token in on the wallet
    const nonEthTokens = supportedTokensWithMinBalanceSufficed.filter((token) => token.symbol !== 'ETH');
    const tokenToSwapFrom = choose(nonEthTokens);

    fromToken = tokenToSwapFrom.symbol;
    toToken = 'ETH';
    amountFrom = tokenToSwapFrom.amount;
    amountTo = tokenToSwapFrom.amount;
  }

  return { fromToken, toToken, amountFrom, amountTo };
};
