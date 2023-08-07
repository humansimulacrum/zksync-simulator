import fetch from 'make-fetch-happen';
import { choose, sleep } from '../../utils/helpers/index';
import { transformDebankDataToNeededFormat } from '../../utils/helpers/debank.helper';
import { moduleName } from '../../utils/const/config.const';
import { DebankTokenBalance, DebankWalletBalanceResponse } from '../../utils/interfaces/debank.interface';
import { log } from '../../utils/logger/logger';

export class Debank {
  proxies: string[];
  protocolName: string;

  constructor(proxies) {
    this.proxies = proxies;
    this.protocolName = 'Debank';
  }

  async activateWalletOnChain(walletAddr: string, chainName: string) {
    const proxyStr = choose(this.proxies);

    try {
      const response = await fetch(
        `https://api.debank.com/token/balance_list?user_addr=${walletAddr}&chain=${chainName}`,
        {
          proxy: proxyStr,
        }
      );

      if (response.headers.get('content-type').includes('json')) {
        const json = await response.json();
        return json.data;
      }

      // in case if it's not json, it's faulty
      const text = await response.text();
      throw new Error(text);
    } catch (e) {
      const message = `Error on wallet activation. Error: ${JSON.stringify(e)}`;
      throw new Error(message);
    }
  }

  async getTokenValue(walletAddr: string): Promise<DebankTokenBalance[]> {
    const proxyStr = choose(this.proxies);

    try {
      const response = await fetch(`https://api.debank.com/token/cache_balance_list?user_addr=${walletAddr}`, {
        proxy: proxyStr,
      });

      if (response.headers.get('content-type').includes('json')) {
        const walletBalance: DebankWalletBalanceResponse = await response.json();
        return transformDebankDataToNeededFormat(walletBalance.data);
      }

      // in case if it's not json, it's faulty
      const text = await response.text();
      throw new Error(text);
    } catch (e: any) {
      if (e.message.includes('429')) {
        const message = `Error on wallet token value fetching. Too many requests.`;
        log(this.protocolName, `${walletAddr}: Sleeping for 40 seconds, because of the Debank 429 error`);
        await sleep(40 * 1000);
        throw new Error(message);
      }

      throw new Error(`Unhandled debank error, info ${JSON.stringify(e)} ${e.message}`);
    }
  }

  async getTokenValueInChain(walletAddr: string, chainName: string) {
    const tokens = await this.getTokenValue(walletAddr);
    const tokensOnNeededChain = tokens.filter((record) => record.chain === chainName.toLowerCase());

    return tokensOnNeededChain;
  }
}
