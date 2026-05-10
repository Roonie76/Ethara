require('dotenv').config();
const { Pool, types } = require('pg');

// Force DATE (OID 1082) to be returned as a string to avoid timezone shifting
types.setTypeParser(1082, (val) => val);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err.message);
});

module.exports = pool;
