require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb } = require('./db/schema');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const dataRoutes = require('./routes/data');
const scoreRoutes = require('./routes/score');
const loanRoutes = require('./routes/loans');
const repaymentRoutes = require('./routes/repayments');
const vouchRoutes = require('./routes/vouch');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payments');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }));
app.use(express.json());

// Initialize database
initDb();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/score', scoreRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/repayments', repaymentRoutes);
app.use('/api/vouch', vouchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'LendX API', timestamp: new Date().toISOString() }));

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 LendX API running on http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
});
