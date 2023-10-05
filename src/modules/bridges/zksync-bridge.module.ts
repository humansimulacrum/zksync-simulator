import Web3 from 'web3';
import { Account } from 'web3-core';
import Contract from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';

import { Provider } from 'zksync-web3';
import { ethers } from 'ethers';

import { ERA, ETH } from '../../utils/const/chains.const';
import { getAbiByRelativePath, log, randomFloatInRange } from '../../utils/helpers';
import { toWei } from '../../utils/helpers/wei.helper';
import { Transaction } from '../checkers/transaction.module';
import { ExecutableModule } from '../executor.module';
import { TokenModule } from '../checkers/token.module';
import { partOfEthToBridgeMax, partOfEthToBridgeMin } from '../../utils/const/config.const';

export const ZKSYNC_BRIDGE_CONTRACT_ADDR = Web3.utils.toChecksumAddress('0x32400084C286CF3E17e7B677ea9583e60a000324');

export class ZkSyncBridge implements ExecutableModule {
  protocolName: string;
  web3: Web3;

  account: Account;
  walletAddress: string;

  contractAddress: string;
  contractAbi: AbiItem[];
  contract: Contract;

  zkSyncProvider: Provider;

  constructor(privateKey: string) {
    this.protocolName = 'ZkSync Bridge';
    this.web3 = new Web3(ETH.rpc);

    this.account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
    this.walletAddress = this.account.address;

    this.contractAddress = ZKSYNC_BRIDGE_CONTRACT_ADDR;
    this.contractAbi = getAbiByRelativePath('../abi/zkSyncBridge.json');

    this.contract = new this.web3.eth.Contract(this.contractAbi, this.contractAddress);

    this.zkSyncProvider = new Provider(ERA.rpc);
  }

  async execute() {
    const balanceInMainnetReadable = await this.getBalanceInMainnet();

    const amountToBridgeMin = partOfEthToBridgeMin * balanceInMainnetReadable;
    const amountToBridgeMax = partOfEthToBridgeMax * balanceInMainnetReadable;

    await this.bridge(amountToBridgeMin, amountToBridgeMax);
  }

  async bridge(amountToBridgeMin: number, amountToBridgeMax: number) {
    const amountToBridgeEth = randomFloatInRange(amountToBridgeMin, amountToBridgeMax, 10);
    const amountToBridgeWei = toWei(amountToBridgeEth);

    log(this.protocolName, `${this.walletAddress}: Sending ${amountToBridgeEth} ETH to ZkSync`);

    const contractAddressL2 = this.walletAddress;
    const l2Value = amountToBridgeWei.toString();
    const calldata: [] = [];
    // numbers are taken from transaction performed through UI
    const l2GasLimit = 733664;
    const l2GasPerPubdataByteLimit = 800;
    const factoryDeps: [] = [];
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

    const zkGasPrice = (await this.zkSyncProvider.getGasPrice()).toString();
    const l2BaseCost = await this.contract.methods
      .l2TransactionBaseCost(zkGasPrice, l2GasLimit, l2GasPerPubdataByteLimit)
      .call();

    // I don't know how to calculate that, because estimateGas doesn't work
    // just took amount from successfull transaction and added 400
    const estimatedGas = 150500;
    const amountWithL2Fee = ethers.BigNumber.from(amountToBridgeWei).add(l2BaseCost);

    const tx = new Transaction(
      this.web3,
      this.contractAddress,
      amountWithL2Fee.toNumber(),
      bridgeFunctionCall,
      this.account,
      {
        gas: estimatedGas,
      }
    );

    const transactionHash = await tx.sendTransaction();
    log(
      this.protocolName,
      `${this.walletAddress}: Sent ${amountToBridgeEth} ETH to ZkSync. TX: ${ETH.explorer}/${transactionHash}`
    );
  }

  private async getBalanceInMainnet() {
    const tokenModule = await TokenModule.create(ETH.rpc);
    const balanceInMainnet = await tokenModule.getBalanceByContractAddress(
      ethers.constants.AddressZero,
      this.walletAddress
    );

    const balanceReadable = tokenModule.getReadableAmountWithDecimals(balanceInMainnet, 18);

    return balanceReadable;
  }
}
