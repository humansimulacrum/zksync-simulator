import { TransactionConfig } from 'web3-core';
import { randomIntInRange } from './random.helper';
import { getTokenContractInstance } from './token-conversion.helper';
import Web3 from 'web3';
import { Chain } from '../const/chains.const';

export const approveToken = async (
  amountToApprove: string,
  privateKey: string,
  chain: Chain,
  tokenContractAddress: string,
  protocolContractAddress: string,
  walletAddress: string,
  web3: Web3
) => {
  const tokenContactInstance = getTokenContractInstance(tokenContractAddress, web3);

  const allowanceAmount = await tokenContactInstance.methods.allowance(walletAddress, protocolContractAddress).call();

  if (allowanceAmount > amountToApprove) {
    return true;
  }

  const approveFunctionCall = await tokenContactInstance.methods.approve(protocolContractAddress, amountToApprove);
  const nonce = await web3.eth.getTransactionCount(walletAddress);

  const gas = await approveFunctionCall.estimateGas({ from: walletAddress });
  const tx: TransactionConfig = {
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

  if (!signedTx || !signedTx.rawTransaction) {
    return false;
  }

  const approveTransactionResult = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

  return approveTransactionResult.transactionHash;
};
