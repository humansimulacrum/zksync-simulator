import { In } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Token } from '../entity/token.entity';
import { TokenSymbol } from '../utils/types/token-symbol.type';

export const TokenRepository = AppDataSource.getRepository(Token).extend({
  async upsertTokens(tokens: Array<Omit<Token, 'id'>>): Promise<void> {
    for (let token of tokens) {
      // Try to update the token based on unique criteria
      const updateResult = await this.createQueryBuilder()
        .update(Token)
        .set({
          ...token,
          priceIsUsd: token.priceIsUsd, // Or other fields you want to update
        })
        .where('symbol = :symbol AND contractAddress = :contractAddress', {
          symbol: token.symbol,
          contractAddress: token.contractAddress,
        })
        .execute();

      // If update did not find a match, insert the new token
      if (updateResult.affected === 0) {
        await this.insert(token);
      }
    }
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
