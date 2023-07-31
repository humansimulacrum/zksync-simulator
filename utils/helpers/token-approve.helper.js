import { randomIntInRange } from './random.helper.js';
import { getTokenContractInstance } from './token-conversion.js';

export const approveToken = async (
  amountToApprove,
  privateKey,
  chain,
  tokenContractAddress,
  protocolContractAddress,
  walletAddress,
  web3
) => {
  const tokenContactInstance = getTokenContractInstance(tokenContractAddress, web3);

  const allowanceAmount = await tokenContactInstance.methods.allowance(walletAddress, protocolContractAddress).call();

  if (allowanceAmount > amountToApprove) {
    return true;
  }

  const approveFunctionCall = await tokenContactInstance.methods.approve(protocolContractAddress, amountToApprove);
  const nonce = await web3.eth.getTransactionCount(walletAddress);

  const gas = await approveFunctionCall.estimateGas({ from: walletAddress });
  const tx = {
    from: walletAddress,
    to: tokenContractAddress,
    data: approveFunctionCall.encodeABI(),
    chainId: chain.chainId,
    nonce,
    value: 0,
    gas,
  };

  if (chain.name === 'BSC') {
    tx.gasPrice = randomIntInRange(1000000000, 1050000000);
  } else {
    tx.gasPrice = await web3.eth.getGasPrice();
  }

  const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
  const approveTransactionResult = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

  return approveTransactionResult.transactionHash;
};
