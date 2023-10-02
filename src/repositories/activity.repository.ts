import { AppDataSource } from '../data-source';
import { Account } from '../entity/account.entity';
import { AccountActivity } from '../entity/activities.entity';

export const ActivityRepository = AppDataSource.getRepository(AccountActivity).extend({
  updateById(id: string, payload: Partial<AccountActivity>) {
    return this.update({ id }, payload);
  },
});
