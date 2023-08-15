import { shuffle } from '.';
import { accountsInBatch, daysBetweenTransactionsOnAccount } from '../const/config.const';
import { AccountModel } from '../entities/account.entity';
import { getDaysAgo } from './date.helper';
import { base64Decode } from './encode.helper';

export async function accountPicker() {
  const lastTransactionMinDate = getDaysAgo(daysBetweenTransactionsOnAccount);

  const accounts = await AccountModel.aggregate([
    {
      $lookup: {
        from: 'activities',
        localField: 'activity',
        foreignField: '_id',
        as: 'activity',
      },
    },
    {
      $unwind: {
        path: '$activity',
      },
    },
    {
      $match: {
        'activity.lastTransactionDate': { $lte: lastTransactionMinDate },
      },
    },
  ]);

  const shuffledAccounts = shuffle(accounts);

  const decodedAccounts = shuffledAccounts.map((acc) => ({ ...acc, privateKey: base64Decode(acc.privateKey) }));
  return decodedAccounts.slice(0, accountsInBatch);
}
