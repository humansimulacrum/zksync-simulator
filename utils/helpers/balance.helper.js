import { getTokenContractInstance } from './token-conversion.js';

export const getBalanceWithTokenContract = async (tokenContractAddr, addressToCheckOn, web3) => {
  try {
    const fromTokenContractInstance = getTokenContractInstance(tokenContractAddr, web3);

    const tokenBalance = await fromTokenContractInstance.methods.balanceOf(addressToCheckOn).call();
    const decimals = await fromTokenContractInstance.methods.decimals().call();

    if (!parseInt(tokenBalance)) return 0;

    return { tokenBalance, decimals };
  } catch (e) {
    console.error(e);
  }
};
