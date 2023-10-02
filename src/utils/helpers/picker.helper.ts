import { getRepository } from 'typeorm';
import { shuffle } from '.';
import { Account } from '../../entity/account.entity';
import { accountsInBatch, daysBetweenTransactionsOnAccount, shuffleWallets } from '../const/config.const';
import { getDaysAgo } from './date.helper';

export async function accountPicker() {
  const lastTransactionMinDate = getDaysAgo(daysBetweenTransactionsOnAccount);
  const accountRepository = getRepository(Account);

  let accounts = await accountRepository
    .createQueryBuilder('account')
    .leftJoinAndSelect('account.activity', 'activity')
    .where('activity.lastTransactionDate < :minDate', { minDate: lastTransactionMinDate })
    .getMany();

  if (shuffleWallets) {
    accounts = shuffle(accounts);
  }

  return accounts.slice(0, accountsInBatch);
}
