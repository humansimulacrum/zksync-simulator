import { AppDataSource } from '../data-source';
import { Account } from '../entity/account.entity';
import { DeepPartial } from 'typeorm';

export const AccountRepository = AppDataSource.getRepository(Account).extend({
  createAccount(privateKey: string, walletAddress: string) {
    const createAccountPayload = {
      privateKey,
      walletAddress,
      activity: null,
      tier: null,
    };

    return AccountRepository.save(createAccountPayload);
  },

  removeAllAssignedTiers() {
    return this.update({}, { tier: null });
  },

  getAccountsWithActivities() {
    return this.createQueryBuilder('account').leftJoinAndSelect('account.activity', 'activities').getMany();
  },

  getAccountsWithLastTransactionDateLessThan(lastTransactionDate: string) {
    const accounts = this.createQueryBuilder('account')
      .leftJoinAndSelect('account.activity', 'activity')
      .where('activity.lastTransactionDate < :minDate', { minDate: lastTransactionDate })
      .getMany();

    return accounts;
  },
  updateById(id: string, payload: DeepPartial<Account>) {
    return this.update({ id }, payload);
  },
});
