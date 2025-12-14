const { db } = require('../database/db');

function createLuciferKey(discordId, scriptCode, luciferUsername) {
  const stmt = db.prepare(`
    INSERT INTO lucifer_key (discord_id, script_code, lucifer_username)
    VALUES (?, ?, ?)
  `);
  return stmt.run(discordId, scriptCode, luciferUsername);
}

function getLuciferKeysByUser(discordId) {
  return db.prepare(`
    SELECT lk.*, s.name as script_name
    FROM lucifer_key lk
    LEFT JOIN scripts s ON lk.script_code = s.code
    WHERE lk.discord_id = ?
    ORDER BY lk.created_at DESC
  `).all(discordId);
}

function getLuciferKeysByScript(scriptCode) {
  return db.prepare(`
    SELECT lk.*, u.username
    FROM lucifer_key lk
    LEFT JOIN users u ON lk.discord_id = u.discord_id
    WHERE lk.script_code = ?
    ORDER BY lk.created_at DESC
  `).all(scriptCode);
}

function getAllLuciferKeys() {
  return db.prepare(`
    SELECT lk.*, u.username, s.name as script_name
    FROM lucifer_key lk
    LEFT JOIN users u ON lk.discord_id = u.discord_id
    LEFT JOIN scripts s ON lk.script_code = s.code
    ORDER BY lk.created_at DESC
  `).all();
}

function deleteLuciferKey(id) {
  return db.prepare('DELETE FROM lucifer_key WHERE id = ?').run(id);
}

function countKeysByUser(discordId) {
  const result = db.prepare('SELECT COUNT(*) as count FROM lucifer_key WHERE discord_id = ?').get(discordId);
  return result ? result.count : 0;
}

function hasKeyForScript(discordId, scriptCode) {
  const key = db.prepare('SELECT * FROM lucifer_key WHERE discord_id = ? AND script_code = ?').get(discordId, scriptCode);
  return !!key;
}

function isUsernameUsedForScript(scriptCode, luciferUsername) {
  const key = db.prepare(
    'SELECT * FROM lucifer_key WHERE script_code = ? AND lucifer_username = ? COLLATE NOCASE'
  ).get(scriptCode, luciferUsername);
  return !!key;
}

module.exports = {
  createLuciferKey,
  getLuciferKeysByUser,
  getLuciferKeysByScript,
  getAllLuciferKeys,
  deleteLuciferKey,
  countKeysByUser,
  hasKeyForScript,
  isUsernameUsedForScript
};
