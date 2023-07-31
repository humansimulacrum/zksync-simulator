export const getSwapDeadline = async (web3) => {
  const currentTimestamp = (await web3.eth.getBlock('latest')).timestamp;

  return parseInt(currentTimestamp) + 1200;
};
