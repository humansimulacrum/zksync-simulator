import { shuffle } from '.';
import {
  ONLY_INACTIVE_ACCOUNTS_PICKED,
  ACCOUNTS_IN_BATCH,
  daysBetweenTransactionsOnAccount,
  shuffleWallets,
} from '../const/config.const';
import { getDaysAgo } from './date.helper';
import { AccountRepository } from '../../repositories/account.repository';
import { Account } from '../../entity/account.entity';

export async function accountPicker() {
  let accounts: Account[];

  if (!ONLY_INACTIVE_ACCOUNTS_PICKED) {
    accounts = await AccountRepository.getAllAccounts();
    return formBatch(accounts, ACCOUNTS_IN_BATCH);
  }

  accounts = await selectAccountsThatWereInactive();
  return formBatch(accounts, calculateBatchAmount(accounts));
}

async function selectAccountsThatWereInactive() {
  const lastTransactionMinDate = getDaysAgo(daysBetweenTransactionsOnAccount);
  let accounts = await AccountRepository.getAccountsWithLastTransactionDateLessThan(lastTransactionMinDate);

  return accounts;
}

function calculateBatchAmount(accounts: Account[]) {
  return accounts.length / daysBetweenTransactionsOnAccount;
}

function formBatch(accounts: Account[], accountsInBatch: number): Account[] {
  if (shuffleWallets) {
    accounts = shuffle(accounts);
  }

  return accounts.slice(0, accountsInBatch);
}
