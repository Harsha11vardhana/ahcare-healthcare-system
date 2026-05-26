// beds.js
'use strict';
const router = require('express').Router();
const store  = require('../utils/demoStore');

router.get('/', (req, res) => {
  const { ward, status } = req.query;
  let data = [...store.BEDS];
  if (ward)   data = data.filter(b => b.ward === ward);
  if (status) data = data.filter(b => b.status === status);
  res.json({ success:true, count:data.length, data });
});

router.get('/summary', (req, res) => {
  const wards = ['ICU','General','Private','Pediatric','Maternity','Oncology'];
  const summary = wards.map(ward => {
    const wb = store.BEDS.filter(b => b.ward === ward);
    return { ward, total:wb.length, free:wb.filter(b=>b.status==='free').length,
      occupied:wb.filter(b=>b.status==='occupied').length,
      reserved:wb.filter(b=>b.status==='reserved').length,
      pct: wb.length ? Math.round(wb.filter(b=>b.status==='occupied').length/wb.length*100):0 };
  });
  const total = store.BEDS.length, free = store.BEDS.filter(b=>b.status==='free').length;
  res.json({ success:true, data:summary, total, free, occupied:total-free });
});

router.patch('/:bedNumber', (req, res) => {
  const { status, patientId, patientName, notes } = req.body;
  const idx = store.BEDS.findIndex(b => b.bedNumber === req.params.bedNumber);
  if (idx===-1) return res.status(404).json({ success:false, message:'Bed not found' });
  store.BEDS[idx] = { ...store.BEDS[idx], status:status||store.BEDS[idx].status, patientId:patientId||null, patientName:patientName||'', notes:notes||'', lastUpdated:new Date() };
  res.json({ success:true, data:store.BEDS[idx] });
});

module.exports = router;
