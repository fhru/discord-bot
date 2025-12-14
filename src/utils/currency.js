const { db } = require('../database/db');

function getDLPrice() {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('dl_price');
  return row ? parseInt(row.value) : 15000;
}

function dlToIDR(dlAmount) {
  const price = getDLPrice();
  return dlAmount * price;
}

function idrToDL(idrAmount) {
  const price = getDLPrice();
  return Math.floor(idrAmount / price);
}

function formatIDR(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

function formatDL(amount) {
  return `${amount} DL`;
}

function censorUsername(username) {
  if (!username || username.length <= 3) return username;
  const visible = Math.ceil(username.length / 3);
  return username.slice(0, visible) + '***' + username.slice(-visible);
}

module.exports = {
  getDLPrice,
  dlToIDR,
  idrToDL,
  formatIDR,
  formatDL,
  censorUsername
};
