import Web3 from 'web3';

export const toWei = (etherAmount: string, decimals?: number): string => {
  if (!decimals || decimals === 18) {
    return Number(Web3.utils.toWei(String(etherAmount), 'ether')).toFixed(0);
  }

  return (Number(etherAmount) * 10 ** decimals).toFixed(0);
};

export const fromWei = (weiAmount: string, decimals?: number): string => {
  if (!decimals || decimals === 18) {
    return Number(Web3.utils.fromWei(String(weiAmount), 'ether')).toFixed(7);
  }

  return (Number(weiAmount) / 10 ** decimals).toFixed(7);
};
