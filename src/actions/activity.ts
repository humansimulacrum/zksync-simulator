import { Account } from '../entity';
import { AccountRepository } from '../repositories';
// import { writeToCsvFile } from '../utils/helpers';
import { connectToDatabase } from '../utils/helpers/db.helper';
import { orderBy } from 'lodash';

export async function main() {
  await connectToDatabase();

  const accounts = await AccountRepository.getAccountsWithActivities();
  const dataForTable = orderBy(
    accounts.map((account: Account) => ({
      walletAddress: account.walletAddress,
      transactionCount: account.activity?.transactionCount,
      lastTransactionDate: account.activity?.lastTransactionDate,
      gasSpentInUsd: account.activity?.gasSpentInUsd,
      uniqueContractCount: account.activity?.uniqueContractCount,
    })),
    ['lastTransactionDate']
  );
  console.table(dataForTable);
  // writeToCsvFile(dataForTable, `activity-export-${new Date().toISOString()}`);
  process.exit(0);
}

main();
