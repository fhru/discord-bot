const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../data.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function initDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
  console.log('🔸 Database initialized');
}

module.exports = { db, initDatabase };
