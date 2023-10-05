import Web3 from 'web3';

export const toWei = (etherAmount: number, decimals?: number): number => {
  if (!decimals || decimals === 18) {
    return parseInt(Web3.utils.toWei(String(etherAmount), 'ether'));
  }

  return etherAmount * 10 ** decimals;
};

export const fromWei = (weiAmount: number, decimals?: number): number => {
  if (!decimals || decimals === 18) {
    return parseInt(Web3.utils.fromWei(String(weiAmount), 'ether'));
  }

  return weiAmount / 10 ** decimals;
};
