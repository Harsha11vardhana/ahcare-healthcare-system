'use strict';
const { v4: uuid } = require('uuid');

/* ── BEDS ── */
function genBeds(ward, prefix, count) {
  const pool = ['free','occupied','occupied','occupied','reserved','occupied','occupied','cleaning'];
  return Array.from({ length: count }, (_, i) => ({
    _id: uuid(), bedNumber:`${prefix}${String(i+1).padStart(2,'0')}`,
    ward, status: pool[(i*3+Math.floor(i/4)) % pool.length],
    patientId:null, patientName:'', lastUpdated:new Date()
  }));
}
const BEDS = [
  ...genBeds('ICU','ICU-',30), ...genBeds('General','GEN-',100),
  ...genBeds('Private','PRV-',50), ...genBeds('Pediatric','PED-',50),
  ...genBeds('Maternity','MAT-',50), ...genBeds('Oncology','ONC-',20)
];

/* ── PATIENTS ── */
const PATIENTS = [
  { _id:uuid(), patientId:'P-2041', name:'Vikram Hegde',     age:54, gender:'Male',   wardType:'ICU',       bedNumber:'ICU-03', diagnosis:'Myocardial Infarction', severity:'Critical', status:'Admitted', attendingDoctor:'Dr. Anand Murthy',   admittedAt:new Date('2026-04-20'), phone:'9900110001', bloodGroup:'B+', govtScheme:'Ayushman Bharat PMJAY' },
  { _id:uuid(), patientId:'P-2039', name:'Savitha Nagaraj',  age:38, gender:'Female', wardType:'General',   bedNumber:'GEN-07', diagnosis:'Pneumonia',             severity:'Medium',   status:'Admitted', attendingDoctor:'Dr. Kavitha Reddy',  admittedAt:new Date('2026-04-21'), phone:'9900110002', bloodGroup:'O+', govtScheme:'' },
  { _id:uuid(), patientId:'P-2037', name:'Ramesh Gowda',     age:47, gender:'Male',   wardType:'Private',   bedNumber:'PRV-02', diagnosis:'Appendectomy (Post)',   severity:'Low',      status:'Admitted', attendingDoctor:'Dr. Suresh Kumar',   admittedAt:new Date('2026-04-19'), phone:'9900110003', bloodGroup:'A+', govtScheme:'Arogya Karnataka' },
  { _id:uuid(), patientId:'P-2035', name:'Mamatha K.',       age:29, gender:'Female', wardType:'Maternity', bedNumber:'MAT-06', diagnosis:'Normal Delivery',       severity:'Medium',   status:'Admitted', attendingDoctor:'Dr. Rekha M.',       admittedAt:new Date('2026-04-22'), phone:'9900110004', bloodGroup:'AB+', govtScheme:'' },
  { _id:uuid(), patientId:'P-2033', name:'Rohan Patil',      age:6,  gender:'Male',   wardType:'Pediatric', bedNumber:'PED-04', diagnosis:'Febrile Seizures',      severity:'High',     status:'Admitted', attendingDoctor:'Dr. Gopal D.',       admittedAt:new Date('2026-04-22'), phone:'9900110005', bloodGroup:'O-', govtScheme:'' },
  { _id:uuid(), patientId:'P-2031', name:'Shantamma B.',     age:63, gender:'Female', wardType:'Oncology',  bedNumber:'ONC-03', diagnosis:'Breast Cancer Stage II', severity:'High',     status:'Admitted', attendingDoctor:'Dr. Kiran C.',       admittedAt:new Date('2026-04-18'), phone:'9900110006', bloodGroup:'A-', govtScheme:'Ayushman Bharat PMJAY' },
];

