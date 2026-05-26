'use strict';
const router = require('express').Router();
const store  = require('../utils/demoStore');
router.get('/stats', (req, res) => {
  const beds = store.BEDS, patients = store.PATIENTS, bills = store.BILLS;
  const total = beds.length, free = beds.filter(b=>b.status==='free').length;
  const admitted = patients.filter(p=>p.status==='Admitted').length;
  const critical = patients.filter(p=>p.severity==='Critical').length;
  const revenue  = bills.filter(b=>b.status==='Paid').reduce((s,b)=>s+(b.netPayable||0),0);
  const wards    = ['ICU','General','Private','Pediatric','Maternity','Oncology'].map(ward => {
    const wb = beds.filter(b=>b.ward===ward);
    return { ward, total:wb.length, free:wb.filter(b=>b.status==='free').length, pct:wb.length?Math.round(wb.filter(b=>b.status==='occupied').length/wb.length*100):0 };
  });
  res.json({ success:true, data:{ totalBeds:total, freeBeds:free, occupied:total-free, patientsAdmitted:admitted, criticalPatients:critical, totalRevenue:revenue, activeEmergencies:store.EMERGENCIES.filter(e=>e.status==='Active').length, wardSummary:wards, hourlyAdmissions:[3,6,10,8,5,9,12,8,5] }});
});
module.exports = router;
