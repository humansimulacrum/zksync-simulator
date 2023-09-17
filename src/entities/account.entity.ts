import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AccountActivity } from './activities.entity';
import { Tier } from './tier.entity';

@Entity()
export class Account {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  walletAddress: string;

  @Column()
  privateKey: string;

  @OneToOne(() => AccountActivity)
  @JoinColumn()
  activity: AccountActivity;

  @ManyToOne(() => Tier)
  @JoinColumn()
  tier: Tier | null;
}
