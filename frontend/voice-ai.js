/**
 * AHCare Voice AI — Frontend Module v7.0
 * Full pipeline: Wake Word → STT → NLP → TTS → Navigation
 * Bilingual: Kannada + English | Web Speech API + Anthropic Claude
 * ================================================================
 */
'use strict';

(function () {

  /* ── CONFIG ── */
  const CFG = {
    API_ENDPOINT: '/api/voiceai/chat',
    WAKE_WORDS:   ['hello ahcare', 'hey ahcare', 'ahcare', 'ಹಲೋ ahcare', 'ಹಲೋ ಆ care'],
    DEFAULT_LANG: 'en-IN',
    KN_LANG:      'kn-IN',
    SESSION_ID:   'ahcare-session-' + Math.random().toString(36).slice(2),
    MAX_RETRIES:  2,
    VOICE_RATE:   0.92,
    VOICE_PITCH:  1.05,
    TTS_EN_NAME:  ['Google UK English Female', 'Microsoft Zira', 'Samantha'],
    WAKE_TIMEOUT: 8000,  // ms of silence before wake-word mode reactivates
    RESPONSE_TIMEOUT: 12000,
  };

  /* ── STATE ── */
  const VAI = {
    open:          false,
    listening:     false,
    speaking:      false,
    continuous:    false,
    wakeActive:    false,
    currentLang:   'en',
    recognition:   null,
    synth:         window.speechSynthesis,
    voices:        [],
    sessionId:     CFG.SESSION_ID,
    history:       [],
    retries:       0,
    silenceTimer:  null,
    wakeTimer:     null,
    animFrame:     null,
    audioCtx:      null,
    analyser:      null,
    micStream:     null,
    bars:          [],
    knVoice:       null,
    enVoice:       null,
    wakePhraseBuffer: '',
  };

  /* ─────────────────────────────────────────────────────────
     BUILD UI
  ───────────────────────────────────────────────────────── */
  function buildUI() {
    const style = document.createElement('style');
    style.id = 'vai-styles';
    style.textContent = `
      /* ── VAI Floating Button ── */
      #vai-fab {
        position: fixed; bottom: 24px; right: 24px; z-index: 9999;
        width: 60px; height: 60px; border-radius: 50%;
        background: linear-gradient(135deg, #00875A 0%, #005C3B 100%);
        box-shadow: 0 4px 20px rgba(0,135,90,0.45);
        border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: transform .2s, box-shadow .2s;
        animation: vai-pulse-idle 3s ease-in-out infinite;
      }
      #vai-fab:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(0,135,90,0.6); }
      #vai-fab.listening { animation: vai-pulse-listen 1s ease-in-out infinite; background: linear-gradient(135deg,#C0392B,#8B0000); }
      #vai-fab.speaking  { animation: vai-pulse-speak 0.6s ease-in-out infinite; background: linear-gradient(135deg,#2980B9,#154360); }
      @keyframes vai-pulse-idle   { 0%,100%{box-shadow:0 4px 20px rgba(0,135,90,.45)} 50%{box-shadow:0 4px 32px rgba(0,135,90,.75)} }
      @keyframes vai-pulse-listen { 0%,100%{box-shadow:0 0 0 0 rgba(192,57,43,.5)} 70%{box-shadow:0 0 0 14px rgba(192,57,43,0)} }
      @keyframes vai-pulse-speak  { 0%,100%{box-shadow:0 0 0 0 rgba(41,128,185,.5)} 70%{box-shadow:0 0 0 12px rgba(41,128,185,0)} }
      #vai-fab-icon { font-size: 26px; line-height: 1; pointer-events: none; }
      #vai-fab-badge {
        position:absolute; top:-4px; right:-4px; background:#E74C3C;
        color:#fff; font-size:9px; font-weight:700; border-radius:50%;
        width:18px; height:18px; display:flex; align-items:center; justify-content:center;
        display: none;
      }

      /* ── VAI Panel ── */
      #vai-panel {
        position: fixed; bottom: 96px; right: 24px; z-index: 9998;
        width: 340px; max-height: 580px;
        background: var(--bg2, #fff); border-radius: 20px;
        box-shadow: 0 8px 40px rgba(0,0,0,.18);
        display: flex; flex-direction: column;
        transform: scale(.88) translateY(20px);
        opacity: 0; pointer-events: none;
        transition: transform .25s cubic-bezier(.34,1.56,.64,1), opacity .2s ease;
        overflow: hidden;
        border: 1.5px solid rgba(0,135,90,0.18);
      }
      #vai-panel.open { transform: scale(1) translateY(0); opacity: 1; pointer-events: all; }

      /* Header */
      #vai-header {
        background: linear-gradient(135deg,#00875A,#005C3B);
        padding: 14px 16px 12px;
        display: flex; align-items: center; gap: 10px;
      }
      #vai-avatar {
        width: 38px; height: 38px; border-radius: 50%;
        background: rgba(255,255,255,0.18);
        display: flex; align-items: center; justify-content: center;
        font-size: 20px; flex-shrink: 0;
        border: 2px solid rgba(255,255,255,0.3);
      }
      #vai-title { flex:1 }
      #vai-title .vai-name { font-size:13px; font-weight:700; color:#fff; line-height:1.2 }
      #vai-title .vai-sub  { font-size:10px; color:rgba(255,255,255,.7); margin-top:1px }
      #vai-lang-badge {
        background: rgba(255,255,255,0.2); border-radius: 20px;
        padding: 3px 8px; font-size: 10px; font-weight: 700; color: #fff;
        letter-spacing: .5px; cursor: pointer; transition: background .15s;
        user-select: none;
      }
      #vai-lang-badge:hover { background: rgba(255,255,255,.35); }
      #vai-close {
        background: none; border: none; color: rgba(255,255,255,.8);
        font-size: 18px; cursor: pointer; padding: 0 0 0 6px; line-height: 1;
        transition: color .15s;
      }
      #vai-close:hover { color: #fff; }

      /* Waveform */
      #vai-wave-bar {
        height: 52px; background: linear-gradient(135deg, #f0faf5, #e8f5ef);
        display: flex; align-items: center; justify-content: center; gap: 3px;
        padding: 0 16px;
      }
      .vai-bar {
        width: 3px; border-radius: 3px;
        background: #00875A; min-height: 4px;
        transition: height .08s ease;
      }

      /* Status */
      #vai-status {
        text-align: center; font-size: 10px; font-weight: 600;
        color: #00875A; letter-spacing: .4px; padding: 6px 16px 2px;
        text-transform: uppercase;
      }

      /* Chat area */
      #vai-chat {
        flex: 1; overflow-y: auto; padding: 10px 14px;
        display: flex; flex-direction: column; gap: 8px;
        min-height: 160px; max-height: 280px;
        scroll-behavior: smooth;
      }
      #vai-chat::-webkit-scrollbar { width: 4px; }
      #vai-chat::-webkit-scrollbar-thumb { background: #cce9de; border-radius: 4px; }

      .vai-msg {
        max-width: 84%; padding: 9px 13px; border-radius: 16px;
        font-size: 12.5px; line-height: 1.5; word-break: break-word;
        animation: vai-msg-in .2s ease;
      }
      @keyframes vai-msg-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
      .vai-msg.user {
        align-self: flex-end;
        background: linear-gradient(135deg,#00875A,#006845);
        color: #fff; border-bottom-right-radius: 4px;
      }
      .vai-msg.bot {
        align-self: flex-start;
        background: var(--bg3, #f0f0f0);
        color: var(--txt, #111); border-bottom-left-radius: 4px;
        border: 1px solid rgba(0,135,90,.12);
      }
      .vai-msg.typing { min-width: 52px; }
      .vai-msg.typing::after {
        content: ''; display: inline-block;
        width: 24px; height: 8px;
        background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 10'%3E%3Ccircle cx='5' cy='5' r='4' fill='%2300875A'%3E%3Canimate attributeName='opacity' values='1;.2;1' dur='1s' repeatCount='indefinite'/%3E%3C/circle%3E%3Ccircle cx='20' cy='5' r='4' fill='%2300875A'%3E%3Canimate attributeName='opacity' values='1;.2;1' dur='1s' begin='.3s' repeatCount='indefinite'/%3E%3C/circle%3E%3Ccircle cx='35' cy='5' r='4' fill='%2300875A'%3E%3Canimate attributeName='opacity' values='1;.2;1' dur='1s' begin='.6s' repeatCount='indefinite'/%3E%3C/circle%3E%3C/svg%3E") no-repeat center/cover;
        vertical-align: middle; margin-left: 4px;
      }

      /* Controls */
      #vai-controls {
        padding: 10px 14px 14px;
        display: flex; gap: 8px; align-items: center;
        border-top: 1px solid rgba(0,135,90,.1);
        background: var(--bg2, #fff);
      }
      #vai-text-input {
        flex:1; border: 1.5px solid #cce9de; border-radius: 20px;
        padding: 8px 14px; font-size: 12px; outline: none;
        background: var(--bg3,#f8fafb); color: var(--txt,#111);
        transition: border-color .15s;
      }
      #vai-text-input:focus { border-color: #00875A; }
      #vai-text-input::placeholder { color: #aaa; }

      #vai-mic-btn {
        width: 38px; height: 38px; border-radius: 50%; border: none;
        background: linear-gradient(135deg,#00875A,#005C3B);
        color: #fff; font-size: 16px; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: background .2s, transform .15s;
        flex-shrink: 0;
      }
      #vai-mic-btn:hover { transform: scale(1.08); }
      #vai-mic-btn.active { background: linear-gradient(135deg,#C0392B,#922B21); }

      #vai-send-btn {
        width: 38px; height: 38px; border-radius: 50%; border: none;
        background: var(--bg3,#eee); color: #00875A; font-size: 16px;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: background .15s;
      }
      #vai-send-btn:hover { background: #cce9de; }

      /* Continuous toggle */
      #vai-toolbar {
        display: flex; align-items: center; gap: 8px;
        padding: 6px 14px 0;
        font-size: 10px; color: var(--txt2, #777);
      }
      .vai-toggle {
        width: 32px; height: 16px; border-radius: 8px;
        background: #ccc; cursor: pointer; position: relative;
        transition: background .2s; border: none;
        flex-shrink: 0;
      }
      .vai-toggle::after {
        content:''; position:absolute; top:2px; left:2px;
        width:12px; height:12px; border-radius:50%;
        background:#fff; transition:left .2s;
      }
      .vai-toggle.on { background: #00875A; }
      .vai-toggle.on::after { left: 18px; }

      /* Wake word banner */
      #vai-wake-banner {
        display: none; text-align: center;
        padding: 5px 12px; font-size: 10px; font-weight: 600;
        color: #fff; background: linear-gradient(90deg,#E67E22,#C0392B);
        letter-spacing: .4px;
      }
      #vai-wake-banner.show { display: block; }

      /* Nav action chip */
      .vai-nav-chip {
        display: inline-flex; align-items: center; gap: 4px;
        background: rgba(0,135,90,.12); color: #00875A;
        border: 1px solid rgba(0,135,90,.25); border-radius: 20px;
        padding: 4px 10px; font-size: 10px; font-weight: 700;
        cursor: pointer; margin-top: 5px; transition: background .15s;
      }
      .vai-nav-chip:hover { background: rgba(0,135,90,.22); }

      /* Mobile responsive */
      @media (max-width: 440px) {
        #vai-panel { width: calc(100vw - 24px); right: 12px; bottom: 88px; }
        #vai-fab   { bottom: 16px; right: 16px; }
      }
    `;
    document.head.appendChild(style);

    /* ── FAB Button ── */
    const fab = document.createElement('button');
    fab.id = 'vai-fab';
    fab.title = 'AHCare Voice Assistant';
    fab.innerHTML = `<span id="vai-fab-icon">🎙️</span><span id="vai-fab-badge">1</span>`;
    fab.addEventListener('click', togglePanel);
    document.body.appendChild(fab);

    /* ── Panel ── */
    const panel = document.createElement('div');
    panel.id = 'vai-panel';
    panel.innerHTML = `
      <div id="vai-header">
        <div id="vai-avatar">🏥</div>
        <div id="vai-title">
          <div class="vai-name">AHCare Assistant</div>
          <div class="vai-sub" id="vai-sub-status">Say "Hello AHCare" to begin</div>
        </div>
        <div id="vai-lang-badge" onclick="window.VAIAPI.toggleLang()" title="Switch Language">EN</div>
        <button id="vai-close" onclick="window.VAIAPI.closePanel()" title="Close">✕</button>
      </div>

      <div id="vai-wake-banner">🎙 Wake word active — Listening for "Hello AHCare"</div>

      <div id="vai-wave-bar">
        ${Array.from({length:18}, (_,i) => `<div class="vai-bar" id="vai-b${i}" style="height:${4+Math.sin(i)*3}px"></div>`).join('')}
      </div>
      <div id="vai-status">Ready</div>

      <div id="vai-chat">
        <div class="vai-msg bot">
          👋 Namaste! I'm your AHCare bilingual assistant.<br>
          I speak <strong>English</strong> and <strong>ಕನ್ನಡ</strong>.<br>
          Tap 🎙️ to speak or type below.
        </div>
      </div>

      <div id="vai-toolbar">
        <button class="vai-toggle" id="vai-continuous-toggle" title="Continuous listening"></button>
        <span>Continuous listening</span>
        <div style="margin-left:auto;display:flex;gap:6px">
          <button style="background:none;border:1px solid #cce9de;border-radius:12px;padding:2px 8px;font-size:10px;color:#00875A;cursor:pointer" onclick="window.VAIAPI.clearChat()">Clear</button>
        </div>
      </div>

      <div id="vai-controls">
        <input id="vai-text-input" type="text" placeholder="Type or speak your query…" autocomplete="off"/>
        <button id="vai-mic-btn" title="Start/stop voice">🎙️</button>
        <button id="vai-send-btn" title="Send">➤</button>
      </div>
    `;
    document.body.appendChild(panel);

    /* ── Wire controls ── */
    document.getElementById('vai-mic-btn').addEventListener('click', toggleMic);
    document.getElementById('vai-send-btn').addEventListener('click', sendText);
    document.getElementById('vai-text-input').addEventListener('keydown', e => { if (e.key === 'Enter') sendText(); });
    document.getElementById('vai-continuous-toggle').addEventListener('click', function () {
      VAI.continuous = !VAI.continuous;
      this.classList.toggle('on', VAI.continuous);
      if (VAI.continuous) startListening();
      else stopListening();
    });

    /* ── Waveform bars ref ── */
    VAI.bars = Array.from({length:18}, (_, i) => document.getElementById('vai-b' + i));

    /* ── Load voices async ── */
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    /* ── Show welcome badge ── */
    const badge = document.getElementById('vai-fab-badge');
    badge.style.display = 'flex';
    setTimeout(() => { badge.style.display = 'none'; }, 5000);
  }

  /* ─────────────────────────────────────────────────────────
     VOICE LOADING
  ───────────────────────────────────────────────────────── */
  function loadVoices() {
    VAI.voices = window.speechSynthesis.getVoices();
    // Find best Kannada voice
    VAI.knVoice = VAI.voices.find(v => v.lang === 'kn-IN' || v.lang === 'kn') ||
                  VAI.voices.find(v => v.lang.startsWith('kn')) || null;
    // Find best English voice
    VAI.enVoice = VAI.voices.find(v => CFG.TTS_EN_NAME.some(n => v.name.includes(n))) ||
                  VAI.voices.find(v => v.lang === 'en-IN') ||
                  VAI.voices.find(v => v.lang.startsWith('en')) || null;
  }

  /* ─────────────────────────────────────────────────────────
     PANEL TOGGLE
  ───────────────────────────────────────────────────────── */
  function togglePanel() {
    VAI.open ? closePanel() : openPanel();
  }
  function openPanel() {
    VAI.open = true;
    document.getElementById('vai-panel').classList.add('open');
    document.getElementById('vai-fab-icon').textContent = '🎙️';
    // Greet on first open
    if (VAI.history.length === 0) {
      setTimeout(() => {
        const greeting = VAI.currentLang === 'kn'
          ? 'ನಮಸ್ಕಾರ! ನಾನು AHCare ಸಹಾಯಕ. ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?'
          : 'Hello! I\'m AHCare Assistant. How can I help you today?';
        speak(greeting, VAI.currentLang);
      }, 400);
    }
    startWakeWordMode();
  }
  function closePanel() {
    VAI.open = false;
    document.getElementById('vai-panel').classList.remove('open');
    stopListening();
    stopWakeWordMode();
  }

  /* ─────────────────────────────────────────────────────────
     SPEECH RECOGNITION
  ───────────────────────────────────────────────────────── */
  function initRecognition(lang) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const r = new SR();
    r.continuous    = false;
    r.interimResults = true;
    r.maxAlternatives = 1;
    r.lang = lang === 'kn' ? CFG.KN_LANG : CFG.DEFAULT_LANG;
    return r;
  }

  function startListening() {
    if (VAI.listening) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { appendMsg('bot', '⚠️ Speech recognition not supported. Please type your query.'); return; }

    VAI.recognition = initRecognition(VAI.currentLang);
    const r = VAI.recognition;

    r.onstart = () => {
      VAI.listening = true;
      setStatus('Listening…', 'listening');
      document.getElementById('vai-mic-btn').classList.add('active');
      document.getElementById('vai-mic-btn').textContent = '⏹';
      document.getElementById('vai-fab').classList.add('listening');
      startWaveform();
    };

    r.onresult = (e) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t; else interim += t;
      }
      const display = final || interim;
      document.getElementById('vai-text-input').value = display;

      // Wake-word check
      if (CFG.WAKE_WORDS.some(w => display.toLowerCase().includes(w))) {
        handleWakeWord();
      }
    };

    r.onend = () => {
      const txt = document.getElementById('vai-text-input').value.trim();
      VAI.listening = false;
      document.getElementById('vai-mic-btn').classList.remove('active');
      document.getElementById('vai-mic-btn').textContent = '🎙️';
      document.getElementById('vai-fab').classList.remove('listening');
      stopWaveformAnim();

      if (txt && !CFG.WAKE_WORDS.some(w => txt.toLowerCase().includes(w))) {
        sendMessage(txt);
        document.getElementById('vai-text-input').value = '';
      }

      if (VAI.continuous && VAI.open) {
        setTimeout(startListening, 600);
      } else {
        setStatus('Tap mic or type', 'ready');
      }
    };

    r.onerror = (e) => {
      VAI.listening = false;
      stopWaveformAnim();
      document.getElementById('vai-mic-btn').classList.remove('active');
      document.getElementById('vai-mic-btn').textContent = '🎙️';
      document.getElementById('vai-fab').classList.remove('listening');
      if (e.error === 'not-allowed') {
        appendMsg('bot', '🎙️ Microphone access denied. Please allow mic permission and retry.');
        setStatus('Mic blocked', 'ready');
      } else if (e.error !== 'no-speech') {
        setStatus('Ready', 'ready');
      }
      if (VAI.continuous && VAI.open && e.error !== 'not-allowed') {
        setTimeout(startListening, 1200);
      }
    };

    try {
      r.start();
    } catch(err) {
      console.warn('STT start error:', err);
    }
  }

  function stopListening() {
    if (VAI.recognition) {
      try { VAI.recognition.stop(); } catch(e) {}
    }
    VAI.listening = false;
    document.getElementById('vai-mic-btn')?.classList.remove('active');
    if (document.getElementById('vai-mic-btn')) document.getElementById('vai-mic-btn').textContent = '🎙️';
    document.getElementById('vai-fab')?.classList.remove('listening');
    stopWaveformAnim();
    setStatus('Ready', 'ready');
  }

  function toggleMic() {
    if (VAI.listening) stopListening();
    else startListening();
  }

  /* ─────────────────────────────────────────────────────────
     WAKE WORD MODE (background passive listener)
  ───────────────────────────────────────────────────────── */
  function startWakeWordMode() {
    if (VAI.wakeActive || VAI.listening) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    document.getElementById('vai-wake-banner').classList.add('show');
  }

  function stopWakeWordMode() {
    VAI.wakeActive = false;
    document.getElementById('vai-wake-banner')?.classList.remove('show');
  }

  function handleWakeWord() {
    document.getElementById('vai-text-input').value = '';
    stopListening();
    const msg = VAI.currentLang === 'kn'
      ? 'ಹಾ, ಹೇಳಿ! ನಾನು ಕೇಳುತ್ತಿದ್ದೇನೆ.'
      : 'Yes, I\'m listening! How can I help you?';
    appendMsg('bot', '🎙️ ' + msg);
    speak(msg, VAI.currentLang);
    setTimeout(startListening, 1200);
  }

  /* ─────────────────────────────────────────────────────────
     TEXT-TO-SPEECH (bilingual)
  ───────────────────────────────────────────────────────── */
  function speak(text, lang) {
    if (!VAI.synth || !text) return;
    VAI.synth.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang  = lang === 'kn' ? CFG.KN_LANG : CFG.DEFAULT_LANG;
    utter.rate  = CFG.VOICE_RATE;
    utter.pitch = CFG.VOICE_PITCH;

    // Pick best voice
    const voice = lang === 'kn' ? VAI.knVoice : VAI.enVoice;
    if (voice) utter.voice = voice;

    utter.onstart = () => {
      VAI.speaking = true;
      document.getElementById('vai-fab').classList.add('speaking');
      setStatus('Speaking…', 'speaking');
      startWaveformSpeaking();
    };
    utter.onend = utter.onerror = () => {
      VAI.speaking = false;
      document.getElementById('vai-fab').classList.remove('speaking');
      setStatus('Ready', 'ready');
      stopWaveformAnim();
      if (VAI.continuous && VAI.open) setTimeout(startListening, 500);
    };

    // Chromium workaround: re-add utter after resume
    VAI.synth.speak(utter);
    // Keep speech synth alive on Chrome
    const keep = setInterval(() => {
      if (!VAI.synth.speaking) { clearInterval(keep); return; }
      VAI.synth.pause(); VAI.synth.resume();
    }, 12000);
  }

  /* ─────────────────────────────────────────────────────────
     MESSAGING
  ───────────────────────────────────────────────────────── */
  function sendText() {
    const input = document.getElementById('vai-text-input');
    const txt = (input.value || '').trim();
    if (!txt) return;
    input.value = '';
    sendMessage(txt);
  }

  async function sendMessage(text) {
    if (!text.trim()) return;

    // Detect lang from text
    const knChars = (text.match(/[\u0C80-\u0CFF]/g) || []).length;
    if (knChars > 1) {
      VAI.currentLang = 'kn';
      updateLangBadge('KN');
    }

    appendMsg('user', text);
    VAI.history.push({ role: 'user', content: text });

    // Show typing indicator
    const typingId = appendMsg('bot', '', true);
    setStatus('Thinking…', 'thinking');

    try {
      const res = await fetchWithTimeout(CFG.API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message:   text,
          sessionId: VAI.sessionId,
          lang:      VAI.currentLang,
        }),
      }, CFG.RESPONSE_TIMEOUT);

      removeMsg(typingId);

      if (!res.ok) throw new Error('API ' + res.status);

      const data = await res.json();
      const reply = data.reply || 'Sorry, I could not process that.';
      const lang  = data.lang  || VAI.currentLang;
      const nav   = data.navCmd;

      // Update detected language
      if (lang !== VAI.currentLang) {
        VAI.currentLang = lang;
        updateLangBadge(lang === 'kn' ? 'KN' : 'EN');
      }

      VAI.history.push({ role: 'assistant', content: reply });
      VAI.retries = 0;

      // Append reply with optional nav chip
      appendMsg('bot', reply, false, nav);
      speak(reply, lang);

      // Auto-navigate if navCmd
      if (nav && typeof showScreen === 'function') {
        setTimeout(() => showScreen(nav), 1800);
      }

    } catch (err) {
      removeMsg(typingId);
      if (VAI.retries < CFG.MAX_RETRIES) {
        VAI.retries++;
        setTimeout(() => sendMessage(text), 1500);
        return;
      }
      VAI.retries = 0;
      const fallback = VAI.currentLang === 'kn'
        ? 'ಕ್ಷಮಿಸಿ, ಸಂಪರ್ಕ ದೋಷ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'
        : 'Sorry, I\'m having trouble connecting. Please check your network and try again.';
      appendMsg('bot', fallback);
      speak(fallback, VAI.currentLang);
      setStatus('Offline mode', 'ready');
    }
  }

  /* ─────────────────────────────────────────────────────────
     CHAT DOM HELPERS
  ───────────────────────────────────────────────────────── */
  let _msgId = 0;
  function appendMsg(role, text, typing = false, navCmd = null) {
    const chat = document.getElementById('vai-chat');
    const id   = 'vai-m' + (++_msgId);
    const div  = document.createElement('div');
    div.id    = id;
    div.className = 'vai-msg ' + role + (typing ? ' typing' : '');

    if (!typing && text) {
      div.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');
      // Navigation chip
      if (navCmd) {
        const chip = document.createElement('div');
        chip.innerHTML = `<span class="vai-nav-chip" onclick="window.VAIAPI.navigate('${navCmd}')">📍 Open ${navCmd.charAt(0).toUpperCase()+navCmd.slice(1)} →</span>`;
        div.appendChild(chip.firstChild);
      }
    }

    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
    return id;
  }

  function removeMsg(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  function escapeHtml(t) {
    return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  /* ─────────────────────────────────────────────────────────
     WAVEFORM ANIMATION
  ───────────────────────────────────────────────────────── */
  function startWaveform() {
    stopWaveformAnim();
    let t = 0;
    function frame() {
      VAI.animFrame = requestAnimationFrame(frame);
      t += 0.15;
      VAI.bars.forEach((b, i) => {
        if (!b) return;
        const h = 4 + Math.abs(Math.sin(t + i * 0.4)) * 28;
        b.style.height = h + 'px';
        b.style.background = VAI.speaking
          ? `hsl(${200 + i*3}, 80%, ${45 + h*0.5}%)`
          : `hsl(${150 + i*2}, 70%, ${35 + h*0.4}%)`;
      });
    }
    VAI.animFrame = requestAnimationFrame(frame);
  }

  function startWaveformSpeaking() { startWaveform(); }

  function stopWaveformAnim() {
    if (VAI.animFrame) { cancelAnimationFrame(VAI.animFrame); VAI.animFrame = null; }
    VAI.bars.forEach((b, i) => {
      if (b) { b.style.height = (4 + Math.sin(i)*2) + 'px'; b.style.background = '#00875A'; }
    });
  }

  /* ─────────────────────────────────────────────────────────
     STATUS
  ───────────────────────────────────────────────────────── */
  function setStatus(text, mode) {
    const el = document.getElementById('vai-status');
    const sub = document.getElementById('vai-sub-status');
    if (el) {
      el.textContent = text;
      el.style.color = mode === 'listening' ? '#C0392B'
        : mode === 'speaking'  ? '#2980B9'
        : mode === 'thinking'  ? '#E67E22'
        : '#00875A';
    }
    if (sub) sub.textContent = text;
  }

  /* ─────────────────────────────────────────────────────────
     LANG TOGGLE
  ───────────────────────────────────────────────────────── */
  function toggleLang() {
    VAI.currentLang = VAI.currentLang === 'en' ? 'kn' : 'en';
    updateLangBadge(VAI.currentLang === 'kn' ? 'KN' : 'EN');
    const msg = VAI.currentLang === 'kn'
      ? 'ಭಾಷೆ ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ.'
      : 'Switched to English.';
    appendMsg('bot', msg);
    speak(msg, VAI.currentLang);
    if (VAI.recognition) { stopListening(); setTimeout(startListening, 600); }
  }

  function updateLangBadge(label) {
    const badge = document.getElementById('vai-lang-badge');
    if (badge) badge.textContent = label;
  }

  /* ─────────────────────────────────────────────────────────
     FETCH WITH TIMEOUT
  ───────────────────────────────────────────────────────── */
  function fetchWithTimeout(url, opts, ms) {
    return new Promise((resolve, reject) => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), ms);
      fetch(url, { ...opts, signal: ctrl.signal })
        .then(r => { clearTimeout(timer); resolve(r); })
        .catch(e => { clearTimeout(timer); reject(e); });
    });
  }

  /* ─────────────────────────────────────────────────────────
     PUBLIC API
  ───────────────────────────────────────────────────────── */
  window.VAIAPI = {
    toggleLang,
    closePanel,
    navigate(screen) {
      if (typeof showScreen === 'function') showScreen(screen);
    },
    clearChat() {
      const chat = document.getElementById('vai-chat');
      if (chat) chat.innerHTML = '';
      VAI.history = [];
    },
    sendMessage,
    openPanel,
    closePanel,
  };

  /* ─────────────────────────────────────────────────────────
     GLOBAL VOICE NAVIGATION COMMANDS (hands-free)
  ───────────────────────────────────────────────────────── */
  function handleVoiceNavigation(text) {
    const t = text.toLowerCase();
    const map = [
      { rx: /\b(dashboard|home|ಮನೆ|ಡ್ಯಾಶ್)\b/, screen: 'dashboard' },
      { rx: /\b(bed|beds|wards|ಹಾಸಿಗೆ|ವಾರ್ಡ್)\b/, screen: 'beds' },
      { rx: /\b(patient|patients|ರೋಗಿ|ರೋಗಿಗಳು)\b/, screen: 'patients' },
      { rx: /\b(booking|appointment|prebooking|book|ಬುಕ್|ಅಪಾಯಿಂಟ್)\b/, screen: 'prebooking' },
      { rx: /\b(emergency|urgent|ತುರ್ತು)\b/, screen: 'emergency' },
      { rx: /\b(blood|blood bank|ರಕ್ತ)\b/, screen: 'bloodby' },
      { rx: /\b(billing|payment|bill|ಬಿಲ್|ಪಾವತಿ)\b/, screen: 'billing' },
      { rx: /\b(oncology|cancer|ಆಂಕಾಲಜಿ|ಕ್ಯಾನ್ಸರ್)\b/, screen: 'oncology' },
      { rx: /\b(report|reports|analytics|ವರದಿ)\b/, screen: 'reports' },
      { rx: /\b(organ|donation|ಅಂಗ|ದಾನ)\b/, screen: 'organdonation' },
      { rx: /\b(contact|contacts|ಸಂಪರ್ಕ)\b/, screen: 'contact' },
    ];
    for (const { rx, screen } of map) {
      if (rx.test(t)) {
        if (typeof showScreen === 'function') showScreen(screen);
        return true;
      }
    }
    return false;
  }

  /* ─────────────────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────────────── */
  function init() {
    buildUI();
    loadVoices();

    // Expose navigation helper
    const origSendMsg = sendMessage;
    window.VAIAPI.sendMessage = function(text) {
      if (!handleVoiceNavigation(text)) origSendMsg(text);
    };

    console.log('✅ AHCare Voice AI initialized | Session:', VAI.sessionId);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
