import { TokenModule } from '../modules/utility/token.module';
import { AccountRepository } from '../repositories';
import { ERA } from '../utils/const/chains.const';
import { connectToDatabase } from '../utils/helpers/db.helper';
import { sortBy, sumBy } from 'lodash';
import { TokenSymbol } from '../utils/types';

export async function main() {
  await connectToDatabase();

  const tokenModule = await TokenModule.create(ERA.rpc);

  const accounts = await AccountRepository.getAllAccounts();

  const addresses = accounts.map((account) => account.walletAddress);

  const promiseArray = addresses.map(async (address) => {
    const balance = await tokenModule.getBalanceAll(address);
    return { walletAddress: address, balance };
  });

  const walletBalances = await Promise.all(promiseArray);
  const dataForTable = walletBalances.map(({ balance, walletAddress }) => {
    const output: Partial<Record<TokenSymbol, number>> & { walletAddress: string } = { walletAddress };
    let sum = 0;

    balance.forEach((record) => {
      output[record.symbol] = Number(record.valueInUsd.toFixed(2));
      sum += record.valueInUsd;
    });

    output['ETH'] = output['ETH'] || 0;
    output['WETH'] = output['WETH'] || 0;
    output['USDC'] = output['USDC'] || 0;
    output['WBTC'] = output['WBTC'] || 0;

    return { ...output, Sum: Number(sum.toFixed(2)) };
  });

  const sortedData = sortBy(dataForTable, 'Sum').reverse();
  const totalSum = sumBy(sortedData, 'Sum');

  console.table(sortedData, ['walletAddress', 'ETH', 'WETH', 'USDC', 'WBTC', 'Sum']);
  console.log(`Total sum in ZkSync => ${totalSum.toFixed(2)} USD.`);

  process.exit(0);
}

main();
