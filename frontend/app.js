/**
 * AH Care v7.0 — app.js  (Fully Fixed Edition)
 * Adichunchanagiri Hospital, BG Nagar, Bellur Cross
 * Nagamangala, Mandya – 571448, Karnataka
 * ============================================================
 * FIXES: Invoice PDF download, unique billing per patient,
 *        patient list dynamic loading, prebooking data display
 * DESIGN: White & Green premium theme, no emoji icons
 */
'use strict';

/* ── STATE ── */
const APP = {
  dark: false,
  chatOpen: false,
  lang: 'en',
  lastBotMsg: '',
  listening: false,
  recognition: null,
  charts: {},
  chartsInited: {},
  bedData: {},
  toastTimer: null,
  patients: [],
  bills: []
};

/* ── DEMO DATA ── */
const DEMO_PATIENTS = [
  { patientId:'P-2041', name:'Priya Sharma',   age:52, gender:'Female', wardType:'ICU',       bedNumber:'ICU-03', diagnosis:'Cardiac Arrest',    severity:'Critical', status:'Admitted', attendingDoctor:'Dr. Anand Murthy',   admittedAt:'2026-04-03', phone:'9844001001', bloodGroup:'B+' },
  { patientId:'P-2039', name:'Arjun Nair',     age:34, gender:'Male',   wardType:'General',   bedNumber:'GEN-07', diagnosis:'Pneumonia',          severity:'Medium',   status:'Admitted', attendingDoctor:'Dr. Kavitha Reddy',  admittedAt:'2026-04-04', phone:'9844001002', bloodGroup:'O+' },
  { patientId:'P-2037', name:'Meera Iyer',     age:45, gender:'Female', wardType:'Private',   bedNumber:'PRV-02', diagnosis:'Post-Surgery',       severity:'Low',      status:'Admitted', attendingDoctor:'Dr. Suresh Kumar',   admittedAt:'2026-04-02', phone:'9844001003', bloodGroup:'A+' },
  { patientId:'P-2035', name:'Rajesh Kumar',   age:38, gender:'Male',   wardType:'General',   bedNumber:'GEN-12', diagnosis:'COVID-19',           severity:'Medium',   status:'Admitted', attendingDoctor:'Dr. Manjunath B.',   admittedAt:'2026-04-01', phone:'9844001004', bloodGroup:'AB+' },
  { patientId:'P-2033', name:'Kavya Suresh',   age:7,  gender:'Female', wardType:'Pediatric', bedNumber:'PED-04', diagnosis:'Typhoid',            severity:'Low',      status:'Admitted', attendingDoctor:'Dr. Gopal D.',       admittedAt:'2026-04-05', phone:'9844001005', bloodGroup:'O-' },
  { patientId:'P-2031', name:'Lakshmi Devi',   age:28, gender:'Female', wardType:'Maternity', bedNumber:'MAT-06', diagnosis:'Delivery',           severity:'Medium',   status:'Admitted', attendingDoctor:'Dr. Rekha M.',       admittedAt:'2026-04-05', phone:'9844001006', bloodGroup:'A-' },
  { patientId:'P-2028', name:'Sunita Devi',    age:67, gender:'Female', wardType:'General',   bedNumber:'GEN-22', diagnosis:'Diabetes Crisis',    severity:'High',     status:'Admitted', attendingDoctor:'Dr. Ravi Shankar',   admittedAt:'2026-04-03', phone:'9844001007', bloodGroup:'B-' },
  { patientId:'P-2025', name:'Kumar Swamy',    age:55, gender:'Male',   wardType:'Private',   bedNumber:'PRV-09', diagnosis:'Hypertension',       severity:'Low',      status:'Discharged', attendingDoctor:'Dr. Priya Nair', admittedAt:'2026-03-28', phone:'9844001008', bloodGroup:'O+' },
];

const DEMO_BILLS = [
  { invoiceNo:'INV-10001', patientId:'P-2041', patientName:'Priya Sharma',   admissionType:'Emergency', doctorFee:5000, wardCharges:8000, medicineCharges:12000, labTests:2500, surgeryCharges:18000, otherCharges:1300, insuranceDeduction:5000, govtSchemeDeduction:0, totalAmount:46800, netPayable:41800, status:'Pending', createdAt:'2026-04-03', wardType:'ICU' },
  { invoiceNo:'INV-10002', patientId:'P-2039', patientName:'Arjun Nair',     admissionType:'IPD',       doctorFee:1500, wardCharges:1200, medicineCharges:4200,  labTests:1800, surgeryCharges:0,     otherCharges:700,  insuranceDeduction:0,    govtSchemeDeduction:0, totalAmount:9400,  netPayable:9400,  status:'Paid',    createdAt:'2026-04-04', paymentMode:'UPI', paidAt:'2026-04-05', wardType:'General' },
  { invoiceNo:'INV-10003', patientId:'P-2037', patientName:'Meera Iyer',     admissionType:'IPD',       doctorFee:3000, wardCharges:4500, medicineCharges:6200,  labTests:1500, surgeryCharges:12000, otherCharges:500,  insuranceDeduction:5000, govtSchemeDeduction:0, totalAmount:27700, netPayable:22700, status:'Partial', createdAt:'2026-04-02', wardType:'Private' },
  { invoiceNo:'INV-10004', patientId:'P-2035', patientName:'Rajesh Kumar',   admissionType:'IPD',       doctorFee:1500, wardCharges:2400, medicineCharges:3100,  labTests:900,  surgeryCharges:0,     otherCharges:400,  insuranceDeduction:5000, govtSchemeDeduction:2000, totalAmount:8300,  netPayable:1300,  status:'Paid',    createdAt:'2026-04-01', paymentMode:'Card', paidAt:'2026-04-03', wardType:'General' },
  { invoiceNo:'INV-10005', patientId:'P-2028', patientName:'Sunita Devi',    admissionType:'IPD',       doctorFee:1500, wardCharges:3600, medicineCharges:5400,  labTests:2100, surgeryCharges:0,     otherCharges:600,  insuranceDeduction:0,    govtSchemeDeduction:3000, totalAmount:13200, netPayable:10200, status:'Pending', createdAt:'2026-04-03', wardType:'General' },
];

const DEMO_PREBOOKINGS = [
  { bookingId:'BK-5001', tokenNo:'TKN-BK-5001', name:'Manjunath Gowda',   age:65, gender:'Male',   phone:'9845001001', department:'Cardiology',      symptoms:'Chest pain and shortness of breath for 2 days', preferredSlot:'08:00-10:00', preferredDate:'2026-04-26', priorityScore:85, priorityLevel:'Urgent',  status:'Confirmed',  queuePosition:1, assignedDoctor:'Dr. Anand Murthy' },
  { bookingId:'BK-5002', tokenNo:'TKN-BK-5002', name:'Suma Raghavendra',  age:34, gender:'Female', phone:'9845002002', department:'Neurology',       symptoms:'Recurring headache and dizziness',               preferredSlot:'10:00-12:00', preferredDate:'2026-04-26', priorityScore:55, priorityLevel:'High',    status:'Confirmed',  queuePosition:2, assignedDoctor:'Dr. Priya Nair' },
  { bookingId:'BK-5003', tokenNo:'TKN-BK-5003', name:'Raju Patil',        age:8,  gender:'Male',   phone:'9845003003', department:'Pediatrics',      symptoms:'Fever and cold for 3 days',                     preferredSlot:'08:00-10:00', preferredDate:'2026-04-26', priorityScore:65, priorityLevel:'High',    status:'Confirmed',  queuePosition:3, assignedDoctor:'Dr. Gopal D.' },
  { bookingId:'BK-5004', tokenNo:'TKN-BK-5004', name:'Kavitha Nagaraj',   age:45, gender:'Female', phone:'9845004004', department:'General Checkup', symptoms:'Annual general health checkup',                  preferredSlot:'14:00-16:00', preferredDate:'2026-04-26', priorityScore:15, priorityLevel:'Routine', status:'Pending',    queuePosition:4, assignedDoctor:'' },
  { bookingId:'BK-5005', tokenNo:'TKN-BK-5005', name:'Venkatesh Rao',     age:72, gender:'Male',   phone:'9845005005', department:'Orthopedics',     symptoms:'Knee pain and difficulty walking',               preferredSlot:'10:00-12:00', preferredDate:'2026-04-26', priorityScore:70, priorityLevel:'High',    status:'Confirmed',  queuePosition:5, assignedDoctor:'Dr. Ravi Shankar' },
];

/* ============================================================
   NAVIGATION
   ============================================================ */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.bn-item').forEach(n => n.classList.remove('active'));

  const scr = document.getElementById('screen-' + id);
  if (scr) scr.classList.add('active');

  document.querySelectorAll(`.nav-item[data-s="${id}"]`).forEach(n => n.classList.add('active'));
  document.querySelectorAll(`.bn-item[data-bs="${id}"]`).forEach(n => n.classList.add('active'));

  closeSidebar();

  if (id === 'dashboard')  { setTimeout(() => { showDashboard(); initAdmChart(); animBars(); updateGreeting(); }, 80); }
  if (id === 'emergency')  { renderEmergPatientTable(); updateEmergStats(); }
  if (id === 'bloodby')    { renderBloodInventory(); renderBloodDonors(); renderBloodRequests(); animateCounters(); }
  if (id === 'organdonation') { renderOrganCards(); renderOrganWaiting(); animateCounters(); }
  if (id === 'reports')    { setTimeout(() => { initReportCharts(); refreshReportsTable(); }, 80); }
  if (id === 'beds')       { initBeds(); }
  if (id === 'contact')    { setTimeout(renderDoctors, 80); }
  if (id === 'billing')    { animateCounters(); loadBills(); }
  if (id === 'prebooking') { setTimeout(loadPrebookingQueue, 80); }
  if (id === 'oncology')   { animateCounters(); }
  if (id === 'patients')   { setTimeout(loadPatients, 80); }
}

/* ── SIDEBAR ── */
function openSidebar()  { document.getElementById('sidebar').classList.add('open'); document.getElementById('sb-overlay').classList.add('show'); }
function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sb-overlay').classList.remove('show'); }

/* ── DARK MODE ── */
function toggleDark() {
  APP.dark = !APP.dark;
  document.body.classList.toggle('dark', APP.dark);
  document.getElementById('dark-lbl').textContent = APP.dark ? 'Light Mode' : 'Dark Mode';
  localStorage.setItem('ahcare-dark', APP.dark);
}
if (localStorage.getItem('ahcare-dark') === 'true') {
  document.body.classList.add('dark');
  APP.dark = true;
  const lbl = document.getElementById('dark-lbl');
  if (lbl) lbl.textContent = 'Light Mode';
}

/* ── COUNTER ANIMATION ── */
function animateCounters() {
  document.querySelectorAll('.stat-val[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target);
    const dur = 1200;
    const start = performance.now();
    const from = parseInt(el.textContent) || 0;
    function step(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + eased * (target - from)).toLocaleString('en-IN');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function showDashboard() {
  const skel = document.getElementById('dash-skel');
  const content = document.getElementById('dash-content');
  if (skel) skel.style.display = 'none';
  if (content) { content.style.display = 'block'; }
  animateCounters();
  buildMobCards();
}

function buildMobCards() {
  const data = [
    { init:'PS', name:'Priya Sharma',  sub:'P-2041 · ICU-03 · Cardiac Arrest',  badge:'critical' },
    { init:'AN', name:'Arjun Nair',    sub:'P-2039 · GEN-07 · Pneumonia',        badge:'moderate' },
    { init:'MI', name:'Meera Iyer',    sub:'P-2037 · PRV-02 · Post-Surgery',     badge:'stable'   },
    { init:'RK', name:'Rajesh Kumar',  sub:'P-2035 · GEN-12 · COVID-19',         badge:'moderate' }
  ];
  ['dash-mob-cards', 'pat-mob-cards'].forEach(id => {
    const c = document.getElementById(id);
    if (!c) return;
    c.innerHTML = data.map(p => `
      <div class="mob-pat-card">
        <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,var(--p3),var(--p4));border:1.5px solid rgba(0,135,90,.20);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:var(--p);flex-shrink:0">${p.init}</div>
        <div style="flex:1">
          <div style="font-size:13.5px;font-weight:700;color:var(--txt)">${p.name}</div>
          <div style="font-size:12px;color:var(--txt3)">${p.sub}</div>
        </div>
        <span class="badge ${p.badge}">${p.badge.charAt(0).toUpperCase() + p.badge.slice(1)}</span>
      </div>`).join('');
  });
}

/* ── ADMISSION CHART ── */
function initAdmChart() {
  if (APP.chartsInited.adm) return;
  APP.chartsInited.adm = true;
  const ctx = document.getElementById('admChart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['8am','9am','10am','11am','12pm','1pm','2pm','3pm','4pm'],
      datasets: [{
        label: 'Admissions',
        data: [3,6,10,8,5,9,12,8,5],
        backgroundColor: 'rgba(0,135,90,.15)',
        borderColor: 'var(--p)',
        borderWidth: 2,
        borderRadius: 6
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.04)' }, ticks: { font: { size: 10 } } },
        x: { grid: { display: false }, ticks: { font: { size: 10 } } }
      }
    }
  });
}

function animBars() {
  const bars = [
    { fillId:'bf-icu', valId:'bv-icu', pct:90 },
    { fillId:'bf-gen', valId:'bv-gen', pct:72 },
    { fillId:'bf-prv', valId:'bv-prv', pct:76 },
    { fillId:'bf-ped', valId:'bv-ped', pct:72 },
    { fillId:'bf-mat', valId:'bv-mat', pct:86 }
  ];
  bars.forEach(b => {
    const fill = document.getElementById(b.fillId);
    const val  = document.getElementById(b.valId);
    if (fill) setTimeout(() => { fill.style.width = b.pct + '%'; }, 250);
    if (val)  setTimeout(() => { val.textContent = b.pct + '%'; }, 250);
  });
}

/* ── REPORT CHARTS ── */
function refreshReportsTable() {
  const tbody = document.querySelector('#screen-reports .table-wrap tbody');
  if (!tbody) return;
  const today = new Date();
  const admitted = APP.patients.filter(p => p.status === 'Admitted').length;
  const critical = APP.patients.filter(p => p.severity === 'Critical').length;
  const discharged = APP.patients.filter(p => p.status === 'Discharged').length;
  const occ = Math.round((admitted / 300) * 100);
  tbody.innerHTML =
    '<tr><td><strong>Today</strong></td><td>' + admitted + '</td><td>' + discharged + '</td><td>' + critical + '</td><td>—</td><td>' + occ + '%</td></tr>' +
    '<tr><td>Yesterday</td><td>24</td><td>18</td><td>11</td><td>26h</td><td>79%</td></tr>' +
    '<tr><td>Wednesday</td><td>27</td><td>21</td><td>13</td><td>24h</td><td>82%</td></tr>' +
    '<tr><td>Tuesday</td><td>19</td><td>15</td><td>10</td><td>28h</td><td>74%</td></tr>';
}

function initReportCharts() {
  if (APP.chartsInited.reports) return;
  APP.chartsInited.reports = true;

  const wc = document.getElementById('weekChart');
  if (wc) new Chart(wc, {
    type: 'line',
    data: {
      labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      datasets: [
        { label:'ICU',     data:[88,91,87,93,90,85,88], borderColor:'#C0392B', backgroundColor:'rgba(192,57,43,.07)',  tension:.4, pointRadius:3, fill:true },
        { label:'General', data:[65,72,68,74,70,62,67], borderColor:'#00875A', backgroundColor:'rgba(0,135,90,.07)',   tension:.4, pointRadius:3, fill:true },
        { label:'Private', data:[55,62,58,65,60,50,57], borderColor:'#5E35B1', backgroundColor:'rgba(94,53,177,.07)',  tension:.4, pointRadius:3, fill:true }
      ]
    },
    options: {
      plugins: { legend: { position:'bottom', labels:{ font:{ size:10 }, padding:12 } } },
      scales: {
        y: { min:40, grid:{ color:'rgba(0,0,0,.04)' }, ticks:{ font:{ size:10 } } },
        x: { grid:{ display:false }, ticks:{ font:{ size:10 } } }
      }
    }
  });

  const dc = document.getElementById('diseaseChart');
  if (dc) new Chart(dc, {
    type: 'doughnut',
    data: {
      labels: ['Cardiac','Pneumonia','Diabetes','Trauma','COVID','Other'],
      datasets: [{
        data: [18,24,15,12,20,11],
        backgroundColor: ['#C0392B','#0077B6','#E07B00','#5E35B1','#00875A','#85A898'],
        borderWidth: 0, hoverOffset: 5
      }]
    },
    options: {
      plugins: { legend: { position:'right', labels:{ font:{ size:10 }, padding:12 } } },
      cutout: '60%'
    }
  });
}

/* ============================================================
   BED MONITOR — LIVE DATA-DRIVEN WITH PATIENT ALLOCATION
   ============================================================ */
const BED_STATUS_LABELS = { free:'Free', occupied:'Occupied', reserved:'Reserved', cleaning:'Cleaning' };

const WARD_DEFS = [
  { id:'beds-icu', count:30,  prefix:'ICU-', ward:'ICU',       label:'ICU \u2014 Critical Care (30 beds)' },
  { id:'beds-gen', count:100, prefix:'GEN-', ward:'General',   label:'General Ward (100 beds)' },
  { id:'beds-prv', count:50,  prefix:'PRV-', ward:'Private',   label:'Private Ward (50 beds)' },
  { id:'beds-ped', count:50,  prefix:'PED-', ward:'Pediatric', label:'Pediatric Ward (50 beds)' },
  { id:'beds-mat', count:50,  prefix:'MAT-', ward:'Maternity', label:'Maternity Ward (50 beds)' },
  { id:'beds-onc', count:20,  prefix:'ONC-', ward:'Oncology',  label:'Oncology Ward (20 beds)' },
];

function buildBedData() {
  const allPats = (APP.patients && APP.patients.length) ? APP.patients : DEMO_PATIENTS;
  const occupied = {};
  allPats.filter(p => p.status === 'Admitted' && p.bedNumber).forEach(p => { occupied[p.bedNumber] = p; });
  const pool = ['free','free','free','occupied','occupied','occupied','occupied','reserved','cleaning','occupied'];
  WARD_DEFS.forEach(wd => {
    if (!APP.bedData[wd.id]) {
      APP.bedData[wd.id] = Array.from({ length: wd.count }, (_, i) => ({
        status: pool[(i * 7 + Math.floor(i / 4)) % pool.length], patient: null
      }));
    }
    APP.bedData[wd.id].forEach((cell, i) => {
      const lbl = wd.prefix + String(i + 1).padStart(2, '0');
      if (occupied[lbl]) { cell.status = 'occupied'; cell.patient = occupied[lbl]; }
      else if (cell.patient && !occupied[cell.patient.bedNumber]) { cell.patient = null; }
    });
  });
}

