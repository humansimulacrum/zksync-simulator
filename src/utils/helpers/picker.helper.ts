import { shuffle } from '.';
import { accountsInBatch, daysBetweenTransactionsOnAccount, shuffleWallets } from '../const/config.const';
import { getDaysAgo } from './date.helper';
import { AccountRepository } from '../../repositories/account.repository';

export async function accountPicker() {
  const lastTransactionMinDate = getDaysAgo(daysBetweenTransactionsOnAccount);
  let accounts = await AccountRepository.getAccountsWithLastTransactionDateLessThan(lastTransactionMinDate);

  if (shuffleWallets) {
    accounts = shuffle(accounts);
  }

  return accounts.slice(0, accountsInBatch);
}
