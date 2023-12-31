import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Account } from './account.entity';

@Entity()
export class Tier {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  tierRank: number;

  @Column()
  transactionCountNeeded: number;

  @Column()
  officialBridgeNeeded: boolean;

  @Column()
  zkSyncDomainNeeded: boolean;

  @Column()
  dmailerAllowed: boolean;

  @Column()
  volume: number;

  @Column()
  uniqueSmartContracts: number;

  @OneToMany(() => Account, (account) => account.tier)
  accounts: Account[];
}
