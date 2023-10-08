import Web3 from 'web3';
import { getAbiByRelativePath, getTokenPriceCryptoCompare, importProxies } from '../../utils/helpers';
import { Contract } from 'web3-eth-contract';
import { Account } from 'web3-core';

import { ERA } from '../../utils/const/chains.const';
import { Transaction } from './transaction.module';
import { TOKENS_SUPPORTED } from '../../utils/const/token-contracts.const';
import { TokenRepository } from '../../repositories/token.repository';
import { Token } from '../../entity/token.entity';
import { TokenSymbol } from '../../utils/types/token-symbol.type';
import { TokenBalance } from '../../utils/interfaces/balance.interface';
import { fromWei, toWei } from '../../utils/helpers/wei.helper';

export class TokenModule {
  moduleName = 'TokenModule';

  proxies: string[];
  web3: Web3;
  erc20Abi: any;

  private constructor(proxies: string[], erc20Abi: any, web3: Web3) {
    this.proxies = proxies;
    this.web3 = web3;
    this.erc20Abi = erc20Abi;
  }

  static async create(rpcUrl?: string): Promise<TokenModule> {
    const proxies = await importProxies();
    const web3 = new Web3(rpcUrl ? rpcUrl : ERA.rpc);
    const erc20Abi = getAbiByRelativePath('../abi/erc20.json');

    return new TokenModule(proxies, erc20Abi, web3);
  }

  async approveToken(
    amountToApprove: string,
    account: Account,
    tokenContractAddress: string,
    protocolContractAddress: string
  ) {
    const tokenContactInstance = this.getTokenContractInstanceByAddress(tokenContractAddress);
    const allowanceAmount = await tokenContactInstance.methods
      .allowance(account.address, protocolContractAddress)
      .call();

    if (allowanceAmount > amountToApprove) {
      return true;
    }

    const approveFunctionCall = tokenContactInstance.methods.approve(protocolContractAddress, amountToApprove);

    const approveTransaction = new Transaction(this.web3, tokenContractAddress, '0', approveFunctionCall, account);
    return approveTransaction.sendTransaction();
  }

  async upsertTokens(): Promise<void> {
    const symbolContractTuples = Object.entries(TOKENS_SUPPORTED) as [TokenSymbol, string][];

    const promiseList = symbolContractTuples.map(async ([symbol, contractAddress]): Promise<Omit<Token, 'id'>> => {
      const priceInUsdPromise = getTokenPriceCryptoCompare(symbol);
      const decimalsPromise = this.getDecimalsFromContractAddress(contractAddress);

      const [priceInUsd, decimals] = await Promise.all([priceInUsdPromise, decimalsPromise]);

      return { symbol, contractAddress, priceInUsd, decimals };
    });

    const tokenPayloads = await Promise.all(promiseList);
    await TokenRepository.upsertTokens(tokenPayloads);
  }

  async getBalanceAll(addressToCheckOn: string): Promise<TokenBalance[]> {
    const tokens = await TokenRepository.getAllTokens();

    const promiseArray = tokens.map(async (token): Promise<TokenBalance> => {
      const balanceInTokenWei = await this.getBalanceByTokenWei(token, addressToCheckOn);
      const valueInUsd = await this.calculateValueInUsd(token, balanceInTokenWei);

      return {
        symbol: token.symbol,
        decimals: token.decimals,
        valueInToken: balanceInTokenWei,
        valueInUsd,
      };
    });

    const accountBalance = await Promise.all(promiseArray);
    return accountBalance;
  }

  async getBalanceByTokenReadable(token: Token, addressToCheckOn: string): Promise<string> {
    const balanceInWei = await this.getBalanceByTokenWei(token, addressToCheckOn);
    return TokenModule.getReadableAmountWithToken(balanceInWei, token);
  }

  async getBalanceByTokenWei(token: Token, addressToCheckOn: string): Promise<string> {
    if (token.symbol === 'ETH') {
      return this.getBalanceNative(addressToCheckOn);
    }

    const fromTokenContractInstance = await this.getTokenContractInstanceByAddress(token.contractAddress);
    const balanceInWei = await fromTokenContractInstance.methods.balanceOf(addressToCheckOn).call();

    return balanceInWei;
  }

  static getAmountWithPrecisionWithToken(readableAmount: string | number, token: Token): string {
    return toWei(readableAmount, token.decimals);
  }

  static getReadableAmountWithToken(amountWithPrecision: string | number, token: Token): string {
    return fromWei(amountWithPrecision, token.decimals);
  }

  calculateValueInUsd(token: Token, amountInWei: string) {
    const readableAmount = TokenModule.getReadableAmountWithToken(amountInWei, token);
    return Number(readableAmount) * token.priceInUsd;
  }

  getTokensBySymbols(symbols: TokenSymbol[]) {
    return TokenRepository.findBySymbols(symbols);
  }

  private async getDecimalsFromContractAddress(tokenContactAddress: string) {
    const tokenContractInstance = await this.getTokenContractInstanceByAddress(tokenContactAddress);
    const decimals = await tokenContractInstance.methods.decimals().call();

    return decimals;
  }

  private getTokenContractInstanceByAddress(address: string): Contract {
    return new this.web3.eth.Contract(this.erc20Abi, address);
  }

  private async getBalanceNative(walletAddress: string): Promise<string> {
    return this.web3.eth.getBalance(walletAddress);
  }
}
