// 本機 SQLite 資料庫（使用 Node.js 內建的 node:sqlite，不需要額外編譯原生模組）
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'app.db');

let db;

function getDb() {
  if (db) return db;
  db = new DatabaseSync(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project TEXT NOT NULL,
      task_name TEXT NOT NULL,
      estimated_hours REAL NOT NULL,
      actual_hours REAL,
      status TEXT NOT NULL DEFAULT '進行中',
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

module.exports = { getDb };
