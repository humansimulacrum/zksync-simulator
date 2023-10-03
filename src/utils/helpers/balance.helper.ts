import Web3 from 'web3';
import { getTokenContractInstance } from './token-conversion.helper';

export const getBalanceAndDecimalsWithTokenContract = async (
  tokenContractAddr: string,
  addressToCheckOn: string,
  web3: Web3
) => {
  const fromTokenContractInstance = getTokenContractInstance(tokenContractAddr, web3);

  const tokenBalance: number = await fromTokenContractInstance.methods.balanceOf(addressToCheckOn).call();
  const decimals: number = await fromTokenContractInstance.methods.decimals().call();

  return { tokenBalance, decimals };
};
