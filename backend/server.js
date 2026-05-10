const pool = require('./db');
const app  = require('./app');

const pool = require('./db');
const app  = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Connect to DB in the background
  pool.connect()
    .then(client => {
      client.release();
      console.log('PostgreSQL connected');
    })
    .catch(err => {
      console.error('PostgreSQL connection failed:', err.message);
      // We don't exit(1) here so the healthcheck can still pass
    });
});
