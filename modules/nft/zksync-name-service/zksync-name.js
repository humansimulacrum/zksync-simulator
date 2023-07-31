import { ERA } from '../../../utils/const/chains.const.js';
import { englishWords } from '../../../utils/const/words.const.js';
import { getAbiByRelativePath } from '../../../utils/helpers/abi.helper.js';
import { ZKSYNC_NAME_CONTRACT } from './zksync-name-contract.const.js';

import { maxPriorityFeePerGas } from '../../../config.js';

export class ZkSyncNameService {
  constructor(privateKey) {
    this.protocolName = 'ZkSyncNameService';
    this.chain = ERA;
    this.web3 = new Web3(this.chain.rpc);

    this.privateKey = privateKey;
    this.account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
    this.walletAddress = this.account.address;

    this.contractAddr = ZKSYNC_NAME_CONTRACT;
    this.contractAbi = getAbiByRelativePath('./utils/abi/eraNameService.json');

    this.contract = new this.web3.eth.Contract(this.contractAddr, this.contractAbi);
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
      const valueToMint = this.web3.utils.toWei(0.0026, 'ether');

      const estimatedGas = await mintFunctionCall.estimateGas({
        from: this.walletAddress,
        value: valueToMint,
        maxPriorityFeePerGas,
      });

      const tx = {
        from: this.walletAddress,
        to: this.contractAddr,
        value: valueToMint,
        nonce: await this.web3.eth.getTransactionCount(this.walletAddress),
        maxPriorityFeePerGas,
        gas: estimatedGas,
        data: mintFunctionCall.encodeABI(),
      };

      const signedTx = await this.web3.eth.accounts.signTransaction(tx, this.privateKey);
      const sendTransactionResult = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);

      console.log(
        `ZkSync AIO - ${this.protocolName}. ${this.walletAddress}: Minted ZkSync Domain Name ${name}.zk | TX: ${this.chain.explorer}/${sendTransactionResult.transactionHash}`
      );

      return sendTransactionResult;
    } catch (e) {
      if (e.message.includes('insufficient funds')) {
        const [balance, fee, value] = extractNumbersFromString(e.message);
        const feeInEther = this.web3.utils.fromWei(fee, 'ether');
        const balanceInEther = this.web3.utils.fromWei(balance, 'ether');
        const valueInEther = this.web3.utils.fromWei(value, 'ether');

        console.error(
          `ZkSync AIO - ${this.protocolName}. ${this.walletAddress} | Insufficient funds for transaction. Fee - ${feeInEther}, Value - ${valueInEther}, Balance - ${balanceInEther}`
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
