import { AppDataSource } from '../../data-source';

export async function connectToDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('Connected to the database');
  } catch (error) {
    console.error('Error connecting to the database', error);
  }
}
