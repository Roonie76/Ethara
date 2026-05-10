require('dotenv').config();
const pool = require('./db');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id           SERIAL PRIMARY KEY,
        name         TEXT        NOT null,
        email        TEXT        NOT null UNIQUE,
        firebase_uid TEXT        UNIQUE,
        role         TEXT        NOT null DEFAULT 'Member' CHECK (role IN ('Admin', 'Member')),
        avatar       TEXT,
        created_at   TIMESTAMPTZ NOT null DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT null DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id          SERIAL PRIMARY KEY,
        name        TEXT        NOT null,
        description TEXT,
        status      TEXT        NOT null DEFAULT 'Planning' CHECK (status IN ('Planning', 'Active', 'Completed')),
        due_date    DATE,
        color       TEXT        NOT null DEFAULT '#6366f1',
        lead_id     INTEGER     REFERENCES users(id) ON DELETE SET null,
        created_by  INTEGER     REFERENCES users(id) ON DELETE SET null,
        created_at  TIMESTAMPTZ NOT null DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT null DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS project_members (
        project_id INTEGER NOT null REFERENCES projects(id) ON DELETE CASCADE,
        user_id    INTEGER NOT null REFERENCES users(id) ON DELETE CASCADE,
        PRIMARY KEY (project_id, user_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id          SERIAL PRIMARY KEY,
        title       TEXT        NOT null,
        description TEXT,
        status      TEXT        NOT null DEFAULT 'Todo' CHECK (status IN ('Todo', 'In Progress', 'Review', 'Done')),
        priority    TEXT        NOT null DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
        project_id  INTEGER     NOT null REFERENCES projects(id) ON DELETE CASCADE,
        assignee_id INTEGER     REFERENCES users(id) ON DELETE SET null,
        created_by  INTEGER     REFERENCES users(id) ON DELETE SET null,
        due_date    DATE,
        created_at  TIMESTAMPTZ NOT null DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT null DEFAULT NOW()
      )
    `);

    await client.query('COMMIT');
    console.log('Database migration completed');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Database migration failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
