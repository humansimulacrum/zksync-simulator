import { ethers } from 'ethers';
import { ERA, ETH } from '../../../utils/const/chains.const';
import { ZKSYNC_BRIDGE_CONTRACT_ADDR } from './zksync-bridge-contract.const';
import { maxPriorityFeePerGas } from '../../../config';
import { Provider } from 'zksync-web3';

export class ZkSyncBridge {
  constructor(privateKey) {
    this.protocolName = 'ZkSync Bridge';
    this.chain = ETH;
    this.web3 = new Web3(this.chain.rpc);

    this.privateKey = privateKey;
    this.account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
    this.walletAddress = this.account.address;

    this.contractAddr = ZKSYNC_BRIDGE_CONTRACT_ADDR;
    this.contractAbi = getAbiByRelativePath('./utils/abi/zkSyncBridge.json');

    this.contract = new this.web3.eth.Contract(this.contractAddr, this.contractAbi);

    this.zkSyncProvider = new Provider(ERA.rpc);
  }

  async bridge(amountToBridgeMin, amountToBridgeMax) {
    try {
      const amountToBridgeEth = randomFloatInRange(amountToBridgeMin, amountToBridgeMax, 6);
      const amountToBridgeWei = this.web3.utils.toWei(String(amountToBridgeEth), 'ether');

      console.log(
        `ZkSync AIO. ${this.protocolName}. ${this.walletAddress}: Sending ${amountToBridgeEth} ETH to ZkSync`
      );

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

      const baseFee = (await web3.eth.getBlock('latest')).baseFeePerGas;
      const zkGasPrice = (await this.zkSyncProvider.getGasPrice()).toString();
      const l2BaseCost = await contract.methods
        .l2TransactionBaseCost(zkGasPrice, l2GasLimit, l2GasPerPubdataByteLimit)
        .call();

      // I don't know how to calculate that, because estimateGas doesn't work
      // just took amount from successfull transaction and added 400
      const estimatedGas = 150500;

      const minEthNeeded = ethers.BigNumber.from(estimatedGas)
        .mul(baseFee)
        .add(maxPriorityFeePerGas)
        .add(ethers.BigNumber.from(l2BaseCost))
        .add(ethers.BigNumber.from(l2Value));

      if (ethers.BigNumber.from(ethBalance).lte(minEthNeeded)) {
        console.log(
          `ZkSync AIO. ${this.protocolName}. ${
            this.walletAddress
          }: Unsufficient balance. Balance - ${web3.utils.fromWei(String(ethBalance))}, Needed - ${web3.utils.fromWei(
            String(minEthNeeded)
          )}, `
        );
        return false;
      }

      const amountWithL2Fee = ethers.BigNumber.from(amountToBridgeWei).add(l2BaseCost);

      const tx = {
        from: this.walletAddress,
        to: this.contractAddr,
        nonce: await web3.eth.getTransactionCount(this.walletAddress),
        gas: estimatedGas,
        maxPriorityFeePerGas,
        maxFeePerGas: ethers.BigNumber.from(baseFee).add(maxPriorityFeePerGas).toString(),
        value: amountWithL2Fee.toString(),
        data: bridgeFunctionCall.encodeABI(),
      };

      const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
      const transactionData = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

      return transactionData;
    } catch (error) {
      if (error?.message.includes('insufficient funds')) {
        console.log(`ZkSync AIO. ${this.protocolName}. ${this.walletAddress}: Unsufficient balance.`);
      } else {
        console.log(`ZkSync AIO. ${this.protocolName}. ${this.walletAddress}: Error ->`);
        console.dir(error);
      }
    }
  }
}
