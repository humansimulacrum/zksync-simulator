import { Contract, Provider } from 'zksync-web3';
import { JsonFragment, ethers.providers.JsonRpcProvider, Wallet } from 'ethers';

import { Chain, ERA, ETH } from '../../utils/const/chains.const';
import { logWithFormatting, randomIntInRange } from '../../utils/helpers';
import { toWei } from '../../utils/helpers/wei.helper';
import { TransactionModule } from '../utility/transaction.module';
import { TokenModule } from '../utility/token.module';
import { partOfEthToBridgeMax, partOfEthToBridgeMin } from '../../utils/const/config.const';
import { ExecutableModule, ExecuteOutput, ModuleOutput } from '../../utils/interfaces/execute.interface';
import { ActionType } from '../../utils/enums/action-type.enum';
import BigNumber from 'bignumber.js';
import { toChecksumAddress } from 'web3-utils';
import { ZKSYNC_BRIDGE_ABI } from '../../utils/abi/zkSyncBridge';

export const ZKSYNC_BRIDGE_CONTRACT_ADDR = toChecksumAddress('0x32400084C286CF3E17e7B677ea9583e60a000324');

export class ZkSyncBridge implements ExecutableModule {
  protocolName: string;

  provider: ethers.providers.JsonRpcProvider;
  chain: Chain;

  wallet: Wallet;
  walletAddress: string;

  contractAddress: string;
  contractAbi: JsonFragment[];
  contract: Contract;

  zkSyncProvider: Provider;

  constructor(privateKey: string) {
    this.protocolName = ActionType.OfficialBridge;
    this.chain = ETH;
    this.provider = new ethers.providers.JsonRpcProvider(this.chain.rpc);

    this.wallet = new Wallet(privateKey, this.provider);
    this.walletAddress = this.wallet.address;

    this.contractAddress = ZKSYNC_BRIDGE_CONTRACT_ADDR;
    this.contractAbi = ZKSYNC_BRIDGE_ABI;

    this.zkSyncProvider = new Provider(ERA.rpc);

    this.contract = new Contract(this.contractAddress, this.contractAbi, this.zkSyncProvider);
  }

  async execute(): Promise<ExecuteOutput> {
    const balanceInMainnetReadable = await this.getBalanceInMainnet();

    const amountToBridgeMin = partOfEthToBridgeMin * Number(balanceInMainnetReadable);
    const amountToBridgeMax = partOfEthToBridgeMax * Number(balanceInMainnetReadable);

    const { transactionHash, message } = await this.bridge(amountToBridgeMin, amountToBridgeMax);

    return { transactionHash, message, chain: this.chain, protocolName: this.protocolName };
  }

  async bridge(amountToBridgeMin: number, amountToBridgeMax: number): Promise<ModuleOutput> {
    const amountToBridgeEth = randomIntInRange(amountToBridgeMin, amountToBridgeMax);
    const amountToBridgeWei = toWei(amountToBridgeEth);

    logWithFormatting(this.protocolName, `${this.walletAddress}: Sending ${amountToBridgeEth} ETH to ZkSync`);

    const contractAddressL2 = this.walletAddress;
    const l2Value = amountToBridgeWei;
    const calldata: [] = [];
    // numbers are taken from transaction performed through UI
    const l2GasLimit = 733664;
    const l2GasPerPubdataByteLimit = 800;
    const factoryDeps: [] = [];
    const refundRecipient = this.walletAddress;

    const bridgeFunctionCall = await this.contract.requestL2Transaction(
      contractAddressL2,
      l2Value,
      calldata,
      l2GasLimit,
      l2GasPerPubdataByteLimit,
      factoryDeps,
      refundRecipient
    );

    const zkGasPrice = (await this.zkSyncProvider.getGasPrice()).toString();
    const l2BaseCost = await this.contract.methods.l2TransactionBaseCost(
      zkGasPrice,
      l2GasLimit,
      l2GasPerPubdataByteLimit
    );
    // I don't know how to calculate that, because estimateGas doesn't work
    // just took amount from successfull transaction and added 400
    const estimatedGas = 150500;
    const amountWithL2Fee = new BigNumber(amountToBridgeWei).plus(l2BaseCost);

    const tx = new TransactionModule(
      this.provider,
      this.contractAddress,
      amountWithL2Fee.toString(),
      bridgeFunctionCall,
      this.wallet,
      {
        gasLimit: estimatedGas,
      }
    );

    const transactionHash = await tx.sendTransaction();
    const message = `Bridged ${amountToBridgeEth} ETH to ZkSync via Official Bridge.`;
    return {
      transactionHash,
      message,
    };
  }

  private async getBalanceInMainnet() {
    const tokenModule = await TokenModule.create(ETH.rpc);
    const ethToken = (await tokenModule.getTokensBySymbols(['ETH']))[0];

    const balanceInMainnet = await tokenModule.getBalanceByTokenReadable(ethToken, this.walletAddress);
    return balanceInMainnet;
  }
}
