'use strict';
const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  invoiceNo          : { type:String, unique:true },
  patientId          : { type:String, required:true },
  patientName        : { type:String, default:'' },
  admissionType      : { type:String, enum:['OPD','IPD','Emergency','Day Care'], default:'IPD' },
  doctorFee          : { type:Number, default:0 },
  wardCharges        : { type:Number, default:0 },
  medicineCharges    : { type:Number, default:0 },
  labTests           : { type:Number, default:0 },
  surgeryCharges     : { type:Number, default:0 },
  otherCharges       : { type:Number, default:0 },
  insuranceDeduction : { type:Number, default:0 },
  govtSchemeDeduction: { type:Number, default:0 },
  totalAmount        : { type:Number, default:0 },
  netPayable         : { type:Number, default:0 },
  status             : { type:String, enum:['Pending','Paid','Partial','Waived'], default:'Pending' },
  paymentMode        : { type:String, default:'' },
  paypalTxnId        : { type:String, default:'' },
  paidAt             : { type:Date },
  createdBy          : { type:String, default:'Reception' },
  notes              : { type:String, default:'' }
},{ timestamps:true });

billSchema.pre('save', async function(next) {
  if (!this.invoiceNo) {
    const last = await this.constructor.findOne({},{},[['createdAt','desc']]);
    let num=10001; if(last?.invoiceNo){ const n=parseInt(last.invoiceNo.replace('INV-','')); if(!isNaN(n)) num=n+1; }
    this.invoiceNo='INV-'+num;
  }
  this.totalAmount = (this.doctorFee||0)+(this.wardCharges||0)+(this.medicineCharges||0)+(this.labTests||0)+(this.surgeryCharges||0)+(this.otherCharges||0);
  this.netPayable  = Math.max(0, this.totalAmount-(this.insuranceDeduction||0)-(this.govtSchemeDeduction||0));
  next();
});
const Bill = mongoose.model('Bill', billSchema);

const prebookSchema = new mongoose.Schema({
  bookingId      : { type:String, unique:true },
  tokenNo        : { type:String },
  name           : { type:String, required:true },
  age            : { type:Number, required:true },
  gender         : { type:String, default:'Male' },
  phone          : { type:String, required:true },
  aadhaar        : { type:String, default:'' },
  department     : { type:String, required:true },
  preferredDate  : { type:String, required:true },
  preferredSlot  : { type:String, required:true },
  priorityLevel  : { type:String, enum:['Urgent','High','Normal','Routine'], default:'Normal' },
  priorityScore  : { type:Number, default:0 },
  symptoms       : { type:String, required:true },
  address        : { type:String, default:'' },
  govtScheme     : { type:String, default:'' },
  status         : { type:String, enum:['Confirmed','Pending','Cancelled','Completed'], default:'Pending' },
  queuePosition  : { type:Number, default:1 },
  assignedDoctor : { type:String, default:'' }
},{ timestamps:true });
const Prebooking = mongoose.model('Prebooking', prebookSchema);

module.exports = { Bill, Prebooking };
