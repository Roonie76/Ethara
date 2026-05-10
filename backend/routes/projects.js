const express = require('express');
const pool    = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validateProject, validateProjectPatch } = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

// GET /api/projects
router.get('/', async (req, res) => {
  try {
    const isAdmin = req.user.role === 'Admin';
    const { rows } = await pool.query(`
      SELECT p.*, COALESCE(array_agg(pm.user_id) FILTER (WHERE pm.user_id IS NOT NULL), '{}') as member_ids
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE $1 = TRUE 
         OR p.created_by = $2 
         OR p.lead_id = $2 
         OR p.id IN (SELECT project_id FROM project_members WHERE user_id = $2)
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [isAdmin, req.user.id]);
    res.json(rows.map(camel));
  } catch (err) {
    console.error('Fetch projects error:', err);
    res.status(500).json({ error: 'Failed to fetch projects.' });
  }
});

// POST /api/projects  – admin only
router.post('/', requireAdmin, validateProject, async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, description, status, dueDate, color, leadId, memberIds } = req.body;
    
    await client.query('BEGIN');
    
    const { rows } = await client.query(
      `INSERT INTO projects (name, description, status, due_date, color, lead_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        name.trim(),
        description ? String(description).slice(0, 2000) : null,
        status || 'Planning',
        dueDate || null,
        color || '#6366f1',
        leadId || null,
        req.user.id,
      ]
    );

    const project = rows[0];

    if (memberIds && Array.isArray(memberIds)) {
      for (const userId of memberIds) {
        await client.query(
          'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [project.id, userId]
        );
      }
    }

    await client.query('COMMIT');
    
    // Return the full project with member_ids
    const { rows: created } = await pool.query(`
      SELECT p.*, COALESCE(array_agg(pm.user_id) FILTER (WHERE pm.user_id IS NOT NULL), '{}') as member_ids
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE p.id = $1
      GROUP BY p.id
    `, [project.id]);

    res.status(201).json(camel(created[0]));
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Failed to create project.' });
  } finally {
    client.release();
  }
});

// PATCH /api/projects/:id  – admin or lead
router.patch('/:id', validateProjectPatch, async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows: existing } = await client.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Project not found.' });
    
    const project = existing[0];
    const isAdmin = req.user.role === 'Admin';
    const isLead  = Number(project.lead_id) === Number(req.user.id);
    
    if (!isAdmin && !isLead) {
      return res.status(403).json({ error: 'Not allowed to update this project.' });
    }

    const { name, description, status, dueDate, color, leadId, memberIds } = req.body;
    
    await client.query('BEGIN');
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) { updates.push(`name = $${idx++}`); values.push(name?.trim()); }
    if (description !== undefined) { updates.push(`description = $${idx++}`); values.push(description ? String(description).slice(0, 2000) : null); }
    if (status !== undefined) { updates.push(`status = $${idx++}`); values.push(status); }
    if (dueDate !== undefined) { updates.push(`due_date = $${idx++}`); values.push(dueDate || null); }
    if (color !== undefined) { updates.push(`color = $${idx++}`); values.push(color); }
    if (leadId !== undefined) { updates.push(`lead_id = $${idx++}`); values.push(leadId ? parseInt(leadId) : null); }
    
    updates.push(`updated_at = NOW()`);
    values.push(req.params.id);

    if (updates.length > 1) { // more than just updated_at
      await client.query(
        `UPDATE projects SET ${updates.join(', ')} WHERE id = $${idx}`,
        values
      );
    }

    if (memberIds && Array.isArray(memberIds)) {
      await client.query('DELETE FROM project_members WHERE project_id = $1', [req.params.id]);
      for (const userId of memberIds) {
        await client.query(
          'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [req.params.id, userId]
        );
      }
    }

    await client.query('COMMIT');

    // Return the full updated project with member_ids
    const { rows: updated } = await pool.query(`
      SELECT p.*, COALESCE(array_agg(pm.user_id) FILTER (WHERE pm.user_id IS NOT NULL), '{}') as member_ids
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE p.id = $1
      GROUP BY p.id
    `, [req.params.id]);

    res.json(camel(updated[0]));
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update project error:', err);
    res.status(500).json({ error: 'Failed to update project.' });
  } finally {
    client.release();
  }
});

// DELETE /api/projects/:id  – admin only, cascades tasks
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id FROM projects WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Project not found.' });
    await pool.query('DELETE FROM tasks WHERE project_id = $1', [req.params.id]);
    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.json({ message: 'Project and its tasks deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project.' });
  }
});

// snake_case → camelCase for frontend
function camel(row) {
  return {
    id:          row.id,
    name:        row.name,
    description: row.description,
    status:      row.status,
    dueDate:     row.due_date,
    color:       row.color,
    leadId:      row.lead_id,
    memberIds:   row.member_ids || [],
    createdBy:   row.created_by,
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
  };
}

module.exports = router;
