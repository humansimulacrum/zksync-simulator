import { AppDataSource } from '../data-source';
import { Account } from '../entity/account.entity';
import { Activity } from '../entity/activities.entity';

export const ActivityRepository = AppDataSource.getRepository(Activity).extend({
  updateById(id: string, payload: Partial<Activity>) {
    return this.update({ id }, payload);
  },
});
