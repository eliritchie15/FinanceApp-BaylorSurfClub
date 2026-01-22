import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'surf_club_finances',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Rastaman123!',
});

// Test connection
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

export default pool;