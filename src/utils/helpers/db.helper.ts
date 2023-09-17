const { createConnection } = require('typeorm');

export async function connectToDatabase() {
  try {
    await createConnection();
    console.log('Connected to the database');
    // Your application logic here
  } catch (error) {
    console.error('Error connecting to the database', error);
  }
}
