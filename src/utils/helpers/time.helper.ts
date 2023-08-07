import Web3 from 'web3';

export const getSwapDeadline = async (web3: Web3) => {
  const currentTimestamp = (await web3.eth.getBlock('latest')).timestamp;

  return parseInt(String(currentTimestamp)) + 1200;
};
