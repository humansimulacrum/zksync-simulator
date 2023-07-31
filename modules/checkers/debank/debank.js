import fetch from 'make-fetch-happen';
import { choose } from '../../../utils/helpers/index.js';
import { transformDebankDataToNeededFormat } from '../../../utils/helpers/debank.helper.js';

export class Debank {
  constructor(proxies) {
    this.proxies = proxies;
    this.protocolName = 'Debank';
  }

  async activateWalletOnChain(walletAddr, chain) {
    const proxyStr = choose(this.proxies);

    try {
      const response = await fetch(`https://api.debank.com/token/balance_list?user_addr=${walletAddr}&chain=${chain}`, {
        proxy: proxyStr,
      });

      const json = await response.json();

      return json.data;
    } catch (e) {
      console.log(
        `ZkSync AIO. ${this.protocolName}. ${walletAddr}: Error on wallet activation on ${chain} -> ${JSON.stringify(
          e
        )}`
      );
      return false;
    }
  }

  async getTokenValue(walletAddr) {
    const proxyStr = choose(this.proxies);

    try {
      const response = await fetch(`https://api.debank.com/token/cache_balance_list?user_addr=${walletAddr}`, {
        proxy: proxyStr,
      });

      if (response.headers.get('content-type').includes('json')) {
        const json = await response.json();
        return json.data;
      }

      // in case if it's not json, it's faulty
      const text = await response.text();
      throw new Error(text);
    } catch (e) {
      console.log(`ZkSync AIO. ${this.protocolName}. ${walletAddr}: Error on wallet token value fetching.`);
      return false;
    }
  }

  async getTokenValueInChain(walletAddr, chainName) {
    const tokens = await this.getTokenValue(walletAddr);

    if (!tokens) return false;
    const tokensOnNeededChain = tokens.filter((record) => record.chain === chainName.toLowerCase());

    return transformDebankDataToNeededFormat(tokensOnNeededChain);
  }
}
