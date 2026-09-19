const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../lendx.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('borrower', 'admin')),
      full_name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS borrower_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      business_name TEXT NOT NULL,
      business_type TEXT NOT NULL,
      location TEXT NOT NULL,
      monthly_income_est REAL NOT NULL,
      phone TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS alt_data_signals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      source TEXT NOT NULL CHECK(source IN ('upi', 'utility', 'gst', 'vouch')),
      aggregated_value REAL NOT NULL,
      metadata TEXT,
      collected_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS credit_scores (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      breakdown TEXT NOT NULL,
      calculated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS loans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      tenure_months INTEGER NOT NULL,
      interest_rate REAL NOT NULL,
      purpose TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'under_review', 'approved', 'rejected', 'disbursed', 'active', 'closed')),
      applied_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS repayments (
      id TEXT PRIMARY KEY,
      loan_id TEXT NOT NULL,
      amount REAL NOT NULL,
      due_date TEXT NOT NULL,
      paid_date TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'late', 'missed')),
      FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS vouches (
      id TEXT PRIMARY KEY,
      voucher_id TEXT NOT NULL,
      vouchee_id TEXT NOT NULL,
      note TEXT,
      weight REAL NOT NULL DEFAULT 1.0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (voucher_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (vouchee_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      loan_id TEXT NOT NULL,
      repayment_id TEXT,
      user_id TEXT NOT NULL,
      payment_type TEXT NOT NULL CHECK(payment_type IN ('repayment', 'disbursement')),
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      transaction_id TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'successful', 'failed', 'cancelled')),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Seed admin user if not exists
  const adminExists = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
  if (!adminExists) {
    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');
    const adminId = uuidv4();
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare(`INSERT INTO users (id, email, password_hash, role, full_name) VALUES (?, ?, ?, 'admin', 'LendX Admin')`)
      .run(adminId, 'admin@lendx.com', hash);
    console.log('✅ Admin seeded: admin@lendx.com / admin123');
  }
}

module.exports = { db, initDb };
