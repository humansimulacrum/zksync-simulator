import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Account } from './account.entity';

@Entity()
export class Activity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ nullable: true })
  transactionCount: number;

  @Column({ nullable: true })
  lastTransactionDate: string;

  @Column({ nullable: true })
  gasSpentInUsd: number;

  @Column({ nullable: true })
  bridgeVolume: number;

  @Column({ nullable: true })
  transactionVolume: number;

  @Column({ default: false })
  officialBridge: boolean;

  @Column({ default: false })
  zkSyncDomain: boolean;

  @Column({ nullable: true })
  uniqueContractCount: number;

  // json serialize, deserialize, since we are using sqlite here
  @Column({ nullable: true })
  uniqueContractArray: string;

  @OneToOne(() => Account)
  @JoinColumn({ name: 'accountId' })
  account: Account;
}
