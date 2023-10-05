import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TOKENS_SUPPORTED } from '../utils/const/token-contracts.const';
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
