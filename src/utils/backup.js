const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data.db');
const BACKUP_DIR = path.join(__dirname, '../../backups');

function backupDatabase() {
  try {
    // Create backups folder if not exists
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // Check if database exists
    if (!fs.existsSync(DB_PATH)) {
      console.log('🔸 No database to backup yet');
      return;
    }

    // Format: backup_2024-12-14_15-30-00.db
    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '-').slice(0, 19);
    const backupPath = path.join(BACKUP_DIR, `backup_${timestamp}.db`);

    // Copy file database
    fs.copyFileSync(DB_PATH, backupPath);
    
    // Remove old backups (keep last 7)
    cleanOldBackups(7);
    
    console.log(`🔸 Database backed up: ${backupPath}`);
  } catch (error) {
    console.error('🔴 Backup failed:', error.message);
  }
}

function cleanOldBackups(keepCount) {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('backup_') && f.endsWith('.db'))
      .sort()
      .reverse();
    
    files.slice(keepCount).forEach(f => {
      fs.unlinkSync(path.join(BACKUP_DIR, f));
      console.log(`🔸 Removed old backup: ${f}`);
    });
  } catch (error) {
    console.error('🔴 Cleanup failed:', error.message);
  }
}

module.exports = { backupDatabase };