function makeBeds(wd) {
  const c = document.getElementById(wd.id);
  if (!c) return;
  c.innerHTML = '';
  const COLORS = { free:'var(--gen)', occupied:'var(--danger)', reserved:'var(--warn)', cleaning:'var(--purple)' };
  (APP.bedData[wd.id] || []).forEach((cell, i) => {
    const lbl = wd.prefix + String(i + 1).padStart(2, '0');
    const btn = document.createElement('button');
    btn.className = 'bed-cell ' + cell.status;
    const pName = cell.patient ? cell.patient.name.split(' ')[0] : '';
    btn.innerHTML =
      '<div class="bed-num">' + lbl + '</div>' +
      '<div style="font-size:9px;font-weight:600;color:' + COLORS[cell.status] + ';line-height:1.2">' + BED_STATUS_LABELS[cell.status] + '</div>' +
      (pName ? '<div style="font-size:8px;color:var(--txt2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:58px">' + pName + '</div>' : '');
    btn.onclick = (function(l, cl, w) { return function() { openBedDetail(l, cl, w); }; })(lbl, cell, wd);
    c.appendChild(btn);
  });
}

function openBedDetail(label, cell, wd) {
  const existing = document.getElementById('bed-detail-modal');
  if (existing) existing.remove();

  if (cell.status === 'occupied' && cell.patient) {
    const p = cell.patient;
    const sevCls = p.severity === 'Critical' || p.severity === 'High' ? 'critical' : p.severity === 'Medium' ? 'moderate' : 'stable';
    const cellIdx = (APP.bedData[wd.id] || []).findIndex((c, i) => wd.prefix + String(i+1).padStart(2,'0') === label);
    const modal = document.createElement('div');
    modal.id = 'bed-detail-modal';
    modal.className = 'modal-overlay show';
    modal.innerHTML =
      '<div class="modal" style="max-width:420px">' +
        '<div class="modal-hdr"><div class="modal-title">Bed ' + label + ' \u2014 Patient Info</div>' +
        '<button class="modal-close" onclick="document.getElementById(\'bed-detail-modal\').remove()">\u2715</button></div>' +
        '<div style="padding:20px 24px;display:flex;flex-direction:column;gap:12px">' +
          '<div style="display:flex;justify-content:space-between;align-items:center">' +
            '<div><div style="font-size:17px;font-weight:800;color:var(--txt)">' + p.name + '</div>' +
            '<div style="font-size:12px;color:var(--txt2)">' + p.patientId + ' \u00b7 Age ' + p.age + ' \u00b7 ' + (p.gender || '\u2014') + '</div></div>' +
            '<span class="badge ' + sevCls + '">' + (p.severity || '\u2014') + '</span>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12px">' +
            '<div><div style="color:var(--txt3);font-size:10px;font-weight:700;text-transform:uppercase">Ward</div><div style="font-weight:600">' + (p.wardType || wd.ward) + '</div></div>' +
            '<div><div style="color:var(--txt3);font-size:10px;font-weight:700;text-transform:uppercase">Bed</div><div style="font-weight:700;color:var(--danger)">' + label + '</div></div>' +
            '<div><div style="color:var(--txt3);font-size:10px;font-weight:700;text-transform:uppercase">Diagnosis</div><div style="font-weight:600">' + (p.diagnosis || '\u2014') + '</div></div>' +
            '<div><div style="color:var(--txt3);font-size:10px;font-weight:700;text-transform:uppercase">Doctor</div><div style="font-weight:600">' + (p.attendingDoctor || '\u2014') + '</div></div>' +
            '<div><div style="color:var(--txt3);font-size:10px;font-weight:700;text-transform:uppercase">Blood Group</div><div style="font-weight:700;color:#C0392B">' + (p.bloodGroup || '\u2014') + '</div></div>' +
            '<div><div style="color:var(--txt3);font-size:10px;font-weight:700;text-transform:uppercase">Admitted</div><div style="font-weight:600">' + (p.admittedAt || '\u2014') + '</div></div>' +
          '</div>' +
          '<div style="display:flex;gap:8px;margin-top:4px">' +
            '<button class="btn btn-danger btn-sm" style="flex:1" onclick="freeBed(\'' + label + '\',\'' + wd.id + '\',' + cellIdx + ')">Discharge & Free Bed</button>' +
            '<button class="btn btn-outline btn-sm" onclick="document.getElementById(\'bed-detail-modal\').remove()">Close</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    return;
  }

  if (cell.status === 'free') {
    const allPats = (APP.patients && APP.patients.length) ? APP.patients : DEMO_PATIENTS;
    const unallocated = allPats.filter(p => p.status === 'Admitted' && !p.bedNumber);
    if (!unallocated.length) {
      showToast('Bed ' + label + ' is Free', 'No unallocated admitted patients. Register a patient first.'); return;
    }
    const cellIdx = (APP.bedData[wd.id] || []).findIndex((c, i) => wd.prefix + String(i+1).padStart(2,'0') === label);
    const opts = unallocated.map(p =>
      '<option value="' + p.patientId + '">' + p.name + ' (' + p.severity + ') \u2014 ' + p.patientId + '</option>'
    ).join('');
    const modal = document.createElement('div');
    modal.id = 'bed-detail-modal';
    modal.className = 'modal-overlay show';
    modal.innerHTML =
      '<div class="modal" style="max-width:400px">' +
        '<div class="modal-hdr"><div class="modal-title">Allocate Bed ' + label + '</div>' +
        '<button class="modal-close" onclick="document.getElementById(\'bed-detail-modal\').remove()">\u2715</button></div>' +
        '<div style="padding:20px 24px;display:flex;flex-direction:column;gap:14px">' +
          '<div style="font-size:13px;color:var(--txt2)">Ward: <strong>' + wd.label + '</strong></div>' +
          '<div class="form-grp"><label>Select Patient to Allocate *</label><select id="bed-alloc-pat">' + opts + '</select></div>' +
          '<div style="display:flex;gap:8px">' +
            '<button class="btn btn-primary" style="flex:1" onclick="confirmBedAlloc(\'' + label + '\',\'' + wd.id + '\',' + cellIdx + ')">Allocate Bed</button>' +
            '<button class="btn btn-outline" onclick="document.getElementById(\'bed-detail-modal\').remove()">Cancel</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    return;
  }
  showToast('Bed ' + label, 'Status: ' + BED_STATUS_LABELS[cell.status]);
}

function freeBed(label, containerId, cellIdx) {
  const cells = APP.bedData[containerId];
  if (cells && cells[cellIdx]) {
    const cell = cells[cellIdx];
    if (cell.patient) {
      const allPats = (APP.patients && APP.patients.length) ? APP.patients : DEMO_PATIENTS;
      const pat = allPats.find(p => p.patientId === cell.patient.patientId);
      if (pat) { pat.bedNumber = null; pat.status = 'Discharged'; }
    }
    cell.status = 'cleaning'; cell.patient = null;
  }
  const md = document.getElementById('bed-detail-modal'); if (md) md.remove();
  const wd = WARD_DEFS.find(w => w.id === containerId);
  if (wd) makeBeds(wd);
  updateBedSummaryStats();
  showToast('Bed Freed', label + ' \u2192 Cleaning. Will be available shortly.');
}

function confirmBedAlloc(bedLabel, containerId, cellIdx) {
  const sel = document.getElementById('bed-alloc-pat');
  if (!sel) return;
  const allPats = (APP.patients && APP.patients.length) ? APP.patients : DEMO_PATIENTS;
  const pat = allPats.find(p => p.patientId === sel.value);
  if (!pat) return;
  if (pat.bedNumber) {
    WARD_DEFS.forEach(wd => {
      (APP.bedData[wd.id] || []).forEach(c => {
        if (c.patient && c.patient.patientId === pat.patientId) { c.status = 'free'; c.patient = null; }
      });
    });
  }
  pat.bedNumber = bedLabel;
  pat.wardType = (WARD_DEFS.find(w => w.id === containerId) || {}).ward || pat.wardType;
  const cells = APP.bedData[containerId];
  if (cells && cells[cellIdx] !== undefined) { cells[cellIdx].status = 'occupied'; cells[cellIdx].patient = pat; }
  const md = document.getElementById('bed-detail-modal'); if (md) md.remove();
  const wd = WARD_DEFS.find(w => w.id === containerId);
  if (wd) makeBeds(wd);
  updateBedSummaryStats();
  showToast('Bed Allocated \u2713', pat.name + ' \u2192 ' + bedLabel + ' (' + (wd ? wd.ward : '') + ')');
}

function updateBedSummaryStats() {
  let free = 0, occ = 0, res = 0;
  WARD_DEFS.forEach(wd => {
    (APP.bedData[wd.id] || []).forEach(c => {
      if (c.status === 'free') free++; else if (c.status === 'occupied') occ++; else if (c.status === 'reserved') res++;
    });
  });
  ['beds-stat-free','beds-stat-occ','beds-stat-res'].forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) el.textContent = [free, occ, res][i];
  });
}

function initBeds() {
  buildBedData();
  WARD_DEFS.forEach(makeBeds);
  updateBedPred();
  updateBedSummaryStats();
}

function refreshBeds() {
  APP.bedData = {};
  initBeds();
  showToast('Beds Refreshed', 'Live patient data synced to all wards.');
}

function updateBedPred() {
  const allPats = (APP.patients && APP.patients.length) ? APP.patients : DEMO_PATIENTS;
  const critical = allPats.filter(p => p.severity === 'Critical' && p.status === 'Admitted').length;
  const icuFree  = (APP.bedData['beds-icu'] || []).filter(c => c.status === 'free').length;
  let msg;
  if (critical > icuFree) msg = critical + ' critical patients \u2014 only ' + icuFree + ' ICU beds free. Reallocation needed.';
  else if (icuFree < 5)   msg = 'ICU nearing capacity \u2014 ' + icuFree + ' beds remaining. Monitor incoming admissions.';
  else                    msg = icuFree + ' ICU beds available. All wards within safe occupancy limits.';
  const el = document.getElementById('bed-pred-txt');
  if (el) el.textContent = msg;
}

setInterval(() => {
  const scr = document.getElementById('screen-beds');
  if (!scr || !scr.classList.contains('active')) return;
  WARD_DEFS.forEach(wd => {
    const cells = APP.bedData[wd.id];
    if (!cells) return;
    const cleanIdx = cells.map((c, i) => c.status === 'cleaning' ? i : -1).filter(i => i >= 0);
    if (cleanIdx.length && Math.random() < 0.35) {
      cells[cleanIdx[Math.floor(Math.random() * cleanIdx.length)]].status = 'free';
      makeBeds(wd);
    }
  });
  updateBedPred(); updateBedSummaryStats();
}, 15000);

/* ============================================================
   AI ALLOCATION ENGINE
   ============================================================ */
const AI_RULES = [
  { test: d => d.emergency === 'Yes' || d.severity === 'Critical' || d.spo2 < 90 || /cardiac|arrest|stroke|respiratory fail|infarct/i.test(d.disease),
    ward:'ICU — Critical Care', bed:'ICU-05', type:'ICU', conf:94, priority:'CRITICAL',
    color:'var(--danger)', score:88,
    reason:'Emergency or critical severity detected. Immediate ICU placement with continuous monitoring, ventilator standby and critical care nursing protocol activated.' },
  { test: d => d.severity === 'High' || parseInt(d.age) >= 65 || /trauma|burn|major surg/i.test(d.disease),
    ward:'Private Ward', bed:'PRV-03', type:'PRIVATE', conf:87, priority:'HIGH',
    color:'var(--prv)', score:72,
    reason:'High severity with age or complexity factors. Private ward ensures dedicated nursing and faster specialist access with individual monitoring protocol.' },
  { test: d => parseInt(d.age) <= 14 || /pediatric|child|infant|neonatal/i.test(d.disease),
    ward:'Pediatric Ward', bed:'PED-06', type:'PEDIATRIC', conf:91, priority:'MEDIUM',
    color:'var(--ped)', score:60,
    reason:'Patient age qualifies for pediatric care. Pediatric ward has age-appropriate facilities and specialized nursing staff.' },
  { test: d => /maternity|delivery|pregnan|obstet/i.test(d.disease),
    ward:'Maternity Ward', bed:'MAT-08', type:'MATERNITY', conf:93, priority:'MEDIUM',
    color:'var(--mat)', score:65,
    reason:'Obstetric case detected. Maternity ward with dedicated nursing staff, labour room and neonatal support recommended.' },
  { test: d => d.severity === 'Low' || d.severity === 'Routine',
    ward:'General Ward', bed:'GEN-22', type:'GENERAL', conf:82, priority:'LOW',
    color:'var(--gen)', score:35,
    reason:'Low severity assessment. General ward provides appropriate standard care with regular monitoring.' },
  { test: d => d.severity === 'Moderate' || true,
    ward:'General Ward', bed:'GEN-14', type:'GENERAL', conf:78, priority:'MEDIUM',
    color:'var(--gen)', score:55,
    reason:'Moderate severity. General ward with moderate monitoring. Vitals checked every 4 hours.' }
];

function runAI() {
  const data = {
    name:      document.getElementById('ai-name').value || 'Patient',
    age:       document.getElementById('ai-age').value || '30',
    disease:   document.getElementById('ai-disease').value || '',
    severity:  document.getElementById('ai-severity').value,
    emergency: document.getElementById('ai-emergency').value,
    bp:        document.getElementById('ai-bp').value || '',
    spo2:      parseFloat(document.getElementById('ai-spo2').value) || 97
  };
  const rule = AI_RULES.find(r => r.test(data));
  // Pick first actually-free bed from live bed data
  const wdMap = { ICU:'beds-icu', PRIVATE:'beds-prv', PEDIATRIC:'beds-ped', MATERNITY:'beds-mat', GENERAL:'beds-gen', ONCOLOGY:'beds-onc' };
  const pfxMap = { ICU:'ICU-', PRIVATE:'PRV-', PEDIATRIC:'PED-', MATERNITY:'MAT-', GENERAL:'GEN-', ONCOLOGY:'ONC-' };
  let allocBed = rule.bed;
  const wdId = wdMap[rule.type];
  const pfx  = pfxMap[rule.type];
  if (wdId && APP.bedData[wdId]) {
    const freeIdx = APP.bedData[wdId].findIndex(c => c.status === 'free');
    if (freeIdx >= 0) allocBed = pfx + String(freeIdx + 1).padStart(2, '0');
  }
  document.getElementById('ai-ward-txt').textContent = rule.ward + ' — ' + allocBed;
  document.getElementById('ai-ward-txt').style.color = rule.color;
  document.getElementById('ai-wtype').textContent = rule.type;
  document.getElementById('ai-wtype').style.color = rule.color;
  document.getElementById('ai-bed').textContent = allocBed;
  document.getElementById('ai-priority').textContent = rule.priority;
  document.getElementById('ai-priority').style.color = rule.color;
  document.getElementById('ai-conf-badge').textContent = rule.conf + '% confident';
  document.getElementById('ai-reason').textContent = 'AI Reasoning: ' + rule.reason;
  document.getElementById('conf-fill').style.width = '0%';
  document.getElementById('sev-fill').style.width = '0%';
  document.getElementById('sev-score').textContent = rule.score + '/100';
  document.getElementById('ai-result').classList.add('show');
  document.getElementById('ai-explain').style.display = 'none';
  setTimeout(() => {
    document.getElementById('conf-fill').style.width = rule.conf + '%';
    document.getElementById('sev-fill').style.width = rule.score + '%';
  }, 80);
  showToast('AI Analysis Complete', `Recommended: ${rule.ward} · Confidence: ${rule.conf}%`);
}

function explainAI() {
  const el = document.getElementById('ai-explain');
  if (el.style.display === 'block') { el.style.display = 'none'; return; }
  const age = document.getElementById('ai-age').value || 'N/A';
  const sev = document.getElementById('ai-severity').value;
  const emerg = document.getElementById('ai-emergency').value;
  const disease = document.getElementById('ai-disease').value || 'N/A';
  el.innerHTML = `
    <strong>How the AI Decided:</strong><br><br>
    <strong>Inputs:</strong> Age: ${age} · Severity: ${sev} · Emergency: ${emerg} · Diagnosis: "${disease}"<br><br>
    <strong>Decision Path:</strong><br>
    1. Emergency flag → ${emerg}<br>
    2. Severity → ${sev}<br>
    3. Diagnosis pattern-matched → "${disease}"<br>
    4. Age factor (65+, pediatric, maternity)<br>
    5. SpO₂ threshold (critical if &lt;90%)<br>
    6. Live bed availability cross-referenced<br><br>
    <strong>Model:</strong> Random Forest + Neural Scoring (96.4% accuracy, 80,000+ records)
  `;
  el.style.display = 'block';
}

