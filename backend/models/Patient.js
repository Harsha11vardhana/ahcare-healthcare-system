'use strict';
const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientId       : { type:String, unique:true },
  name            : { type:String, required:true, trim:true },
  age             : { type:Number, required:true, min:0, max:130 },
  gender          : { type:String, enum:['Male','Female','Other'], default:'Male' },
  phone           : { type:String, default:'' },
  aadhaar         : { type:String, default:'' },
  bloodGroup      : { type:String, enum:['A+','A-','B+','B-','O+','O-','AB+','AB-','Unknown'], default:'Unknown' },
  address         : { type:String, default:'' },
  wardType        : { type:String, default:'' },
  bedNumber       : { type:String, default:'' },
  diagnosis       : { type:String, default:'' },
  severity        : { type:String, enum:['Critical','High','Medium','Low',''], default:'' },
  status          : { type:String, enum:['Admitted','Discharged','OPD','Transferred'], default:'Admitted' },
  attendingDoctor : { type:String, default:'' },
  medicalHistory  : { type:String, default:'' },
  allergies       : { type:String, default:'' },
  admittedAt      : { type:Date, default:Date.now },
  dischargedAt    : { type:Date },
  govtScheme      : { type:String, default:'' },
  insuranceAmount : { type:Number, default:0 },
  isEmergency     : { type:Boolean, default:false },
  notes: [{ text:String, by:String, at:{ type:Date, default:Date.now } }]
},{ timestamps:true });

patientSchema.pre('save', async function(next) {
  if (!this.patientId) {
    const last = await this.constructor.findOne({},{},[['createdAt','desc']]);
    let num = 2001;
    if (last?.patientId) { const n=parseInt(last.patientId.replace('P-','')); if(!isNaN(n)) num=n+1; }
    this.patientId = 'P-'+num;
  }
  next();
});
module.exports = mongoose.model('Patient', patientSchema);
