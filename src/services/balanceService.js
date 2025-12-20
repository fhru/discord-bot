const { db } = require('../database/db');
const userService = require('./userService');

function getBalance(discordId) {
  const user = userService.getUserByDiscordId(discordId);
  return user ? user.balance : 0;
}

function addBalance(discordId, amount) {
  // Atomic update to prevent race conditions
  const result = db.prepare(
    'UPDATE users SET balance = balance + ? WHERE discord_id = ? RETURNING balance'
  ).get(amount, discordId);
  return result ? result.balance : null;
}

function deductBalance(discordId, amount) {
  // Atomic deduction with balance check to prevent race conditions
  const result = db.prepare(
    'UPDATE users SET balance = balance - ? WHERE discord_id = ? AND balance >= ? RETURNING balance'
  ).get(amount, discordId, amount);
  return result ? result.balance : null;
}

function setBalance(discordId, amount) {
  return db.prepare('UPDATE users SET balance = ? WHERE discord_id = ?').run(amount, discordId);
}

function hasEnoughBalance(discordId, amount) {
  const balance = getBalance(discordId);
  return balance >= amount;
}

module.exports = {
  getBalance,
  addBalance,
  deductBalance,
  setBalance,
  hasEnoughBalance
};
