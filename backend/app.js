require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const projectRoutes = require('./routes/projects');
const taskRoutes    = require('./routes/tasks');
const userRoutes    = require('./routes/users');

const app = express();

app.use(cors({ 
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173', 
  credentials: true 
}));
app.use(express.json());

app.use('/api/projects', projectRoutes);
app.use('/api/tasks',    taskRoutes);
app.use('/api/users',    userRoutes);

// Serve static files from the React frontend app
app.use(express.static(path.join(process.cwd(), 'frontend/dist')));

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'frontend/dist/index.html'));
});

module.exports = app;
