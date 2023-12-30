import { AppDataSource } from '../data-source';
import { Activity } from '../entity/activity.entity';
import { DeepPartial } from 'typeorm';

export const ActivityRepository = AppDataSource.getRepository(Activity).extend({
  async updateAndReturnOneById(id: string, payload: DeepPartial<Activity>) {
    await ActivityRepository.update({ id }, payload);
    const updatedActivity = await ActivityRepository.findOneBy({ id });

    if (!updatedActivity) {
      // TODO: Add proper error handling
      throw new Error('Unexpected');
    }

    return updatedActivity;
  },

  async updateById(id: string, payload: DeepPartial<Activity>): Promise<void> {
    await this.update({ id }, payload);
    return;
  },

  async getUniqueContractsForAccount(accountId: string): Promise<string[]> {
    const activity = await this.findOne({ where: { account: { id: accountId } } });

    if (!activity) {
      return [];
    }

    return JSON.parse(activity.uniqueContractArray);
  },
});
