'use strict';
const router = require('express').Router();
const store  = require('../utils/demoStore');

/* ── AI ALLOCATION ── */
const AI_RULES = [
  { test:d => d.emergency==='Yes'||d.severity==='Critical'||d.spo2<90||/cardiac|arrest|stroke|respiratory fail|infarct|cancer/i.test(d.disease||''),
    ward:'ICU',type:'ICU',conf:94,priority:'CRITICAL',score:88, reason:'Emergency or critical severity. Immediate ICU with continuous monitoring, ventilator standby and critical nursing protocol.' },
  { test:d => d.severity==='High'||parseInt(d.age)>=65||/trauma|burn|major surg|oncol/i.test(d.disease||''),
    ward:'Private',type:'PRIVATE',conf:87,priority:'HIGH',score:72, reason:'High severity with age or complexity. Private ward ensures dedicated nursing and faster specialist access.' },
  { test:d => /cancer|oncol|chemo|tumou?r/i.test(d.disease||''),
    ward:'Oncology',type:'ONCOLOGY',conf:93,priority:'HIGH',score:75, reason:'Oncology case detected. Dedicated cancer care ward with oncology nursing team.' },
  { test:d => parseInt(d.age)<=14||/pediatric|child|infant|neonatal/i.test(d.disease||''),
    ward:'Pediatric',type:'PEDIATRIC',conf:91,priority:'MEDIUM',score:60, reason:'Patient age qualifies for paediatric care with age-appropriate facilities.' },
  { test:d => /maternity|delivery|pregnan|obstet/i.test(d.disease||''),
    ward:'Maternity',type:'MATERNITY',conf:93,priority:'MEDIUM',score:65, reason:'Obstetric case. Maternity ward with labour room and neonatal support.' },
  { test:d => d.severity==='Low',
    ward:'General',type:'GENERAL',conf:82,priority:'LOW',score:35, reason:'Low severity. General ward with regular monitoring.' },
  { test:()=>true,
    ward:'General',type:'GENERAL',conf:78,priority:'MEDIUM',score:55, reason:'Moderate severity. General ward, vitals every 4 hrs. Escalate if deterioration.' }
];
const WARD_PREFIX = { ICU:'ICU-', Private:'PRV-', Oncology:'ONC-', Pediatric:'PED-', Maternity:'MAT-', General:'GEN-' };

