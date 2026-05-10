const express = require('express');
const pool    = require('../db');
const { authenticate } = require('../middleware/auth');
const { validateTask, validateTaskPatch, validateTaskStatus } = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

// GET /api/tasks
router.get('/', async (req, res) => {
  try {
    const isAdmin = req.user.role === 'Admin';
    const { rows } = await pool.query(`
      SELECT t.* FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE $1 = TRUE
         OR t.assignee_id = $2
         OR t.created_by = $2
         OR p.created_by = $2
         OR p.lead_id = $2
         OR pm.user_id = $2
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `, [isAdmin, req.user.id]);
    res.json(rows.map(camel));
  } catch (err) {
    console.error('Fetch tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
});

// POST /api/tasks
router.post('/', validateTask, async (req, res) => {
  try {
    const { title, description, status, priority, projectId, assigneeId, dueDate } = req.body;

    // Verify project exists and user has access
    const isAdmin = req.user.role === 'Admin';
    const projQuery = await pool.query(`
      SELECT p.* FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE p.id = $1 AND ($2 = TRUE OR p.created_by = $3 OR p.lead_id = $3 OR pm.user_id = $3)
    `, [projectId, isAdmin, req.user.id]);
    
    if (!projQuery.rows.length) return res.status(403).json({ error: 'Project not found or access denied.' });

    // Verify assignee exists (if admin provides one)
    let resolvedAssignee = req.user.id;
    if (req.user.role === 'Admin') {
      if (assigneeId) {
        const assignee = await pool.query('SELECT id FROM users WHERE id = $1', [assigneeId]);
        if (!assignee.rows.length) return res.status(400).json({ error: 'Assignee not found.' });
        resolvedAssignee = assigneeId;
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO tasks (title, description, status, priority, project_id, assignee_id, created_by, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        title.trim(),
        description ? String(description).slice(0, 5000) : null,
        status || 'Todo',
        priority || 'Medium',
        projectId,
        resolvedAssignee || null,
        req.user.id,
        dueDate || null,
      ]
    );
    res.status(201).json(camel(rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

// PATCH /api/tasks/:id  – admin or assignee (full edit)
router.patch('/:id', validateTaskPatch, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Task not found.' });
    const task = rows[0];

    const isAdmin    = req.user.role === 'Admin';
    const isAssignee = String(task.assignee_id) === String(req.user.id);
    // Check if user is the project lead
    const proj = await pool.query('SELECT lead_id FROM projects WHERE id = $1', [task.project_id]);
    const isLead = proj.rows.length > 0 && String(proj.rows[0].lead_id) === String(req.user.id);

    if (!isAdmin && !isAssignee && !isLead) {
      return res.status(403).json({ error: 'Not allowed to update this task.' });
    }

    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    // Only lead or admin can change priority and due date
    if ((priority !== undefined || dueDate !== undefined) && !isAdmin && !isLead) {
      return res.status(403).json({ error: 'Only the project lead or admin can change priority and due date.' });
    }

    // Only admin can reassign a task
    let resolvedAssignee = undefined;
    if (assigneeId !== undefined) {
      if (!isAdmin) return res.status(403).json({ error: 'Only admins can reassign tasks.' });
      const assignee = await pool.query('SELECT id FROM users WHERE id = $1', [assigneeId]);
      if (!assignee.rows.length) return res.status(400).json({ error: 'Assignee not found.' });
      resolvedAssignee = assigneeId;
    }

    const { rows: updated } = await pool.query(
      `UPDATE tasks SET
         title       = COALESCE($1, title),
         description = COALESCE($2, description),
         status      = COALESCE($3, status),
         priority    = COALESCE($4, priority),
         due_date    = COALESCE($5, due_date),
         assignee_id = COALESCE($6, assignee_id),
         updated_at  = NOW()
       WHERE id = $7 RETURNING *`,
      [
        title       !== undefined ? title.trim()                        : null,
        description !== undefined ? String(description).slice(0, 5000) : null,
        status      !== undefined ? status                              : null,
        priority    !== undefined ? priority                            : null,
        dueDate     !== undefined ? dueDate                             : null,
        resolvedAssignee !== undefined ? resolvedAssignee               : null,
        req.params.id,
      ]
    );
    res.json(camel(updated[0]));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

// PATCH /api/tasks/:id/status  – admin, assignee, project lead, or project member
router.patch('/:id/status', validateTaskStatus, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Task not found.' });
    const task = rows[0];

    const isAdmin    = req.user.role === 'Admin';
    const isAssignee = Number(task.assignee_id) === Number(req.user.id);
    const newStatus  = req.body.status;

    // Check if user is the project lead or a project member
    const proj = await pool.query('SELECT lead_id, id FROM projects WHERE id = $1', [task.project_id]);
    const project = proj.rows[0];
    const isLead = project && Number(project.lead_id) === Number(req.user.id);

    let isMember = false;
    let memberCount = 0;
    if (project) {
      const memberCheck = await pool.query(
        'SELECT COUNT(*) FROM project_members WHERE project_id = $1 AND user_id = $2',
        [Number(project.id), Number(req.user.id)]
      );
      memberCount = parseInt(memberCheck.rows[0].count);
      isMember = memberCount > 0;
    }

    console.log('[DEBUG] Status Update:', {
      taskId: req.params.id,
      userId: req.user.id,
      projectId: project?.id,
      isAdmin,
      isAssignee,
      isLead,
      isMember,
      memberCount,
      newStatus
    });

    if (!isAdmin && !isAssignee && !isLead && !isMember) {
      return res.status(403).json({ 
        error: 'Not allowed to update this task.',
        debug: { isAdmin, isAssignee, isLead, isMember, memberCount, userId: req.user.id, projectId: project?.id }
      });
    }

    // Only admin or project lead can move tasks to Done/Completed
    if ((newStatus === 'Done' || newStatus === 'Completed') && !isAdmin && !isLead) {
      return res.status(403).json({ error: 'Only the project lead or admin can mark tasks as Done.' });
    }

    const { rows: updated } = await pool.query(
      'UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [req.body.status, req.params.id]
    );
    res.json(camel(updated[0]));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task status.' });
  }
});

// DELETE /api/tasks/:id  – admin or assignee
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Task not found.' });
    const task = rows[0];

    const isAdmin    = req.user.role === 'Admin';
    const isAssignee = String(task.assignee_id) === String(req.user.id);

    // Check if user is the project lead
    const proj = await pool.query('SELECT lead_id FROM projects WHERE id = $1', [task.project_id]);
    const isLead = proj.rows.length > 0 && String(proj.rows[0].lead_id) === String(req.user.id);

    if (!isAdmin && !isAssignee && !isLead) {
      return res.status(403).json({ error: 'Not allowed to delete this task.' });
    }

    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ message: 'Task deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

function camel(row) {
  return {
    id:          row.id,
    title:       row.title,
    description: row.description,
    status:      row.status,
    priority:    row.priority,
    projectId:   row.project_id,
    assigneeId:  row.assignee_id,
    createdBy:   row.created_by,
    dueDate:     row.due_date,
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
  };
}

module.exports = router;
