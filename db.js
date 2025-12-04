import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const { Pool } = pg;

// Connection pool
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export default pool;

// Export query function to be used by API endpoints
export const query = (text, params) => pool.query(text, params);
