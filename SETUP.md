# AHCare v7.0 — Voice AI Setup Guide
## Adichunchanagiri Hospital, Mandya

---

## 🚀 Quick Start (5 minutes)

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your values (MongoDB URI, JWT secret)
```

### 3. Start the server
```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

### 4. Open in browser
```
http://localhost:5000
```

The Voice AI floating button (🎙️) appears at the bottom-right of every page.

---

## 🎙️ Voice AI — How It Works

### Wake Word
Say **"Hello AHCare"** to activate the assistant hands-free.

### Supported Commands (English)
| Say | Action |
|-----|--------|
| "Hello AHCare" | Wake word — activates assistant |
| "Show me the beds" | Navigates to Bed Monitor |
| "Book an appointment" | Opens Pre-Booking |
| "Emergency help" | Opens Emergency + reads hotline |
| "Blood bank" | Opens Blood Bank |
| "What are the OPD timings?" | Speaks OPD hours |
| "Where are you located?" | Speaks hospital address |
| "Show billing" | Opens Billing screen |
| "What departments do you have?" | Lists all departments |

### Supported Commands (ಕನ್ನಡ)
| ಹೇಳಿ | ಕ್ರಿಯೆ |
|------|--------|
| "ನಮಸ್ಕಾರ AHCare" | ಸಹಾಯಕ ಸಕ್ರಿಯ |
| "ಹಾಸಿಗೆ ತೋರಿಸಿ" | ಬೆಡ್ ಮಾನಿಟರ್ |
| "ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ" | ಪ್ರಿ-ಬುಕಿಂಗ್ |
| "ತುರ್ತು ಸಹಾಯ" | ತುರ್ತು ವಿಭಾಗ |
| "ರಕ್ತ ಭಂಡಾರ" | ರಕ್ತ ಭಂಡಾರ ವಿಭಾಗ |

### Language Toggle
- Click **EN / KN** badge in the assistant header to switch languages
- Assistant auto-detects Kannada script and switches automatically

### Continuous Listening
- Toggle the **Continuous listening** switch in the assistant panel
- Assistant will keep listening after each response

---

## 🏗️ Architecture

```
Browser
  └── voice-ai.js          ← Frontend Voice AI module
        ├── Web Speech API  ← STT (Speech-to-Text)
        ├── SpeechSynthesis ← TTS (Text-to-Speech, bilingual)
        ├── Wake Word engine
        ├── Waveform animation
        └── POST /api/voiceai/chat

Backend (Node.js / Express)
  └── routes/voiceai.js
        ├── Intent classifier
        ├── Language detector
        ├── Emotion detector
        ├── Hospital knowledge base
        ├── Response generator (EN + KN)
        └── Session memory (in-memory, 30 min TTL)
```

---

## 🌐 Production Deployment

### Option A: Railway / Render / Heroku
1. Push to GitHub
2. Connect repo to Railway/Render
3. Set environment variables in platform dashboard
4. Deploy — URL is your production endpoint

### Option B: VPS (Ubuntu)
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Start app
cd /var/www/ahcare/backend
npm install --production
pm2 start server.js --name ahcare
pm2 save && pm2 startup

# Nginx reverse proxy
# Add to /etc/nginx/sites-available/ahcare:
# location / { proxy_pass http://localhost:5000; }
```

### HTTPS (required for microphone access in production)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

> ⚠️ **Important**: Microphone access (getUserMedia) requires HTTPS in production.
> Self-signed certificates will NOT work. Use Let's Encrypt (free).

---

## 🔧 Upgrading to Production-Grade Kannada TTS

The default setup uses the browser's built-in Web Speech API.
For best Kannada voice quality in production:

### Google Cloud TTS (Recommended)
```bash
npm install @google-cloud/text-to-speech
```
Set `GOOGLE_TTS_API_KEY` in `.env`.
Supports: `kn-IN-Wavenet-A` (female), `kn-IN-Wavenet-B` (male)

### Azure Cognitive Services
```bash
npm install microsoft-cognitiveservices-speech-sdk
```
Set `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION=centralindia` in `.env`.

---

## 📁 File Structure
```
AHCare-v7-Fixed/
├── frontend/
│   ├── index.html        ← Main app (Voice AI panel injected)
│   ├── app.js            ← Main app logic (all 26 fixes applied)
│   ├── voice-ai.js       ← 🆕 Voice AI complete module
│   ├── style.css         ← App styles
│   └── manifest.json     ← PWA manifest
├── backend/
│   ├── server.js         ← Express server (voiceai route wired)
│   ├── routes/
│   │   ├── voiceai.js    ← 🆕 Voice AI NLP + bilingual engine
│   │   ├── patients.js
│   │   ├── billing.js
│   │   ├── prebooking.js
│   │   └── auth.js
│   ├── middleware/
│   ├── models/
│   └── utils/
├── .env.example          ← 🆕 Environment template
└── SETUP.md              ← This file
```

---

## 🧪 Testing Voice AI

### API Test (curl)
```bash
# English
curl -X POST http://localhost:5000/api/voiceai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What are your OPD timings?","sessionId":"test1"}'

# Kannada
curl -X POST http://localhost:5000/api/voiceai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"ಹಾಸಿಗೆ ಲಭ್ಯತೆ ಇದೆಯೇ?","sessionId":"test1"}'

# Emergency (triggers navigation)
curl -X POST http://localhost:5000/api/voiceai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"I need emergency help immediately","sessionId":"test1"}'
```

### Health Check
```bash
curl http://localhost:5000/api/voiceai/health
# → {"status":"ok","sessions":1}
```

---

## 🛡️ Browser Compatibility
| Browser | STT | TTS | Wake Word |
|---------|-----|-----|-----------|
| Chrome 90+ | ✅ | ✅ | ✅ |
| Edge 90+ | ✅ | ✅ | ✅ |
| Firefox | ❌* | ✅ | ❌ |
| Safari 15+ | ⚠️ | ✅ | ⚠️ |
| Android Chrome | ✅ | ✅ | ✅ |
| iOS Safari | ⚠️ | ✅ | ⚠️ |

*Firefox: Voice input falls back to text input automatically.

**Recommended**: Chrome or Edge for full voice experience.

---

## 📞 Hospital Contact
- **Address**: BG Nagar, Bellur Cross, Nagamangala, Mandya – 571448
- **OPD**: +91 08234-287777
- **Emergency**: 108 / +91 08234-287999
- **Email**: info@ahcare.in
