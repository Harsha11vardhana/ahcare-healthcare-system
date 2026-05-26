'use strict';
const router = require('express').Router();
const store  = require('../utils/demoStore');
const { v4:uuid } = require('uuid');

function calcScore(age, symptoms, priorityLevel) {
  let s = 0;
  if (age >= 70) s += 30; else if (age >= 60) s += 20; else if (age <= 10) s += 25;
  if (/chest|heart|breath|stroke|faint|bleed|severe|acute|cancer/i.test(symptoms)) s += 40;
  else if (/fever|pain|vomit|diarrh|head|rash|swelling/i.test(symptoms)) s += 20;
  else s += 5;
  const lvl = { Urgent:25, High:15, Normal:5, Routine:0 };
  return Math.min(s + (lvl[priorityLevel]||5), 100);
}

router.get('/', (req, res) => {
  const { dept, status, date } = req.query;
  let data = [...store.PREBOOKINGS];
  if (dept)   data = data.filter(b=>b.department===dept);
  if (status) data = data.filter(b=>b.status===status);
  if (date)   data = data.filter(b=>b.preferredDate===date);
  const sorted = data.sort((a,b)=>b.priorityScore-a.priorityScore).map((b,i)=>({...b,queuePosition:i+1}));
  res.json({ success:true, count:sorted.length, data:sorted });
});

router.get('/:id', (req, res) => {
  const b = store.PREBOOKINGS.find(b=>b.bookingId===req.params.id||b._id===req.params.id);
  if (!b) return res.status(404).json({ success:false, message:'Not found' });
  res.json({ success:true, data:b });
});

router.post('/', (req, res) => {
  try {
    const { name, age, gender, phone, aadhaar, department, preferredDate, preferredSlot, priorityLevel, symptoms, address, govtScheme } = req.body;
    if (!name||!age||!phone||!department||!preferredDate||!preferredSlot||!symptoms)
      return res.status(400).json({ success:false, message:'name, age, phone, department, date, slot, symptoms are required' });

    const num   = 5007 + store.PREBOOKINGS.length + Math.floor(Math.random()*10);
    const score = calcScore(parseInt(age)||0, symptoms, priorityLevel||'Normal');
    const level = score>=75?'Urgent':score>=50?'High':score>=25?'Normal':'Routine';

    const booking = {
      _id:uuid(), bookingId:`BK-${num}`, tokenNo:`TKN-${num}`,
      name, age:parseInt(age), gender:gender||'Male', phone, aadhaar:aadhaar||'',
      department, preferredDate, preferredSlot,
      priorityLevel: priorityLevel||level, priorityScore:score,
      symptoms, address:address||'', govtScheme:govtScheme||'',
      status:'Confirmed', queuePosition:1,
      assignedDoctor:'', createdAt:new Date()
    };
    store.PREBOOKINGS.push(booking);
    // Recalculate positions
    store.PREBOOKINGS.sort((a,b)=>b.priorityScore-a.priorityScore).forEach((b,i)=>{b.queuePosition=i+1;});
    const updated = store.PREBOOKINGS.find(b=>b.bookingId===booking.bookingId);
    res.status(201).json({ success:true, data:updated, message:`Booking confirmed: ${booking.bookingId}` });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

router.patch('/:id', (req, res) => {
  const idx = store.PREBOOKINGS.findIndex(b=>b.bookingId===req.params.id||b._id===req.params.id);
  if (idx===-1) return res.status(404).json({ success:false, message:'Not found' });
  store.PREBOOKINGS[idx] = { ...store.PREBOOKINGS[idx], ...req.body };
  res.json({ success:true, data:store.PREBOOKINGS[idx] });
});

router.delete('/:id', (req, res) => {
  const idx = store.PREBOOKINGS.findIndex(b=>b.bookingId===req.params.id||b._id===req.params.id);
  if (idx===-1) return res.status(404).json({ success:false, message:'Not found' });
  store.PREBOOKINGS.splice(idx, 1);
  res.json({ success:true, message:'Booking cancelled' });
});

module.exports = router;
