import { getRepository } from 'typeorm';
import { shuffle } from '.';
import { Account } from '../../entities/account.entity';
import { accountsInBatch, daysBetweenTransactionsOnAccount } from '../const/config.const';
import { getDaysAgo } from './date.helper';
import { base64Decode } from './encode.helper';

export async function accountPicker() {
  const lastTransactionMinDate = getDaysAgo(daysBetweenTransactionsOnAccount);
  const accountRepository = getRepository(Account);

  const accounts = await accountRepository
    .createQueryBuilder('account')
    .leftJoinAndSelect('account.activity', 'activity')
    .where('activity.lastTransactionDate < :minDate', { minDate: lastTransactionMinDate })
    .getMany();

  const shuffledAccounts = shuffle(accounts);

  const decodedAccounts = shuffledAccounts.map((acc) => ({ ...acc, privateKey: acc.privateKey }));
  return decodedAccounts.slice(0, accountsInBatch);
}
