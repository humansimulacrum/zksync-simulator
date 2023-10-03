import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Account } from './account.entity';

@Entity()
export class Activity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  transactionCount: number;

  @Column()
  rank: number;

  @Column()
  lastTransactionDate: string;

  @Column()
  gasSpentInUsd: number;

  @Column({ default: false })
  officialBridge: boolean;

  @Column({ default: false })
  zkSyncDomain: boolean;

  @OneToOne(() => Account)
  @JoinColumn()
  account: Account;
}
