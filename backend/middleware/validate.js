const VALID_ROLES     = new Set(['Admin', 'Member']);
const VALID_STATUSES  = new Set(['Todo', 'In Progress', 'Review', 'Done']);
const VALID_PRIORITIES = new Set(['Low', 'Medium', 'High']);
const EMAIL_RE        = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function str(val, field, { min = 1, max = 255 } = {}) {
  if (typeof val !== 'string' || val.trim().length < min) {
    return `${field} is required.`;
  }
  if (val.trim().length > max) {
    return `${field} must be ${max} characters or fewer.`;
  }
  return null;
}



function validateInvite(req, res, next) {
  const { name, email, role } = req.body;

  const nameErr = str(name, 'Name', { max: 100 });
  if (nameErr) return res.status(400).json({ error: nameErr });

  if (!email || !EMAIL_RE.test(String(email).trim())) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }
  if (role !== undefined && !VALID_ROLES.has(role)) {
    return res.status(400).json({ error: 'Role must be Admin or Member.' });
  }
  next();
}

function validateRole(req, res, next) {
  const { role } = req.body;
  if (!role || !VALID_ROLES.has(role)) {
    return res.status(400).json({ error: 'Role must be Admin or Member.' });
  }
  next();
}

function validateProject(req, res, next) {
  const { name, status } = req.body;

  const nameErr = str(name, 'Project name', { max: 150 });
  if (nameErr) return res.status(400).json({ error: nameErr });

  const PROJ_STATUSES = new Set(['Planning', 'Active', 'Completed']);
  if (status !== undefined && !PROJ_STATUSES.has(status)) {
    return res.status(400).json({ error: 'Status must be Planning, Active, or Completed.' });
  }
  next();
}

function validateProjectPatch(req, res, next) {
  const { name, status } = req.body;

  if (name !== undefined) {
    const nameErr = str(name, 'Project name', { max: 150 });
    if (nameErr) return res.status(400).json({ error: nameErr });
  }
  const PROJ_STATUSES = new Set(['Planning', 'Active', 'Completed']);
  if (status !== undefined && !PROJ_STATUSES.has(status)) {
    return res.status(400).json({ error: 'Status must be Planning, Active, or Completed.' });
  }
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'No fields provided to update.' });
  }
  next();
}

function validateTask(req, res, next) {
  const { title, projectId, status, priority } = req.body;

  const titleErr = str(title, 'Title', { max: 255 });
  if (titleErr) return res.status(400).json({ error: titleErr });

  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required.' });
  }
  if (status !== undefined && !VALID_STATUSES.has(status)) {
    return res.status(400).json({ error: 'Status must be Todo, In Progress, Review, or Done.' });
  }
  if (priority !== undefined && !VALID_PRIORITIES.has(priority)) {
    return res.status(400).json({ error: 'Priority must be Low, Medium, or High.' });
  }
  next();
}

function validateTaskPatch(req, res, next) {
  const { title, status, priority } = req.body;

  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'No fields provided to update.' });
  }
  if (title !== undefined) {
    const titleErr = str(title, 'Title', { max: 255 });
    if (titleErr) return res.status(400).json({ error: titleErr });
  }
  if (status !== undefined && !VALID_STATUSES.has(status)) {
    return res.status(400).json({ error: 'Status must be Todo, In Progress, Review, or Done.' });
  }
  if (priority !== undefined && !VALID_PRIORITIES.has(priority)) {
    return res.status(400).json({ error: 'Priority must be Low, Medium, or High.' });
  }
  next();
}

function validateTaskStatus(req, res, next) {
  const { status } = req.body;
  if (!status || !VALID_STATUSES.has(status)) {
    return res.status(400).json({ error: 'Status must be Todo, In Progress, Review, or Done.' });
  }
  next();
}

module.exports = {
  validateInvite,
  validateRole,
  validateProject,
  validateProjectPatch,
  validateTask,
  validateTaskPatch,
  validateTaskStatus,
};
