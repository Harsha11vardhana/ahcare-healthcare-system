'use strict';
const router = require('express').Router();
const store  = require('../utils/demoStore');
const { v4:uuid } = require('uuid');

let Patient, mongoose;
try { Patient = require('../models/Patient'); mongoose = require('mongoose'); } catch {}
const useDB = () => Patient && mongoose && mongoose.connection.readyState === 1;

/* ── GET ALL ── */
router.get('/', async (req, res) => {
  try {
    const { status, ward, q } = req.query;
    if (useDB()) {
      const f = {};
      if (status) f.status = status;
      if (ward) f.wardType = ward;
      if (q) f.$or = [{ name:new RegExp(q,'i') }, { patientId:new RegExp(q,'i') }, { diagnosis:new RegExp(q,'i') }];
      const pts = await Patient.find(f).sort({ admittedAt:-1 }).limit(200);
      return res.json({ success:true, count:pts.length, data:pts });
    }
    let data = [...store.PATIENTS];
    if (status) data = data.filter(p => p.status === status);
    if (ward)   data = data.filter(p => p.wardType === ward);
    if (q)      data = data.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.patientId.includes(q));
    res.json({ success:true, count:data.length, data });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* ── GET ONE ── */
router.get('/:id', async (req, res) => {
  try {
    if (useDB()) {
      const p = await Patient.findOne({ patientId:req.params.id });
      if (!p) return res.status(404).json({ success:false, message:'Not found' });
      return res.json({ success:true, data:p });
    }
    const p = store.PATIENTS.find(p => p.patientId === req.params.id);
    if (!p) return res.status(404).json({ success:false, message:'Not found' });
    res.json({ success:true, data:p });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* ── CREATE ── */
router.post('/', async (req, res) => {
  try {
    const { name, age, gender, phone, aadhaar, bloodGroup, address, wardType, bedNumber, diagnosis, severity, attendingDoctor, medicalHistory, isEmergency, govtScheme } = req.body;
    if (!name || !age) return res.status(400).json({ success:false, message:'Name and age are required' });

    if (useDB()) {
      const p = await Patient.create({ name, age, gender, phone, aadhaar, bloodGroup, address, wardType, bedNumber, diagnosis, severity, attendingDoctor, medicalHistory, isEmergency, govtScheme });
      return res.status(201).json({ success:true, data:p, message:`Patient registered: ${p.patientId}` });
    }
    // Demo: generate sequential ID
    const nums = store.PATIENTS.map(p => parseInt(p.patientId.replace('P-',''))).filter(n=>!isNaN(n));
    const newId = 'P-' + (Math.max(...nums, 2041) + 1);
    const p = { _id:uuid(), patientId:newId, name, age:parseInt(age), gender:gender||'Male', phone:phone||'', aadhaar:aadhaar||'', bloodGroup:bloodGroup||'Unknown', address:address||'', wardType:wardType||'General', bedNumber:bedNumber||'', diagnosis:diagnosis||'', severity:severity||'Medium', status:'Admitted', attendingDoctor:attendingDoctor||'', medicalHistory:medicalHistory||'', isEmergency:!!isEmergency, govtScheme:govtScheme||'', admittedAt:new Date() };
    store.PATIENTS.unshift(p);
    res.status(201).json({ success:true, data:p, message:`Patient registered: ${newId}` });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* ── UPDATE ── */
router.patch('/:id', async (req, res) => {
  try {
    if (useDB()) {
      const p = await Patient.findOneAndUpdate({ patientId:req.params.id }, req.body, { new:true, runValidators:true });
      if (!p) return res.status(404).json({ success:false, message:'Not found' });
      return res.json({ success:true, data:p });
    }
    const idx = store.PATIENTS.findIndex(p => p.patientId === req.params.id);
    if (idx===-1) return res.status(404).json({ success:false, message:'Not found' });
    store.PATIENTS[idx] = { ...store.PATIENTS[idx], ...req.body };
    res.json({ success:true, data:store.PATIENTS[idx] });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* ── DISCHARGE ── */
router.post('/:id/discharge', async (req, res) => {
  try {
    const upd = { status:'Discharged', dischargedAt:new Date() };
    if (useDB()) {
      const p = await Patient.findOneAndUpdate({ patientId:req.params.id }, upd, { new:true });
      if (!p) return res.status(404).json({ success:false, message:'Not found' });
      return res.json({ success:true, message:`${p.name} discharged`, data:p });
    }
    const idx = store.PATIENTS.findIndex(p => p.patientId === req.params.id);
    if (idx===-1) return res.status(404).json({ success:false, message:'Not found' });
    store.PATIENTS[idx] = { ...store.PATIENTS[idx], ...upd };
    res.json({ success:true, message:`Patient ${req.params.id} discharged` });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

module.exports = router;
