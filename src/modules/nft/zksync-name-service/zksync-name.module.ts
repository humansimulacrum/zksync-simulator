import Web3 from 'web3';
import { Account } from 'web3-core';
import Contract from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';

import { Chain, ERA } from '../../../utils/const/chains.const';
import { getAbiByRelativePath, randomIntInRange } from '../../../utils/helpers';
import { log } from '../../../utils/logger/logger';
import { extractNumbersFromString } from '../../../utils/helpers/string.helper';
import { englishWords } from '../../../utils/const/words.const';

const ZKSYNC_NAME_CONTRACT = Web3.utils.toChecksumAddress('0x935442AF47F3dc1c11F006D551E13769F12eab13');

export class ZkSyncNameService {
  protocolName: string;
  chain: Chain;
  web3: Web3;

  privateKey: string;
  account: Account;
  walletAddress: string;

  contractAddr: string;
  contractAbi: AbiItem[];
  contract: Contract;

  constructor(privateKey) {
    this.protocolName = 'ZkSyncNameService';
    this.chain = ERA;
    this.web3 = new Web3(this.chain.rpc);

    this.privateKey = privateKey;
    this.account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
    this.walletAddress = this.account.address;

    this.contractAddr = ZKSYNC_NAME_CONTRACT;
    this.contractAbi = getAbiByRelativePath('../abi/eraNameService.json');

    this.contract = new this.web3.eth.Contract(this.contractAbi, this.contractAddr);
  }

  async mint() {
    if (this.isAlreadyMinted()) {
      return false;
    }

    let name;

    while (true) {
      name = this.generateName();
      const isTaken = await this.checkEligibility(name);
      if (isTaken === 0) {
        break;
      }
    }

    try {
      const mintFunctionCall = this.contract.methods.register(name);
      const valueToMint = this.web3.utils.toWei(String(0.0026), 'ether');

      const estimatedGas = await mintFunctionCall.estimateGas({
        from: this.walletAddress,
        value: valueToMint,
      });

      const tx = {
        from: this.walletAddress,
        to: this.contractAddr,
        value: valueToMint,
        nonce: await this.web3.eth.getTransactionCount(this.walletAddress),
        gas: estimatedGas,
        data: mintFunctionCall.encodeABI(),
      };

      const signedTx = await this.web3.eth.accounts.signTransaction(tx, this.privateKey);

      if (!signedTx || !signedTx.rawTransaction) {
        throw new Error('Signed transaction is not generated');
      }

      const sendTransactionResult = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);

      log(
        this.protocolName,
        `${this.walletAddress}: Minted ZkSync Domain Name ${name}.zk | TX: ${this.chain.explorer}/${sendTransactionResult.transactionHash}`
      );

      return sendTransactionResult;
    } catch (e: any) {
      if (e.message.includes('insufficient funds')) {
        const [balance, fee, value] = extractNumbersFromString(e.message);
        const feeInEther = this.web3.utils.fromWei(fee, 'ether');
        const balanceInEther = this.web3.utils.fromWei(balance, 'ether');
        const valueInEther = this.web3.utils.fromWei(value, 'ether');

        log(
          this.protocolName,
          `${this.walletAddress} | Insufficient funds for transaction. Fee - ${feeInEther}, Value - ${valueInEther}, Balance - ${balanceInEther}`
        );
      } else {
        console.error(e);
      }
    }
  }

  generateName() {
    const wordCount = englishWords.length;
    return englishWords[randomIntInRange(0, wordCount)] + englishWords[randomIntInRange(0, wordCount)];
  }

  checkEligibility(name) {
    return this.contract.methods.tokenAddressandID(name).call();
  }

  isAlreadyMinted() {
    return this.contract.methods.balanceOf(this.walletAddress).call();
  }
}
