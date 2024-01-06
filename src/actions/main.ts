import 'dotenv/config';

import { Executor } from '../modules/utility/executor.module';
import { TokenModule } from '../modules/utility/token.module';
import { connectToDatabase } from '../utils/helpers/db.helper';

export async function main() {
  await connectToDatabase();

  const tokenModule = await TokenModule.create();
  await tokenModule.upsertTokens();

  const executorModule = await Executor.create();
  await executorModule.executeActionsOnBatch();

  process.exit(0);
}

main();
