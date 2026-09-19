const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'lendx_secret';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function requireBorrower(req, res, next) {
  if (req.user?.role !== 'borrower') {
    return res.status(403).json({ error: 'Borrower access required' });
  }
  next();
}

module.exports = { authenticateToken, requireAdmin, requireBorrower };
