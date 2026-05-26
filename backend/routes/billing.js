'use strict';
const router = require('express').Router();
const store  = require('../utils/demoStore');
const { v4:uuid } = require('uuid');

router.get('/', (req, res) => {
  const { patientId, status, q } = req.query;
  let data = [...store.BILLS];
  if (patientId) data = data.filter(b => b.patientId === patientId);
  if (status)    data = data.filter(b => b.status === status);
  if (q)         data = data.filter(b => b.patientId.includes(q) || b.patientName.toLowerCase().includes(q.toLowerCase()) || (b.invoiceNo||'').includes(q));
  res.json({ success:true, count:data.length, data });
});

router.get('/summary', (req, res) => {
  const bills = store.BILLS;
  res.json({ success:true, data: {
    totalRevenue : bills.filter(b=>b.status==='Paid').reduce((s,b)=>s+(b.netPayable||0),0),
    totalPending : bills.filter(b=>b.status==='Pending').reduce((s,b)=>s+(b.netPayable||0),0),
    totalBills   : bills.length,
    paidBills    : bills.filter(b=>b.status==='Paid').length
  }});
});

router.post('/', (req, res) => {
  try {
    const body = req.body;
    if (!body.patientId) return res.status(400).json({ success:false, message:'patientId required' });
    const total = ['doctorFee','wardCharges','medicineCharges','labTests','surgeryCharges','otherCharges'].reduce((s,k)=>s+(parseFloat(body[k])||0),0);
    const net   = Math.max(0, total - (parseFloat(body.insuranceDeduction)||0) - (parseFloat(body.govtSchemeDeduction)||0));
    const invNums = store.BILLS.map(b=>parseInt((b.invoiceNo||'INV-10000').replace('INV-','')));
    const invoiceNo = 'INV-' + (Math.max(...invNums,10000)+1);
    const bill = { _id:uuid(), invoiceNo, ...body, totalAmount:total, netPayable:net, status:'Pending', createdAt:new Date() };
    store.BILLS.unshift(bill);
    res.status(201).json({ success:true, data:bill, message:`Invoice ${invoiceNo} created` });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

router.patch('/:invoiceNo/pay', (req, res) => {
  const { paymentMode } = req.body;
  const idx = store.BILLS.findIndex(b => b.invoiceNo === req.params.invoiceNo);
  if (idx===-1) return res.status(404).json({ success:false, message:'Invoice not found' });
  store.BILLS[idx] = { ...store.BILLS[idx], status:'Paid', paymentMode:paymentMode||'Cash', paidAt:new Date() };
  res.json({ success:true, data:store.BILLS[idx], message:'Payment recorded' });
});

router.post('/ai-estimate', (req, res) => {
  const { wardType, days, surgery } = req.body;
  const rates = { ICU:8000, Private:4500, General:1200, Pediatric:1800, Maternity:2200, Oncology:5000 };
  const rate = rates[wardType]||1200; const d = parseInt(days)||3;
  const ward = rate*d, doc = wardType==='ICU'?5000:wardType==='Private'?3000:1500;
  const surg = surgery==='Yes'?35000:0, med = wardType==='ICU'?12000:6000, lab = 2500;
  const total = ward+doc+surg+med+lab;
  res.json({ success:true, estimate:{ wardCharges:ward, doctorFee:doc, surgeryCharges:surg, medicineCharges:med, labTests:lab, total, insurance:Math.round(total*.2), netEstimate:Math.round(total*.8) }});
});

module.exports = router;
