'use strict';
/**
 * AHCare Voice AI — Backend Route
 * Endpoint: POST /api/voiceai/chat
 * Handles: Bilingual (Kannada/English) NLP, hospital context, session memory
 */
const express = require('express');
const router  = express.Router();

/* ── In-memory session store (per sessionId) ── */
const sessions = new Map();
const SESSION_TTL = 30 * 60 * 1000; // 30 min

function getSession(id) {
  if (!sessions.has(id)) sessions.set(id, { history: [], createdAt: Date.now() });
  const s = sessions.get(id);
  s.lastAccess = Date.now();
  return s;
}

/* Cleanup stale sessions every 10 min */
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of sessions.entries()) {
    if (now - (v.lastAccess || v.createdAt) > SESSION_TTL) sessions.delete(k);
  }
}, 10 * 60 * 1000);

/* ── Hospital knowledge base ── */
const HOSPITAL_KB = {
  name: 'Adichunchanagiri Hospital (AH Care)',
  location: 'BG Nagar, Bellur Cross, Nagamangala, Mandya – 571448, Karnataka',
  phone: '+91 08234-287777',
  emergency: '108 / +91 08234-287999',
  timings: 'OPD: 8:00 AM – 6:00 PM | Emergency: 24×7',
  departments: [
    'Cardiology','Neurology','Orthopaedics','Paediatrics','Oncology & Cancer Care',
    'Obstetrics & Gynaecology','General Medicine','Dermatology','Nephrology',
    'Gastroenterology','Urology','Pulmonology','ENT','Ophthalmology','Psychiatry',
    'Radiology','Pathology','Physiotherapy','Dental','Ayurveda'
  ],
  wards: [
    { name:'ICU',       beds:30,  desc:'Critical care, 24×7 monitoring' },
    { name:'General',   beds:100, desc:'Standard admitted patients' },
    { name:'Private',   beds:50,  desc:'Private rooms with attached bath' },
    { name:'Pediatric', beds:50,  desc:'Children under 15 years' },
    { name:'Maternity', beds:50,  desc:'Delivery & post-natal care' },
    { name:'Oncology',  beds:20,  desc:'Cancer treatment & chemotherapy' },
  ],
  faqs: {
    visiting: 'Visiting hours: 10 AM–12 PM and 5 PM–7 PM daily.',
    parking: 'Free parking available for patients and visitors.',
    canteen: 'Hospital canteen open 7 AM–9 PM. Diet meals available.',
    ambulance: 'Call 108 for free government ambulance service.',
    insurance: 'We accept Ayushman Bharat, ESIC, and most private insurers.',
    blood: 'Blood bank available 24×7. Call ext. 112.',
    pharmacy: 'In-house pharmacy open 24×7 near main reception.',
  }
};

