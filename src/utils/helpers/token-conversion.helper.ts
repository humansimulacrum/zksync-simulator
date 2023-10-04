import Web3 from 'web3';
import { getAbiByRelativePath } from './abi.helper';

export const getTokenContractInstance = (tokenContractAddr: string, web3: Web3) => {
  const erc20Abi = getAbiByRelativePath('../abi/erc20.json');
  return new web3.eth.Contract(erc20Abi, tokenContractAddr);
};

export const getAmountWithPrecision = async (tokenContractAddress: string, tokenAmount: string, web3: Web3) => {
  const tokenContractInstance = getTokenContractInstance(tokenContractAddress, web3);
  const decimals = await tokenContractInstance.methods.decimals().call();

  let amount;

  if (decimals === 18) {
    amount = web3.utils.toWei(tokenAmount, 'ether');
  } else {
    amount = tokenAmount * 10 ** decimals;
  }

  return parseInt(amount);
};
