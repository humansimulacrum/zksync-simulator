import { In } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Token } from '../entity/token.entity';
import { TokenSymbol } from '../utils/types/token-symbol.type';

export const TokenRepository = AppDataSource.getRepository(Token).extend({
  async upsertTokens(tokens: Array<Omit<Token, 'id'>>): Promise<void> {
    await this.upsert(tokens, ['id', 'symbol', 'contractAddress']);
  },

  async findBySymbolOne(symbol: TokenSymbol) {
    return this.findOneBy({ symbol });
  },

  async getAllTokens() {
    return this.find();
  },

  async findBySymbols(symbols: TokenSymbol[]) {
    return this.findBy({ symbol: In(symbols) });
  },
});
