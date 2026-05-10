const pool = require('./db');

async function check() {
  try {
    const { rows } = await pool.query('SELECT id, name, email FROM users');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
