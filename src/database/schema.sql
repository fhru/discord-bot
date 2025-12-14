-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  discord_id TEXT UNIQUE NOT NULL,
  username TEXT,
  growid TEXT UNIQUE,
  balance INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Settings table (key-value store)
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT
);

-- Scripts table
CREATE TABLE IF NOT EXISTS scripts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  link TEXT,
  price INTEGER NOT NULL,
  role_id TEXT,
  is_available INTEGER DEFAULT 1,
  download_link TEXT
);

-- Lucifer Key table
CREATE TABLE IF NOT EXISTS lucifer_key (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  discord_id TEXT NOT NULL,
  script_code TEXT NOT NULL,
  lucifer_username TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (discord_id) REFERENCES users(discord_id),
  FOREIGN KEY (script_code) REFERENCES scripts(code)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  script_id INTEGER,
  discord_id TEXT NOT NULL,
  total_amount INTEGER NOT NULL,
  status TEXT DEFAULT 'completed',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (script_id) REFERENCES scripts(id),
  FOREIGN KEY (discord_id) REFERENCES users(discord_id)
);

-- Active Panels table (for auto-update)
CREATE TABLE IF NOT EXISTS active_panels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT OR IGNORE INTO settings (key, value) VALUES ('dl_price', '15000');
INSERT OR IGNORE INTO settings (key, value) VALUES ('add_key_price', '5000');
INSERT OR IGNORE INTO settings (key, value) VALUES ('world_name', 'BUYSCRIPT');
INSERT OR IGNORE INTO settings (key, value) VALUES ('world_owner', 'ADMINGT');