/* ── Intent classifier ── */
function classifyIntent(text, lang) {
  const t = text.toLowerCase();

  // Kannada keyword patterns
  const kn = {
    greeting:    /ನಮಸ್ಕಾರ|ಹಲೋ|ಹಾಯ್|ಶುಭ/,
    emergency:   /ತುರ್ತು|ಅಪಘಾತ|ಬೀಳುವ|ನೋವು|ತಕ್ಷಣ/,
    beds:        /ಹಾಸಿಗೆ|ಬೆಡ್|ರೂಮ್|ವಾರ್ಡ್/,
    appointment: /ಅಪಾಯಿಂಟ್ಮೆಂಟ್|ಬುಕ್|ತಪಾಸಣೆ|ಡಾಕ್ಟರ್/,
    blood:       /ರಕ್ತ|ಬ್ಲಡ್|ಡೋನರ್/,
    billing:     /ಬಿಲ್|ಹಣ|ಶುಲ್ಕ|ಪಾವತಿ/,
    department:  /ವಿಭಾಗ|ಡಿಪಾರ್ಟ್ಮೆಂಟ್|ವೈದ್ಯ/,
    timing:      /ಸಮಯ|ಟೈಮ್|ಯಾವಾಗ/,
  };

  // English keyword patterns
  const en = {
    greeting:    /\b(hi|hello|hey|good morning|good afternoon|good evening|namaste)\b/,
    emergency:   /\b(emergency|urgent|accident|chest pain|unconscious|bleeding|ambulance|help|sos)\b/,
    beds:        /\b(bed|beds|ward|room|icu|admit|admitted|available)\b/,
    appointment: /\b(appointment|book|schedule|consult|doctor|slot|visit)\b/,
    blood:       /\b(blood|donor|donate|transfusion|group|bank)\b/,
    billing:     /\b(bill|billing|pay|payment|cost|fee|insurance|amount)\b/,
    department:  /\b(department|dept|cardio|neuro|ortho|paed|oncol|gynae|general)\b/,
    timing:      /\b(time|timing|hour|open|close|when|opd)\b/,
    location:    /\b(where|location|address|direction|map|how to reach)\b/,
    pharmacy:    /\b(pharmacy|medicine|drug|tablet|injection)\b/,
    parking:     /\b(park|parking|vehicle|car|bike)\b/,
    canteen:     /\b(food|canteen|eat|meal|diet|cafeteria)\b/,
    visiting:    /\b(visit|visitor|family|relative|when can|allowed)\b/,
    insurance:   /\b(insurance|ayushman|esic|claim|cashless)\b/,
    discharge:   /\b(discharge|go home|leave|checkout)\b/,
    navigation:  /\b(navigate|go to|open|show|take me)\b/,
  };

  const patterns = lang === 'kn' ? kn : en;
  for (const [intent, rx] of Object.entries(patterns)) {
    if (rx.test(t)) return intent;
  }
  // Fallback: check English patterns even for Kannada input
  for (const [intent, rx] of Object.entries(en)) {
    if (rx.test(t)) return intent;
  }
  return 'general';
}

