const admin = require('../firebase');
const pool  = require('../db');

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  try {
    const token        = header.slice(7);
    const decodedToken = await admin.auth().verifyIdToken(token);

    const { rows } = await pool.query(
      'SELECT id, name, email, role, avatar FROM users WHERE firebase_uid = $1',
      [decodedToken.uid]
    );

    let user;
    if (!rows.length) {
      // Check if an invited user row exists with this email but no firebase_uid yet
      const { rows: byEmail } = await pool.query(
        'SELECT id, name, email, role, avatar FROM users WHERE email = $1 AND firebase_uid IS NULL',
        [decodedToken.email]
      );
      if (byEmail.length) {
        // Link the Firebase UID to the existing invited row
        const { rows: linked } = await pool.query(
          'UPDATE users SET firebase_uid = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, role, avatar',
          [decodedToken.uid, byEmail[0].id]
        );
        user = linked[0];
      } else {
        // Brand new user — auto-provision as Member
        const displayName = decodedToken.name || decodedToken.email;
        const avatar      = displayName.slice(0, 2).toUpperCase();
        const { rows: inserted } = await pool.query(
          `INSERT INTO users (name, email, firebase_uid, role, avatar)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, name, email, role, avatar`,
          [displayName, decodedToken.email, decodedToken.uid, 'Member', avatar]
        );
        user = inserted[0];
      }
    } else {
      user = rows[0];
    }

    req.user = {
      id:     user.id,
      name:   user.name,
      email:  user.email,
      role:   user.role,
      avatar: user.avatar,
    };

    next();
  } catch {
    res.status(401).json({ error: 'Authentication failed.' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'Admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

module.exports = { authenticate, requireAdmin };
