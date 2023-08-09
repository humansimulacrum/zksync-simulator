import { shuffle } from '.';
import { accountsInBatch, daysBetweenTransactionsOnAccount } from '../const/config.const';
import { AccountModel } from '../entities/account.entity';
import { getDaysAgo, getMonday } from './date.helper';
import { base64Decode } from './encode.helper';

export async function accountPicker() {
  const lastTransactionMinDate = getDaysAgo(daysBetweenTransactionsOnAccount);

  const accounts = await AccountModel.find({ lastTransactionDate: { $lte: lastTransactionMinDate } }).lean();
  const shuffledAccounts = shuffle(accounts);

  const decodedAccounts = shuffledAccounts.map((acc) => ({ ...acc, privateKey: base64Decode(acc.privateKey) }));

  return decodedAccounts.slice(0, accountsInBatch);
}
