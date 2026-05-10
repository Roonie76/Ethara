require('dotenv').config();
const pool   = require('./db');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Create tables ──────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id           SERIAL PRIMARY KEY,
        name         TEXT        NOT null,
        email        TEXT        NOT null UNIQUE,
        firebase_uid TEXT        UNIQUE,
        role         TEXT        NOT null DEFAULT 'Member' CHECK (role IN ('Admin', 'Member')),
        avatar     TEXT,
        created_at TIMESTAMPTZ NOT null DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT null DEFAULT NOW()
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

    // ── Clear existing data ────────────────────────────────────────────────────
    await client.query('DELETE FROM project_members');
    await client.query('DELETE FROM tasks');
    await client.query('DELETE FROM projects');
    await client.query('DELETE FROM users');
    await client.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE projects_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE tasks_id_seq RESTART WITH 1');
    console.log('Cleared existing data');

    // ── Users ──────────────────────────────────────────────────────────────────
    const { rows: [admin] } = await client.query(
      `INSERT INTO users (name, email, firebase_uid, role, avatar) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      ['Rohin Vengatesh', 'rohinvengatesh04@gmail.com', null, 'Admin', 'RV']
    );
    console.log('Admin user seeded');

    const { rows: [alice] } = await client.query(
      `INSERT INTO users (name, email, firebase_uid, role, avatar) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      ['Alice Developer', 'alice@ethara.com', null, 'Member', 'AL']
    );
    const { rows: [bob] } = await client.query(
      `INSERT INTO users (name, email, firebase_uid, role, avatar) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      ['Bob Manager', 'bob@ethara.com', null, 'Admin', 'BO']
    );
    const { rows: [carol] } = await client.query(
      `INSERT INTO users (name, email, firebase_uid, role, avatar) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      ['Carol Designer', 'carol@ethara.com', null, 'Member', 'CA']
    );
    const { rows: [dan] } = await client.query(
      `INSERT INTO users (name, email, firebase_uid, role, avatar) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      ['Dan Tester', 'dan@ethara.com', null, 'Member', 'DA']
    );

    // ── Projects ───────────────────────────────────────────────────────────────
    const { rows: [p1] } = await client.query(
      `INSERT INTO projects (name, description, status, due_date, color, created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      ['Website Redesign', 'Redesign the company website with modern UI/UX.', 'Active', '2026-06-01', '#6366f1', alice.id]
    );
    const { rows: [p2] } = await client.query(
      `INSERT INTO projects (name, description, status, due_date, color, created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      ['Mobile App v2', 'Build the second version of our mobile application.', 'Active', '2026-07-15', '#0ea5e9', alice.id]
    );
    const { rows: [p3] } = await client.query(
      `INSERT INTO projects (name, description, status, due_date, color, created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      ['API Integration', 'Integrate third-party payment and analytics APIs.', 'Completed', '2026-04-01', '#10b981', alice.id]
    );
    console.log('Projects seeded');

    // ── Tasks ──────────────────────────────────────────────────────────────────
    const taskData = [
      ['Design homepage mockup',       'Create wireframes and high-fidelity mockups.',         'Done',        'High',   p1.id, carol.id, alice.id, '2026-04-20'],
      ['Implement navigation bar',     'Build responsive nav bar with mobile hamburger menu.', 'In Progress', 'High',   p1.id, bob.id,   alice.id, '2026-05-10'],
      ['Write content for About page', 'Draft copy for the About Us section.',                 'Todo',        'Medium', p1.id, carol.id, alice.id, '2026-05-20'],
      ['SEO audit',                    'Run an SEO audit and fix meta tags.',                   'Todo',        'Low',    p1.id, bob.id,   alice.id, '2026-04-25'],
      ['Set up React Native project',  'Initialize repo, configure CI/CD pipeline.',           'Done',        'High',   p2.id, dan.id,   alice.id, '2026-04-25'],
      ['Design onboarding flow',       'Create screens for new user onboarding.',              'In Progress', 'High',   p2.id, bob.id,   alice.id, '2026-05-15'],
      ['Push notification integration','Integrate Firebase Cloud Messaging.',                  'Todo',        'Medium', p2.id, dan.id,   alice.id, '2026-06-01'],
      ['Stripe payment integration',   'Integrate Stripe for checkout flow.',                  'Done',        'High',   p3.id, carol.id, alice.id, '2026-03-15'],
      ['Analytics dashboard',          'Connect Mixpanel and build analytics view.',           'Done',        'Medium', p3.id, carol.id, alice.id, '2026-03-30'],
    ];

    for (const [title, desc, status, priority, projId, assignee, creator, due] of taskData) {
      await client.query(
        `INSERT INTO tasks (title, description, status, priority, project_id, assignee_id, created_by, due_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [title, desc, status, priority, projId, assignee, creator, due]
      );
    }
    console.log('Tasks seeded');

    await client.query('COMMIT');
    console.log('Seed complete! Use Firebase Auth to log in.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => { console.error(err.message); process.exit(1); });
