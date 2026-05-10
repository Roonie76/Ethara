const pool = require('./db');
const app  = require('./app');

pool.connect()
  .then(client => {
    client.release();
    console.log('PostgreSQL connected');
    app.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );
  })
  .catch(err => {
    console.error('PostgreSQL connection failed:', err.message);
    process.exit(1);
  });
