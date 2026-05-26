'use strict';
require('dotenv').config({ path: require('path').join(__dirname,'../.env') });
const mongoose = require('mongoose');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI||'mongodb://localhost:27017/ahcare5');
  console.log('✅ MongoDB connected');

  const User    = require('../models/User');
  const Patient = require('../models/Patient');
  const Bed     = require('../models/Bed');

  await User.deleteMany({}); await Patient.deleteMany({}); await Bed.deleteMany({});
  console.log('🗑️  Cleared');

  await User.create([
    { name:'Admin Staff',       email:'admin@ahcare.in',     password:'admin123',  role:'admin',     dept:'Administration' },
    { name:'Reception Officer', email:'reception@ahcare.in', password:'rec123',    role:'reception', dept:'Front Desk' },
    { name:'Billing Officer',   email:'billing@ahcare.in',   password:'bill123',   role:'billing',   dept:'Finance' },
    { name:'Dr. M. Suresh',     email:'doctor@ahcare.in',    password:'doc123',    role:'doctor',    dept:'General Surgery' },
    { name:'ICU Nurse',         email:'nurse@ahcare.in',     password:'nurse123',  role:'nurse',     dept:'ICU' },
  ]);
  console.log('👥 Users seeded');

  const wardConfig = [
    { ward:'ICU',       prefix:'ICU-', count:30 },
    { ward:'General',   prefix:'GEN-', count:100 },
    { ward:'Private',   prefix:'PRV-', count:50 },
    { ward:'Pediatric', prefix:'PED-', count:50 },
    { ward:'Maternity', prefix:'MAT-', count:50 },
    { ward:'Oncology',  prefix:'ONC-', count:20 },
  ];
  const pool = ['free','occupied','occupied','occupied','reserved','occupied','occupied','cleaning'];
  const beds = [];
  wardConfig.forEach(({ ward, prefix, count }) => {
    for (let i=1;i<=count;i++) beds.push({ bedNumber:`${prefix}${String(i).padStart(2,'0')}`, ward, status:pool[(i*3+Math.floor(i/4))%pool.length] });
  });
  await Bed.insertMany(beds);
  console.log(`🛏️  ${beds.length} beds seeded`);

  await Patient.create([
    { name:'Vikram Hegde',   age:54, gender:'Male',   wardType:'ICU',       bedNumber:'ICU-03', diagnosis:'Cardiac Arrest',        severity:'Critical', attendingDoctor:'Dr. Anand Murthy', isEmergency:true,  govtScheme:'Ayushman Bharat PMJAY' },
    { name:'Savitha Nagaraj',age:38, gender:'Female', wardType:'General',   bedNumber:'GEN-07', diagnosis:'Pneumonia',             severity:'Medium',   attendingDoctor:'Dr. Kavitha Reddy' },
    { name:'Mamatha K.',     age:29, gender:'Female', wardType:'Maternity', bedNumber:'MAT-06', diagnosis:'Normal Delivery',       severity:'Medium',   attendingDoctor:'Dr. Rekha M.' },
    { name:'Rohan Patil',    age:6,  gender:'Male',   wardType:'Pediatric', bedNumber:'PED-04', diagnosis:'Febrile Seizures',      severity:'High',     attendingDoctor:'Dr. Gopal D.' },
    { name:'Shantamma B.',   age:63, gender:'Female', wardType:'Oncology',  bedNumber:'ONC-03', diagnosis:'Breast Cancer Stage II',severity:'High',     attendingDoctor:'Dr. Kiran C.',    govtScheme:'Ayushman Bharat PMJAY' },
  ]);
  console.log('👤 Patients seeded');

  await mongoose.disconnect();
  console.log('\n🎉 Seed complete!\n   Demo logins:\n   admin@ahcare.in / admin123\n   reception@ahcare.in / rec123\n   doctor@ahcare.in / doc123\n');
}
seed().catch(e => { console.error(e); process.exit(1); });
