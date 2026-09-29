/**
 * Sahakar Seva — Web Speech API Integration
 * Handles speech-to-text with multi-language BCP-47 recognition (hi-IN, ta-IN, te-IN, bn-IN, mr-IN, en-IN)
 * and text-to-speech feedback.
 */

window.Voice = {
  recognition: null,
  isListening: false,
  currentSpeechLang: localStorage.getItem('sahakar_voice_lang') || 'en',

  supportedLanguages: [
    { code: 'en', bcp47: 'en-IN', name: 'English', native: 'English', flag: '🇬🇧' },
    { code: 'hi', bcp47: 'hi-IN', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ta', bcp47: 'ta-IN', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te', bcp47: 'te-IN', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
    { code: 'bn', bcp47: 'bn-IN', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
    { code: 'mr', bcp47: 'mr-IN', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' }
  ],
  
  isSupported: function() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  },
  
  init: function() {
    if (!this.isSupported()) return;
    
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;
      
      this.setLanguage(this.currentSpeechLang);
    } catch (e) {
      console.error('[Voice] Failed to initialize SpeechRecognition:', e);
    }
  },
  
  startListening: function(callback, errorCallback) {
    if (!this.isSupported()) {
      if (errorCallback) errorCallback('SpeechRecognition not supported in this browser.');
      return false;
    }

    if (!this.recognition) {
      this.init();
    }

    // Set the language before starting
    const bcp47 = this.getBCP47(this.currentSpeechLang);
    this.recognition.lang = bcp47;
    console.log(`[Voice] Starting recognition in language: ${this.currentSpeechLang} (${bcp47})`);
    
    this.recognition.onresult = (event) => {
      this.isListening = false;
      if (event.results && event.results.length > 0 && event.results[0].length > 0) {
        const transcript = event.results[0][0].transcript;
        console.log('[Voice] Transcript received:', transcript);
        if (callback) callback(transcript);
      }
    };
    
    this.recognition.onerror = (event) => {
      this.isListening = false;
      console.warn('[Voice] Speech error:', event.error);
      if (errorCallback) errorCallback(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };
    
    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch(e) {
      console.error('[Voice] Start error:', e);
      this.isListening = false;
      // If already started, stop and restart
      try {
        this.recognition.stop();
      } catch(ignore) {}
      if (errorCallback) errorCallback(e.message);
      return false;
    }
  },
  
  stopListening: function() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch(e){}
      this.isListening = false;
    }
  },
  
  speak: function(text, lang) {
    if (!window.speechSynthesis) return;
    
    try {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      const targetLang = lang || this.currentSpeechLang || 'en';
      const langCode = this.getBCP47(targetLang);
      utterance.lang = langCode;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const voice = voices.find(v => v.lang === langCode || v.lang.startsWith(langCode.split('-')[0]));
        if (voice) {
          utterance.voice = voice;
        }
      }
      
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('[Voice] TTS error:', e);
    }
  },
  
  setLanguage: function(langCode) {
    this.currentSpeechLang = langCode;
    localStorage.setItem('sahakar_voice_lang', langCode);
    if (this.recognition) {
      this.recognition.lang = this.getBCP47(langCode);
    }
  },

  getCurrentLanguage: function() {
    return this.currentSpeechLang;
  },
  
  getBCP47: function(lang) {
    const found = this.supportedLanguages.find(l => l.code === lang);
    return found ? found.bcp47 : 'en-IN';
  }
};

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.Voice.init());
} else {
  window.Voice.init();
}
