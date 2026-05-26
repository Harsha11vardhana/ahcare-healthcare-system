'use strict';
const mongoose = require('mongoose');
const bedSchema = new mongoose.Schema({
  bedNumber   : { type:String, required:true, unique:true },
  ward        : { type:String, required:true, enum:['ICU','General','Private','Pediatric','Maternity','Oncology'] },
  status      : { type:String, enum:['free','occupied','reserved','cleaning'], default:'free' },
  patientId   : { type:String, default:null },
  patientName : { type:String, default:'' },
  notes       : { type:String, default:'' },
  lastUpdated : { type:Date, default:Date.now }
},{ timestamps:true });
module.exports = mongoose.model('Bed', bedSchema);
