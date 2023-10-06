import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Activity } from './activity.entity';
import { Tier } from './tier.entity';

@Entity()
export class Account {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  walletAddress: string;

  @Column()
  privateKey: string;

  @OneToOne(() => Activity)
  @JoinColumn({ name: 'activityId' })
  activity: Activity | null;

  @ManyToOne(() => Tier)
  @JoinColumn({ name: 'tierId' })
  tier: Tier | null;
}
