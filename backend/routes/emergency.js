// emergency.js
'use strict';
const router = require('express').Router();
const store  = require('../utils/demoStore');
const { v4:uuid } = require('uuid');

router.get('/', (req, res) => res.json({ success:true, count:store.EMERGENCIES.length, data:store.EMERGENCIES }));

router.post('/', (req, res) => {
  const { type, patient, severity, location, respondedBy } = req.body;
  if (!type) return res.status(400).json({ success:false, message:'type required' });
  const wardMap = { Critical:'ICU', High:'ICU', Medium:'General', Low:'General' };
  const ward = wardMap[severity]||'ICU';
  const free = store.BEDS.filter(b=>b.ward===ward&&b.status==='free');
  const bed  = free.length ? free[0].bedNumber : `${ward.substring(0,3).toUpperCase()}-TBD`;
  if (free.length) { const i = store.BEDS.findIndex(b=>b.bedNumber===bed); if(i!==-1) store.BEDS[i].status='reserved'; }
  const evt = { _id:uuid(), type, patient:patient||'Unknown', patientId:null, severity:severity||'Critical', location:location||'Emergency Block', status:'Active', respondedBy:respondedBy||'Duty Doctor', allocatedBed:bed, time:new Date() };
  store.EMERGENCIES.unshift(evt);
  res.status(201).json({ success:true, data:evt, message:`Emergency logged — ${bed} reserved` });
});

router.patch('/:id/resolve', (req, res) => {
  const i = store.EMERGENCIES.findIndex(e=>e._id===req.params.id);
  if (i===-1) return res.status(404).json({ success:false, message:'Not found' });
  store.EMERGENCIES[i] = { ...store.EMERGENCIES[i], status:'Resolved', resolvedAt:new Date() };
  res.json({ success:true, data:store.EMERGENCIES[i] });
});

module.exports = router;
