import { shuffle } from '.';
import { accountsInBatch, daysBetweenTransactionsOnAccount, shuffleWallets } from '../const/config.const';
import { getDaysAgo } from './date.helper';
import { AccountRepository } from '../../repositories/account.repository';
import { Account } from '../../entity/account.entity';

export async function accountPicker() {
  const accounts = await selectAccountsThatWereInactive();
  const batch = formBatch(accounts);

  return batch;
}

async function selectAccountsThatWereInactive() {
  const lastTransactionMinDate = getDaysAgo(daysBetweenTransactionsOnAccount);
  let accounts = await AccountRepository.getAccountsWithLastTransactionDateLessThan(lastTransactionMinDate);

  return accounts;
}

function formBatch(accounts: Account[]): Account[] {
  if (shuffleWallets) {
    accounts = shuffle(accounts);
  }

  return accounts.slice(0, accountsInBatch);
}
