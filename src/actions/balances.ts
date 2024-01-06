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
      output[record.symbol] = record.valueInUsd;
      sum += record.valueInUsd;
    });

    return { ...output, Sum: sum };
  });

  const sortedData = sortBy(dataForTable, 'Sum').reverse();
  const totalSum = sumBy(sortedData, 'Sum');

  console.table(sortedData, ['walletAddress', 'ETH', 'WETH', 'USDC', 'MUTE', 'WBTC', 'Sum']);
  console.log(`Total sum in ZkSync => ${totalSum} USD.`);

  process.exit(0);
}

main();