router.post('/allocate', (req, res) => {
  try {
    const d = req.body;
    if (!d.age) return res.status(400).json({ success:false, message:'Patient data required' });
    const rule = AI_RULES.find(r=>r.test(d));
    const prefix = WARD_PREFIX[rule.ward]||'GEN-';
    const free = store.BEDS.filter(b=>b.ward===rule.ward&&b.status==='free');
    const bed  = free.length ? free[0].bedNumber : `${prefix}TBD`;
    res.json({ success:true, allocation:{ ward:`${rule.ward} Ward`, bed, type:rule.type, confidence:rule.conf, priority:rule.priority, score:rule.score, reason:rule.reason, freeBeds:free.length, estimatedStay:rule.type==='ICU'?'3–7 days':rule.type==='PRIVATE'?'2–5 days':'1–3 days', monitoring:rule.type==='ICU'?'Continuous':rule.type==='PRIVATE'?'Every 2 hrs':'Every 4 hrs' }});
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* ── CHATBOT ── */
const KB = {
  en: {
    bed:      'Current availability at Adichunchanagiri Hospital, Mandya:\n🔴 ICU: 3 free / 30\n🟢 General: 28 free / 100\n🟣 Private: 12 free / 50\n🔵 Paediatric: 14 free / 50\n🩷 Maternity: 7 free / 50\n🟠 Oncology: 6 free / 20',
    emerg:    '🚨 EMERGENCY: Call 108 (free ambulance) or 08234-287800. Come to Reception Block A immediately. ICU is auto-allocated for critical cases.',
    admit:    'Admission process:\n1. Register at Reception Block A\n2. AI ward allocation (10 minutes)\n3. Doctor assessment & confirmation\n4. Nurse assigns bed & bracelet\nBring: Aadhaar card + any previous prescriptions.',
    discharge:'Discharge: Doctor clearance → Nurse checklist → Bill settlement → Digital health summary issued. Typically 2–3 hours.',
    billing:  'Payment accepted: UPI, Credit/Debit Card, Net Banking, Cash, QR Pay.\nInsurance: Ayushman Bharat PMJAY, Arogya Karnataka, Vajpayee Arogyashree, ESIC, CGHS.\nBilling counter at Reception.',
    doctor:   'Today on duty: Dr. M. Suresh (Surgery), Dr. Kavitha Reddy (Medicine), Dr. Anand Murthy (Cardiology), Dr. Priya Nair (Neurology), Dr. Gopal D. (Paediatrics), Dr. Rekha M. (Obstetrics), Dr. Kiran C. (Oncology).',
    govt:     'Schemes for Mandya residents:\n🇮🇳 Ayushman Bharat PMJAY — ₹5 lakh/yr (BPL)\n💻 e-Sanjeevani — Free telemedicine\n🌟 Arogya Karnataka — ₹5L BPL / ₹1.5L APL\n💛 Vajpayee Arogyashree — ₹1.5L APL\nApply at Reception with Aadhaar + ration card.',
    hours:    'Hours:\n🚨 Emergency: 24×7\n🏥 OPD: Mon–Sat 8AM–7PM\n💊 Pharmacy: 7AM–10PM\n🔬 Lab: 6:30AM–8PM\n👁 Visiting: 10AM–12PM & 4PM–6PM',
    cancer:   'Oncology & Cancer Care Department:\n• Surgical Oncology\n• Medical Oncology / Chemotherapy\n• Radiation therapy referrals\n• Cancer screening camps\nDoctor: Dr. Kiran C. (Ext 214)\nAyushman Bharat covers most cancer treatments.',
    prebooking:'Pre-Book your OPD appointment:\n• Select department & preferred time slot\n• Receive token number instantly\n• Priority based on symptoms & age\n• Senior citizens & children get priority\nBook via the Pre-Booking section in the app.',
    dept:     'Our departments: Cardiology, Neurology, Oncology & Cancer, Orthopaedics, Paediatrics, Obstetrics & Gynaecology, Ophthalmology, ENT, Dermatology, Nephrology, Gastroenterology, Pulmonology, Diabetology, Psychiatry, Dental, Physiotherapy, Radiology, Pathology Lab.',
    default:  'Hello! I am your AH Care assistant for Adichunchanagiri Hospital, Mandya.\n\nI can help you with:\n🛏 Bed availability · 💳 Billing\n🏛 Govt schemes · 📋 Admission\n🚨 Emergency · 👨‍⚕️ Doctors\n🩺 Departments · 📅 Pre-booking\n\nType your question in English or ಕನ್ನಡ!'
  },
  kn: {
    bed:      'ಅಡಿಚುಂಚನಗಿರಿ ಆಸ್ಪತ್ರೆ, ಮಂಡ್ಯ — ಪ್ರಸ್ತುತ ಹಾಸಿಗೆ ಲಭ್ಯತೆ:\n🔴 ICU: 3 ಖಾಲಿ / 30\n🟢 ಸಾಮಾನ್ಯ: 28 ಖಾಲಿ / 100\n🟣 ಖಾಸಗಿ: 12 ಖಾಲಿ / 50\n🔵 ಮಕ್ಕಳ: 14 ಖಾಲಿ / 50\n🟠 ಆಂಕಾಲಜಿ: 6 ಖಾಲಿ / 20',
    emerg:    '🚨 ತುರ್ತು: 108 (ಉಚಿತ ಆಂಬ್ಯುಲೆನ್ಸ್) ಅಥವಾ 08234-287800 ಕರೆ ಮಾಡಿ. ತಕ್ಷಣ ರಿಸೆಪ್ಶನ್ ಬ್ಲಾಕ್ A ಗೆ ಬನ್ನಿ.',
    admit:    'ದಾಖಲಾತಿ:\n1. ರಿಸೆಪ್ಶನ್ ಬ್ಲಾಕ್ A ನಲ್ಲಿ ನೋಂದಾಯಿಸಿ\n2. AI ವಾರ್ಡ್ ಹಂಚಿಕೆ (10 ನಿಮಿಷ)\n3. ವೈದ್ಯರ ಪರೀಕ್ಷೆ\n4. ದಾದಿ ಹಾಸಿಗೆ ನಿಯೋಜನೆ\nತನ್ನಿ: ಆಧಾರ್ ಕಾರ್ಡ್ + ಹಿಂದಿನ ಚೀಟಿಗಳು',
    billing:  'ಪಾವತಿ: UPI, ಕಾರ್ಡ್, ನೆಟ್ ಬ್ಯಾಂಕಿಂಗ್, ನಗದು, QR.\nವಿಮೆ: ಆಯುಷ್ಮಾನ್ ಭಾರತ್ PMJAY, ಆರೋಗ್ಯ ಕರ್ನಾಟಕ, ವಾಜಪೇಯಿ ಆರೋಗ್ಯಶ್ರೀ.',
    doctor:   'ಇಂದು ಕರ್ತವ್ಯದಲ್ಲಿ: ಡಾ. ಎಂ. ಸುರೇಶ್, ಡಾ. ಕವಿತಾ ರೆಡ್ಡಿ, ಡಾ. ಆನಂದ ಮೂರ್ತಿ, ಡಾ. ಪ್ರಿಯಾ ನಾಯರ್, ಡಾ. ಗೋಪಾಲ್ ಡಿ., ಡಾ. ರೇಖಾ ಎಂ., ಡಾ. ಕಿರಣ್ ಸಿ.',
    govt:     'ಮಂಡ್ಯ ಜಿಲ್ಲೆಗೆ ಯೋಜನೆಗಳು:\n🇮🇳 ಆಯುಷ್ಮಾನ್ ಭಾರತ್ PMJAY\n💻 e-ಸಂಜೀವಿನಿ\n🌟 ಆರೋಗ್ಯ ಕರ್ನಾಟಕ\n💛 ವಾಜಪೇಯಿ ಆರೋಗ್ಯಶ್ರೀ\nಆಧಾರ್ + ರೇಷನ್ ಕಾರ್ಡ್ ತನ್ನಿ.',
    hours:    'ಸಮಯ:\n🚨 ತುರ್ತು: 24×7\n🏥 OPD: ಸೋಮ–ಶನಿ 8AM–7PM\n💊 ಔಷಧಾಲಯ: 7AM–10PM\n👁 ಭೇಟಿ ಸಮಯ: 10AM–12PM ಮತ್ತು 4PM–6PM',
    cancer:   'ಆಂಕಾಲಜಿ ಮತ್ತು ಕ್ಯಾನ್ಸರ್ ವಿಭಾಗ:\n• ಶಸ್ತ್ರಚಿಕಿತ್ಸಾ ಆಂಕಾಲಜಿ\n• ಕೀಮೋಥೆರಪಿ\n• ಕ್ಯಾನ್ಸರ್ ತಪಾಸಣೆ\nವೈದ್ಯ: ಡಾ. ಕಿರಣ್ ಸಿ. (Ext 214)',
    prebooking:'ಮುಂಗಡ ಬುಕ್ಕಿಂಗ್:\n• ವಿಭಾಗ ಮತ್ತು ಸಮಯ ಆಯ್ಕೆ ಮಾಡಿ\n• ತಕ್ಷಣ ಟೋಕನ್ ಸಂಖ್ಯೆ ಸ್ವೀಕರಿಸಿ\n• ರೋಗಲಕ್ಷಣ ಮತ್ತು ವಯಸ್ಸಿನ ಆಧಾರದ ಮೇಲೆ ಆದ್ಯತೆ\n• ಹಿರಿಯ ನಾಗರಿಕರು ಮತ್ತು ಮಕ್ಕಳಿಗೆ ಆದ್ಯತೆ',
    dept:     'ನಮ್ಮ ವಿಭಾಗಗಳು: ಕಾರ್ಡಿಯಾಲಜಿ, ನ್ಯೂರಾಲಜಿ, ಆಂಕಾಲಜಿ, ಅಸ್ಥಿವಿಭಾಗ, ಮಕ್ಕಳ ವಿಭಾಗ, ಪ್ರಸೂತಿ, ನೇತ್ರ, ENT, ಚರ್ಮ, ವೃಕ್ಕ, ಜಠರ, ಶ್ವಾಸಕೋಶ, ಮಧುಮೇಹ, ಮಾನಸಿಕ ಆರೋಗ್ಯ.',
    default:  'ನಮಸ್ಕಾರ! ನಾನು ಅಡಿಚುಂಚನಗಿರಿ ಆಸ್ಪತ್ರೆ, ಮಂಡ್ಯ AI ಸಹಾಯಕ.\n\nನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ:\n🛏 ಹಾಸಿಗೆ · 💳 ಬಿಲ್\n🏛 ಸರ್ಕಾರಿ ಯೋಜನೆ · 📋 ದಾಖಲಾತಿ\n🚨 ತುರ್ತು · 👨‍⚕️ ವೈದ್ಯರು\n📅 ಮುಂಗಡ ಬುಕ್ಕಿಂಗ்\n\nEnglish ಅಥವಾ ಕನ್ನಡದಲ್ಲಿ ಕೇಳಿ!'
  }
};

router.post('/chat', (req, res) => {
  const { message, lang } = req.body;
  if (!message) return res.status(400).json({ success:false, message:'message required' });
  const m = message.toLowerCase();
  const isKn = /[\u0C80-\u0CFF]/.test(message);
  const l = isKn ? 'kn' : (lang||'en');
  const r = KB[l]||KB.en;

  let reply;
  if (/icu|intensive|critical care/i.test(m))                                    reply = r.bed;
  else if (/bed|available|free|vacant|ಹಾಸಿಗೆ|ಲಭ್ಯ/i.test(m))                  reply = r.bed;
  else if (/emerg|urgent|108|ತುರ್ತು/i.test(m))                                  reply = r.emerg;
  else if (/admit|entry|register|check.?in|ದಾಖಲ/i.test(m))                      reply = r.admit;
  else if (/discharg|go home|ಡಿಸ್ಚಾರ್ಜ್/i.test(m))                             reply = r.discharge||r.default;
  else if (/bill|pay|upi|card|insurance|cost|fee|ಬಿಲ್|ಪಾವತಿ/i.test(m))          reply = r.billing;
  else if (/doctor|physician|specialist|ವೈದ್ಯ|ಡಾಕ್ಟರ್/i.test(m))               reply = r.doctor;
  else if (/govt|scheme|ayushman|arogya|pmjay|ಸರ್ಕಾರ|ಯೋಜನೆ/i.test(m))          reply = r.govt;
  else if (/hour|time|open|close|visit|timing|ಸಮಯ/i.test(m))                    reply = r.hours;
  else if (/cancer|oncol|chemo|tumou?r|ಕ್ಯಾನ್ಸರ್/i.test(m))                   reply = r.cancer;
  else if (/book|prebooking|appointment|token|slot|ಬುಕ್ಕಿಂಗ್|ಅಪಾಯಿಂಟ್ಮೆಂಟ್/i.test(m)) reply = r.prebooking;
  else if (/dept|department|specialit|division|ವಿಭಾಗ/i.test(m))                 reply = r.dept;
  else reply = r.default;

  res.json({ success:true, reply, lang:l });
});

module.exports = router;
