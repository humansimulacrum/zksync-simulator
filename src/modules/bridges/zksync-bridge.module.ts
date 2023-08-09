import Web3 from 'web3';
import { Account } from 'web3-core';
import Contract from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';

import { Provider } from 'zksync-web3';
import { ethers } from 'ethers';

import { Chain, ERA, ETH } from '../../utils/const/chains.const';
import { getAbiByRelativePath, randomFloatInRange } from '../../utils/helpers';
import { log } from '../../utils/logger/logger';
import { maxPriorityFeePerGas } from '../../utils/const/config.const';

export const ZKSYNC_BRIDGE_CONTRACT_ADDR = Web3.utils.toChecksumAddress('0x32400084C286CF3E17e7B677ea9583e60a000324');

export class ZkSyncBridge {
  protocolName: string;
  chain: Chain;
  web3: Web3;

  privateKey: string;
  account: Account;
  walletAddress: string;

  contractAddr: string;
  contractAbi: AbiItem[];
  contract: Contract;

  zkSyncProvider: Provider;

  constructor(privateKey) {
    this.protocolName = 'ZkSync Bridge';
    this.chain = ETH;
    this.web3 = new Web3(this.chain.rpc);

    this.privateKey = privateKey;
    this.account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
    this.walletAddress = this.account.address;

    this.contractAddr = ZKSYNC_BRIDGE_CONTRACT_ADDR;
    this.contractAbi = getAbiByRelativePath('../abi/zkSyncBridge.json');

    this.contract = new this.web3.eth.Contract(this.contractAbi, this.contractAddr);

    this.zkSyncProvider = new Provider(ERA.rpc);
  }

  async bridge(amountToBridgeMin, amountToBridgeMax) {
    try {
      const amountToBridgeEth = randomFloatInRange(amountToBridgeMin, amountToBridgeMax, 10);
      const amountToBridgeWei = this.web3.utils.toWei(String(amountToBridgeEth), 'ether');

      log(this.protocolName, `${this.walletAddress}: Sending ${amountToBridgeEth} ETH to ZkSync`);

      const ethBalance = await this.web3.eth.getBalance(this.walletAddress);

      // contract parameters
      const contractAddressL2 = this.walletAddress;
      const l2Value = amountToBridgeWei.toString();
      const calldata = [];
      // numbers are taken from transaction performed through UI
      const l2GasLimit = 733664;
      const l2GasPerPubdataByteLimit = 800;
      const factoryDeps = [];
      const refundRecipient = this.walletAddress;

      const bridgeFunctionCall = await this.contract.methods.requestL2Transaction(
        contractAddressL2,
        l2Value,
        calldata,
        l2GasLimit,
        l2GasPerPubdataByteLimit,
        factoryDeps,
        refundRecipient
      );

      const baseFee = (await this.web3.eth.getBlock('latest')).baseFeePerGas;
      const zkGasPrice = (await this.zkSyncProvider.getGasPrice()).toString();
      const l2BaseCost = await this.contract.methods
        .l2TransactionBaseCost(zkGasPrice, l2GasLimit, l2GasPerPubdataByteLimit)
        .call();

      // I don't know how to calculate that, because estimateGas doesn't work
      // just took amount from successfull transaction and added 400
      const estimatedGas = 150500;

      const minEthNeeded = ethers.BigNumber.from(estimatedGas)
        .mul(baseFee!)
        .add(maxPriorityFeePerGas)
        .add(ethers.BigNumber.from(l2BaseCost))
        .add(ethers.BigNumber.from(l2Value));

      if (ethers.BigNumber.from(ethBalance).lte(minEthNeeded)) {
        log(
          this.protocolName,
          `${this.walletAddress}: Unsufficient balance. Balance - ${Web3.utils.fromWei(
            String(ethBalance)
          )}, Needed - ${Web3.utils.fromWei(String(minEthNeeded))}, `
        );
        return false;
      }

      const amountWithL2Fee = ethers.BigNumber.from(amountToBridgeWei).add(l2BaseCost);

      const tx = {
        from: this.walletAddress,
        to: this.contractAddr,
        nonce: await this.web3.eth.getTransactionCount(this.walletAddress),
        gas: estimatedGas,
        maxPriorityFeePerGas,
        maxFeePerGas: ethers.BigNumber.from(baseFee).add(maxPriorityFeePerGas).toString(),
        value: amountWithL2Fee.toString(),
        data: bridgeFunctionCall.encodeABI(),
      };

      const signedTx = await this.web3.eth.accounts.signTransaction(tx, this.privateKey);
      if (!signedTx || !signedTx.rawTransaction) {
        throw new Error('Transaction is not generated');
      }

      const transactionData = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);

      return transactionData;
    } catch (error: any) {
      if (error?.message.includes('insufficient funds')) {
        log(this.protocolName, `${this.walletAddress}: Unsufficient balance.`);
      } else {
        log(this.protocolName, `${this.walletAddress}: Error ->`);
        console.dir(error);
      }
    }
  }
}