/* ── BILLS ── */
const BILLS = [
  { _id:uuid(), invoiceNo:'INV-10001', patientId:'P-2041', patientName:'Vikram Hegde',     admissionType:'Emergency', doctorFee:5000, wardCharges:8000,  medicineCharges:12000, labTests:3500, surgeryCharges:22000, otherCharges:1300, insuranceDeduction:5000,  govtSchemeDeduction:0,    totalAmount:51800, netPayable:46800, status:'Pending', createdAt:new Date('2026-04-20') },
  { _id:uuid(), invoiceNo:'INV-10002', patientId:'P-2039', patientName:'Savitha Nagaraj',  admissionType:'IPD',       doctorFee:1500, wardCharges:2400,  medicineCharges:4200,  labTests:1800, surgeryCharges:0,     otherCharges:700,  insuranceDeduction:0,     govtSchemeDeduction:0,    totalAmount:10600, netPayable:10600, status:'Paid',    createdAt:new Date('2026-04-21'), paymentMode:'UPI', paidAt:new Date('2026-04-22') },
  { _id:uuid(), invoiceNo:'INV-10003', patientId:'P-2037', patientName:'Ramesh Gowda',     admissionType:'IPD',       doctorFee:3000, wardCharges:4500,  medicineCharges:6200,  labTests:1500, surgeryCharges:14000, otherCharges:500,  insuranceDeduction:3000,  govtSchemeDeduction:2000, totalAmount:29700, netPayable:24700, status:'Partial', createdAt:new Date('2026-04-19') },
  { _id:uuid(), invoiceNo:'INV-10004', patientId:'P-2031', patientName:'Shantamma B.',     admissionType:'IPD',       doctorFee:4000, wardCharges:6000,  medicineCharges:18000, labTests:5000, surgeryCharges:0,     otherCharges:2000, insuranceDeduction:10000, govtSchemeDeduction:5000, totalAmount:35000, netPayable:20000, status:'Pending', createdAt:new Date('2026-04-18') },
];

/* ── SCHEMES ── */
const SCHEMES = [
  { _id:uuid(), name:'Ayushman Bharat PMJAY',  type:'central', coverage:'₹5,00,000/year', eligibility:'BPL / SECC families', documents:['Aadhaar','BPL Ration Card','Income Certificate','PMJAY Card'], contactNo:'14555', active:true },
  { _id:uuid(), name:'e-Sanjeevani',            type:'central', coverage:'Free OPD',       eligibility:'All citizens', documents:['Aadhaar','Mobile Number'], contactNo:'104', active:true },
  { _id:uuid(), name:'Arogya Karnataka',        type:'state',   coverage:'₹5L BPL / ₹1.5L APL', eligibility:'Karnataka residents', documents:['Aadhaar','Ration Card','Income Certificate'], contactNo:'104', active:true },
  { _id:uuid(), name:'Vajpayee Arogyashree',    type:'state',   coverage:'₹1,50,000/year', eligibility:'APL families Karnataka', documents:['Aadhaar','APL Ration Card','Income Cert','Domicile'], contactNo:'1800-425-8330', active:true },
  { _id:uuid(), name:'PMJAY Mandya District',   type:'central', coverage:'₹5,00,000/year', eligibility:'BPL in Mandya', documents:['Aadhaar','PM-JAY Card','BPL Certificate'], contactNo:'08232-222300', active:true },
];

