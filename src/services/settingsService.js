const { db } = require('../database/db');

function getSetting(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

function setSetting(key, value) {
  const existing = db.prepare('SELECT * FROM settings WHERE key = ?').get(key);
  if (existing) {
    return db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(value, key);
  } else {
    return db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(key, value);
  }
}

function getAllSettings() {
  return db.prepare('SELECT * FROM settings ORDER BY key ASC').all();
}

function deleteSetting(key) {
  return db.prepare('DELETE FROM settings WHERE key = ?').run(key);
}

module.exports = {
  getSetting,
  setSetting,
  getAllSettings,
  deleteSetting
};
