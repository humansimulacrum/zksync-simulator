import { connectToDatabase } from '../utils/helpers/db.helper';

export async function main() {
  // TODO: Add price fetching on the start
  await connectToDatabase();

  process.exit(0);
}

main();
