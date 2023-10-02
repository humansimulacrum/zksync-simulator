import { EntityRepository, Repository } from 'typeorm';
import { Tier } from '../entity/tier.entity';
import { tiers } from '../utils/const/tiers.const';
import { AppDataSource } from '../data-source';

export const TierRepository = AppDataSource.getRepository(Tier).extend({
  removeAllExistingTiers() {
    return this.createQueryBuilder('tier').delete().where({}).execute();
  },

  addNewTiersFromConfig() {
    return this.save(tiers);
  },

  getAllTiers() {
    return this.find();
  },
});
