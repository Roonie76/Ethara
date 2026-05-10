const pool = require('./db');

async function check() {
  try {
    const { rows } = await pool.query('SELECT * FROM project_members WHERE project_id = 5');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
