'use strict';
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const prebookingRoutes = require('./routes/prebooking');
const patientRoutes = require('./routes/patients');
const billingRoutes  = require('./routes/billing');
const voiceaiRoutes  = require('./routes/voiceai');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Routes / static
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.get('/api/test', (req, res) => {
  res.json({ message: 'API working ✅' });
});
app.use('/api/auth', authRoutes);
app.use('/api/prebooking', prebookingRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/voiceai', voiceaiRoutes);
// ✅ START SERVER AT THE END
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
}).on('error', (err) => {
  console.error('❌ Server error:', err.message);
});