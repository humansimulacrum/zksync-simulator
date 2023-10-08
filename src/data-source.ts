import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Account } from './entity/account.entity';
import { Tier } from './entity/tier.entity';
import { Activity } from './entity/activity.entity';
import { Token } from './entity';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: './zk-sim',
  logging: false,
  entities: [Account, Tier, Activity, Token],
  migrations: [],
  synchronize: true,
});
