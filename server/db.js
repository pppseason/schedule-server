const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 微信云托管持久化目录：/data（云托管会自动挂载持久化存储）
// 本地开发时默认使用当前目录
const dataDir = process.env.DATA_DIR || '/data';
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.join(dataDir, 'schedule.db');
const db = new sqlite3.Database(dbPath);

// 初始化表
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      openid TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      description TEXT,
      remind_at DATETIME,
      remind_sent INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_schedules_start_time ON schedules(start_time)`);

  // 兼容旧表：添加 remind_sent 字段
  db.run(`ALTER TABLE schedules ADD COLUMN remind_sent INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('添加 remind_sent 字段失败:', err.message);
    }
  });
});

// Promise 封装
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = { db, run, get, all };
