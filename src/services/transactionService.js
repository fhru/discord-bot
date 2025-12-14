const { db } = require('../database/db');

function createTransaction(data) {
  const stmt = db.prepare(`
    INSERT INTO transactions (script_id, discord_id, total_amount, status)
    VALUES (?, ?, ?, ?)
  `);
  return stmt.run(
    data.script_id,
    data.discord_id,
    data.total_amount,
    data.status || 'completed'
  );
}

function getTransactionById(id) {
  return db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
}

function getTransactionsByUser(discordId) {
  return db.prepare(`
    SELECT t.*, s.name as script_name, s.code as script_code
    FROM transactions t
    LEFT JOIN scripts s ON t.script_id = s.id
    WHERE t.discord_id = ?
    ORDER BY t.created_at DESC
  `).all(discordId);
}

function getAllTransactions(limit = 50) {
  return db.prepare(`
    SELECT t.*, s.name as script_name, u.username
    FROM transactions t
    LEFT JOIN scripts s ON t.script_id = s.id
    LEFT JOIN users u ON t.discord_id = u.discord_id
    ORDER BY t.created_at DESC
    LIMIT ?
  `).all(limit);
}

function getTotalSpentByUser(discordId) {
  const result = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) as total
    FROM transactions
    WHERE discord_id = ? AND status = 'completed'
  `).get(discordId);
  return result ? result.total : 0;
}

module.exports = {
  createTransaction,
  getTransactionById,
  getTransactionsByUser,
  getAllTransactions,
  getTotalSpentByUser
};
