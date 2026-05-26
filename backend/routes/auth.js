'use strict';
const router = require('express').Router();

router.get('/', (req, res) => {
  res.send('Auth API is working 🚀');
});

const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const store  = require('../utils/demoStore');
const auth   = require('../middleware/auth');

const SECRET  = process.env.JWT_SECRET || 'ahcare_dev_secret';
const EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

let User, mongoose;
try { User = require('../models/User'); mongoose = require('mongoose'); } catch {}
const useDB = () => User && mongoose && mongoose.connection.readyState === 1;

function makeToken(u) {
  return jwt.sign({ id:u._id, name:u.name, role:u.role, email:u.email }, SECRET, { expiresIn:EXPIRES });
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success:false, message:'Email and password required' });

    if (useDB()) {
      const u = await User.findOne({ email: email.toLowerCase().trim() });
      if (!u || !(await u.comparePassword(password))) return res.status(401).json({ success:false, message:'Invalid credentials' });
      u.lastLogin = new Date(); await u.save();
      return res.json({ success:true, token:makeToken(u), user:{ id:u._id, name:u.name, role:u.role, email:u.email, dept:u.dept } });
    }

    // Demo fallback
    const demo = store.USERS.find(u => u.email === email.toLowerCase().trim() && u.password === password);
    if (!demo) return res.status(401).json({ success:false, message:'Invalid credentials. Try: admin@ahcare.in / admin123' });
    return res.json({ success:true, token:makeToken(demo), user:{ id:demo._id, name:demo.name, role:demo.role, email:demo.email }, demo:true });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, dept } = req.body;
    if (!name||!email||!password) return res.status(400).json({ success:false, message:'Name, email, password required' });
    if (useDB()) {
      if (await User.findOne({ email:email.toLowerCase().trim() })) return res.status(409).json({ success:false, message:'Email already registered' });
      const u = await User.create({ name, email, password, role:role||'reception', dept:dept||'' });
      return res.status(201).json({ success:true, token:makeToken(u), user:{ id:u._id, name:u.name, role:u.role } });
    }
    return res.status(503).json({ success:false, message:'Registration requires MongoDB. Demo mode active.' });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

router.get('/me', auth, (req, res) => res.json({ success:true, user:req.user }));

module.exports = router;
