'use strict';
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'ahcare_dev_secret';

module.exports = function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ success:false, message:'Token required' });
  try {
    req.user = jwt.verify(h.split(' ')[1], SECRET);
    next();
  } catch {
    res.status(401).json({ success:false, message:'Invalid or expired token' });
  }
};
