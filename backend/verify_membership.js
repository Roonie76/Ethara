const pool = require('./db');

async function check() {
  try {
    const { rows } = await pool.query(
      'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
      [5, 6]
    );
    console.log('Result:', rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
