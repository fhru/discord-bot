const { db } = require('../database/db');
const userService = require('./userService');

function getBalance(discordId) {
  const user = userService.getUserByDiscordId(discordId);
  return user ? user.balance : 0;
}

function addBalance(discordId, amount) {
  const user = userService.getUserByDiscordId(discordId);
  if (!user) return null;
  
  const newBalance = user.balance + amount;
  db.prepare('UPDATE users SET balance = ? WHERE discord_id = ?').run(newBalance, discordId);
  return newBalance;
}

function deductBalance(discordId, amount) {
  const user = userService.getUserByDiscordId(discordId);
  if (!user) return null;
  if (user.balance < amount) return null;
  
  const newBalance = user.balance - amount;
  db.prepare('UPDATE users SET balance = ? WHERE discord_id = ?').run(newBalance, discordId);
  return newBalance;
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