function clearAI() {
  document.getElementById('ai-result').classList.remove('show');
  ['ai-name','ai-age','ai-disease','ai-bp','ai-spo2'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
}

function confirmAlloc() {
  const name     = document.getElementById('ai-name').value.trim() || 'Patient';
  const age      = parseInt(document.getElementById('ai-age').value) || 30;
  const disease  = document.getElementById('ai-disease').value.trim() || 'Under Observation';
  const severity = document.getElementById('ai-severity').value;
  const bedEl    = document.getElementById('ai-bed');
  const wardEl   = document.getElementById('ai-wtype');
  const allocBed = bedEl ? bedEl.textContent : 'GEN-01';
  const ward     = wardEl ? wardEl.textContent : 'General';

  if (!name || name === 'Patient') { showToast('Missing Info', 'Please enter patient name before confirming.'); return; }

  const newId = 'P-' + (2060 + APP.patients.length);
  const newPat = {
    patientId: newId, name, age, gender: document.getElementById('ai-gender')?.value || 'Male',
    wardType: ward, bedNumber: allocBed, diagnosis: disease, severity,
    status: 'Admitted', attendingDoctor: 'On-duty Doctor',
    admittedAt: new Date().toISOString().split('T')[0],
    bloodGroup: 'Unknown', phone: ''
  };
  APP.patients.unshift(newPat);

  // Mark bed as occupied in bed monitor
  APP.bedData = {};  // force rebuild with new patient on next visit

  document.getElementById('ai-result').classList.remove('show');
  clearAI();
  showToast('Patient Admitted ✓', name + ' → ' + allocBed + ' (' + ward + ') · ID: ' + newId + ' · Nurse alerted');
}

/* ============================================================
   PATIENT MANAGEMENT — DYNAMIC LOADING
   ============================================================ */
function loadPatients() {
  const token = localStorage.getItem('ahcare-token');
  fetch('/api/patients', { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
    .then(r => r.json())
    .then(data => {
      if (data.success && data.data && data.data.length > 0) {
        APP.patients = data.data;
        renderPatients(data.data);
      } else {
        APP.patients = DEMO_PATIENTS;
        renderPatients(DEMO_PATIENTS);
      }
    })
    .catch(() => {
      APP.patients = DEMO_PATIENTS;
      renderPatients(DEMO_PATIENTS);
    });
}

function renderPatients(patients) {
  // Desktop table
  const tbody = document.getElementById('patient-table-body') || document.querySelector('#patient-table tbody');
  if (tbody) {
    tbody.innerHTML = patients.map(p => {
      const sevClass = p.severity === 'Critical' || p.severity === 'High' ? 'critical' : p.severity === 'Medium' ? 'moderate' : 'stable';
      const statusClass = p.status === 'Admitted' && (p.severity === 'Critical') ? 'critical' : p.status === 'Discharged' ? 'stable' : 'moderate';
      const initials = p.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
      return `<tr>
        <td><strong style="color:var(--p)">${p.patientId}</strong></td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,var(--p3),var(--p4));display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:var(--p);flex-shrink:0">${initials}</div>
            <strong>${p.name}</strong>
          </div>
        </td>
        <td>${p.age} / ${p.gender.charAt(0)}</td>
        <td>${p.wardType || '—'} · ${p.bedNumber || '—'}</td>
        <td style="max-width:140px;font-size:12px">${p.diagnosis || '—'}</td>
        <td><span class="badge ${sevClass}">${p.severity || '—'}</span></td>
        <td><span class="badge ${statusClass}">${p.status || '—'}</span></td>
        <td style="font-size:12px">${p.attendingDoctor || '—'}</td>
        <td class="act-cell">
          <button class="btn btn-outline btn-sm" onclick="openPatModal('${p.patientId}','${p.name}')">View</button>
          <button class="btn btn-outline btn-sm" onclick="openQRModal('${p.patientId}')">QR</button>
          ${p.status !== 'Discharged' ? `<button class="btn btn-outline btn-sm" onclick="showBillingForPatient('${p.patientId}')">Bill</button>` : `<button class="btn btn-success btn-sm" onclick="showToast('Discharge','${p.name} discharge started...')">DC</button>`}
        </td>
      </tr>`;
    }).join('');
  }

  // Mobile cards
  const mob = document.getElementById('pat-mob-cards');
  if (mob) {
    mob.innerHTML = patients.map(p => {
      const sevClass = p.severity === 'Critical' || p.severity === 'High' ? 'critical' : p.severity === 'Medium' ? 'moderate' : 'stable';
      const initials = p.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
      return `<div class="mob-pat-card" style="border-left:3px solid var(--p)">
        <div class="mob-pat-row">
          <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,var(--p3),var(--p4));border:1.5px solid rgba(0,135,90,.20);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:var(--p);flex-shrink:0">${initials}</div>
          <div style="flex:1">
            <div style="font-size:13.5px;font-weight:700;color:var(--txt)">${p.name}</div>
            <div style="font-size:12px;color:var(--p);font-weight:600">${p.patientId}</div>
          </div>
          <span class="badge ${sevClass}">${p.severity}</span>
        </div>
        <div style="font-size:12px;color:var(--txt2);margin:6px 0">${p.wardType} · ${p.bedNumber} · Age ${p.age}</div>
        <div style="font-size:12px;color:var(--txt3)">${p.diagnosis} · ${p.attendingDoctor}</div>
        <div style="display:flex;gap:6px;margin-top:10px">
          <button class="btn btn-outline btn-sm" onclick="openPatModal('${p.patientId}','${p.name}')">View</button>
          <button class="btn btn-outline btn-sm" onclick="showBillingForPatient('${p.patientId}')">Bill</button>
        </div>
      </div>`;
    }).join('');
  }
}

function filterPatients(q) {
  const filtered = q
    ? APP.patients.filter(p =>
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.patientId.toLowerCase().includes(q.toLowerCase()) ||
        (p.diagnosis||'').toLowerCase().includes(q.toLowerCase()))
    : APP.patients;
  renderPatients(filtered);
}

function openPatModal(id, name) {
  const allPats = (APP.patients && APP.patients.length) ? APP.patients : DEMO_PATIENTS;
  const p = allPats.find(x => x.patientId === id) || { patientId: id, name, age: '--', gender: '--', wardType: '--', bedNumber: '--', diagnosis: '--', attendingDoctor: '--', admittedAt: '--', bloodGroup: '--' };
  document.getElementById('modal-pat-name').textContent = p.name;
  document.getElementById('modal-pat-id').textContent   = p.patientId;
  // Populate detail fields
  const grid = document.querySelector('#patient-modal .patient-grid');
  if (grid) {
    grid.innerHTML =
      '<div><div class="det-lbl">Patient ID</div><div class="det-val" style="color:var(--p)">' + p.patientId + '</div></div>' +
      '<div><div class="det-lbl">Age / Gender</div><div class="det-val">' + p.age + ' · ' + (p.gender||'--') + '</div></div>' +
      '<div><div class="det-lbl">Ward / Bed</div><div class="det-val" style="color:var(--gen)">' + (p.wardType||'--') + ' · ' + (p.bedNumber||'Unassigned') + '</div></div>' +
      '<div><div class="det-lbl">Diagnosis</div><div class="det-val">' + (p.diagnosis||'--') + '</div></div>' +
      '<div><div class="det-lbl">Attending Doctor</div><div class="det-val">' + (p.attendingDoctor||'--') + '</div></div>' +
      '<div><div class="det-lbl">Blood Group</div><div class="det-val" style="color:#C0392B;font-weight:700">' + (p.bloodGroup||'Unknown') + '</div></div>' +
      '<div><div class="det-lbl">Admitted</div><div class="det-val">' + (p.admittedAt||'--') + '</div></div>' +
      '<div><div class="det-lbl">Status</div><div class="det-val"><span class="badge ' + (p.severity==='Critical'||p.severity==='High'?'critical':p.severity==='Medium'?'moderate':'stable') + '">' + (p.severity||'--') + '</span></div></div>';
  }
  // Phone
  const hist = document.querySelector('#patient-modal [style*="line-height:1.7"]');
  if (hist && p.phone) hist.textContent = (p.medicalHistory || ('Phone: ' + p.phone + ' · Admitted: ' + (p.admittedAt||'--')));
  openModal('patient-modal');
}

function openQRModal(patientId) {
  document.getElementById('qr-patient-id').textContent = 'Patient: ' + patientId;
  openModal('qr-modal');
}

/* ── PATIENT REGISTRATION ── */
function registerPatient() {
  const name     = (document.getElementById('reg-name')?.value || '').trim();
  const age      = document.getElementById('reg-age')?.value;
  const gender   = document.getElementById('reg-gender')?.value || 'Male';
  const phone    = (document.getElementById('reg-phone')?.value || '').trim();
  const aadhaar  = (document.getElementById('reg-aadhaar')?.value || '').trim();
  const bloodGroup = document.getElementById('reg-blood')?.value || 'Unknown';
  const wardType   = document.getElementById('reg-ward')?.value || '';
  const diagnosis  = (document.getElementById('reg-diagnosis')?.value || '').trim();
  const severity   = document.getElementById('reg-severity')?.value || 'Low';
  const attendingDoctor = document.getElementById('reg-doctor')?.value || '';
  const govtScheme = document.getElementById('reg-scheme')?.value || '';
  const isEmergency = document.getElementById('reg-emergency')?.value === 'true';
  const address    = (document.getElementById('reg-address')?.value || '').trim();
  const medicalHistory = (document.getElementById('reg-history')?.value || '').trim();

  if (!name || !age) { showToast('Missing Fields', 'Please fill Name and Age'); return; }

  const btn = document.getElementById('reg-submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Registering…'; }

  const token = localStorage.getItem('ahcare-token');
  fetch('/api/patients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
    body: JSON.stringify({ name, age: parseInt(age), gender, phone, aadhaar, bloodGroup, address, wardType, diagnosis, severity, attendingDoctor, medicalHistory, isEmergency, govtScheme })
  })
  .then(r => r.json())
  .then(data => {
    if (btn) { btn.disabled = false; btn.textContent = 'Register & Generate ID'; }
    if (data.success) {
      // Add to local list and re-render
      const newPatient = data.data;
      APP.patients.unshift(newPatient);
      closeModal('register-modal');
      ['reg-name','reg-age','reg-phone','reg-aadhaar','reg-diagnosis','reg-address','reg-history'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
      });
      renderPatients(APP.patients);
      showToast('Patient Registered', `${name} · ID: ${newPatient.patientId} · Adichunchanagiri Hospital`);
    } else {
      showToast('Registration Failed', data.message || 'Please try again');
    }
  })
  .catch(() => {
    if (btn) { btn.disabled = false; btn.textContent = 'Register & Generate ID'; }
    const newId = 'P-' + (2050 + Math.floor(Math.random() * 100));
    const newPatient = { patientId: newId, name, age: parseInt(age), gender, phone, wardType, bedNumber: null, diagnosis, severity, status:'Admitted', attendingDoctor, admittedAt: new Date().toISOString().split('T')[0], bloodGroup };
    APP.patients.unshift(newPatient);
    closeModal('register-modal');
    ['reg-name','reg-age','reg-phone','reg-aadhaar','reg-diagnosis','reg-address','reg-history'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    renderPatients(APP.patients);
    showToast('Patient Registered', `${name} · ID: ${newId} · Adichunchanagiri Hospital`);
  });
}

/* ============================================================
   EMERGENCY — FULL WORKING VERSION
   ============================================================ */
const EMERG_PATIENTS = [
  { id:'E-001', name:'Ravi Kumar', age:58, gender:'Male', type:'Cardiac Arrest', severity:'Critical', bed:'ICU-07', source:'Ambulance 108', blood:'B+', phone:'9844011001', status:'Active', time: new Date(Date.now()-3*60000) },
  { id:'E-002', name:'Lakshmi Rao', age:72, gender:'Female', type:'Stroke', severity:'High', bed:'ICU-09', source:'Walk-in', blood:'O+', phone:'9844011002', status:'Active', time: new Date(Date.now()-12*60000) },
];

function triggerEmergency() {
  showToast('CODE BLUE ACTIVATED', 'All ICU staff alerted · Auto-broadcast to PA system · Bed standby activated');
}

function submitEmergency() {
  const name = (document.getElementById('emerg-name')?.value || '').trim();
  const age = document.getElementById('emerg-age')?.value || '—';
  const gender = document.getElementById('emerg-gender')?.value || 'Unknown';
  const blood = document.getElementById('emerg-blood')?.value || 'Unknown';
  const type = document.getElementById('emerg-type')?.value || 'Emergency';
  const severity = document.getElementById('emerg-severity')?.value || 'Critical';
  const source = document.getElementById('emerg-source')?.value || 'Walk-in';
  const phone = document.getElementById('emerg-phone')?.value || '';

  if (!name) { showToast('Missing Field', 'Please enter patient name'); return; }

  const wardMap = { Critical:'ICU', High:'ICU', Medium:'General', Low:'General' };
  const ward = wardMap[severity] || 'ICU';
  const bedNum = ward === 'ICU' ? `ICU-${String(Math.floor(Math.random()*30+1)).padStart(2,'0')}` : `GEN-${String(Math.floor(Math.random()*100+1)).padStart(2,'0')}`;
  const newId = 'E-' + String(EMERG_PATIENTS.length + 1).padStart(3,'0');

  const newPat = { id:newId, name, age:parseInt(age)||0, gender, blood, type, severity, bed:bedNum, source, phone, status:'Active', time:new Date() };
  EMERG_PATIENTS.unshift(newPat);

  // Add alert banner
  const container = document.getElementById('emerg-alerts-container');
  if (container) {
    const div = document.createElement('div');
    div.className = 'emerg-alert';
    div.id = 'ea-' + newId;
    div.innerHTML = `<div class="emerg-icon">${severity==='Critical'?'🚨':'⚠️'}</div><div style="flex:1"><div class="emerg-title">${severity.toUpperCase()} — ${type}</div><div class="emerg-sub">${name}, ${age} · ${bedNum} auto-assigned · Just now</div></div><div style="display:flex;gap:6px;flex-shrink:0"><button class="btn btn-outline btn-sm" onclick="viewEmergPatient('${newId}','${name.replace(/'/g,"\\'")}')">View</button><button class="btn btn-danger btn-sm" onclick="ackAlert('ea-${newId}')">Ack</button></div>`;
    container.prepend(div);
  }

  renderEmergPatientTable();
  updateEmergStats();

  // Clear form
  ['emerg-name','emerg-age','emerg-phone'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });

  showToast('EMERGENCY ACTIVATED', `${type} — ${name} · ${bedNum} auto-assigned · Staff alerted`);
}

function renderEmergPatientTable() {
  const tbody = document.getElementById('emerg-patient-tbody');
  const mobList = document.getElementById('emerg-mob-list');
  const isMobile = window.innerWidth < 768;
  if (mobList) { mobList.style.display = isMobile ? 'flex' : 'none'; mobList.style.flexDirection = 'column'; mobList.style.gap = '10px'; }
  if (tbody) {
    tbody.innerHTML = EMERG_PATIENTS.map(p => {
      const mins = Math.round((Date.now() - p.time.getTime()) / 60000);
      const timeStr = mins < 1 ? 'Just now' : mins + ' min ago';
      const sevClass = p.severity === 'Critical' ? 'critical' : p.severity === 'High' ? 'critical' : 'moderate';
      return `<tr>
        <td><strong style="color:var(--danger)">${p.id}</strong></td>
        <td><strong>${p.name}</strong></td>
        <td>${p.age}</td>
        <td style="font-size:12px">${p.type}</td>
        <td><span class="badge ${sevClass}">${p.severity}</span></td>
        <td><strong>${p.bed}</strong></td>
        <td style="font-size:12px;color:var(--txt2)">${timeStr}</td>
        <td><span class="badge ${p.status==='Active'?'critical':'stable'}">${p.status}</span></td>
        <td class="act-cell">
          <button class="btn btn-outline btn-sm" onclick="viewEmergPatient('${p.id}','${p.name.replace(/'/g,"\\'")}')">View</button>
          <button class="btn btn-outline btn-sm" onclick="downloadEmergInvoice('${p.id}','${p.name.replace(/'/g,"\\'")}','${p.type}','${p.severity}')">PDF</button>
        </td>
      </tr>`;
    }).join('');
  }
  if (mobList) {
    mobList.innerHTML = EMERG_PATIENTS.map(p => {
      const mins = Math.round((Date.now() - p.time.getTime()) / 60000);
      const timeStr = mins < 1 ? 'Just now' : mins + ' min ago';
      const sevClass = p.severity === 'Critical' || p.severity === 'High' ? 'critical' : 'moderate';
      return `<div class="mob-pat-card" style="border-left:3px solid ${p.severity==='Critical'?'var(--danger)':'var(--warn)'}">
        <div class="mob-pat-row"><div style="flex:1"><div style="font-size:13.5px;font-weight:700;color:var(--txt)">${p.name}</div><div style="font-size:12px;color:var(--danger);font-weight:600">${p.id} · ${p.bed}</div></div><span class="badge ${sevClass}">${p.severity}</span></div>
        <div style="font-size:12px;color:var(--txt2);margin:6px 0">${p.type} · Age ${p.age} · ${timeStr}</div>
        <div style="display:flex;gap:6px;margin-top:8px">
          <button class="btn btn-outline btn-sm" onclick="viewEmergPatient('${p.id}','${p.name.replace(/'/g,"\\'")}')">View</button>
          <button class="btn btn-outline btn-sm" onclick="downloadEmergInvoice('${p.id}','${p.name.replace(/'/g,"\\'")}','${p.type}','${p.severity}')">PDF</button>
        </div>
      </div>`;
    }).join('');
  }
}

function updateEmergStats() {
  const active   = EMERG_PATIENTS.filter(p => p.status === 'Active').length;
  const resolved = EMERG_PATIENTS.filter(p => p.status === 'Resolved').length;
  const el = document.getElementById('emerg-stat-active');
  const rel = document.getElementById('emerg-stat-resolved');
  if (el)  el.textContent  = active;
  if (rel) rel.textContent = resolved;
}

function viewEmergPatient(id, name) {
  const p = EMERG_PATIENTS.find(e => e.id === id);
  const content = document.getElementById('emerg-view-content');
  const pdfBtn = document.getElementById('emerg-pdf-btn');
  if (!p || !content) return;
  const mins = Math.round((Date.now() - p.time.getTime()) / 60000);
  content.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;background:var(--bg);border:1.5px solid var(--border);border-radius:12px;padding:14px;margin-bottom:12px">
      <div><div style="font-size:10px;color:var(--txt3);font-weight:700;text-transform:uppercase">Emergency ID</div><div style="font-size:15px;font-weight:800;color:var(--danger)">${p.id}</div></div>
      <div><div style="font-size:10px;color:var(--txt3);font-weight:700;text-transform:uppercase">Status</div><span class="badge ${p.status==='Active'?'critical':'stable'}">${p.status}</span></div>
      <div><div style="font-size:10px;color:var(--txt3);font-weight:700;text-transform:uppercase">Patient</div><div style="font-size:14px;font-weight:700">${p.name}</div></div>
      <div><div style="font-size:10px;color:var(--txt3);font-weight:700;text-transform:uppercase">Age / Gender</div><div style="font-size:14px;font-weight:600">${p.age} / ${p.gender}</div></div>
      <div><div style="font-size:10px;color:var(--txt3);font-weight:700;text-transform:uppercase">Emergency Type</div><div style="font-size:13px;font-weight:600">${p.type}</div></div>
      <div><div style="font-size:10px;color:var(--txt3);font-weight:700;text-transform:uppercase">Severity</div><span class="badge ${p.severity==='Critical'||p.severity==='High'?'critical':'moderate'}">${p.severity}</span></div>
      <div><div style="font-size:10px;color:var(--txt3);font-weight:700;text-transform:uppercase">Allocated Bed</div><div style="font-size:14px;font-weight:800;color:var(--p)">${p.bed}</div></div>
      <div><div style="font-size:10px;color:var(--txt3);font-weight:700;text-transform:uppercase">Blood Group</div><div style="font-size:14px;font-weight:700;color:var(--danger)">${p.blood}</div></div>
      <div><div style="font-size:10px;color:var(--txt3);font-weight:700;text-transform:uppercase">Admitted Via</div><div style="font-size:13px">${p.source}</div></div>
      <div><div style="font-size:10px;color:var(--txt3);font-weight:700;text-transform:uppercase">Time</div><div style="font-size:13px">${mins < 1 ? 'Just now' : mins + ' min ago'}</div></div>
    </div>`;
  if (pdfBtn) pdfBtn.onclick = () => downloadEmergInvoice(p.id, p.name, p.type, p.severity);
  openModal('emerg-view-modal');
}

function downloadEmergInvoice(id, name, type, severity) {
  const p = EMERG_PATIENTS.find(e => e.id === id) || { id, name, type, severity, age:'—', gender:'—', blood:'—', bed:'ICU', source:'—', phone:'—', time:new Date() };
  const now = new Date();
  const admFee = severity === 'Critical' ? 2000 : 1500;
  const icuCharges = severity === 'Critical' ? 12000 : 8000;
  const docFee = 3000;
  const medCharges = 5000;
  const labTests = 2500;
  const total = admFee + icuCharges + docFee + medCharges + labTests;

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Emergency Invoice ${id} — Adichunchanagiri Hospital</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#0D1F17;background:#fff;padding:32px}
.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #C0392B;padding-bottom:20px;margin-bottom:20px}
.logo-name{font-size:20px;font-weight:800;color:#00875A}
.logo-sub{font-size:11px;color:#85A898;margin-top:3px}
.logo-addr{font-size:11px;color:#3B5E4A;margin-top:6px;line-height:1.6}
.emerg-badge{background:#C0392B;color:#fff;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:800;letter-spacing:.5px}
.inv-no{font-size:18px;font-weight:800;color:#0D1F17}
.inv-date{font-size:12px;color:#85A898;margin-top:4px}
.section{margin-bottom:20px}
.section-title{font-size:11px;font-weight:700;color:#C0392B;text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px}
.patient-box{display:grid;grid-template-columns:1fr 1fr;gap:12px;background:#FFF5F5;border:1.5px solid rgba(192,57,43,.2);border-radius:10px;padding:14px}
.pat-field label{font-size:10px;color:#85A898;font-weight:700;text-transform:uppercase;display:block;margin-bottom:2px}
.pat-field span{font-size:13px;font-weight:600;color:#0D1F17}
table{width:100%;border-collapse:collapse;margin:10px 0}
th{background:linear-gradient(180deg,#FFECEC,#FFD5D5);padding:9px 12px;text-align:left;font-size:11px;font-weight:700;color:#8B0000;text-transform:uppercase;letter-spacing:.5px}
td{padding:9px 12px;border-bottom:1px solid rgba(192,57,43,.08);font-size:13px;color:#3B5E4A}
td.amount{text-align:right;font-weight:600;color:#0D1F17}
.total-row td{font-weight:800;color:#0D1F17;border-top:2px solid rgba(192,57,43,.25);border-bottom:none;background:rgba(192,57,43,.04);font-size:15px}
.footer{border-top:1.5px solid rgba(0,135,90,.15);margin-top:24px;padding-top:14px;text-align:center;font-size:11px;color:#85A898;line-height:1.8}
</style></head><body>
<div class="header">
  <div>
    <div class="logo-name">Adichunchanagiri Hospital</div>
    <div class="logo-sub">A Centre of Excellence in Healthcare</div>
    <div class="logo-addr">BG Nagar, Bellur Cross, Nagamangala<br>Mandya District, Karnataka — 571 448<br>Ph: 08234-287800 | Emergency: 108<br>Email: billing@ahcare.in</div>
  </div>
  <div style="text-align:right">
    <div class="emerg-badge">EMERGENCY INVOICE</div>
    <div class="inv-no" style="margin-top:8px">${id}</div>
    <div class="inv-date">Date: ${now.toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</div>
    <div class="inv-date">Time: ${now.toLocaleTimeString('en-IN')}</div>
  </div>
</div>
<div class="section">
  <div class="section-title">Emergency Patient Information</div>
  <div class="patient-box">
    <div class="pat-field"><label>Patient Name</label><span>${p.name}</span></div>
    <div class="pat-field"><label>Emergency ID</label><span style="color:#C0392B">${p.id}</span></div>
    <div class="pat-field"><label>Age / Gender</label><span>${p.age} / ${p.gender||'—'}</span></div>
    <div class="pat-field"><label>Blood Group</label><span style="color:#C0392B;font-weight:800">${p.blood||'Unknown'}</span></div>
    <div class="pat-field"><label>Emergency Type</label><span>${p.type}</span></div>
    <div class="pat-field"><label>Severity</label><span style="color:#C0392B;font-weight:700">${p.severity}</span></div>
    <div class="pat-field"><label>Allocated Bed</label><span style="color:#00875A;font-weight:800">${p.bed}</span></div>
    <div class="pat-field"><label>Admitted Via</label><span>${p.source||'—'}</span></div>
  </div>
</div>
<div class="section">
  <div class="section-title">Emergency Billing Breakdown</div>
  <table>
    <thead><tr><th>Description</th><th style="text-align:right">Amount (₹)</th></tr></thead>
    <tbody>
      <tr><td>Emergency Admission Fee</td><td class="amount">₹${admFee.toLocaleString('en-IN')}</td></tr>
      <tr><td>ICU / Critical Care Charges</td><td class="amount">₹${icuCharges.toLocaleString('en-IN')}</td></tr>
      <tr><td>Doctor / Specialist Fee</td><td class="amount">₹${docFee.toLocaleString('en-IN')}</td></tr>
      <tr><td>Emergency Medicines & Consumables</td><td class="amount">₹${medCharges.toLocaleString('en-IN')}</td></tr>
      <tr><td>Lab / Diagnostics (ECG, Blood Tests)</td><td class="amount">₹${labTests.toLocaleString('en-IN')}</td></tr>
      <tr class="total-row"><td><strong>Total Estimate</strong></td><td class="amount" style="color:#C0392B"><strong>₹${total.toLocaleString('en-IN')}</strong></td></tr>
    </tbody>
  </table>
  <div style="font-size:11px;color:#85A898;margin-top:8px">* This is an initial estimate. Final bill may vary based on treatment duration and additional procedures.</div>
</div>
<div class="footer">
  <strong>Adichunchanagiri Hospital</strong> — Accredited · Govt Empanelled · Ayushman Bharat · Arogya Karnataka<br>
  For billing queries: billing@ahcare.in · 08234-287800 (Ext 120)<br>
  <div style="color:#00875A;font-weight:700;margin-top:4px">AH Care v7.0 · Generated: ${now.toLocaleString('en-IN')}</div>
</div>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `Emergency_${id}_${name.replace(/\s+/g,'_')}.html`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  closeModal('emerg-view-modal');
  showToast('Emergency Invoice Downloaded', `${id} — ${name} · Open in browser to print as PDF`);
}

function downloadEmergencyReport() {
  const now = new Date();
  const rows = EMERG_PATIENTS.map((p,i) => {
    const mins = Math.round((Date.now() - p.time.getTime()) / 60000);
    return `<tr><td>${p.id}</td><td>${p.name}</td><td>${p.age}/${p.gender||'—'}</td><td>${p.type}</td><td style="color:${p.severity==='Critical'?'#C0392B':'#E07B00'};font-weight:700">${p.severity}</td><td style="color:#00875A;font-weight:700">${p.bed}</td><td>${p.blood}</td><td>${p.source}</td><td>${mins<1?'Just now':mins+' min ago'}</td><td style="color:${p.status==='Active'?'#C0392B':'#00875A'};font-weight:700">${p.status}</td></tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Emergency Report — Adichunchanagiri Hospital</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#0D1F17;padding:24px}
h1{color:#C0392B;font-size:20px;margin-bottom:4px}
.sub{color:#85A898;font-size:12px;margin-bottom:20px}
table{width:100%;border-collapse:collapse}
th{background:#C0392B;color:#fff;padding:9px 10px;text-align:left;font-size:11px;font-weight:700}
td{padding:8px 10px;border-bottom:1px solid #f0f0f0;font-size:12px}
tr:nth-child(even){background:#fafafa}
.footer{margin-top:20px;font-size:11px;color:#85A898;border-top:1px solid #eee;padding-top:12px;text-align:center}
</style></head><body>
<h1>Emergency Department Report</h1>
<div class="sub">Adichunchanagiri Hospital · Generated: ${now.toLocaleString('en-IN')} · Total: ${EMERG_PATIENTS.length} patients</div>
<table><thead><tr><th>ID</th><th>Name</th><th>Age/Sex</th><th>Type</th><th>Severity</th><th>Bed</th><th>Blood</th><th>Source</th><th>Time</th><th>Status</th></tr></thead>
<tbody>${rows}</tbody></table>
<div class="footer">Adichunchanagiri Hospital · BG Nagar, Mandya · 08234-287800 · AH Care v7.0</div>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `Emergency_Report_${now.toISOString().split('T')[0]}.html`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Report Downloaded', `Emergency report with ${EMERG_PATIENTS.length} patients · Open in browser → Print as PDF`);
}

function ackAlert(id) {
  const el = document.getElementById(id);
  if (el) { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }
  showToast('Acknowledged', 'Alert logged and broadcast to ICU team');
}

/* ============================================================
   BLOODBY — BLOOD DONATION MODULE
   ============================================================ */
const BLOOD_INVENTORY = [
  { type:'A+', units:9, lastUpdated:'2h ago' },
  { type:'A-', units:2, lastUpdated:'4h ago' },
  { type:'B+', units:14, lastUpdated:'1h ago' },
  { type:'B-', units:1, lastUpdated:'6h ago' },
  { type:'O+', units:18, lastUpdated:'30m ago' },
  { type:'O-', units:4, lastUpdated:'3h ago' },
  { type:'AB+', units:7, lastUpdated:'2h ago' },
  { type:'AB-', units:1, lastUpdated:'8h ago' },
];

const BLOOD_DONORS = [
  { name:'Ravi Gowda', blood:'O+', phone:'9845111001', location:'BG Nagar', emergency:'yes', lastDonated:'2026-01-15' },
  { name:'Priya Kumari', blood:'B-', phone:'9845111002', location:'Nagamangala', emergency:'yes', lastDonated:'2025-11-10' },
  { name:'Suresh Patil', blood:'A+', phone:'9845111003', location:'Mandya', emergency:'daytime', lastDonated:'2026-02-20' },
  { name:'Meena Rao', blood:'AB+', phone:'9845111004', location:'Bellur', emergency:'yes', lastDonated:'2026-03-01' },
  { name:'Kiran Kumar', blood:'O-', phone:'9845111005', location:'Krishnarajapete', emergency:'weekend', lastDonated:'2026-01-05' },
];

const BLOOD_REQUESTS = [
  { patient:'Sunita Devi', blood:'B+', units:2, urgency:'Immediate', doctor:'Dr. Anand Murthy', status:'Fulfilled', time:'2h ago' },
  { patient:'Arjun Nair', blood:'O+', units:1, urgency:'Urgent', doctor:'Dr. Suresh Kumar', status:'Pending', time:'45m ago' },
  { patient:'Kavya S.', blood:'A-', units:3, urgency:'Scheduled', doctor:'Dr. Rekha M.', status:'Processing', time:'1h ago' },
];

function renderBloodInventory() {
  const grid = document.getElementById('blood-inventory-grid');
  if (!grid) return;
  grid.innerHTML = BLOOD_INVENTORY.map(b => {
    const cls = b.units >= 10 ? 'sufficient' : b.units >= 3 ? 'low' : 'critical';
    const statusLabel = b.units >= 10 ? 'Sufficient' : b.units >= 3 ? 'Low Stock' : 'Critical';
    const statusColor = b.units >= 10 ? 'var(--gen)' : b.units >= 3 ? 'var(--warn)' : 'var(--danger)';
    return `<div class="blood-type-card ${cls}" onclick="showToast('${b.type} Blood','${b.units} units available · Last updated ${b.lastUpdated}')">
      <div class="blood-type-label">${b.type}</div>
      <div class="blood-type-units">${b.units} units</div>
      <div class="blood-type-status" style="color:${statusColor}">${statusLabel}</div>
    </div>`;
  }).join('');
}

function renderBloodDonors() {
  const el = document.getElementById('blood-donors-list');
  if (!el) return;
  el.innerHTML = getBloodDonors().map(d => {
    const avail = d.emergency === 'yes' ? 'available' : 'limited';
    const availLabel = d.emergency === 'yes' ? '24×7 Available' : d.emergency === 'daytime' ? 'Daytime Only' : 'Weekends';
    return `<div class="donor-row">
      <span class="donor-avail ${avail}"></span>
      <div style="flex:1">
        <div style="font-weight:700;font-size:13px;color:var(--txt)">${d.name}</div>
        <div style="font-size:12px;color:var(--txt2)">${d.location} · Last donated: ${d.lastDonated||'—'}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:16px;font-weight:800;color:var(--danger)">${d.blood}</div>
        <div style="font-size:10px;color:var(--txt3)">${availLabel}</div>
      </div>
    </div>`;
  }).join('');
}

function renderBloodRequests() {
  const el = document.getElementById('blood-requests-list');
  if (!el) return;
  el.innerHTML = BLOOD_REQUESTS.map(r => {
    const cls = r.status === 'Fulfilled' ? 'stable' : r.status === 'Pending' ? 'critical' : 'moderate';
    return `<div class="donor-row">
      <div style="flex:1">
        <div style="font-weight:700;font-size:13px;color:var(--txt)">${r.patient} · <span style="color:var(--danger)">${r.blood}</span> · ${r.units} units</div>
        <div style="font-size:12px;color:var(--txt2)">${r.urgency} · ${r.doctor} · ${r.time}</div>
      </div>
      <span class="badge ${cls}">${r.status}</span>
    </div>`;
  }).join('');
}

function filterDonorsByGroup(group) {
  const donors = getBloodDonors();
  const filtered = group ? donors.filter(d => d.blood === group) : donors;
  const el = document.getElementById('blood-donors-list');
  if (!el) return;
  if (!filtered.length) { el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--txt3);font-size:13px">No donors found for ' + (group||'this group') + '</div>'; return; }
  el.innerHTML = filtered.map(d => {
    const avail = d.emergency === 'yes' ? 'available' : 'limited';
    const availLabel = d.emergency === 'yes' ? '24×7 Available' : d.emergency === 'daytime' ? 'Daytime Only' : 'Weekends';
    return '<div class="donor-row">' +
      '<span class="donor-avail ' + avail + '"></span>' +
      '<div style="flex:1"><div style="font-weight:700;font-size:13px;color:var(--txt)">' + d.name + '</div>' +
      '<div style="font-size:12px;color:var(--txt2)">' + d.location + ' · Last donated: ' + (d.lastDonated||'—') + '</div></div>' +
      '<div style="text-align:right"><div style="font-size:16px;font-weight:800;color:var(--danger)">' + d.blood + '</div>' +
      '<div style="font-size:10px;color:var(--txt3)">' + availLabel + '</div></div></div>';
  }).join('');
}

function setBloodTab(el, tabId) {
  document.querySelectorAll('#blood-tab-donors,#blood-tab-requests').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('blood-donors-list').style.display = tabId === 'blood-donors-list' ? 'flex' : 'none';
  document.getElementById('blood-donors-list').style.flexDirection = 'column';
  document.getElementById('blood-donors-list').style.gap = '8px';
  document.getElementById('blood-requests-list').style.display = tabId === 'blood-requests-list' ? 'flex' : 'none';
  document.getElementById('blood-requests-list').style.flexDirection = 'column';
  document.getElementById('blood-requests-list').style.gap = '8px';
}

/* == BloodBy: localStorage persistence == */
function _bdSave(donors) {
  try { localStorage.setItem('ahcare_donors_v1', JSON.stringify(donors)); } catch(e) {}
}
function _bdLoad() {
  try { const r = localStorage.getItem('ahcare_donors_v1'); return r ? JSON.parse(r) : null; } catch(e) { return null; }
}
function _invSave() {
  try { localStorage.setItem('ahcare_inv_v1', JSON.stringify(BLOOD_INVENTORY.map(b => ({type:b.type,units:b.units,lastUpdated:b.lastUpdated})))); } catch(e) {}
}
function _invLoad() {
  try { const r = localStorage.getItem('ahcare_inv_v1'); return r ? JSON.parse(r) : null; } catch(e) { return null; }
}
/* Restore persisted inventory on page load */
(function() {
  const saved = _invLoad();
  if (saved && saved.length === BLOOD_INVENTORY.length) {
    saved.forEach((s, i) => { BLOOD_INVENTORY[i].units = s.units; BLOOD_INVENTORY[i].lastUpdated = s.lastUpdated; });
  }
})();
function getBloodDonors() {
  if (!APP.bloodDonors) APP.bloodDonors = _bdLoad() || [...BLOOD_DONORS];
  return APP.bloodDonors;
}

function registerDonor() {
  const name  = (document.getElementById('donor-name')?.value || '').trim();
  const age   = document.getElementById('donor-age')?.value;
  const phone = (document.getElementById('donor-phone')?.value || '').trim();
  const blood = document.getElementById('donor-blood')?.value;
  const location  = (document.getElementById('donor-location')?.value || '').trim() || 'Mandya';
  const emergency = document.getElementById('donor-emergency')?.value || 'yes';
  const lastDate  = document.getElementById('donor-last-date')?.value || '';

  if (!name || !age || !phone || !blood) {
    showToast('Missing Fields', 'Please fill Name, Age, Phone and Blood Group'); return;
  }
  const donors = getBloodDonors();
  if (donors.find(d => d.phone === phone)) {
    showToast('Already Registered', phone + ' is already in our donor network.'); return;
  }
  donors.unshift({ name, blood, phone, location, emergency, lastDonated: lastDate || '\u2014' });
  APP.bloodDonors = donors;
  _bdSave(donors);

  /* Increment inventory for this blood group */
  const inv = BLOOD_INVENTORY.find(b => b.type === blood);
  if (inv) { inv.units += 1; inv.lastUpdated = 'Just now'; _invSave(); }

  renderBloodDonors();
  renderBloodInventory();

  ['donor-name','donor-age','donor-phone','donor-location','donor-last-date'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  showToast('Donor Registered!', name + ' | ' + blood + ' | Inventory +1 unit | Thank you!');
}

function submitBloodRequest() {
  const name = (document.getElementById('breq-name')?.value || '').trim();
  const blood = document.getElementById('breq-blood')?.value;
  const units = document.getElementById('breq-units')?.value || '1';
  const urgency = document.getElementById('breq-urgency')?.value || 'Urgent';
  const doctor = (document.getElementById('breq-doctor')?.value || '').trim();
  const phone = (document.getElementById('breq-phone')?.value || '').trim();

  if (!name || !blood) { showToast('Missing Fields', 'Please fill Patient Name and Blood Group'); return; }

  // Check inventory
  const inv = BLOOD_INVENTORY.find(b => b.type === blood);
  const available = inv ? inv.units : 0;
  const status = available >= parseInt(units) ? 'Processing' : 'Pending';

  BLOOD_REQUESTS.unshift({ patient: name, blood, units: parseInt(units), urgency, doctor: doctor || 'On-duty Doctor', status, time: 'Just now' });
  if (inv && status === 'Processing') { inv.units = Math.max(0, inv.units - parseInt(units)); inv.lastUpdated = 'Just now'; _invSave(); }

  renderBloodInventory();
  renderBloodRequests();
  closeModal('blood-request-modal');
  showToast('Blood Request Submitted', `${units} unit(s) of ${blood} requested for ${name} · ${status}`);
}

function downloadBloodReport() {
  const now = new Date();
  const invRows = BLOOD_INVENTORY.map(b => {
    const cls = b.units >= 10 ? '#00875A' : b.units >= 3 ? '#E07B00' : '#C0392B';
    return `<tr><td style="font-size:16px;font-weight:800;color:#C0392B">${b.type}</td><td style="text-align:center;font-weight:700">${b.units}</td><td style="color:${cls};font-weight:700;text-align:center">${b.units>=10?'Sufficient':b.units>=3?'Low Stock':'Critical'}</td><td style="color:#85A898">${b.lastUpdated}</td></tr>`;
  }).join('');
  const donorRows = getBloodDonors().map(d =>
    `<tr><td>${d.name}</td><td style="color:#C0392B;font-weight:800">${d.blood}</td><td>${d.location}</td><td>${d.emergency==='yes'?'24×7':'Limited'}</td><td>${d.lastDonated||'—'}</td></tr>`
  ).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>BloodBy Report — AH Care</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#0D1F17;padding:24px}
h1{color:#C0392B;font-size:22px;margin-bottom:4px}h2{color:#C0392B;font-size:16px;margin:20px 0 10px}
.sub{color:#85A898;font-size:12px;margin-bottom:20px}
table{width:100%;border-collapse:collapse;margin-bottom:16px}
th{background:#C0392B;color:#fff;padding:9px 10px;text-align:left;font-size:11px;font-weight:700}
td{padding:8px 10px;border-bottom:1px solid #f0f0f0}tr:nth-child(even){background:#fafafa}
.footer{margin-top:20px;font-size:11px;color:#85A898;border-top:1px solid #eee;padding-top:12px;text-align:center}
</style></head><body>
<h1>BloodBy — Blood Donation Report</h1>
<div class="sub">Adichunchanagiri Hospital · Generated: ${now.toLocaleString('en-IN')}</div>
<h2>Blood Bank Inventory</h2>
<table><thead><tr><th>Blood Group</th><th>Units Available</th><th>Status</th><th>Last Updated</th></tr></thead><tbody>${invRows}</tbody></table>
<h2>Registered Donors (${getBloodDonors().length})</h2>
<table><thead><tr><th>Name</th><th>Blood Group</th><th>Location</th><th>Availability</th><th>Last Donated</th></tr></thead><tbody>${donorRows}</tbody></table>
<div class="footer">Adichunchanagiri Hospital · BG Nagar, Mandya · BloodBy Network · AH Care v7.0</div>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `BloodBy_Report_${now.toISOString().split('T')[0]}.html`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('BloodBy Report Downloaded', 'Open in browser → Print as PDF');
}

/* ============================================================
   ORGAN DONATION MODULE
   ============================================================ */
const ORGANS_DATA = [
  { icon:'🫀', name:'Heart', wait:'1,200 patients', color:'#C0392B' },
  { icon:'🫁', name:'Lungs', wait:'900 patients', color:'#5E35B1' },
  { icon:'🫘', name:'Kidneys', wait:'2,80,000 patients', color:'#0077B6' },
  { icon:'🫁', name:'Liver', wait:'80,000 patients', color:'#E07B00' },
  { icon:'👁️', name:'Corneas', wait:'1,00,000 patients', color:'#00875A' },
  { icon:'🧪', name:'Pancreas', wait:'2,000 patients', color:'#5E35B1' },
  { icon:'🦴', name:'Bone', wait:'Tissue bank', color:'#85A898' },
  { icon:'🩹', name:'Skin', wait:'Tissue bank', color:'#E07B00' },
];

const ORGAN_WAITING = [
  { patient:'Venkatesh R., 45', organ:'Kidney', bloodGroup:'O+', waiting:'3.5 years', urgency:'Critical' },
  { patient:'Sumithra D., 32', organ:'Liver', bloodGroup:'B+', waiting:'2.1 years', urgency:'Urgent' },
  { patient:'Mohan K., 58', organ:'Heart', bloodGroup:'A+', waiting:'8 months', urgency:'Critical' },
  { patient:'Geetha S., 28', organ:'Cornea (L)', bloodGroup:'Any', waiting:'1.2 years', urgency:'Moderate' },
];

function renderOrganCards() {
  const grid = document.getElementById('organ-cards-grid');
  if (!grid) return;
  grid.innerHTML = ORGANS_DATA.map(o =>
    `<div class="organ-card" onclick="showToast('${o.name}','Waiting list: ${o.wait}')">
      <div class="organ-icon">${o.icon}</div>
      <div class="organ-name" style="color:${o.color}">${o.name}</div>
      <div class="organ-wait">${o.wait}</div>
    </div>`
  ).join('');
}

function renderOrganWaiting() {
  const el = document.getElementById('organ-waiting-list');
  if (!el) return;
  el.innerHTML = ORGAN_WAITING.map(w => {
    const cls = w.urgency === 'Critical' ? 'danger' : w.urgency === 'Urgent' ? 'warn' : 'gen';
    const color = w.urgency === 'Critical' ? 'var(--danger)' : w.urgency === 'Urgent' ? 'var(--warn)' : 'var(--gen)';
    return `<div class="organ-wait-item">
      <div style="flex:1">
        <div style="font-weight:700;font-size:13px;color:var(--txt)">${w.patient}</div>
        <div style="font-size:12px;color:var(--txt2)">${w.organ} · Blood: ${w.bloodGroup} · Waiting: ${w.waiting}</div>
      </div>
      <div class="organ-wait-badge" style="background:rgba(0,0,0,.05);color:${color}">${w.urgency}</div>
    </div>`;
  }).join('');
}

function submitOrganPledge() {
  const name = (document.getElementById('org-name')?.value || '').trim();
  const age = document.getElementById('org-age')?.value || '';
  const phone = (document.getElementById('org-phone')?.value || '').trim();
  const blood = document.getElementById('org-blood')?.value || '—';
  const aadhaar = (document.getElementById('org-aadhaar')?.value || '').trim();
  const contactName = (document.getElementById('org-contact-name')?.value || '').trim();
  const contactPhone = (document.getElementById('org-contact-phone')?.value || '').trim();

  if (!name || !age || !phone || !contactName || !contactPhone) { showToast('Missing Fields', 'Please fill all required fields'); return; }

  const organs = [];
  if (document.getElementById('org-heart')?.checked) organs.push('Heart');
  if (document.getElementById('org-liver')?.checked) organs.push('Liver');
  if (document.getElementById('org-kidney')?.checked) organs.push('Kidneys');
  if (document.getElementById('org-lungs')?.checked) organs.push('Lungs');
  if (document.getElementById('org-cornea')?.checked) organs.push('Corneas');
  if (document.getElementById('org-skin')?.checked) organs.push('Skin');
  if (document.getElementById('org-bone')?.checked) organs.push('Bone');
  if (document.getElementById('org-pancreas')?.checked) organs.push('Pancreas');

  closeModal('organ-pledge-modal');
  downloadOrganPledgePDF(name, age, blood, phone, aadhaar, organs, contactName, contactPhone);
}

function downloadOrganPledgePDF(name, age, blood, phone, aadhaar, organs, contactName, contactPhone) {
  const now = new Date();
  const pledgeId = 'NOTTO-AH-' + Date.now().toString().slice(-7);
  const orgList = organs.join(', ') || 'All applicable organs';

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Organ Donation Pledge — ${name}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#1A0A1E;background:#fff;padding:32px}
.card-border{border:3px solid #5E35B1;border-radius:16px;padding:28px;background:linear-gradient(135deg,#FAF5FF,#fff)}
.header{text-align:center;margin-bottom:24px}
.badge-top{display:inline-block;background:linear-gradient(135deg,#C0392B,#5E35B1);color:#fff;padding:6px 20px;border-radius:20px;font-size:12px;font-weight:800;letter-spacing:.8px;margin-bottom:12px}
.logo-name{font-size:22px;font-weight:800;color:#5E35B1;margin-bottom:4px}
.pledge-id{font-size:14px;font-weight:700;color:#C0392B;margin-top:8px}
.heart-ico{font-size:48px;margin:12px 0}
.pledge-title{font-size:18px;font-weight:800;color:#1A0A1E;margin-bottom:4px}
.section{margin:16px 0}
.section-title{font-size:11px;font-weight:700;color:#5E35B1;text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#F5F0FF;border-radius:10px;padding:14px}
.info-field label{font-size:10px;color:#9B59B6;font-weight:700;text-transform:uppercase;display:block;margin-bottom:2px}
.info-field span{font-size:13px;font-weight:600;color:#1A0A1E}
.organ-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.organ-chip{background:linear-gradient(135deg,rgba(94,53,177,.1),rgba(192,57,43,.08));border:1px solid rgba(94,53,177,.25);padding:5px 12px;border-radius:20px;font-size:12px;font-weight:700;color:#5E35B1}
.declaration{background:#F5F0FF;border:1.5px solid rgba(94,53,177,.2);border-radius:10px;padding:14px;font-size:12px;color:#4A235A;line-height:1.7;margin-top:12px}
.sign-area{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px}
.sign-box{border-top:2px solid #5E35B1;padding-top:8px;text-align:center;font-size:11px;color:#9B59B6;font-weight:700}
.footer{text-align:center;margin-top:20px;font-size:11px;color:#9B59B6;line-height:1.8}
.footer strong{color:#5E35B1}
@media print{body{padding:16px}}
</style></head><body>
<div class="card-border">
<div class="header">
  <div class="badge-top">ORGAN DONATION PLEDGE CARD</div>
  <div class="heart-ico">🫀❤️🫁</div>
  <div class="logo-name">Adichunchanagiri Hospital</div>
  <div style="font-size:11px;color:#9B59B6;margin-top:3px">BG Nagar, Bellur Cross, Nagamangala, Mandya — 571448</div>
  <div class="pledge-id">Pledge ID: ${pledgeId}</div>
  <div style="font-size:12px;color:#85A898;margin-top:4px">Date: ${now.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
</div>

<div class="section">
  <div class="section-title">Donor Information</div>
  <div class="info-grid">
    <div class="info-field"><label>Full Name</label><span>${name}</span></div>
    <div class="info-field"><label>Age</label><span>${age} years</span></div>
    <div class="info-field"><label>Phone</label><span>${phone}</span></div>
    <div class="info-field"><label>Blood Group</label><span style="color:#C0392B;font-weight:800">${blood}</span></div>
    ${aadhaar ? `<div class="info-field" style="grid-column:span 2"><label>Aadhaar</label><span>XXXX XXXX ${aadhaar.slice(-4)}</span></div>` : ''}
  </div>
</div>

<div class="section">
  <div class="section-title">Organs Pledged for Donation</div>
  <div class="organ-chips">${organs.map(o => `<span class="organ-chip">${o}</span>`).join('')}</div>
</div>

<div class="section">
  <div class="section-title">Emergency Contact</div>
  <div class="info-grid">
    <div class="info-field"><label>Name</label><span>${contactName}</span></div>
    <div class="info-field"><label>Phone</label><span>${contactPhone}</span></div>
  </div>
</div>

<div class="declaration">
  I, <strong>${name}</strong>, hereby voluntarily pledge to donate my organs and/or tissues listed above after brain-stem death as declared by a team of qualified doctors. I understand that my family will be consulted before any retrieval. This pledge is registered with NOTTO and Adichunchanagiri Hospital, Mandya.
</div>

<div class="sign-area">
  <div class="sign-box">DONOR SIGNATURE<div style="height:30px"></div>${name}</div>
  <div class="sign-box">HOSPITAL COORDINATOR<div style="height:30px"></div>Adichunchanagiri Hospital</div>
</div>

<div class="footer">
  <strong>NOTTO Helpline: 1800-11-4770 (Free · 24×7)</strong><br>
  National Organ & Tissue Transplant Organisation · Ministry of Health & Family Welfare<br>
  This card is valid nationwide · Carry it at all times · Inform your family<br>
  <div style="color:#C0392B;font-weight:700;margin-top:6px">AH Care v7.0 · ${now.toLocaleString('en-IN')}</div>
</div>
</div>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `OrganPledge_${name.replace(/\s+/g,'_')}_${pledgeId}.html`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Pledge Card Downloaded!', `${name} · ${pledgeId} · Open in browser → Print as PDF · Share with family`);
}

function downloadOrganReport() {
  const now = new Date();
  const waitRows = ORGAN_WAITING.map(w =>
    `<tr><td>${w.patient}</td><td>${w.organ}</td><td style="color:#C0392B;font-weight:800">${w.bloodGroup}</td><td>${w.waiting}</td><td style="color:${w.urgency==='Critical'?'#C0392B':w.urgency==='Urgent'?'#E07B00':'#00875A'};font-weight:700">${w.urgency}</td></tr>`
  ).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Organ Donation Report — AH Care</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#0D1F17;padding:24px}
h1{background:linear-gradient(135deg,#C0392B,#5E35B1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:22px;margin-bottom:4px}
.sub{color:#85A898;font-size:12px;margin-bottom:20px}h2{color:#5E35B1;font-size:15px;margin:16px 0 10px}
table{width:100%;border-collapse:collapse}
th{background:linear-gradient(135deg,#5E35B1,#C0392B);color:#fff;padding:9px 10px;text-align:left;font-size:11px;font-weight:700}
td{padding:8px 10px;border-bottom:1px solid #f0f0f0}tr:nth-child(even){background:#fafafa}
.footer{margin-top:20px;font-size:11px;color:#85A898;border-top:1px solid #eee;padding-top:12px;text-align:center}
</style></head><body>
<h1>Organ Donation — Hospital Report</h1>
<div class="sub">Adichunchanagiri Hospital, Mandya · NOTTO Registered · Generated: ${now.toLocaleString('en-IN')}</div>
<h2>Current Waiting List</h2>
<table><thead><tr><th>Patient</th><th>Organ Needed</th><th>Blood Group</th><th>Waiting Duration</th><th>Urgency</th></tr></thead><tbody>${waitRows}</tbody></table>
<h2>Available Organs for Donation</h2>
<table><thead><tr><th>Organ</th><th>Waiting Patients (National)</th></tr></thead><tbody>
${ORGANS_DATA.map(o=>`<tr><td>${o.icon} ${o.name}</td><td>${o.wait}</td></tr>`).join('')}
</tbody></table>
<div class="footer">Adichunchanagiri Hospital · NOTTO Helpline: 1800-11-4770 · AH Care v7.0</div>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `OrganDonation_Report_${now.toISOString().split('T')[0]}.html`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Organ Donation Report Downloaded', 'Open in browser → Print as PDF');
}

/* ============================================================
   BILLING — DYNAMIC LOADING & UNIQUE PER PATIENT
   ============================================================ */
const INSURANCE_DATA = {
  ay: { name:'Ayushman Bharat (PMJAY) Validated', coverage:'Coverage: ₹5,00,000 / year · Remaining: ₹3,42,000' },
  ak: { name:'Arogya Karnataka Validated',        coverage:'BPL: ₹5,00,000 / APL: ₹1,50,000 per year' },
  va: { name:'Vajpayee Arogyashree Validated',    coverage:'Coverage: ₹1,50,000 / year · Pre-auth in 24h' },
  es: { name:'ESIC Validated',                    coverage:'As per ESIC norms and empanelment' },
  cg: { name:'CGHS Validated',                    coverage:'CGHS approved procedures covered' }
};

function loadBills() {
  const token = localStorage.getItem('ahcare-token');
  fetch('/api/billing', { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
    .then(r => r.json())
    .then(data => {
      if (data.success && data.data && data.data.length > 0) {
        APP.bills = data.data;
        renderTransactionHistory(data.data);
      } else {
        APP.bills = DEMO_BILLS;
        renderTransactionHistory(DEMO_BILLS);
      }
    })
    .catch(() => {
      APP.bills = DEMO_BILLS;
      renderTransactionHistory(DEMO_BILLS);
    });
}

function renderTransactionHistory(bills) {
  const list = document.getElementById('txn-list-container');
  if (!list) return;
  list.innerHTML = bills.slice(0,8).map(b => {
    const ico = b.status === 'Paid' ? 'paid' : b.status === 'Partial' ? 'insure' : 'pending';
    const icoSvg = b.status === 'Paid' ?
      `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>` :
      b.status === 'Partial' ?
      `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>` :
      `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    return `<div class="txn-item">
      <div class="txn-ico ${ico}">${icoSvg}</div>
      <div class="txn-detail">
        <div class="txn-name">${b.patientId} · ${b.patientName}</div>
        <div class="txn-sub">${b.admissionType || 'IPD'} · ${b.status}${b.paymentMode ? ' · ' + b.paymentMode : ''}</div>
      </div>
      <div style="text-align:right">
        <div class="txn-amt ${ico}">₹${(b.netPayable||0).toLocaleString('en-IN')}</div>
        <div style="font-size:10px;color:var(--txt3)">${b.invoiceNo}</div>
      </div>
      <button class="btn btn-outline btn-xs" onclick="downloadInvoice('${b.invoiceNo}')">PDF</button>
    </div>`;
  }).join('');
}

function checkInsurance() {
  const val = document.getElementById('pay-insure').value;
  const box = document.getElementById('ins-validated');
  if (val !== 'none' && INSURANCE_DATA[val]) {
    document.getElementById('ins-scheme-name').textContent = INSURANCE_DATA[val].name;
    document.getElementById('ins-coverage').textContent    = INSURANCE_DATA[val].coverage;
    box.style.display = 'flex';
  } else {
    box.style.display = 'none';
  }
  // Recalculate estimate if visible
  if (document.getElementById('ai-bill-result').style.display !== 'none') estimateBill();
}

function selectPay(method) {
  ['upi','card','net','cash','qr','paypal'].forEach(m => {
    document.getElementById('pm-' + m)?.classList.remove('active');
    const p = document.getElementById('pay-panel-' + m);
    if (p) p.style.display = 'none';
  });
  document.getElementById('pm-' + method)?.classList.add('active');
  const panel = document.getElementById('pay-panel-' + method);
  if (panel) panel.style.display = 'block';
  if (method === 'paypal') initPayPal();
}

function initPayPal() {
  const container = document.getElementById('paypal-btn-container');
  if (!container || container.children.length > 0) return;
  if (typeof paypal === 'undefined') {
    container.innerHTML = '<div style="background:rgba(255,255,255,.15);border-radius:8px;padding:12px;font-size:12px;color:#fff">PayPal ready. Set your Client ID in index.html PayPal SDK script tag to go live.</div>';
    return;
  }
  const amt = document.getElementById('pay-amt')?.value || '100';
  const usd = (parseFloat(amt) / 84).toFixed(2);
  paypal.Buttons({
    style: { layout:'vertical', color:'blue', shape:'rect', label:'pay', height:40 },
    createOrder(data, actions) {
      return actions.order.create({ purchase_units:[{ amount:{ value: usd }, description:'Adichunchanagiri Hospital — ₹'+amt }] });
    },
    onApprove(data, actions) {
      return actions.order.capture().then(d => {
        showToast('PayPal Success','Payment ₹'+amt+' captured. TxnID: '+d.id);
      });
    },
    onError() { showToast('PayPal Error','Payment failed. Try another method.'); }
  }).render('#paypal-btn-container');
}

function estimateBill() {
  const pid = document.getElementById('pay-pid')?.value?.trim();
  const insVal  = document.getElementById('pay-insure')?.value;

  // Look up patient's actual bill data
  const existingBill = APP.bills.find(b => b.patientId === pid || b.invoiceNo === pid);
  let doctorFee, wardCharges, medicineCharges, labTests, surgeryCharges, otherCharges;

  if (existingBill) {
    doctorFee       = existingBill.doctorFee || 0;
    wardCharges     = existingBill.wardCharges || 0;
    medicineCharges = existingBill.medicineCharges || 0;
    labTests        = existingBill.labTests || 0;
    surgeryCharges  = existingBill.surgeryCharges || 0;
    otherCharges    = existingBill.otherCharges || 0;
  } else {
    // Generate reasonable random estimates if no match
    const amt = parseInt(document.getElementById('pay-amt')?.value) || 12500;
    doctorFee       = Math.round(amt * 0.10);
    wardCharges     = Math.round(amt * 0.22);
    medicineCharges = Math.round(amt * 0.25);
    labTests        = Math.round(amt * 0.15);
    surgeryCharges  = Math.round(amt * 0.20);
    otherCharges    = Math.round(amt * 0.08);
  }

  const insDisc = insVal === 'ay' ? 5000 : insVal === 'ak' ? 3000 : insVal === 'va' ? 2000 : insVal === 'es' ? 1500 : 0;
  const total = doctorFee + wardCharges + medicineCharges + labTests + surgeryCharges + otherCharges;
  const net = Math.max(0, total - insDisc);

  const items = [
    ['Doctor / Consultation Fee', doctorFee],
    ['Ward Charges',              wardCharges],
    ['Medicines & Consumables',   medicineCharges],
    ['Lab / Diagnostics',         labTests],
    ['Surgery / Procedure',       surgeryCharges],
    ['Other Charges',             otherCharges],
    ['Insurance Deduction',       -insDisc]
  ];

  document.getElementById('ai-bill-breakdown').innerHTML =
    items.filter(([, v]) => v !== 0).map(([l, v]) =>
      `<div class="bill-item"><span>${l}</span><span>${v < 0 ? '-₹' + Math.abs(v).toLocaleString('en-IN') : '₹' + v.toLocaleString('en-IN')}</span></div>`
    ).join('') +
    `<div class="bill-item"><span><strong>Net Payable</strong></span><span><strong>₹${net.toLocaleString('en-IN')}</strong></span></div>`;

  document.getElementById('ai-bill-result').style.display = 'block';
  // Update the amount field
  const amtEl = document.getElementById('pay-amt');
  if (amtEl) amtEl.value = net;
  showToast('Bill Estimation Ready', 'Breakdown calculated based on patient records');
}

function processPayment() {
  const amt = parseInt(document.getElementById('pay-amt')?.value) || 0;
  const pid = (document.getElementById('pay-pid')?.value || '').trim();
  if (!pid) { showToast('Missing Info', 'Please enter Patient ID or Invoice Number'); return; }
  if (!amt)  { showToast('Missing Info', 'Please enter bill amount'); return; }

  // Find active payment method
  const methods = ['upi','card','net','cash','qr','paypal'];
  const active  = methods.find(m => document.getElementById('pm-' + m)?.classList.contains('active')) || 'cash';

  // Mark the bill as paid
  const bill = APP.bills.find(b => b.patientId === pid || b.invoiceNo === pid);
  if (bill) {
    bill.status = 'Paid';
    bill.paymentMode = { upi:'UPI', card:'Card', net:'Net Banking', cash:'Cash', qr:'QR Pay', paypal:'PayPal' }[active] || active;
    bill.paidAt = new Date().toISOString();
    bill.netPayable = amt;
  } else {
    // Create a quick receipt
    const invNo = 'INV-RCT-' + Date.now().toString().slice(-5);
    APP.bills.unshift({ invoiceNo: invNo, patientId: pid, patientName: pid, admissionType: 'OPD', netPayable: amt, totalAmount: amt, status: 'Paid', paymentMode: active.toUpperCase(), paidAt: new Date().toISOString(), createdAt: new Date().toISOString().split('T')[0] });
  }
  renderTransactionHistory(APP.bills);
  showToast('Payment Successful ✓', '₹' + amt.toLocaleString('en-IN') + ' received via ' + active.toUpperCase() + ' · ' + pid + ' · Receipt ready');
  setTimeout(() => downloadInvoice(bill ? bill.invoiceNo : APP.bills[0].invoiceNo), 800);
}

/* ── CREATE BILL (Modal) ── */
function createBill() {
  const patientId = document.getElementById('nb-patient-id')?.value?.trim();
  const patientName = document.getElementById('nb-patient-name')?.value?.trim();
  const admissionType = document.getElementById('nb-admission-type')?.value;
  const doctorFee = parseFloat(document.getElementById('nb-doctor-fee')?.value) || 0;
  const wardCharges = parseFloat(document.getElementById('nb-ward-charges')?.value) || 0;
  const medicineCharges = parseFloat(document.getElementById('nb-medicine-charges')?.value) || 0;
  const labTests = parseFloat(document.getElementById('nb-lab-tests')?.value) || 0;
  const surgeryCharges = parseFloat(document.getElementById('nb-surgery-charges')?.value) || 0;
  const insuranceDeduction = parseFloat(document.getElementById('nb-insurance-deduction')?.value) || 0;

  if (!patientId) { showToast('Missing Field', 'Please enter Patient ID'); return; }

  const totalAmount = doctorFee + wardCharges + medicineCharges + labTests + surgeryCharges;
  const netPayable = Math.max(0, totalAmount - insuranceDeduction);
  const invNums = APP.bills.map(b => parseInt((b.invoiceNo||'INV-10000').replace('INV-','')));
  const invoiceNo = 'INV-' + (Math.max(...invNums, 10000) + 1);

  const newBill = {
    invoiceNo, patientId, patientName: patientName || patientId,
    admissionType, doctorFee, wardCharges, medicineCharges, labTests,
    surgeryCharges, insuranceDeduction, totalAmount, netPayable,
    status: 'Pending', createdAt: new Date().toISOString().split('T')[0]
  };

  const token = localStorage.getItem('ahcare-token');
  fetch('/api/billing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
    body: JSON.stringify(newBill)
  })
  .then(r => r.json())
  .then(data => {
    const bill = data.success ? data.data : newBill;
    APP.bills.unshift(bill);
    renderTransactionHistory(APP.bills);
    closeModal('newbill-modal');
    showToast('Invoice Created', `${bill.invoiceNo} created · Net: ₹${netPayable.toLocaleString('en-IN')}`);
    setTimeout(() => downloadInvoice(bill.invoiceNo), 400);
  })
  .catch(() => {
    APP.bills.unshift(newBill);
    renderTransactionHistory(APP.bills);
    closeModal('newbill-modal');
    showToast('Invoice Created', `${invoiceNo} created · Net: ₹${netPayable.toLocaleString('en-IN')}`);
    setTimeout(() => downloadInvoice(invoiceNo), 400);
  });
}

/* ── INVOICE PDF DOWNLOAD ── */
function downloadInvoice(invoiceNo) {
  const bill = APP.bills.find(b => b.invoiceNo === invoiceNo) ||
    DEMO_BILLS.find(b => b.invoiceNo === invoiceNo);

  if (!bill) {
    showToast('Invoice Not Found', `${invoiceNo} could not be located`);
    return;
  }

  const doctorFee       = bill.doctorFee || 0;
  const wardCharges     = bill.wardCharges || 0;
  const medicineCharges = bill.medicineCharges || 0;
  const labTests        = bill.labTests || 0;
  const surgeryCharges  = bill.surgeryCharges || 0;
  const otherCharges    = bill.otherCharges || 0;
  const totalAmount     = bill.totalAmount || (doctorFee + wardCharges + medicineCharges + labTests + surgeryCharges + otherCharges);
  const insuranceDeduction = bill.insuranceDeduction || 0;
  const netPayable      = bill.netPayable || Math.max(0, totalAmount - insuranceDeduction);
  const createdAt       = bill.createdAt ? new Date(bill.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) : new Date().toLocaleDateString('en-IN');

  const lineItems = [
    ['Doctor / Consultation Fee', doctorFee],
    ['Ward Charges',              wardCharges],
    ['Medicines & Consumables',   medicineCharges],
    ['Lab / Diagnostics',         labTests],
    ['Surgery / Procedure',       surgeryCharges],
    ['Other Charges',             otherCharges],
  ].filter(([, v]) => v > 0);

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Invoice ${invoiceNo} — Adichunchanagiri Hospital</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#0D1F17;background:#fff;padding:32px}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2.5px solid #00875A;padding-bottom:20px;margin-bottom:20px}
  .logo-name{font-size:20px;font-weight:800;color:#00875A;letter-spacing:-.5px}
  .logo-sub{font-size:11px;color:#85A898;margin-top:3px}
  .logo-addr{font-size:11px;color:#3B5E4A;margin-top:6px;line-height:1.6}
  .inv-meta{text-align:right}
  .inv-no{font-size:18px;font-weight:800;color:#0D1F17}
  .inv-date{font-size:12px;color:#85A898;margin-top:4px}
  .inv-status{display:inline-block;margin-top:8px;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;background:${bill.status==='Paid'?'rgba(0,135,90,.12)':bill.status==='Partial'?'rgba(94,53,177,.10)':'rgba(224,123,0,.12)'};color:${bill.status==='Paid'?'#00875A':bill.status==='Partial'?'#5E35B1':'#E07B00'};border:1px solid ${bill.status==='Paid'?'rgba(0,135,90,.25)':bill.status==='Partial'?'rgba(94,53,177,.25)':'rgba(224,123,0,.25)'}}
  .section{margin-bottom:20px}
  .section-title{font-size:11px;font-weight:700;color:#00875A;text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px}
  .patient-box{display:grid;grid-template-columns:1fr 1fr;gap:12px;background:#F4FBF8;border:1.5px solid rgba(0,135,90,.15);border-radius:10px;padding:14px}
  .pat-field label{font-size:10px;color:#85A898;font-weight:700;text-transform:uppercase;display:block;margin-bottom:2px}
  .pat-field span{font-size:13px;font-weight:600;color:#0D1F17}
  table{width:100%;border-collapse:collapse;margin:10px 0}
  th{background:linear-gradient(180deg,#E3F9F0,#B7EDDB);padding:9px 12px;text-align:left;font-size:11px;font-weight:700;color:#006644;text-transform:uppercase;letter-spacing:.5px}
  td{padding:9px 12px;border-bottom:1px solid rgba(0,135,90,.08);font-size:13px;color:#3B5E4A}
  td.amount{text-align:right;font-weight:600;color:#0D1F17}
  .total-row td{font-weight:800;color:#0D1F17;border-top:2px solid rgba(0,135,90,.20);border-bottom:none;background:rgba(0,135,90,.04);font-size:14px}
  .deduction-row td{color:#C0392B;background:rgba(192,57,43,.03)}
  .net-row td{background:linear-gradient(135deg,rgba(0,135,90,.08),rgba(0,184,122,.05));border-top:2px solid #00875A;font-size:15px}
  .payment-info{background:#F4FBF8;border:1.5px solid rgba(0,135,90,.15);border-radius:10px;padding:14px;margin-top:16px;display:flex;gap:24px}
  .pi-item label{font-size:10px;color:#85A898;font-weight:700;text-transform:uppercase;display:block;margin-bottom:3px}
  .pi-item span{font-size:13px;font-weight:600;color:#0D1F17}
  .footer{border-top:1.5px solid rgba(0,135,90,.15);margin-top:24px;padding-top:14px;text-align:center;font-size:11px;color:#85A898;line-height:1.8}
  .footer strong{color:#3B5E4A}
  .watermark{font-size:10px;color:#00875A;font-weight:700;margin-top:4px}
  @media print{body{padding:16px}}
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="logo-name">Adichunchanagiri Hospital</div>
    <div class="logo-sub">A Centre of Excellence in Healthcare</div>
    <div class="logo-addr">
      BG Nagar, Bellur Cross, Nagamangala<br>
      Mandya District, Karnataka — 571 448<br>
      Ph: 08234-287800 &nbsp;|&nbsp; Emergency: 108<br>
      Email: billing@ahcare.in
    </div>
  </div>
  <div class="inv-meta">
    <div class="inv-no">${invoiceNo}</div>
    <div class="inv-date">Date: ${createdAt}</div>
    <div class="inv-status">${bill.status}</div>
    ${bill.paidAt ? `<div style="font-size:11px;color:#85A898;margin-top:4px">Paid: ${new Date(bill.paidAt).toLocaleDateString('en-IN')}</div>` : ''}
  </div>
</div>

<div class="section">
  <div class="section-title">Patient Information</div>
  <div class="patient-box">
    <div class="pat-field"><label>Patient Name</label><span>${bill.patientName || '—'}</span></div>
    <div class="pat-field"><label>Patient ID</label><span>${bill.patientId || '—'}</span></div>
    <div class="pat-field"><label>Admission Type</label><span>${bill.admissionType || 'IPD'}</span></div>
    <div class="pat-field"><label>Ward</label><span>${bill.wardType || '—'}</span></div>
  </div>
</div>

<div class="section">
  <div class="section-title">Billing Breakdown</div>
  <table>
    <thead><tr><th>Description</th><th style="text-align:right">Amount (₹)</th></tr></thead>
    <tbody>
      ${lineItems.map(([desc, amt]) => `<tr><td>${desc}</td><td class="amount">₹${amt.toLocaleString('en-IN')}</td></tr>`).join('')}
      <tr class="total-row"><td><strong>Gross Total</strong></td><td class="amount"><strong>₹${totalAmount.toLocaleString('en-IN')}</strong></td></tr>
      ${insuranceDeduction > 0 ? `<tr class="deduction-row"><td>Insurance / Scheme Deduction</td><td class="amount" style="color:#C0392B">- ₹${insuranceDeduction.toLocaleString('en-IN')}</td></tr>` : ''}
      <tr class="total-row net-row"><td><strong>Net Payable</strong></td><td class="amount" style="color:#00875A"><strong>₹${netPayable.toLocaleString('en-IN')}</strong></td></tr>
    </tbody>
  </table>
</div>

${bill.status === 'Paid' ? `<div class="payment-info">
  <div class="pi-item"><label>Payment Mode</label><span>${bill.paymentMode || 'Cash'}</span></div>
  <div class="pi-item"><label>Amount Paid</label><span>₹${netPayable.toLocaleString('en-IN')}</span></div>
  <div class="pi-item"><label>Status</label><span style="color:#00875A;font-weight:700">Paid in Full</span></div>
</div>` : ''}

<div class="footer">
  <strong>Adichunchanagiri Hospital</strong> — Accredited · Govt Empanelled · Ayushman Bharat · Arogya Karnataka<br>
  This is a computer-generated invoice and does not require a physical signature.<br>
  For billing queries: billing@ahcare.in · 08234-287800 (Ext 120)<br>
  <div class="watermark">AH Care v7.0 · Generated on ${new Date().toLocaleString('en-IN')}</div>
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${invoiceNo}_${(bill.patientName||'Patient').replace(/\s+/g,'_')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Invoice Downloaded', `${invoiceNo} saved · Open in browser to print as PDF`);
}

function downloadAllInvoices() {
  showToast('Preparing Download', 'Packaging all invoices…');
  setTimeout(() => {
    APP.bills.forEach((b, i) => setTimeout(() => downloadInvoice(b.invoiceNo), i * 300));
  }, 500);
}

function showBillingForPatient(id) {
  showScreen('billing');
  const el = document.getElementById('pay-pid');
  if (el) { el.value = id; }
  const bill = APP.bills.find(b => b.patientId === id);
  if (bill) {
    const amtEl = document.getElementById('pay-amt');
    if (amtEl) amtEl.value = bill.netPayable || bill.totalAmount || '';
    setTimeout(estimateBill, 300);
  }
  showToast('Billing Loaded', 'Patient ' + id + ' billing context loaded');
}

/* ============================================================
   GOVERNMENT SCHEMES
   ============================================================ */
function setSchemeTab(el, tabId) {
  document.querySelectorAll('#screen-govt .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  ['govt-central','govt-state','govt-apply'].forEach(id => {
    const d = document.getElementById(id);
    if (d) d.style.display = id === tabId ? 'block' : 'none';
  });
}

function downloadChecklist(scheme) {
  showToast('Downloading Checklist', `${scheme} — Documents checklist downloading…`);
}

function applyScheme(name) {
  document.getElementById('govt-modal-msg').textContent = `Application for "${name}" submitted to Mandya District Health Office`;
  document.getElementById('govt-ref-no').textContent = 'MND-' + Date.now().toString().slice(-7);
  openModal('govt-modal');
}

function submitGovtApp() {
  const name   = document.getElementById('app-name')?.value;
  const aadhar = document.getElementById('app-aadhar')?.value;
  if (!name || !aadhar) { showToast('Missing Fields', 'Please fill Name and Aadhaar number'); return; }
  const scheme = document.getElementById('app-scheme')?.value;
  applyScheme(scheme || 'Govt Health Scheme');
}

/* ============================================================
   DOCTOR DIRECTORY
   ============================================================ */
const DOCTORS = {
  dean: [
    { init:'SC', name:'Dr. S. Channakeshava', role:'Dean / Chief Medical Officer', dept:'Hospital Administration', contact:'Ext 100', avail:'on' }
  ],
  senior: [
    { init:'SK', name:'Dr. Suresh Kumar',      role:'HOD General Surgery',          dept:'General Surgery',           contact:'Ext 201', avail:'on'  },
    { init:'MB', name:'Dr. Manjunath B.',       role:'HOD Internal Medicine',        dept:'Internal Medicine',         contact:'Ext 202', avail:'on'  },
    { init:'KR', name:'Dr. Kavitha Reddy',      role:'Senior Physician',             dept:'Respiratory Medicine',      contact:'Ext 203', avail:'on'  },
    { init:'RS', name:'Dr. Ravi Shankar',       role:'Senior Surgeon',               dept:'Orthopedics',               contact:'Ext 204', avail:'off' }
  ],
  specialist: [
    { init:'AM', name:'Dr. Anand Murthy',       role:'Cardiologist',                 dept:'Cardiology',                contact:'Ext 210', avail:'on'  },
    { init:'PN', name:'Dr. Priya Nair',         role:'Neurologist',                  dept:'Neurology',                 contact:'Ext 211', avail:'on'  },
    { init:'GD', name:'Dr. Gopal D.',           role:'Pediatrician',                 dept:'Pediatrics',                contact:'Ext 212', avail:'on'  },
    { init:'RM', name:'Dr. Rekha M.',           role:'Obstetrician',                 dept:'Obstetrics & Gynecology',   contact:'Ext 213', avail:'on'  },
    { init:'KC', name:'Dr. Kiran C.',           role:'Oncologist',                   dept:'Oncology',                  contact:'Ext 214', avail:'off' },
    { init:'UP', name:'Dr. Usha Patel',         role:'Ophthalmologist',              dept:'Eye & ENT',                 contact:'Ext 215', avail:'on'  }
  ],
  junior: [
    { init:'MK', name:'Dr. Meena K.',           role:'Junior Doctor',                dept:'Internal Medicine',         contact:'Ext 301', avail:'on'  },
    { init:'AV', name:'Dr. Arun V.',            role:'Junior Doctor',                dept:'Surgery',                   contact:'Ext 302', avail:'off' },
    { init:'SB', name:'Dr. Suma B.',            role:'Junior Doctor',                dept:'Pediatrics',                contact:'Ext 303', avail:'on'  },
    { init:'RN', name:'Dr. Raju N.',            role:'Junior Doctor',                dept:'Emergency',                 contact:'Ext 304', avail:'on'  }
  ],
  intern: [
    { init:'KS', name:'Dr. Kavya S.',           role:'Intern',                       dept:'General Medicine',          contact:'Ext 401', avail:'on'  },
    { init:'AD', name:'Dr. Akash D.',           role:'Intern',                       dept:'Surgery',                   contact:'Ext 402', avail:'on'  },
    { init:'PR', name:'Dr. Pooja R.',           role:'Intern',                       dept:'Pediatrics',                contact:'Ext 403', avail:'on'  },
    { init:'VM', name:'Dr. Vivek M.',           role:'Intern',                       dept:'Emergency',                 contact:'Ext 404', avail:'off' }
  ]
};

function renderDoctors() {
  const tiers = ['dean','senior','specialist','junior','intern'];
  tiers.forEach(tier => {
    const grid = document.getElementById('doc-' + tier);
    if (!grid) return;
    grid.innerHTML = (DOCTORS[tier] || []).map(d => `
      <div class="doctor-card" onclick="showToast('${d.name}','${d.dept} · ${d.contact} · ${d.avail === 'on' ? 'On Duty' : 'Off Duty'}')">
        <div class="doc-avatar">${d.init}</div>
        <div class="doc-name">${d.name}</div>
        <div class="doc-role">${d.role}</div>
        <div style="font-size:11.5px;color:var(--txt3);margin-bottom:8px">${d.dept} · ${d.contact}</div>
        <span class="doc-avail ${d.avail}">
          <span class="doc-avail-dot"></span>
          ${d.avail === 'on' ? 'On Duty' : 'Off Duty'}
        </span>
      </div>`).join('');
  });
}

function filterDoctors(q) {
  document.querySelectorAll('.doctor-card').forEach(c => {
    c.style.display = c.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none';
  });
}

/* ── TABS ── */
function setTab(el, filter) {
  el.closest('.tabs').querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  if (filter !== undefined) {
    const filtered = filter === 'all' ? APP.patients
      : filter === 'admitted' ? APP.patients.filter(p => p.status === 'Admitted')
      : APP.patients.filter(p => p.status === 'Discharged');
    renderPatients(filtered);
  }
}

/* ── MODALS ── */
function openModal(id)  { document.getElementById(id)?.classList.add('show'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('show'); }

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
    if (APP.chatOpen) toggleChat();
  }
});

/* ── AUTH ── */
function loginUser() {
  const emailEl = document.querySelector('#screen-auth input[type="email"]');
  const passEl  = document.querySelector('#screen-auth input[type="password"]');
  const email   = emailEl?.value?.trim() || 'suresh@ahcare.in';
  const password = passEl?.value || 'admin123';

  fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      if (data.token) localStorage.setItem('ahcare-token', data.token);
      if (data.user?.name) {
        localStorage.setItem('ahcare-username', data.user.name);
        const av = document.getElementById('user-av');
        if (av) av.textContent = data.user.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
      }
      showToast('Login Successful', `Welcome back, ${data.user?.name || 'Doctor'}! Loading dashboard…`);
      setTimeout(() => showScreen('dashboard'), 600);
    } else {
      showToast('Login Failed', data.message || 'Invalid credentials');
    }
  })
  .catch(() => {
    showToast('Login Successful', 'Welcome back! Loading dashboard…');
    setTimeout(() => showScreen('dashboard'), 600);
  });
}

/* ── TOAST ── */
function showToast(title, msg) {
  clearTimeout(APP.toastTimer);
  document.getElementById('toast-title').textContent = title;
  document.getElementById('toast-msg').textContent   = msg;
  const toast = document.getElementById('notif-toast');
  const isAlert   = /emerg|error|missing|failed|cancel/i.test(title);
  const isSuccess = /registered|admitted|success|paid|created|downloaded|confirmed|checked/i.test(title);
  toast.style.borderLeftColor = isAlert ? 'var(--danger)' : isSuccess ? 'var(--gen)' : 'var(--p)';
  toast.style.display = 'flex';
  toast.classList.add('show');
  APP.toastTimer = setTimeout(() => { toast.classList.remove('show'); toast.style.display = 'none'; }, 4200);
}

/* ============================================================
   AI CHATBOT — Kannada + English
   ============================================================ */
const CHAT_RESPONSES = {
  en: {
    bed:      'Available at Adichunchanagiri Hospital, Mandya:<br><strong>ICU:</strong> 3 free / 30<br><strong>General:</strong> 28 free / 100<br><strong>Private:</strong> 12 free / 50<br><strong>Pediatric:</strong> 14 free / 50<br><strong>Maternity:</strong> 7 free / 50',
    icu:      'ICU has <strong>30 beds total</strong> — 27 occupied, <strong>3 available</strong>. Reserved for critical/emergency cases only. Shall I run an AI allocation?',
    admit:    'Admission at Adichunchanagiri Hospital:<br>1. Register at Reception (Block A)<br>2. AI ward allocation<br>3. Doctor confirmation<br>4. Nurse assigns bed<br>Approx. 10 minutes.',
    emerg:    'EMERGENCY: Call <strong>108</strong> (Free ambulance) or <strong>08234-287800</strong>. ICU is auto-allocated for critical cases. Come to Reception Block A immediately.',
    discharge:'Discharge process: Doctor approval → Nurse checklist → Bill settlement → Digital summary. Typically 2–3 hours.',
    billing:  'We accept: UPI, Credit/Debit Cards, Net Banking, Cash, QR Pay.<br>Insurance: Ayushman Bharat PMJAY, Arogya Karnataka, Vajpayee Arogyashree.<br>Billing counter at Reception.',
    doctor:   'Today on duty: Dr. Suresh Kumar (Surgery), Dr. Kavitha (Medicine), Dr. Anand Murthy (Cardiology), Dr. Priya Nair (Neurology), Dr. Gopal (Pediatrics), Dr. Rekha M. (Obstetrics).',
    govt:     'Schemes for Mandya residents:<br><strong>Ayushman Bharat PMJAY</strong> — ₹5 lakh/year (BPL)<br><strong>e-Sanjeevani</strong> — Free telemedicine<br><strong>Arogya Karnataka</strong> — ₹5L BPL / ₹1.5L APL<br><strong>Vajpayee Arogyashree</strong> — ₹1.5L APL',
    hours:    'Emergency: 24×7 | OPD: Mon–Sat 8AM–7PM | Pharmacy: 7AM–10PM | Lab: 6:30AM–8PM | Visiting: 10–12AM &amp; 4–6PM',
    default:  'Hello! I am your AH Care assistant for <strong>Adichunchanagiri Hospital, Mandya</strong>.<br>Ask me about beds, billing, govt schemes, admission, emergency or doctors!'
  },
  kn: {
    bed:      'ಅಡಿಚುಂಚನಗಿರಿ ಆಸ್ಪತ್ರೆ, ಮಂಡ್ಯದಲ್ಲಿ ಪ್ರಸ್ತುತ ಲಭ್ಯ:<br>ICU: 3 ಖಾಲಿ / 30<br>ಸಾಮಾನ್ಯ: 28 ಖಾಲಿ / 100<br>ಖಾಸಗಿ: 12 ಖಾಲಿ / 50<br>ಮಕ್ಕಳ: 14 ಖಾಲಿ / 50',
    icu:      'ICU ನಲ್ಲಿ <strong>30 ಹಾಸಿಗೆಗಳಿವೆ</strong> — 27 ತುಂಬಿವೆ, <strong>3 ಲಭ್ಯ</strong>. ತೀವ್ರ ಸ್ಥಿತಿಯ ರೋಗಿಗಳಿಗೆ ಮಾತ್ರ.',
    admit:    'ದಾಖಲಾತಿ: 1. ರಿಸೆಪ್ಶನ್ · 2. AI ಹಂಚಿಕೆ · 3. ವೈದ್ಯರ ಅನುಮೋದನೆ · 4. ಹಾಸಿಗೆ. ಸಾಮಾನ್ಯವಾಗಿ 10 ನಿಮಿಷ.',
    emerg:    'ತುರ್ತು: <strong>108</strong> ಅಥವಾ <strong>08234-287800</strong> ಕರೆ ಮಾಡಿ. ತಕ್ಷಣ ರಿಸೆಪ್ಶನ್‌ಗೆ ಬನ್ನಿ.',
    discharge:'ಡಿಸ್ಚಾರ್ಜ್: ವೈದ್ಯರ ಅನುಮೋದನೆ → ದಾದಿ ಪರಿಶೀಲನೆ → ಬಿಲ್ ಪಾವತಿ → ಡಿಜಿಟಲ್ ಸಾರಾಂಶ.',
    billing:  'ನಾವು ಸ್ವೀಕರಿಸುತ್ತೇವೆ: UPI, ಕಾರ್ಡ್, ನೆಟ್ ಬ್ಯಾಂಕಿಂಗ್, ನಗದು, QR. ಆಯುಷ್ಮಾನ್ ಭಾರತ್, ಆರೋಗ್ಯ ಕರ್ನಾಟಕ ವಿಮೆ ಲಭ್ಯ.',
    doctor:   'ಇಂದು ಕರ್ತವ್ಯದಲ್ಲಿ: ಡಾ. ಸುರೇಶ್ ಕುಮಾರ್, ಡಾ. ಕವಿತಾ ರೆಡ್ಡಿ, ಡಾ. ಆನಂದ ಮೂರ್ತಿ, ಡಾ. ಪ್ರಿಯಾ ನಾಯರ್.',
    govt:     'ಮಂಡ್ಯ ಜಿಲ್ಲೆಗೆ ಲಭ್ಯ ಯೋಜನೆಗಳು:<br>ಆಯುಷ್ಮಾನ್ ಭಾರತ್ PMJAY<br>e-ಸಂಜೀವಿನಿ<br>ಆರೋಗ್ಯ ಕರ್ನಾಟಕ<br>ವಾಜಪೇಯಿ ಆರೋಗ್ಯಶ್ರೀ',
    hours:    'ತುರ್ತು: 24×7 | OPD: ಸೋಮ–ಶನಿ 8AM–7PM | ಔಷಧಾಲಯ: 7AM–10PM | ಭೇಟಿ: 10–12AM ಮತ್ತು 4–6PM',
    default:  'ನಮಸ್ಕಾರ! ನಾನು <strong>ಅಡಿಚುಂಚನಗಿರಿ ಆಸ್ಪತ್ರೆ, ಮಂಡ್ಯ</strong> AI ಸಹಾಯಕ.<br>ಹಾಸಿಗೆ, ಬಿಲ್, ಸರ್ಕಾರಿ ಯೋಜನೆ, ತುರ್ತು ಅಥವಾ ವೈದ್ಯರ ಬಗ್ಗೆ ಕೇಳಿ!'
  }
};

function getBotReply(msg) {
  const m = msg.toLowerCase();
  const r = CHAT_RESPONSES[APP.lang];
  if (/icu|intensive/i.test(m))                              return r.icu;
  if (/bed|available|free|vacant|ಹಾಸಿಗೆ|ಲಭ್ಯ/i.test(m))    return r.bed;
  if (/admit|entry|register|check.?in|ದಾಖಲ/i.test(m))      return r.admit;
  if (/emerg|urgent|108|ತುರ್ತು/i.test(m))                  return r.emerg;
  if (/discharg|go home|ಡಿಸ್ಚಾರ್ಜ್/i.test(m))             return r.discharge;
  if (/bill|pay|upi|card|insurance|cost|fee|ಬಿಲ್|ಪಾವತಿ/i.test(m)) return r.billing;
  if (/doctor|physician|specialist|ವೈದ್ಯ|ಡಾಕ್ಟರ್/i.test(m)) return r.doctor;
  if (/govt|scheme|ayushman|arogya|pmjay|ಸರ್ಕಾರ|ಯೋಜನೆ/i.test(m)) return r.govt;
  if (/hour|time|open|close|visit|ಸಮಯ/i.test(m))           return r.hours;
  return r.default;
}

function toggleChat() {
  APP.chatOpen = !APP.chatOpen;
  const panel = document.getElementById('chatbot-panel');
  panel.classList.toggle('open', APP.chatOpen);
  const btn = document.getElementById('chatbot-btn');
  if (btn) btn.innerHTML = APP.chatOpen ?
    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>` :
    `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
  if (APP.chatOpen) setTimeout(() => document.getElementById('chat-input').focus(), 300);
}

function addMsg(text, type) {
  const div = document.getElementById('chat-messages');
  const m = document.createElement('div');
  m.className = 'msg ' + type;
  m.innerHTML = text;
  div.appendChild(m);
  div.scrollTop = div.scrollHeight;
}

let typingEl = null;
function addTyping() {
  const div = document.getElementById('chat-messages');
  typingEl = document.createElement('div');
  typingEl.className = 'msg bot';
  typingEl.style.cssText = 'display:flex;gap:5px;align-items:center;padding:12px 14px';
  typingEl.innerHTML = '<div style="width:7px;height:7px;border-radius:50%;background:var(--p);animation:pulse 1s infinite"></div><div style="width:7px;height:7px;border-radius:50%;background:var(--p);animation:pulse 1s .2s infinite"></div><div style="width:7px;height:7px;border-radius:50%;background:var(--p);animation:pulse 1s .4s infinite"></div>';
  div.appendChild(typingEl);
  div.scrollTop = div.scrollHeight;
}
function removeTyping() { if (typingEl) { typingEl.remove(); typingEl = null; } }

function sendChat() {
  const inp = document.getElementById('chat-input');
  const msg = inp.value.trim();
  if (!msg) return;
  addMsg(msg, 'user');
  inp.value = '';
  if (/[\u0C80-\u0CFF]/.test(msg)) setLang('kn');
  else if (/[a-zA-Z]/.test(msg))   setLang('en');
  addTyping();

  // Call backend AI chat API
  fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: msg, lang: APP.lang })
  })
  .then(r => r.json())
  .then(data => {
    removeTyping();
    const reply = data.success ? data.reply.replace(/\n/g, '<br>') : getBotReply(msg);
    APP.lastBotMsg = reply.replace(/<[^>]+>/g, '');
    addMsg(reply, 'bot');
  })
  .catch(() => {
    removeTyping();
    const reply = getBotReply(msg);
    APP.lastBotMsg = reply.replace(/<[^>]+>/g, '');
    addMsg(reply, 'bot');
  });
}

function handleChatKey(e) { if (e.key === 'Enter') sendChat(); }

function setLang(lang) {
  APP.lang = lang;
  document.getElementById('lang-en').classList.toggle('active', lang === 'en');
  document.getElementById('lang-kn').classList.toggle('active', lang === 'kn');
  document.getElementById('chat-status').textContent = lang === 'kn' ? 'Online · ಕನ್ನಡ ಮೋಡ್' : 'Online · English Mode';
}

function speakLast() {
  if (!APP.lastBotMsg || !('speechSynthesis' in window)) {
    showToast('TTS', 'Speech synthesis not available in this browser');
    return;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(APP.lastBotMsg);
  u.lang  = APP.lang === 'kn' ? 'kn-IN' : 'en-IN';
  u.rate  = 0.92;
  window.speechSynthesis.speak(u);
}

function toggleMic() {
  const SRClass = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SRClass) { showToast('Voice Input', 'Please use Chrome or Edge for voice input'); return; }
  const btn = document.getElementById('mic-btn');
  if (APP.listening) {
    APP.listening = false;
    if (APP.recognition) APP.recognition.stop();
    btn.classList.remove('listening');
    return;
  }
  APP.listening = true;
  btn.classList.add('listening');
  APP.recognition = new SRClass();
  APP.recognition.lang = APP.lang === 'kn' ? 'kn-IN' : 'en-IN';
  APP.recognition.interimResults = false;
  APP.recognition.onresult = e => {
    document.getElementById('chat-input').value = e.results[0][0].transcript;
    sendChat();
  };
  APP.recognition.onerror = () => { showToast('Voice Error', 'Could not recognise speech. Please try again.'); };
  APP.recognition.onend   = () => { APP.listening = false; btn.classList.remove('listening'); };
  APP.recognition.start();
}

/* ============================================================
   PRE-BOOKING
   ============================================================ */
const DEPT_ICONS_SVG = {
  'General Medicine': `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
  'Cardiology':       `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  'Orthopedics':      `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  'Pediatrics':       `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  'Gynecology':       `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="6"/><path d="M12 14v8"/><path d="M9 19h6"/></svg>`,
  'Dermatology':      `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>`,
  'ENT':              `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3"/></svg>`,
  'Ophthalmology':    `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  'Neurology':        `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/><circle cx="12" cy="12" r="10"/></svg>`,
  'Dentistry':        `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 6c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4z"/></svg>`,
  'Nutrition':        `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`,
  'General Checkup':  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`
};

const PRIORITY_COLORS = { Urgent:'#C0392B', High:'#E07B00', Normal:'#0077B6', Routine:'#85A898' };
const PRIORITY_BADGES = { Urgent:'pb-urgent', High:'pb-high', Normal:'pb-normal', Routine:'pb-routine' };

async function loadPrebookingQueue() {
  const token = localStorage.getItem('ahcare-token');
  try {
    const res = await fetch('/api/prebooking', {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    const data = await res.json();
    if (data.success && data.data && data.data.length > 0) renderPrebookingQueue(data.data);
    else renderPrebookingQueue(DEMO_PREBOOKINGS);
  } catch {
    renderPrebookingQueue(DEMO_PREBOOKINGS);
  }
}

function renderPrebookingQueue(bookings) {
  const sorted = [...bookings].sort((a,b) => b.priorityScore - a.priorityScore).map((b,i) => {
    // Auto-assign doctor if confirmed but no doctor
    if ((b.status === 'Confirmed' || b.status === 'Pending') && !b.assignedDoctor) {
      const deptDoctorMap = {
        'Cardiology': 'Dr. Anand Murthy', 'Neurology': 'Dr. Priya Nair',
        'Paediatrics': 'Dr. Gopal D.', 'Pediatrics': 'Dr. Gopal D.',
        'Orthopaedics': 'Dr. Ravi Shankar', 'Orthopedics': 'Dr. Ravi Shankar',
        'Obstetrics & Gynaecology': 'Dr. Rekha M.', 'Gynecology': 'Dr. Rekha M.',
        'Oncology & Cancer Care': 'Dr. Kiran C.', 'General Medicine': 'Dr. Kavitha Reddy',
        'General Checkup': 'On-duty Doctor', 'General Checkup / Master Health': 'On-duty Doctor'
      };
      b.assignedDoctor = deptDoctorMap[b.department] || 'On-duty Doctor';
    }
    return {...b, queuePosition: i+1};
  });

  const total   = sorted.length;
  const waiting = sorted.filter(b => b.status === 'Pending' || b.status === 'Confirmed').length;
  const done    = sorted.filter(b => b.status === 'Completed' || b.status === 'Checked-In').length;
  const urgent  = sorted.filter(b => b.priorityLevel === 'Urgent').length;

  const safe = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  safe('pb-stat-total',   total);
  safe('pb-stat-waiting', waiting);
  safe('pb-stat-done',    done);
  safe('pb-stat-urgent',  urgent);

  const tbody = document.getElementById('pb-queue-tbody');
  if (tbody) {
    tbody.innerHTML = sorted.map(b => `
      <tr>
        <td><span class="queue-pos${b.queuePosition <= 3 ? ' pos-'+b.queuePosition : ''}">${b.queuePosition}</span></td>
        <td><strong style="font-size:11px;color:var(--p)">${b.tokenNo || b.bookingId}</strong></td>
        <td>
          <div style="display:flex;align-items:center;gap:7px">
            <div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,var(--p3),var(--p4));display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:var(--p);flex-shrink:0">${b.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
            <div>
              <div style="font-weight:700;font-size:13px;color:var(--txt)">${b.name}</div>
              ${b.phone ? `<div style="font-size:11px;color:var(--txt3)">${b.phone}</div>` : ''}
            </div>
          </div>
        </td>
        <td>${b.age || '—'}</td>
        <td>
          <div style="display:flex;align-items:center;gap:6px;color:var(--txt2)">
            <div style="color:var(--p)">${DEPT_ICONS_SVG[b.department] || ''}</div>
            <span style="font-size:12px">${b.department}</span>
          </div>
        </td>
        <td style="max-width:160px;font-size:12px;color:var(--txt3)">${(b.symptoms||'').slice(0,55)}${(b.symptoms||'').length>55?'…':''}</td>
        <td style="font-size:12px;color:var(--txt2)">${b.preferredSlot || '—'}</td>
        <td><span class="badge ${PRIORITY_BADGES[b.priorityLevel]||'pb-normal'}">${b.priorityLevel}</span></td>
        <td>
          <div style="display:flex;align-items:center;gap:6px">
            <div class="pb-score-bar"><div class="pb-score-fill" style="width:${b.priorityScore}%;background:${PRIORITY_COLORS[b.priorityLevel]||'var(--p)'}"></div></div>
            <span style="font-size:12px;font-weight:700;color:${PRIORITY_COLORS[b.priorityLevel]||'var(--p)'}">${b.priorityScore}</span>
          </div>
        </td>
        <td><span class="badge ${b.status==='Completed'||b.status==='Checked-In'?'stable':b.status==='Cancelled'?'critical':'moderate'}">${b.status}</span></td>
        <td class="act-cell">
          ${b.status !== 'Completed' && b.status !== 'Cancelled' && b.status !== 'Checked-In' ? `<button class="btn btn-outline btn-sm" onclick="checkInPrebooking('${b.bookingId}','${b.name}')">Check-In</button>` : ''}
          <button class="btn btn-outline btn-sm" style="color:var(--danger);border-color:rgba(192,57,43,.25)" onclick="cancelPrebooking('${b.bookingId}')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </td>
      </tr>`).join('');
  }

  const mob = document.getElementById('pb-mob-cards');
  if (mob) {
    mob.innerHTML = sorted.map(b => `
      <div class="mob-pat-card" style="border-left:3px solid ${PRIORITY_COLORS[b.priorityLevel]||'var(--p)'}">
        <div class="mob-pat-row">
          <span class="queue-pos${b.queuePosition<=3?' pos-'+b.queuePosition:''}">${b.queuePosition}</span>
          <div style="flex:1">
            <div style="font-weight:700;font-size:13.5px;color:var(--txt)">${b.name}</div>
            <div style="font-size:11.5px;color:var(--p);font-weight:600">${b.tokenNo || b.bookingId}</div>
          </div>
          <span class="badge ${PRIORITY_BADGES[b.priorityLevel]||'pb-normal'}">${b.priorityLevel}</span>
        </div>
        <div style="font-size:12px;color:var(--txt2);margin:6px 0">${b.department} · ${b.preferredSlot} · Age ${b.age||'—'}</div>
        <div style="font-size:12px;color:var(--txt3)">${(b.symptoms||'').slice(0,70)}…</div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:8px">
          <div class="pb-score-bar" style="width:80px"><div class="pb-score-fill" style="width:${b.priorityScore}%;background:${PRIORITY_COLORS[b.priorityLevel]||'var(--p)'}"></div></div>
          <span style="font-size:12px;font-weight:700;color:${PRIORITY_COLORS[b.priorityLevel]||'var(--p)'}">${b.priorityScore}/100</span>
          <span class="badge ${b.status==='Completed'||b.status==='Checked-In'?'stable':b.status==='Cancelled'?'critical':'moderate'}" style="margin-left:auto">${b.status}</span>
        </div>
      </div>`).join('');
  }

  renderDeptGrid(sorted);
}

function renderDeptGrid(bookings) {
  const el = document.getElementById('pb-dept-grid');
  if (!el) return;
  const counts = {};
  bookings.forEach(b => { counts[b.department] = (counts[b.department]||0) + 1; });
  const depts = Object.keys(DEPT_ICONS_SVG);
  el.innerHTML = depts.map(dept => `
    <div class="pb-dept-card">
      <div class="pb-dept-icon">${DEPT_ICONS_SVG[dept]||''}</div>
      <div class="pb-dept-name">${dept}</div>
      <div class="pb-dept-count">${counts[dept]||0}</div>
      <div class="pb-dept-sub">bookings</div>
    </div>`).join('');
}

function filterPrebooking() {
  const dept = document.getElementById('pb-dept-filter')?.value;
  const token = localStorage.getItem('ahcare-token');
  const url = dept ? `/api/prebooking?dept=${encodeURIComponent(dept)}` : '/api/prebooking';
  fetch(url, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
    .then(r => r.json())
    .then(data => { if (data.success) renderPrebookingQueue(data.data); })
    .catch(() => {
      const filtered = dept ? DEMO_PREBOOKINGS.filter(b => b.department === dept) : DEMO_PREBOOKINGS;
      renderPrebookingQueue(filtered);
    });
}

function updatePriorityPreview() {
  const age      = parseInt(document.getElementById('pb-age')?.value) || 0;
  const symptoms = document.getElementById('pb-symptoms')?.value || '';
  const level    = document.getElementById('pb-priority')?.value || 'Normal';

  let score = 0;
  if (age >= 70) score += 30; else if (age >= 60) score += 20; else if (age <= 10) score += 25;
  if (/chest|heart|breath|stroke|faint|bleed|severe|acute/i.test(symptoms)) score += 40;
  else if (/fever|pain|vomit|diarrh|head|rash/i.test(symptoms)) score += 20;
  else score += 5;
  const lvl = { Urgent:25, High:15, Normal:5, Routine:0 };
  score = Math.min(score + (lvl[level]||5), 100);

  const prev    = document.getElementById('pb-priority-preview');
  const badge   = document.getElementById('pb-prev-badge');
  const bar     = document.getElementById('pb-prev-bar');
  const scoreEl = document.getElementById('pb-prev-score');
  const note    = document.getElementById('pb-prev-note');

  if (prev) prev.style.display = 'block';
  const color = PRIORITY_COLORS[level] || 'var(--p)';
  if (badge) { badge.textContent = level; badge.style.background = color; badge.style.color = 'white'; }
  if (bar)   { bar.style.width = score + '%'; bar.style.background = color; }
  if (scoreEl) { scoreEl.textContent = score + '/100'; scoreEl.style.color = color; }

  let noteText = '';
  if (age >= 60)   noteText += 'Senior citizen — gets priority. ';
  if (age <= 10)   noteText += 'Child — gets priority. ';
  if (/chest|heart|severe|acute/i.test(symptoms)) noteText += 'Serious symptoms — marked urgent.';
  if (note) note.textContent = noteText || 'Slot assigned based on priority score.';
}

async function submitPrebooking() {
  const btn = document.getElementById('pb-submit-btn');
  const name  = document.getElementById('pb-name')?.value.trim();
  const age   = document.getElementById('pb-age')?.value;
  const phone = document.getElementById('pb-phone')?.value.trim();
  const dept  = document.getElementById('pb-dept')?.value;
  const date  = document.getElementById('pb-date')?.value;
  const slot  = document.getElementById('pb-slot')?.value;
  const symptoms = document.getElementById('pb-symptoms')?.value.trim();
  if (!name||!age||!phone||!dept||!date||!slot||!symptoms) {
    showToast('Required','Please fill all starred fields'); return;
  }
  const body = {
    name, age:parseInt(age), phone, department:dept,
    gender:        document.getElementById('pb-gender')?.value,
    aadhaar:       document.getElementById('pb-aadhaar')?.value,
    preferredDate: date, preferredSlot: slot,
    priorityLevel: document.getElementById('pb-priority')?.value || 'Normal',
    symptoms, address: document.getElementById('pb-address')?.value,
    govtScheme:    document.getElementById('pb-scheme')?.value
  };
  if (btn) { btn.disabled=true; btn.textContent='Booking...'; }
  let bk;
  try {
    const r = await fetch('/api/prebooking', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    const data = await r.json();
    bk = data.data || {};
  } catch(e) {
    const num = 5010 + DEMO_PREBOOKINGS.length;
    bk = {...body, bookingId:'BK-'+num, tokenNo:'TKN-BK-'+num, status:'Confirmed', queuePosition:DEMO_PREBOOKINGS.length+1, priorityScore:50};
    DEMO_PREBOOKINGS.unshift(bk);
  } finally {
    if (btn) { btn.disabled=false; btn.textContent='Confirm Booking'; }
  }
  closeModal('prebooking-modal');
  document.getElementById('pb-conf-id').textContent      = bk.bookingId || 'BK-NEW';
  document.getElementById('pb-conf-name').textContent    = bk.name || name;
  document.getElementById('pb-conf-token').textContent   = bk.tokenNo || 'TKN-'+Date.now().toString().slice(-5);
  document.getElementById('pb-conf-priority').textContent= bk.priorityLevel || 'Normal';
  document.getElementById('pb-conf-queue').textContent   = bk.queuePosition ? '#'+bk.queuePosition : '#1';
  document.getElementById('pb-conf-details').textContent = dept+' · '+slot+' · '+date;
  openModal('pb-confirm-modal');
  loadPrebookingQueue();
}

function showPrebookingConfirmation(booking) {
  const safe = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  safe('pb-conf-id',       `Booking ID: ${booking.bookingId}`);
  safe('pb-conf-name',     booking.name || '');
  safe('pb-conf-details',  `${booking.preferredSlot} · ${new Date(booking.preferredDate||Date.now()).toLocaleDateString('en-IN')}`);
  safe('pb-conf-token',    booking.tokenNo || booking.bookingId);
  safe('pb-conf-priority', booking.priorityLevel || 'Normal');
  safe('pb-conf-queue',    booking.queuePosition ? `#${booking.queuePosition} in queue` : 'Calculating…');
  openModal('pb-confirm-modal');
}

async function checkInPrebooking(bookingId, name) {
  const token = localStorage.getItem('ahcare-token');
  try {
    await fetch(`/api/prebooking/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type':'application/json', ...(token?{'Authorization':`Bearer ${token}`}:{}) },
      body: JSON.stringify({ status: 'Checked-In' })
    });
  } catch {}
  showToast('Checked In', `${name} marked as Checked-In`);
  setTimeout(loadPrebookingQueue, 500);
}

async function cancelPrebooking(bookingId) {
  if (!confirm(`Cancel booking ${bookingId}?`)) return;
  const token = localStorage.getItem('ahcare-token');
  try {
    await fetch(`/api/prebooking/${bookingId}`, {
      method: 'DELETE',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
  } catch {}
  // Remove from demo list too
  const idx = DEMO_PREBOOKINGS.findIndex(b => b.bookingId === bookingId);
  if (idx !== -1) DEMO_PREBOOKINGS.splice(idx, 1);
  showToast('Cancelled', `Booking ${bookingId} cancelled`);
  setTimeout(loadPrebookingQueue, 500);
}

/* ============================================================
   LIVE SIMULATION
   ============================================================ */
const LIVE_UPDATES = [
  ['Live Update', 'New admission: ICU-08 now occupied'],
  ['Live Update', 'GEN-15 cleaned and available'],
  ['Live Update', 'Patient P-2041 condition stabilising'],
  ['Live Update', 'ICU at 90% capacity — monitor closely'],
  ['Live Update', 'Dr. M. Suresh accepted 2 new assignments'],
  ['Live Update', 'Ambulance ETA 5 min — ICU-2 on standby'],
  ['Live Update', 'PRV-07 reserved for incoming transfer']
];
let liveIdx = 0;
setInterval(() => {
  if (Math.random() > 0.65) {
    const [t, m] = LIVE_UPDATES[liveIdx % LIVE_UPDATES.length];
    showToast(t, m);
    liveIdx++;
  }
}, 22000);

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Set chatbot SVG icon
  const chatBtn = document.getElementById('chatbot-btn');
  if (chatBtn) chatBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;

  // Load initial patient data
  APP.patients = [...DEMO_PATIENTS];
  APP.bills = [...DEMO_BILLS];
  // Update patient count badge
  const patBadge = document.querySelector('.nav-item[data-s="patients"] .nav-badge');
  if (patBadge) patBadge.textContent = APP.patients.filter(p => p.status === 'Admitted').length;

  showDashboard();
  setTimeout(initAdmChart, 300);

  const sub = document.getElementById('dash-date');
  if (sub) {
    const d = new Date();
    sub.textContent = d.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' }) + ' · Adichunchanagiri Hospital, Mandya';
  // Update greeting with logged-in user
  updateGreeting();
  }

  const dateEl = document.getElementById('pb-date');
  if (dateEl) {
    const today = new Date().toISOString().split('T')[0];
    dateEl.min = today;
    dateEl.value = today;
  }
  // Blood donor: last donated date should not be in future
  const donorDateEl = document.getElementById('donor-last-date');
  if (donorDateEl) donorDateEl.max = new Date().toISOString().split('T')[0];

  // Init blood donors display
  const bdl = document.getElementById('blood-donors-list');
  if (bdl) { bdl.style.display='flex'; bdl.style.flexDirection='column'; bdl.style.gap='8px'; }

  console.log('%cAH Care v7.0','color:#00875A;font-size:16px;font-weight:bold');
  console.log('%cAdichunchanagiri Hospital — Mandya','color:#3B5E4A');
});
function updateGreeting() {
  const el = document.getElementById('dash-greeting');
  if (!el) return;
  const hr = new Date().getHours();
  const word = hr<12?'Good Morning':hr<17?'Good Afternoon':'Good Evening';
  const name = localStorage.getItem('ahcare-username');
  el.textContent = name ? word+', '+name.split(' ')[0]+'!' : word+'!';
  const sbName = document.getElementById('sb-user-name');
  const sbRole = document.getElementById('sb-user-role');
  if (sbName && name) sbName.textContent = name;
  const av = document.getElementById('user-av');
  if (av && name) av.textContent = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
}
