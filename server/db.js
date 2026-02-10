import pg from 'pg';

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

export { pool };
export default pool;
