import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TokenSymbol } from '../utils/types/token-symbol.type';

@Entity()
export class Token {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  symbol: TokenSymbol;

  @Column()
  decimals: number;

  @Column()
  contractAddress: string;

  @Column()
  priceIsUsd: number;
}