/* ── DOCTORS (comprehensive) ── */
const DOCTORS = [
  { _id:uuid(), name:'Dr. S. Channakeshava',  role:'Dean / Chief Medical Officer',       dept:'Administration',           tier:'dean',       contact:'Ext 100', avail:true  },
  { _id:uuid(), name:'Dr. M. Suresh',         role:'HOD General Surgery',                dept:'General Surgery',          tier:'senior',     contact:'Ext 201', avail:true  },
  { _id:uuid(), name:'Dr. Manjunath B.',       role:'HOD Internal Medicine',              dept:'Internal Medicine',        tier:'senior',     contact:'Ext 202', avail:true  },
  { _id:uuid(), name:'Dr. Kavitha Reddy',     role:'Senior Physician',                   dept:'Respiratory Medicine',     tier:'senior',     contact:'Ext 203', avail:true  },
  { _id:uuid(), name:'Dr. Ravi Shankar',      role:'Senior Orthopaedic Surgeon',         dept:'Orthopaedics',             tier:'senior',     contact:'Ext 204', avail:false },
  { _id:uuid(), name:'Dr. Anand Murthy',      role:'Senior Cardiologist',                dept:'Cardiology',               tier:'specialist', contact:'Ext 210', avail:true  },
  { _id:uuid(), name:'Dr. Priya Nair',        role:'Senior Neurologist',                 dept:'Neurology',                tier:'specialist', contact:'Ext 211', avail:true  },
  { _id:uuid(), name:'Dr. Gopal D.',          role:'Paediatrician',                      dept:'Paediatrics',              tier:'specialist', contact:'Ext 212', avail:true  },
  { _id:uuid(), name:'Dr. Rekha M.',          role:'Obstetrician & Gynaecologist',       dept:'Obstetrics & Gynaecology', tier:'specialist', contact:'Ext 213', avail:true  },
  { _id:uuid(), name:'Dr. Kiran C.',          role:'Surgical Oncologist',                dept:'Oncology & Cancer Care',   tier:'specialist', contact:'Ext 214', avail:true  },
  { _id:uuid(), name:'Dr. Usha Patel',        role:'Ophthalmologist',                    dept:'Ophthalmology',            tier:'specialist', contact:'Ext 215', avail:true  },
  { _id:uuid(), name:'Dr. Harish T.',         role:'ENT Specialist',                     dept:'ENT',                      tier:'specialist', contact:'Ext 216', avail:true  },
  { _id:uuid(), name:'Dr. Nalini S.',         role:'Dermatologist',                      dept:'Dermatology',              tier:'specialist', contact:'Ext 217', avail:false },
  { _id:uuid(), name:'Dr. Prakash V.',        role:'Nephrologist',                       dept:'Nephrology',               tier:'specialist', contact:'Ext 218', avail:true  },
  { _id:uuid(), name:'Dr. Deepa R.',          role:'Endocrinologist',                    dept:'Diabetology & Endocrinology',tier:'specialist',contact:'Ext 219', avail:true  },
  { _id:uuid(), name:'Dr. Venkat G.',         role:'Gastroenterologist',                 dept:'Gastroenterology',         tier:'specialist', contact:'Ext 220', avail:true  },
  { _id:uuid(), name:'Dr. Suma B.',           role:'Pulmonologist',                      dept:'Pulmonology & Chest',      tier:'specialist', contact:'Ext 221', avail:true  },
  { _id:uuid(), name:'Dr. Arun V.',           role:'Psychiatrist',                       dept:'Psychiatry & Mental Health',tier:'specialist',contact:'Ext 222', avail:false },
  { _id:uuid(), name:'Dr. Meena K.',          role:'Junior Resident',                    dept:'Internal Medicine',        tier:'junior',     contact:'Ext 301', avail:true  },
  { _id:uuid(), name:'Dr. Raju N.',           role:'Junior Resident',                    dept:'Emergency',                tier:'junior',     contact:'Ext 302', avail:true  },
  { _id:uuid(), name:'Dr. Pooja R.',          role:'Junior Resident',                    dept:'Paediatrics',              tier:'junior',     contact:'Ext 303', avail:true  },
  { _id:uuid(), name:'Dr. Akash D.',          role:'Intern',                             dept:'Surgery',                  tier:'intern',     contact:'Ext 401', avail:true  },
  { _id:uuid(), name:'Dr. Kavya S.',          role:'Intern',                             dept:'General Medicine',         tier:'intern',     contact:'Ext 402', avail:true  },
];

/* ── EMERGENCIES ── */
const EMERGENCIES = [
  { _id:uuid(), type:'Cardiac Arrest', patient:'Vikram Hegde', patientId:'P-2041', severity:'Critical', location:'Emergency Block A', status:'Active',   respondedBy:'Dr. Anand Murthy', allocatedBed:'ICU-05', time:new Date('2026-04-22T07:30:00') },
  { _id:uuid(), type:'Road Accident',  patient:'Unknown Male', patientId:null,    severity:'High',    location:'Ambulance Bay 2',   status:'Resolved', respondedBy:'Dr. M. Suresh',   allocatedBed:'PRV-03', time:new Date('2026-04-22T05:15:00') },
];

