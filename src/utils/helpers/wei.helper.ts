import Web3 from 'web3';

export const toWei = (etherAmount: string, decimals?: number): string => {
  if (!decimals || decimals === 18) {
    return Web3.utils.toWei(String(etherAmount), 'ether');
  }

  return String(Number(etherAmount) * 10 ** decimals);
};

export const fromWei = (weiAmount: string, decimals?: number): string => {
  if (!decimals || decimals === 18) {
    return Web3.utils.fromWei(String(weiAmount), 'ether');
  }

  return String(Number(weiAmount) / 10 ** decimals);
};
