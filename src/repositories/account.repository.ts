import { AppDataSource } from '../data-source';
import { Account } from '../entity/account.entity';

export const AccountRepository = AppDataSource.getRepository(Account).extend({
  removeAllAssignedTiers() {
    return this.update({}, { tier: null });
  },

  getAccountsWithActivities() {
    return this.createQueryBuilder('account').leftJoinAndSelect('account.activity', 'activities').getMany();
  },
});
