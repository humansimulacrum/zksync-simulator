import Web3 from 'web3';
import { maxGwei, sleepOnHighGas } from '../const/config.const';
import { sleepLogWrapper } from './sleep.helper';
import { log } from '.';

export const isGasOkay = async (web3: Web3, walletAddress: string) => {
  const baseFee = (await web3.eth.getBlock('latest')).baseFeePerGas;
  const currentGas = Number(web3.utils.fromWei(String(baseFee), 'Gwei'));

  const isGasHigher = currentGas <= maxGwei;

  if (!isGasHigher) {
    log('Gas Checker', `${walletAddress}: gas is too high. ${currentGas} gwei now vs ${maxGwei} gwei limit.`);

    await sleepLogWrapper(sleepOnHighGas * 1000, walletAddress, 'on high gas.');
  }

  return isGasHigher;
};

export const waitForGas = async (web3: Web3, walletAddress: string) => {
  let gasOkay = false;
  while (!gasOkay) {
    gasOkay = await isGasOkay(web3, walletAddress);
  }

  return;
};
