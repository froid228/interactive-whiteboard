const { initDatabase, pool } = require('../src/config/db');

async function main() {
  try {
    await initDatabase();
    console.log('Database schema and seed data are ready');
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
