const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/schema');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'lendx_secret';

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { email, password, role, full_name } = req.body;

  if (!email || !password || !role || !full_name) {
    return res.status(400).json({ error: 'email, password, role, and full_name are required' });
  }
  if (!['borrower', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'role must be borrower or admin' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const id = uuidv4();
  const password_hash = bcrypt.hashSync(password, 10);

  db.prepare('INSERT INTO users (id, email, password_hash, role, full_name) VALUES (?, ?, ?, ?, ?)')
    .run(id, email, password_hash, role, full_name);

  const token = jwt.sign({ id, email, role, full_name }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id, email, role, full_name } });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name } });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, email, role, full_name, created_at FROM users WHERE id = ?').get(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch {
    res.status(403).json({ error: 'Invalid token' });
  }
});

module.exports = router;
