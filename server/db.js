import pg from 'pg';
import mongoose from 'mongoose';

// Rename the function to match what index.js is looking for
export const testDbConnection = async () => {
  try {
    // This uses the variable from your .env
    const conn = await mongoose.connect(process.env.DATABASE_URL);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // Don't kill the process yet, just log the error
  }
};

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

let pool = null;

if (!connectionString) {
  console.warn('DATABASE_URL is not set; database features are disabled.');
} else {
  pool = new Pool({
    connectionString,
  });
}

export async function testDbConnection() {
  if (!pool) {
    console.warn('Skipping database connection test; no DATABASE_URL configured.');
    return;
  }

  try {
    const client = await pool.connect();
    client.release();
    console.log('Database connected successfully');
  } catch (err) {
    console.error('Database connection failed:', err.message || err);
  }
}

require('dotenv').config();



module.exports = connectDB;

export { pool };
export default pool;