/* ── Detect emotion from text ── */
function detectEmotion(text) {
  const t = text.toLowerCase();
  if (/pain|hurt|suffering|please help|urgent|help me|ನೋವು|ತೊಂದರೆ|ಸಹಾಯ/.test(t)) return 'distressed';
  if (/confused|don't know|not sure|which|where|ಗೊಂದಲ|ಎಲ್ಲಿ/.test(t)) return 'confused';
  if (/thank|thanks|good|great|excellent|ಧನ್ಯವಾದ|ಒಳ್ಳೆಯ/.test(t)) return 'positive';
  return 'neutral';
}

/* ── Response generator ── */
function generateResponse(intent, text, lang, history, emotion) {
  const isKn = lang === 'kn';
  const h = HOSPITAL_KB;
  let nav = null; // screen navigation command

  const responses = {
    greeting: {
      en: [
        `Hello! Welcome to ${h.name}. I'm AHCare Assistant — your bilingual healthcare guide. How can I help you today?`,
        `Namaste! I'm here to assist you with appointments, bed availability, departments, billing and more. What do you need?`,
      ],
      kn: [
        `ನಮಸ್ಕಾರ! ${h.name}ಗೆ ಸ್ವಾಗತ. ನಾನು AHCare ಸಹಾಯಕ. ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?`,
        `ಹಲೋ! ಅಪಾಯಿಂಟ್ಮೆಂಟ್, ಹಾಸಿಗೆ ಲಭ್ಯತೆ, ವಿಭಾಗ ಮಾಹಿತಿಗಾಗಿ ನಾನು ಇಲ್ಲಿದ್ದೇನೆ.`,
      ]
    },
    emergency: {
      en: [
        `🚨 EMERGENCY DETECTED. Please call ${h.emergency} immediately. I'm navigating you to our Emergency section now. Stay calm — help is on the way.`,
      ],
      kn: [
        `🚨 ತುರ್ತು ಸ್ಥಿತಿ! ತಕ್ಷಣ ${h.emergency} ಗೆ ಕರೆ ಮಾಡಿ. ನಿಮ್ಮನ್ನು ತುರ್ತು ವಿಭಾಗಕ್ಕೆ ಕರೆದೊಯ್ಯುತ್ತಿದ್ದೇನೆ.`,
      ],
      navCmd: 'emergency'
    },
    beds: {
      en: [
        `Our hospital has 300 beds across 6 wards: ICU (30), General (100), Private (50), Pediatric (50), Maternity (50), and Oncology (20). Real-time bed availability is shown in the Bed Monitor. Shall I take you there?`,
      ],
      kn: [
        `ನಮ್ಮ ಆಸ್ಪತ್ರೆಯಲ್ಲಿ 6 ವಾರ್ಡ್‌ಗಳಲ್ಲಿ 300 ಹಾಸಿಗೆಗಳಿವೆ: ICU (30), ಸಾಮಾನ್ಯ (100), ಖಾಸಗಿ (50), ಮಕ್ಕಳ (50), ಮಾತೃತ್ವ (50), ಆಂಕಾಲಜಿ (20). ಹಾಸಿಗೆ ಮಾನಿಟರ್‌ಗೆ ಹೋಗಲೇ?`,
      ],
      navCmd: 'beds'
    },
    appointment: {
      en: [
        `You can book an appointment through our Pre-Booking system. We have 20+ departments including Cardiology, Neurology, Orthopaedics, and more. Shall I open the appointment booking screen for you?`,
      ],
      kn: [
        `ನಮ್ಮ ಪ್ರಿ-ಬುಕಿಂಗ್ ವ್ಯವಸ್ಥೆ ಮೂಲಕ ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಬುಕ್ ಮಾಡಬಹುದು. ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಪರದೆ ತೆರೆಯಲೇ?`,
      ],
      navCmd: 'prebooking'
    },
    blood: {
      en: [
        `Our blood bank is open 24×7. We maintain inventory of all blood groups: A+, A-, B+, B-, O+, O-, AB+, AB-. You can register as a donor or request blood through the Blood Bank section. Want me to navigate you there?`,
      ],
      kn: [
        `ನಮ್ಮ ರಕ್ತ ಭಂಡಾರ 24×7 ತೆರೆದಿದೆ. ಎಲ್ಲ ರಕ್ತ ಗುಂಪುಗಳ ದಾಸ್ತಾನು ಇದೆ. ರಕ್ತ ದಾನ ಅಥವಾ ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ರಕ್ತ ಭಂಡಾರ ವಿಭಾಗಕ್ಕೆ ಹೋಗಲೇ?`,
      ],
      navCmd: 'bloodby'
    },
    billing: {
      en: [
        `Our billing section supports UPI, card, net banking, and cash payments. We also handle Ayushman Bharat and ESIC insurance. Shall I open the billing section?`,
      ],
      kn: [
        `ನಮ್ಮ ಬಿಲ್ಲಿಂಗ್ UPI, ಕಾರ್ಡ್, ನೆಟ್ ಬ್ಯಾಂಕಿಂಗ್, ನಗದು ಸ್ವೀಕರಿಸುತ್ತದೆ. ಆಯುಷ್ಮಾನ್ ಭಾರತ ಮತ್ತು ESIC ವಿಮೆ ಕೂಡ ಸ್ವೀಕೃತ. ಬಿಲ್ಲಿಂಗ್ ಪರದೆ ತೆರೆಯಲೇ?`,
      ],
      navCmd: 'billing'
    },
    department: {
      en: [
        `We have ${h.departments.length} departments: ${h.departments.slice(0,8).join(', ')}, and more. Which department are you looking for? I can guide you to the right section.`,
      ],
      kn: [
        `ನಮ್ಮಲ್ಲಿ ${h.departments.length} ವಿಭಾಗಗಳಿವೆ: ${h.departments.slice(0,5).join(', ')} ಮತ್ತು ಹೆಚ್ಚಿನವು. ಯಾವ ವಿಭಾಗ ಬೇಕು?`,
      ],
    },
    timing: {
      en: [`${h.name} OPD timings: 8:00 AM – 6:00 PM, Monday to Saturday. Emergency services run 24×7 all days.`],
      kn: [`OPD ಸಮಯ: ಬೆಳಿಗ್ಗೆ 8 ರಿಂದ ಸಂಜೆ 6 ವರೆಗೆ, ಸೋಮ–ಶನಿ. ತುರ್ತು ಸೇವೆ 24×7 ಲಭ್ಯ.`],
    },
    location: {
      en: [`We are located at ${h.location}. Easily accessible from Mysuru, Bangalore, and Hassan via NH-275.`],
      kn: [`ನಮ್ಮ ವಿಳಾಸ: ${h.location}. ಮೈಸೂರು, ಬೆಂಗಳೂರು, ಹಾಸನದಿಂದ NH-275 ಮೂಲಕ ತಲುಪಬಹುದು.`],
    },
    pharmacy: {
      en: [`Our in-house pharmacy is open 24×7, located near the main reception. All prescribed medicines are available. Generic alternatives also provided.`],
      kn: [`ಆಂತರಿಕ ಔಷಧಾಲಯ 24×7 ತೆರೆದಿದೆ, ಮುಖ್ಯ ರಿಸೆಪ್ಷನ್ ಬಳಿ. ಎಲ್ಲ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಔಷಧಗಳು ಲಭ್ಯ.`],
    },
    parking: {
      en: [`Free parking is available for patients and visitors in the hospital premises. Separate parking for two-wheelers and four-wheelers.`],
      kn: [`ರೋಗಿಗಳು ಮತ್ತು ಸಂದರ್ಶಕರಿಗೆ ಉಚಿತ ಪಾರ್ಕಿಂಗ್ ಲಭ್ಯ. ದ್ವಿಚಕ್ರ ಮತ್ತು ನಾಲ್ಕು ಚಕ್ರ ವಾಹನಗಳಿಗೆ ಪ್ರತ್ಯೇಕ ಸ್ಥಳ.`],
    },
    canteen: {
      en: [`Hospital canteen is open from 7 AM to 9 PM. Nutritious diet meals, snacks, and beverages are available. Patient diet meals can be arranged on request.`],
      kn: [`ಕ್ಯಾಂಟೀನ್ ಬೆಳಿಗ್ಗೆ 7 ರಿಂದ ರಾತ್ರಿ 9 ವರೆಗೆ ತೆರೆದಿದೆ. ಪೌಷ್ಟಿಕ ಊಟ, ತಿಂಡಿ ಲಭ್ಯ. ರೋಗಿಗಳಿಗೆ ಆಹಾರ ಕ್ರಮ ವ್ಯವಸ್ಥೆ ಇದೆ.`],
    },
    visiting: {
      en: [`Visiting hours: Morning 10 AM–12 PM, Evening 5 PM–7 PM. One visitor per patient at ICU. Visitors must wear masks and follow hygiene protocols.`],
      kn: [`ಭೇಟಿ ಸಮಯ: ಬೆಳಿಗ್ಗೆ 10–12, ಸಂಜೆ 5–7. ICU ಗೆ ಒಬ್ಬ ಮಾತ್ರ. ಮಾಸ್ಕ್ ಮತ್ತು ನೈರ್ಮಲ್ಯ ನಿಯಮ ಕಡ್ಡಾಯ.`],
    },
    insurance: {
      en: [`We accept Ayushman Bharat (PM-JAY), ESIC, and most major private insurance. Cashless treatment available. Please bring your insurance card and Aadhaar. Visit billing for queries.`],
      kn: [`ಆಯುಷ್ಮಾನ್ ಭಾರತ, ESIC ಮತ್ತು ಖಾಸಗಿ ವಿಮೆ ಸ್ವೀಕೃತ. ನಗದು ರಹಿತ ಚಿಕಿತ್ಸೆ ಲಭ್ಯ. ವಿಮೆ ಕಾರ್ಡ್ ಮತ್ತು ಆಧಾರ್ ತನ್ನಿ.`],
    },
    discharge: {
      en: [`Discharge is processed at the billing counter after doctor clearance. Usually takes 1–3 hours. Ensure all bills are settled and collect discharge summary from the ward nurse.`],
      kn: [`ವೈದ್ಯರ ಅನುಮತಿ ನಂತರ ಡಿಸ್ಚಾರ್ಜ್ ಬಿಲ್ಲಿಂಗ್ ಕೌಂಟರ್‌ನಲ್ಲಿ ಆಗುತ್ತದೆ. 1–3 ಗಂಟೆ ಬೇಕಾಗಬಹುದು. ಡಿಸ್ಚಾರ್ಜ್ ಸಾರಾಂಶ ನರ್ಸ್‌ನಿಂದ ತೆಗೆದುಕೊಳ್ಳಿ.`],
    },
    navigation: {
      en: [`Sure! I can navigate you to: Dashboard, Beds, Patients, Pre-Booking, Emergency, Blood Bank, Billing, Oncology, or Reports. Where would you like to go?`],
      kn: [`ನಾನು ನಿಮ್ಮನ್ನು ಯಾವ ಪರದೆಗೆ ಕರೆದೊಯ್ಯಲಿ? ಹಾಸಿಗೆ, ರೋಗಿ, ಬುಕಿಂಗ್, ತುರ್ತು, ರಕ್ತ, ಬಿಲ್ಲಿಂಗ್?`],
    },
    general: {
      en: [
        `I can help you with bed availability, appointments, departments, billing, blood bank, emergency services, and more. What would you like to know about ${h.name}?`,
        `Great question! ${h.name} provides comprehensive healthcare services. Could you tell me more about what you need?`,
      ],
      kn: [
        `ನಾನು ಹಾಸಿಗೆ ಲಭ್ಯತೆ, ಅಪಾಯಿಂಟ್ಮೆಂಟ್, ವಿಭಾಗ, ಬಿಲ್, ರಕ್ತ ಭಂಡಾರ, ತುರ್ತು ಸೇವೆ ಬಗ್ಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ.`,
      ],
    },
  };

  const bucket = responses[intent] || responses.general;
  const pool   = bucket[isKn ? 'kn' : 'en'] || bucket['en'];

  // Emotion-aware prefix
  let prefix = '';
  if (emotion === 'distressed') {
    prefix = isKn ? 'ದಯವಿಟ್ಟು ಚಿಂತಿಸಬೇಡಿ. ' : 'Please don\'t worry — I\'m here to help. ';
  } else if (emotion === 'confused') {
    prefix = isKn ? 'ಸ್ಪಷ್ಟಪಡಿಸಿ, ಇಲ್ಲಿದ್ದೇನೆ. ' : 'Let me clarify that for you. ';
  } else if (emotion === 'positive' && history.length > 1) {
    prefix = isKn ? 'ಧನ್ಯವಾದ! ' : 'Glad I could help! ';
  }

  const baseText = pool[Math.floor(Math.random() * pool.length)];
  const navCmd   = bucket.navCmd || null;

  return { text: prefix + baseText, navCmd };
}

/* ── Detect language from text ── */
function detectLang(text) {
  // Kannada unicode range: \u0C80–\u0CFF
  const knChars = (text.match(/[\u0C80-\u0CFF]/g) || []).length;
  return knChars > 1 ? 'kn' : 'en';
}

/* ─────────────────────────────────────────────────────
   POST /api/voiceai/chat
   Body: { message, sessionId, lang? }
   Returns: { reply, navCmd, lang, intent, emotion, sessionId }
───────────────────────────────────────────────────── */
router.post('/chat', (req, res) => {
  try {
    const { message, sessionId = 'default', lang: clientLang } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const session = getSession(sessionId);
    const detectedLang = clientLang || detectLang(message);
    const emotion  = detectEmotion(message);
    const intent   = classifyIntent(message, detectedLang);

    // Build conversation history context
    session.history.push({ role: 'user', content: message, lang: detectedLang, ts: Date.now() });
    if (session.history.length > 20) session.history = session.history.slice(-20);

    const { text: reply, navCmd } = generateResponse(
      intent, message, detectedLang, session.history, emotion
    );

    session.history.push({ role: 'assistant', content: reply, ts: Date.now() });

    res.json({
      reply,
      navCmd:    navCmd || null,
      lang:      detectedLang,
      intent,
      emotion,
      sessionId,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('VoiceAI error:', err);
    res.status(500).json({ error: 'Voice AI service error', reply: 'Sorry, I had a technical issue. Please try again.' });
  }
});

/* GET /api/voiceai/health */
router.get('/health', (_, res) => res.json({ status: 'ok', sessions: sessions.size }));

module.exports = router;
