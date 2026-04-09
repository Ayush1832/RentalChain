import { Pool } from 'pg';
import { logger } from '../utils/logger';

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

db.on('error', (err) => {
  logger.error('Unexpected PostgreSQL pool error', err);
});

export async function testConnection(): Promise<void> {
  const client = await db.connect();
  try {
    await client.query('SELECT 1');
    logger.info('PostgreSQL connected');
  } finally {
    client.release();
  }
}
