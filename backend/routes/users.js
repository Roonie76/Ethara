const express = require('express');
const pool    = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validateInvite, validateRole } = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, avatar FROM users ORDER BY name'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// POST /api/users/invite  – admin only
router.post('/invite', requireAdmin, validateInvite, async (req, res) => {
  try {
    const { name, email, role } = req.body;

    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (exists.rows.length) return res.status(400).json({ error: 'Email already in use.' });

    const avatar = name.trim().slice(0, 2).toUpperCase();
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, firebase_uid, role, avatar)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, avatar`,
      [name.trim(), email.trim().toLowerCase(), null, role || 'Member', avatar]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to invite user.' });
  }
});

// PATCH /api/users/:id/role  – admin only, cannot demote last admin
router.patch('/:id/role', requireAdmin, validateRole, async (req, res) => {
  try {
    const { role } = req.body;

    const { rows: target } = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (!target.length) return res.status(404).json({ error: 'User not found.' });

    if (target[0].role === 'Admin' && role === 'Member') {
      const { rows: admins } = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'Admin'");
      if (parseInt(admins[0].count) <= 1) {
        return res.status(400).json({ error: 'Cannot demote the last admin.' });
      }
    }

    const { rows } = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role, avatar',
      [role, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role.' });
  }
});

// DELETE /api/users/:id  – admin only, cannot remove self
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user.id)) {
      return res.status(400).json({ error: 'Cannot remove yourself.' });
    }
    const { rows } = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found.' });
    res.json({ message: 'User removed.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove user.' });
  }
});

module.exports = router;
