'use strict';
const router = require('express').Router();
const store  = require('../utils/demoStore');
router.get('/', (req, res) => {
  const { tier, avail, q } = req.query;
  let data = [...store.DOCTORS];
  if (tier)  data = data.filter(d=>d.tier===tier);
  if (avail) data = data.filter(d=>d.avail===(avail==='true'));
  if (q)     data = data.filter(d=>d.name.toLowerCase().includes(q.toLowerCase())||d.dept.toLowerCase().includes(q.toLowerCase()));
  res.json({ success:true, count:data.length, data });
});
router.get('/on-duty', (req, res) => {
  res.json({ success:true, data:store.DOCTORS.filter(d=>d.avail) });
});
module.exports = router;
