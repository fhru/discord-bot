const { db } = require('../database/db');

function createUser(discordId, username, growid) {
  const stmt = db.prepare('INSERT INTO users (discord_id, username, growid) VALUES (?, ?, ?)');
  return stmt.run(discordId, username, growid);
}

function getUserByDiscordId(discordId) {
  return db.prepare('SELECT * FROM users WHERE discord_id = ?').get(discordId);
}

function getUserByGrowId(growid) {
  return db.prepare('SELECT * FROM users WHERE growid = ? COLLATE NOCASE').get(growid);
}

function getAllUsers() {
  return db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
}

function updateUser(discordId, data) {
  const fields = [];
  const values = [];
  
  if (data.username !== undefined) {
    fields.push('username = ?');
    values.push(data.username);
  }
  if (data.growid !== undefined) {
    fields.push('growid = ?');
    values.push(data.growid);
  }
  if (data.balance !== undefined) {
    fields.push('balance = ?');
    values.push(data.balance);
  }
  
  if (fields.length === 0) return null;
  
  values.push(discordId);
  const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE discord_id = ?`);
  return stmt.run(...values);
}

function deleteUser(discordId) {
  return db.prepare('DELETE FROM users WHERE discord_id = ?').run(discordId);
}

function isRegistered(discordId) {
  const user = getUserByDiscordId(discordId);
  return !!user;
}

function getTopBalances(limit = 10) {
  return db.prepare('SELECT * FROM users ORDER BY balance DESC LIMIT ?').all(limit);
}

function getTopSpenders(limit = 10) {
  return db.prepare(`
    SELECT u.*, COALESCE(SUM(t.total_amount), 0) as total_spent
    FROM users u
    LEFT JOIN transactions t ON u.discord_id = t.discord_id
    GROUP BY u.discord_id
    ORDER BY total_spent DESC
    LIMIT ?
  `).all(limit);
}

module.exports = {
  createUser,
  getUserByDiscordId,
  getUserByGrowId,
  getAllUsers,
  updateUser,
  deleteUser,
  isRegistered,
  getTopBalances,
  getTopSpenders
};
