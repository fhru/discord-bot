const { db } = require('../database/db');

function createScript(data) {
  const stmt = db.prepare(`
    INSERT INTO scripts (name, code, link, price, role_id, is_available, download_link)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    data.name,
    data.code,
    data.link || null,
    data.price,
    data.role_id || null,
    data.is_available !== undefined ? data.is_available : 1,
    data.download_link || null
  );
}

function getScriptById(id) {
  return db.prepare('SELECT * FROM scripts WHERE id = ?').get(id);
}

function getScriptByCode(code) {
  return db.prepare('SELECT * FROM scripts WHERE code = ?').get(code);
}

function getAllScripts() {
  return db.prepare('SELECT * FROM scripts ORDER BY name ASC').all();
}

function getAvailableScripts() {
  return db.prepare('SELECT * FROM scripts WHERE is_available = 1 ORDER BY name ASC').all();
}

function updateScript(id, data) {
  const fields = [];
  const values = [];
  
  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.code !== undefined) {
    fields.push('code = ?');
    values.push(data.code);
  }
  if (data.link !== undefined) {
    fields.push('link = ?');
    values.push(data.link);
  }
  if (data.price !== undefined) {
    fields.push('price = ?');
    values.push(data.price);
  }
  if (data.role_id !== undefined) {
    fields.push('role_id = ?');
    values.push(data.role_id);
  }
  if (data.is_available !== undefined) {
    fields.push('is_available = ?');
    values.push(data.is_available);
  }
  if (data.download_link !== undefined) {
    fields.push('download_link = ?');
    values.push(data.download_link);
  }
  
  if (fields.length === 0) return null;
  
  values.push(id);
  const stmt = db.prepare(`UPDATE scripts SET ${fields.join(', ')} WHERE id = ?`);
  return stmt.run(...values);
}

function deleteScript(id) {
  return db.prepare('DELETE FROM scripts WHERE id = ?').run(id);
}

function toggleAvailability(id) {
  const script = getScriptById(id);
  if (!script) return null;
  
  const newStatus = script.is_available ? 0 : 1;
  return db.prepare('UPDATE scripts SET is_available = ? WHERE id = ?').run(newStatus, id);
}

module.exports = {
  createScript,
  getScriptById,
  getScriptByCode,
  getAllScripts,
  getAvailableScripts,
  updateScript,
  deleteScript,
  toggleAvailability
};
