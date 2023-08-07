import { minAmountOfTokenToSwapInUsd } from '../const/config.const';
import { choose } from './random.helper';
import { sleep } from './sleep.helper';

export const calculateSwapParameters = async (swapInstance, debankInstance) => {
  const swapChain = swapInstance.chain.name;
  const walletAddr = swapInstance.walletAddress;

  const swapSupportedTokens = swapInstance.supportedCoins;
  const nonEthSupportedTokens = swapSupportedTokens.filter((symbol) => symbol !== 'ETH');

  const tokensOnChain = await debankInstance.getTokenValueInChain(walletAddr, swapChain);
  if (!tokensOnChain) {
    sleep(10 * 1000);
    return false;
  }

  const supportedTokensWithBalance = tokensOnChain.filter((token) => swapSupportedTokens.includes(token.symbol));
  const supportedTokensWithMinBalanceSufficed = supportedTokensWithBalance.filter(
    (token) => token.price >= minAmountOfTokenToSwapInUsd
  );

  if (supportedTokensWithMinBalanceSufficed.length === 0) {
    console.log(
      `ZkSync AIO - Pre-Swap. ${walletAddr}: There aren't any liquidity to swap on the walllet. Min amount of token to swap = ${minAmountOfTokenToSwapInUsd}`
    );

    throw new Error('Not enough liquidity');
  }

  if (!supportedTokensWithMinBalanceSufficed.some((token) => token.symbol === 'ETH')) {
    console.log(`ZkSync AIO - Pre-Swap. ${walletAddr}: There are not enough ETH to perform a swap.`);

    throw new Error('Not enough liquidity');
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
