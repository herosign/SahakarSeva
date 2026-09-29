window.Voice = {
  recognition: null,
  isListening: false,
  
  isSupported: function() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  },
  
  init: function() {
    if (!this.isSupported()) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    
    this.setLanguage(window.I18n ? window.I18n.getCurrentLanguage() : 'en');
  },
  
  startListening: function(callback) {
    if (!this.recognition) {
      if (this.isSupported()) this.init();
      else return false;
    }
    
    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (callback) callback(transcript);
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
    };
    
    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch(e) {
      console.error(e);
      this.isListening = false;
      return false;
    }
  },
  
  stopListening: function() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  },
  
  speak: function(text) {
    if (!window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const langCode = this.getBCP47(window.I18n ? window.I18n.getCurrentLanguage() : 'en');
    utterance.lang = langCode;
    
    // Try to find a matching voice
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(langCode) || v.lang.startsWith(langCode.split('-')[0]));
    if (voice) {
      utterance.voice = voice;
    }
    
    window.speechSynthesis.speak(utterance);
  },
  
  setLanguage: function(langCode) {
    if (this.recognition) {
      this.recognition.lang = this.getBCP47(langCode);
    }
  },
  
  getBCP47: function(lang) {
    const map = {
      'en': 'en-IN',
      'hi': 'hi-IN',
      'ta': 'ta-IN',
      'te': 'te-IN',
      'mr': 'mr-IN',
      'bn': 'bn-IN',
      'kn': 'kn-IN'
    };
    return map[lang] || 'en-IN';
  }
};

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.Voice.init());
} else {
  window.Voice.init();
}
