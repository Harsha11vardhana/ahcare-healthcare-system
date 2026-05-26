'use strict';
const router = require('express').Router();
const store  = require('../utils/demoStore');
router.get('/', (req, res) => {
  const { type } = req.query;
  let data = store.SCHEMES;
  if (type) data = data.filter(s=>s.type===type);
  res.json({ success:true, count:data.length, data });
});
router.post('/apply', (req, res) => {
  const { schemeName, patientName } = req.body;
  if (!schemeName||!patientName) return res.status(400).json({ success:false, message:'schemeName and patientName required' });
  res.status(201).json({ success:true, refNo:`MND-${Date.now().toString().slice(-7)}`, message:`Application for "${schemeName}" submitted to Mandya District Health Office` });
});
module.exports = router;
