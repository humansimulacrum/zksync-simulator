import { AppDataSource } from '../data-source';
import { Account } from '../entity/account.entity';

export const AccountRepository = AppDataSource.getRepository(Account).extend({
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

  updateById(id: string, payload: Partial<Account>) {
    return this.update({ id }, payload);
  },
});
