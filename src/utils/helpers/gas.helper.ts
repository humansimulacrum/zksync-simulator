import { maxGwei, moduleName, sleepOnHighGas } from '../const/config.const';
import { log } from '../logger/logger';
import { sleep } from './sleep.helper';

export const isGasOkay = async (web3, ethAddress) => {
  const baseFee = (await web3.eth.getBlock('latest')).baseFeePerGas;
  const currentGas = Number(web3.utils.fromWei(String(baseFee), 'Gwei'));

  const isGasHigher = currentGas <= maxGwei;

  if (!isGasHigher) {
    log('Gas Checker', `${ethAddress}: gas is too high. ${currentGas} gwei now vs ${maxGwei} gwei limit.`);

    await sleep(sleepOnHighGas * 1000, ethAddress, 'on high gas.');
  }

  return isGasHigher;
};

export const waitForGas = async (web3, walletAddress) => {
  let gasOkay = false;
  while (!gasOkay) {
    gasOkay = await isGasOkay(web3, walletAddress);
  }

  return;
};
