require('dotenv').config();
const express = require('express');
const cors    = require('cors');

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

app.get('/', (_, res) => res.send('Ethara API is running.'));
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

module.exports = app;
