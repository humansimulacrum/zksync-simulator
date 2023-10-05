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

  private constructor(proxies: string[], web3: Web3) {
    this.proxies = proxies;
    this.web3 = web3;
  }

  static async create(rpcUrl?: string): Promise<TokenModule> {
    const proxies = await importProxies();
    const web3 = new Web3(rpcUrl ? rpcUrl : ERA.rpc);

    return new TokenModule(proxies, web3);
  }

  async getBalanceByContractAddress(tokenContractAddress: string, addressToCheckOn: string): Promise<number> {
    const fromTokenContractInstance = await this.getTokenContractInstanceByAddress(tokenContractAddress);
    return fromTokenContractInstance.methods.balanceOf(addressToCheckOn).call();
  }

  async getBalanceAll(addressToCheckOn: string): Promise<TokenBalance[]> {
    const tokens = await TokenRepository.getAllTokens();

    const promiseArray = tokens.map(async (token): Promise<TokenBalance> => {
      const balanceInToken = await this.getBalanceByContractAddress(token.contractAddress, addressToCheckOn);
      const valueInUsd = await this.calculateValueInUsd(token, balanceInToken);

      return {
        symbol: token.symbol,
        decimals: token.decimals,
        valueInToken: balanceInToken,
        valueInUsd,
      };
    });

    const accountBalance = await Promise.all(promiseArray);
    return accountBalance;
  }

  async upsertTokens(): Promise<void> {
    const symbolContractTuples = Object.entries(TOKENS_SUPPORTED) as [TokenSymbol, string][];

    const promiseList = symbolContractTuples.map(async ([symbol, contractAddress]): Promise<Omit<Token, 'id'>> => {
      const priceIsUsdPromise = getTokenPriceCryptoCompare(symbol);
      const decimalsPromise = this.getDecimalsFromContractAddress(contractAddress);

      const [priceIsUsd, decimals] = await Promise.all([priceIsUsdPromise, decimalsPromise]);

      return { symbol, contractAddress, priceIsUsd, decimals };
    });

    const tokenPayloads = await Promise.all(promiseList);
    await TokenRepository.upsertTokens(tokenPayloads);
  }

  getTokensBySymbols(symbols: TokenSymbol[]) {
    return TokenRepository.findBySymbols(symbols);
  }

  async getTokenContractAddressBySymbol(symbol: TokenSymbol) {
    const token = await TokenRepository.findBySymbolOne(symbol);

    if (!token) {
      throw new Error('Tokens are not imported');
    }

    return token.contractAddress;
  }

  async getTokenContractInstanceBySymbol(symbol: TokenSymbol): Promise<Contract> {
    const address = await this.getTokenContractAddressBySymbol(symbol);
    return this.getTokenContractInstanceByAddress(address);
  }

  getTokenContractInstanceByAddress(address: string): Contract {
    const erc20Abi = getAbiByRelativePath('../abi/erc20.json');
    return new this.web3.eth.Contract(erc20Abi, address);
  }

  async calculateValueInUsd(token: Token, amountWithPrecision: number) {
    const readableAmount = await this.getReadableAmountWithContractAddress(amountWithPrecision, token.contractAddress);
    return readableAmount * token.priceIsUsd;
  }

  async getDecimalsFromContractAddress(tokenContactAddress: string) {
    const tokenContractInstance = await this.getTokenContractInstanceByAddress(tokenContactAddress);
    const decimals = await tokenContractInstance.methods.decimals().call();

    return decimals;
  }

  getAmountWithPrecisionWithDecimals(readableAmount: number, decimals: number) {
    return toWei(readableAmount, decimals);
  }

  getReadableAmountWithDecimals(amountWithPrecision: number, decimals: number) {
    return fromWei(amountWithPrecision, decimals);
  }

  async getAmountWithPrecisionWithContractAddress(readableAmount: number, contractAddress: string) {
    const decimals = await this.getDecimalsFromContractAddress(contractAddress);
    return toWei(readableAmount, decimals);
  }

  async getReadableAmountWithContractAddress(amountWithPrecision: number, contractAddress: string) {
    const decimals = await this.getDecimalsFromContractAddress(contractAddress);
    return fromWei(amountWithPrecision, decimals);
  }

  async approveToken(
    amountToApprove: number,
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

    const approveFunctionCall = await tokenContactInstance.methods.approve(protocolContractAddress, amountToApprove);

    const approveTransaction = new Transaction(this.web3, protocolContractAddress, 0, approveFunctionCall, account);
    return approveTransaction.sendTransaction();
  }
}
