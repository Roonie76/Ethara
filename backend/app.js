require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const projectRoutes = require('./routes/projects');
const taskRoutes    = require('./routes/tasks');
const userRoutes    = require('./routes/users');

const app = express();

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean)
  : ['http://localhost:5173'];

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());

app.use('/api/projects', projectRoutes);
app.use('/api/tasks',    taskRoutes);
app.use('/api/users',    userRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

const frontendDist = path.resolve(__dirname, '../frontend/dist');

app.use(express.static(frontendDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'));
});

module.exports = app;
