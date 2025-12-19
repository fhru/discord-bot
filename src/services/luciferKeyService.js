const scriptService = require('./scriptService');
const userService = require('./userService');

const API_URL = process.env.RUBOT_API_URL;
const API_KEY = process.env.RUBOT_API_KEY;

async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    ...options.headers
  };

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

async function createLuciferKey(discordId, scriptCode, luciferUsername) {
  const result = await apiRequest('/key-create', {
    method: 'POST',
    body: JSON.stringify({
      discord_id: discordId,
      script_code: scriptCode,
      lucifer_username: luciferUsername
    })
  });
  return result;
}

async function getLuciferKeysByUser(discordId) {
  try {
    const keys = await apiRequest(`/key/discord/${discordId}`);
    
    // Enrich with script_name
    return keys.map(k => {
      const script = scriptService.getScriptByCode(k.script_code);
      return {
        ...k,
        script_name: script ? script.name : k.script_code
      };
    });
  } catch (e) {
    if (e.message === 'Key not found') return [];
    throw e;
  }
}

async function getLuciferKeysByScript(scriptCode) {
  try {
    const allKeys = await apiRequest('/key-list');
    const filtered = allKeys.filter(k => k.script_code === scriptCode);
    
    // Enrich with username
    return filtered.map(k => {
      const user = userService.getUserByDiscordId(k.discord_id);
      return {
        ...k,
        username: user ? user.username : null
      };
    });
  } catch (e) {
    console.error('getLuciferKeysByScript error:', e);
    return [];
  }
}

async function getAllLuciferKeys() {
  try {
    const keys = await apiRequest('/key-list');
    
    // Enrich with script_name and username
    return keys.map(k => {
      const script = scriptService.getScriptByCode(k.script_code);
      const user = userService.getUserByDiscordId(k.discord_id);
      return {
        ...k,
        script_name: script ? script.name : k.script_code,
        username: user ? user.username : null
      };
    });
  } catch (e) {
    console.error('getAllLuciferKeys error:', e);
    return [];
  }
}

async function deleteLuciferKey(id) {
  try {
    const result = await apiRequest(`/key/${id}`, { method: 'DELETE' });
    return { changes: result.meta?.changes || 1 };
  } catch (e) {
    if (e.message === 'Key not found') return { changes: 0 };
    throw e;
  }
}

async function countKeysByUser(discordId) {
  try {
    const keys = await apiRequest(`/key/discord/${discordId}`);
    return keys.length;
  } catch (e) {
    if (e.message === 'Key not found') return 0;
    throw e;
  }
}

async function hasKeyForScript(discordId, scriptCode) {
  try {
    const keys = await apiRequest(`/key/discord/${discordId}`);
    return keys.some(k => k.script_code === scriptCode);
  } catch (e) {
    if (e.message === 'Key not found') return false;
    throw e;
  }
}

async function isUsernameUsedForScript(scriptCode, luciferUsername) {
  try {
    const result = await apiRequest('/key-validate', {
      method: 'POST',
      headers: {},
      body: JSON.stringify({
        script_code: scriptCode,
        lucifer_username: luciferUsername
      })
    });
    return result.valid === true;
  } catch (e) {
    return false;
  }
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
