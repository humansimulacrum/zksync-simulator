import { getAbiByRelativePath } from './abi.helper';

export const getTokenContractInstance = (tokenContractAddr, web3) => {
  const erc20Abi = getAbiByRelativePath('../abi/erc20.json');
  return new web3.eth.Contract(erc20Abi, tokenContractAddr);
};

export const getAmountWithPrecision = async (tokenContractAddress, tokenAmount, web3) => {
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

export const getAmountInReadableFormat = ({ tokenBalance, decimals }) => {
  tokenBalance = String(tokenBalance);
  decimals = parseInt(decimals);

  if (decimals > tokenBalance.length) {
    // +1 to have the first zero
    const lengthDifference = decimals - tokenBalance.length + 1;
    const equalizerString = '0'.repeat(lengthDifference);

    tokenBalance = equalizerString + tokenBalance;
  }

  const pointPosition = tokenBalance.length - decimals;

  return tokenBalance.substring(0, pointPosition) + '.' + tokenBalance.substring(pointPosition, tokenBalance.length);
};