/* ── PRE-BOOKINGS ── */
const PREBOOKINGS = [
  { _id:uuid(), bookingId:'BK-5001', tokenNo:'TKN-5001', name:'Manjunath Gowda',  age:65, gender:'Male',   phone:'9845001001', department:'Cardiology',                 symptoms:'Chest pain and shortness of breath for 2 days', preferredSlot:'08:00-10:00', preferredDate:'2026-04-26', priorityScore:85, priorityLevel:'Urgent',  status:'Confirmed',  queuePosition:1, assignedDoctor:'Dr. Anand Murthy' },
  { _id:uuid(), bookingId:'BK-5002', tokenNo:'TKN-5002', name:'Suma Raghavendra', age:34, gender:'Female', phone:'9845002002', department:'Neurology',                  symptoms:'Recurring migraine and visual disturbances',     preferredSlot:'10:00-12:00', preferredDate:'2026-04-26', priorityScore:62, priorityLevel:'High',    status:'Confirmed',  queuePosition:2, assignedDoctor:'Dr. Priya Nair' },
  { _id:uuid(), bookingId:'BK-5003', tokenNo:'TKN-5003', name:'Raju Patil',       age:8,  gender:'Male',   phone:'9845003003', department:'Paediatrics',                symptoms:'Fever and cold for 3 days',                       preferredSlot:'08:00-10:00', preferredDate:'2026-04-26', priorityScore:65, priorityLevel:'High',    status:'Confirmed',  queuePosition:3, assignedDoctor:'Dr. Gopal D.' },
  { _id:uuid(), bookingId:'BK-5004', tokenNo:'TKN-5004', name:'Kavitha Nagaraj',  age:45, gender:'Female', phone:'9845004004', department:'General Checkup',            symptoms:'Annual health checkup',                           preferredSlot:'14:00-16:00', preferredDate:'2026-04-26', priorityScore:15, priorityLevel:'Routine', status:'Pending',    queuePosition:4 },
  { _id:uuid(), bookingId:'BK-5005', tokenNo:'TKN-5005', name:'Venkatesh Rao',    age:72, gender:'Male',   phone:'9845005005', department:'Orthopaedics',               symptoms:'Knee pain and difficulty walking',                preferredSlot:'10:00-12:00', preferredDate:'2026-04-26', priorityScore:70, priorityLevel:'High',    status:'Confirmed',  queuePosition:5, assignedDoctor:'Dr. Ravi Shankar' },
  { _id:uuid(), bookingId:'BK-5006', tokenNo:'TKN-5006', name:'Geeta Srinivas',   age:52, gender:'Female', phone:'9845006006', department:'Oncology & Cancer Care',     symptoms:'Follow-up after chemotherapy cycle 3',            preferredSlot:'10:00-12:00', preferredDate:'2026-04-27', priorityScore:80, priorityLevel:'Urgent',  status:'Confirmed',  queuePosition:1, assignedDoctor:'Dr. Kiran C.' },
];

/* ── USERS (for auth) ── */
const USERS = [
  { _id:'usr-001', name:'Reception Staff', email:'reception@ahcare.in', password:'rec123',   role:'reception', dept:'Front Desk' },
  { _id:'usr-002', name:'Billing Officer', email:'billing@ahcare.in',   password:'bill123',  role:'billing',   dept:'Finance' },
  { _id:'usr-003', name:'Dr. M. Suresh',   email:'doctor@ahcare.in',    password:'doc123',   role:'doctor',    dept:'Surgery' },
  { _id:'usr-004', name:'Admin',           email:'admin@ahcare.in',     password:'admin123', role:'admin',     dept:'Administration' },
];

module.exports = { BEDS, PATIENTS, BILLS, SCHEMES, DOCTORS, EMERGENCIES, PREBOOKINGS, USERS };
