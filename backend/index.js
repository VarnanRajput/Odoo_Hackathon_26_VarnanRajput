const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Initialize app
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Import routers
const authRoutes = require('./routes/auth');
const deptRoutes = require('./routes/departments');
const catRoutes = require('./routes/categories');
const empRoutes = require('./routes/employees');
const assetRoutes = require('./routes/assets');
const allocRoutes = require('./routes/allocations');
const bookRoutes = require('./routes/bookings');
const maintRoutes = require('./routes/maintenance');
const auditRoutes = require('./routes/audits');
const logRoutes = require('./routes/logs');
const notifRoutes = require('./routes/notifications');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', deptRoutes);
app.use('/api/categories', catRoutes);
app.use('/api/employees', empRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/allocations', allocRoutes);
app.use('/api/bookings', bookRoutes);
app.use('/api/maintenance', maintRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/notifications', notifRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the AssetFlow ERP System API' });
});

// Global error handler middleware
app.use(errorHandler);

// Connect Database & Start Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to DB (MongoDB or fallback)
  await connectDB();

  // Listen
  app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer();
