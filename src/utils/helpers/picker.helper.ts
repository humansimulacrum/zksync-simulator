import { shuffle } from '.';
import {
  ONLY_INACTIVE_ACCOUNTS_PICKED,
  accountsInBatch,
  daysBetweenTransactionsOnAccount,
  shuffleWallets,
} from '../const/config.const';
import { getDaysAgo } from './date.helper';
import { AccountRepository } from '../../repositories/account.repository';
import { Account } from '../../entity/account.entity';

export async function accountPicker() {
  let accounts: Account[];

  if (ONLY_INACTIVE_ACCOUNTS_PICKED) {
    accounts = await selectAccountsThatWereInactive();
  } else {
    accounts = await AccountRepository.getAllAccounts();
  }

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
