# 🏥 AH Care v5.0 — Adichunchanagiri Hospital
### Competition-Grade Full Stack Hospital Management System

**Adichunchanagiri Institute of Medical Sciences (AIMS)**  
Bellur Cross, BG Nagar, Nagamangala Taluk, Mandya District – 571448, Karnataka  
📍 [Google Maps](https://maps.app.goo.gl/SFzDhcJvJX1iuxh68) · 📞 Emergency: 08234-287800 · 🚑 Ambulance: 108

---

## 🚀 Quick Start

```bash
cd backend
npm install
cp .env.example .env      # configure if needed
npm start                  # → http://localhost:5000
```

**No MongoDB needed** — runs fully in demo mode with in-memory data.

## 🔑 Demo Logins
| Email | Password | Role |
|-------|----------|------|
| admin@ahcare.in | admin123 | Admin |
| reception@ahcare.in | rec123 | Reception |
| billing@ahcare.in | bill123 | Billing |
| doctor@ahcare.in | doc123 | Doctor |

---

## ✨ Features
- 🤖 **AI Ward Allocation** — Severity scoring → ICU/General/Private/Pediatric/Maternity/Oncology
- 🛏 **Live Bed Monitor** — 300 beds across 6 wards
- 🎗 **Oncology & Cancer Centre** — Full dedicated section with screening camps
- 📅 **NH-Style Pre-Booking** — Smart priority queue (Urgent > High > Normal > Routine), all departments
- 💳 **Multi-Payment** — UPI, Card, NetBanking, Cash, QR, **PayPal**
- 👤 **Patient Management** — Register, track, discharge with backend persistence
- 🏛 **Govt Schemes** — PMJAY, Arogya Karnataka, Vajpayee Arogyashree, e-Sanjeevani
- 🚨 **Emergency System** — Auto-ICU allocation, Code Blue alerts
- 💬 **AI Chatbot** — Bilingual English + ಕನ್ನಡ with backend API
- 🩺 **22 Departments** — Including Cancer, Psychiatry, Urology, etc.
- 🗺 **Real Map** — Official hospital Google Maps location
- 🌙 **Dark Mode** · 📱 **PWA** · 📊 **Reports & Analytics**

## 📁 Structure
```
ahcare5/
├── frontend/          ← PWA (HTML + CSS + JS)
└── backend/
    ├── server.js
    ├── routes/        ← auth, patients, beds, billing, ai, prebooking, ...
    ├── models/        ← Mongoose schemas
    └── utils/         ← demoStore, seed
```

## 🌐 API
| Endpoint | Description |
|----------|-------------|
| POST /api/auth/login | Login → JWT |
| GET/POST /api/patients | List / Register |
| GET /api/beds/summary | Ward occupancy |
| GET/POST /api/prebooking | Priority queue |
| POST /api/ai/allocate | AI ward allocation |
| POST /api/ai/chat | Chatbot (EN + KN) |
| POST /api/billing | Create invoice |
| GET /api/dashboard/stats | Dashboard stats |
