import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Account } from './entity/account.entity';
import { Tier } from './entity/tier.entity';
import { AccountActivity } from './entity/activities.entity';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: '../zk-sim',
  logging: false,
  entities: [Account, Tier, AccountActivity],
  migrations: [],
  synchronize: true,
});
