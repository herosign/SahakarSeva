/**
 * Sahakar Seva — Multilingual AI Voice Assistant Engine
 * Powered by Google Gemini API & Web Speech API
 * Built for MLH 2026
 * Supports Hindi, Tamil, Telugu, Bengali, Marathi, and English.
 */

window.SahakarVoiceAssistant = {
  // Gemini API Configuration (loaded via config.local.js or localStorage)
  get apiKey() {
    return window.GEMINI_API_KEY || (typeof localStorage !== 'undefined' && localStorage.getItem('gemini_api_key')) || '';
  },
  
  // Model cascade for high reliability and sub-second latency
  candidateModels: [
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash'
  ],

  // Multilingual Trade Keyword Dictionary for local offline fallback
  tradeKeywords: {
    'Electrician': [
      // English
      'electrician', 'electric', 'electrical', 'wiring', 'fan', 'ceiling fan', 'switch', 'switchboard', 'light', 'fuse', 'inverter', 'voltage', 'wire', 'socket',
      // Hindi / Hinglish
      'इलेक्ट्रीशियन', 'बिजली', 'पंखा', 'स्विच', 'बोर्ड', 'तार', 'लाइट', 'फ्यूज', 'शॉर्ट सर्किट', 'bijli', 'pankha', 'chulha',
      // Tamil
      'எலக்ட்ரீஷியன்', 'மின்சாரம்', 'மின்விசிறி', 'விசிறி', 'சுவிட்ச்', 'வயரிங்', 'மின்பழுது',
      // Telugu
      'ఎలక్ట్రీషియన్', 'విద్యుత్', 'ఫ్యాన్', 'స్విచ్', 'వైరింగ్', 'కరెంట్', 'లైట్',
      // Bengali
      'ইলেকট্রিশিয়ান', 'বৈদ্যুতিক', 'পাখা', 'সুইচ', 'ওয়্যারিং', 'বিদ্যুৎ', 'ফ্যান',
      // Marathi
      'इलेक्ट्रिशियन', 'वीज', 'पंखा', 'बटण', 'वायरिंग', 'लाईट'
    ],
    'Plumber': [
      // English
      'plumber', 'plumbing', 'pipe', 'pipeline', 'tap', 'faucet', 'leak', 'leakage', 'drain', 'water', 'sink', 'flush', 'shower', 'cistern', 'toilet',
      // Hindi / Hinglish
      'प्लंबर', 'नल', 'पाइप', 'लीक', 'पानी', 'सिंक', 'टॉयलेट', 'nal', 'paani', 'tanki',
      // Tamil
      'பிளம்பர்', 'பிளம்பிங்', 'குழாய்', 'தண்ணீர்', 'கசிவு', 'சின்னி', 'தொட்டி',
      // Telugu
      'ప్లంబర్', 'పైపు', 'కుళాయి', 'నీళ్లు', 'లీకేజ్', 'సింక్',
      // Bengali
      'প্লাম্বার', 'পাইপ', 'কল', 'জল', 'লিক', 'ড্রেন',
      // Marathi
      'प्लंबर', 'नळ', 'पाईप', 'गळती', 'पाणी'
    ],
    'Carpenter': [
      // English
      'carpenter', 'carpentry', 'wood', 'wooden', 'door', 'window', 'table', 'chair', 'furniture', 'lock', 'cabinet', 'bed', 'sofa', 'shelf', 'hinge', 'almirah',
      // Hindi / Hinglish
      'बढ़ई', 'कारपेंटर', 'लकड़ी', 'दरवाजा', 'खिड़की', 'मेज', 'कुर्सी', 'फर्नीचर', 'ताला', 'अलमारी', 'lakdi', 'darwaja',
      // Tamil
      'தச்சர்', 'மரம்', 'மரவேலை', 'கதவு', 'ஜன்னல்', 'மேஜை', 'நாற்காலி', 'மரச்சாமான்கள்',
      // Telugu
      'వడ్రంగి', 'కార్పెంటర్', 'చెక్క', 'తలుపు', 'కిటికీ', 'టేబుల్', 'కుర్చీ',
      // Bengali
      'কার্পেন্টার', 'ছুতোর', 'কাঠ', 'দরজা', 'জানালা', 'টেবিল', 'চেয়ার', 'আসবাবপত্র',
      // Marathi
      'सुतार', 'कारपेंटर', 'लाकूड', 'दरवाजा', 'खिडकी', 'कपाट'
    ],
    'Mason': [
      // English
      'mason', 'masonry', 'brick', 'wall', 'cement', 'tile', 'tiles', 'plaster', 'concrete', 'flooring', 'grouting',
      // Hindi / Hinglish
      'राजमिस्त्री', 'मिस्त्री', 'ईंट', 'दीवार', 'सीमेंट', 'टाइल', 'प्लास्टर', 'छत', 'mistri', 'deewar', 'cement',
      // Tamil
      'கொத்தனார்', 'செங்கல்', 'சுவர்', 'சிமெண்ட்', 'டைல்ஸ்',
      // Telugu
      'తాపీ మేస్త్రీ', 'ఇటుక', 'గోడ', 'సిమెంట్', 'టైల్స్',
      // Bengali
      'রাজমিস্ত্রি', 'ইট', 'দেয়াল', 'সিমেন্ট', 'টাইলস',
      // Marathi
      'गवंडी', 'विटा', 'भिंत', 'सिमेंट'
    ],
    'AC Repair': [
      // English
      'ac', 'air conditioner', 'cooling', 'ac service', 'gas', 'gas filling', 'filter', 'compressor', 'servicing', 'split ac', 'window ac',
      // Hindi / Hinglish
      'एसी', 'एयर कंडीशनर', 'कूलिंग', 'गैस', 'सर्विसिंग', 'ठंडा', 'ac repair', 'ac thanda nahi kar raha',
      // Tamil
      'ஏசி', 'ஏர் கண்டிஷனர்', 'குளிரூட்டி', 'கேஸ்', 'சர்வீஸ்',
      // Telugu
      'ఏసీ', 'ఎయిర్ కండీషనర్', 'కూలింగ్', 'గ్యాస్ ఫిల్లింగ్', 'సర్వీసింగ్',
      // Bengali
      'এসি', 'শীতাতপ নিয়ন্ত্রক', 'কুলিং', 'গ্যাস', 'সার্ভিসিং',
      // Marathi
      'एसी', 'कूलिंग', 'गॅस भरणे', 'सर्व्हिसिंग'
    ],
    'Cleaning': [
      // English
      'cleaning', 'clean', 'cleaner', 'sweep', 'mop', 'dusting', 'wash', 'deep cleaning', 'housekeeping', 'kitchen cleaning', 'bathroom cleaning',
      // Hindi / Hinglish
      'सफाई', 'क्लीनिंग', 'झाड़ू', 'पोछा', 'धुलाई', 'safai', 'pochha',
      // Tamil
      'சுத்தம்', 'தூய்மை', 'துடைத்தல்', 'வீட்டு சுத்தம்',
      // Telugu
      'శుభ్రం', 'క్లీనింగ్', 'ఊడ్చడం', 'తుడవడం',
      // Bengali
      'পরিষ্কার', 'সাফাই', 'ঝাড়ু', 'মোছা',
      // Marathi
      'स्वच्छता', 'सफाई', 'झाडू'
    ]
  },

  /**
   * Primary entry point: parses transcript using Gemini API with intelligent local fallback
   * @param {string} transcript The spoken text transcript
   * @param {string} [languageHint] Optional spoken language name or code
   * @returns {Promise<Object>} Extracted booking entities
   */
  parse: async function(transcript, languageHint) {
    if (!transcript || typeof transcript !== 'string') {
      return this.parseOffline(transcript);
    }

    const trimmed = transcript.trim();
    if (trimmed.length === 0) {
      return this.parseOffline(transcript);
    }

    // Try Gemini API first
    try {
      const geminiResult = await this.parseWithGemini(trimmed, languageHint);
      if (geminiResult && geminiResult.service_type) {
        return geminiResult;
      }
    } catch (err) {
      console.warn('[SahakarVoiceAssistant] Gemini API call failed or timed out, falling back to local NLP parser:', err.message);
    }

    // Seamless offline fallback
    return this.parseOffline(trimmed);
  },

  /**
   * Calls Google Gemini API with model cascade and prompt engineering
   */
  parseWithGemini: async function(transcript, languageHint) {
    const prompt = `You are the multilingual AI voice assistant for "Sahakar Seva", an Indian cooperative gig marketplace (MLH 2026).
The user spoke a service request in an Indian language (e.g. Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, or English).

Your job: Extract the service category, user location/locality, budget/offer amount, and a concise task description.

RULES:
1. "service_type" MUST be exactly one of: "Electrician", "Plumber", "Carpenter", "Mason", "AC Repair", "Cleaning".
2. "location": Extract the city, sector, neighborhood, or locality. Transliterate it into clean English script (e.g., "लाजपत नगर" -> "Lajpat Nagar, Delhi", "அடையாறு" -> "Adyar, Chennai", "మాదాపూర్" -> "Madhapur, Hyderabad", "সল্টলেক" -> "Salt Lake, Kolkata", "कोथरुड" -> "Kothrud, Pune"). If no location is mentioned, return "Detected from Area".
3. "budget": Extract the numerical amount in INR (convert Indic numerals to standard integer). If not mentioned, provide a fair reasonable standard amount (Electrician: 400, Plumber: 350, Carpenter: 400, Mason: 450, AC Repair: 550, Cleaning: 300).
4. "description": A concise, clear English summary of the requested job.
5. "detected_language": The natural language spoken (e.g. "Hindi", "Tamil", "Telugu", "Bengali", "Marathi", "English").

Respond ONLY with a valid JSON object matching this schema:
{
  "service_type": "Electrician" | "Plumber" | "Carpenter" | "Mason" | "AC Repair" | "Cleaning",
  "location": "<English transliteration of locality>",
  "budget": <integer amount in INR>,
  "description": "<concise English summary>",
  "detected_language": "<Language name>"
}

User Spoken Request: "${transcript}"`;

    // Try candidate models in order
    for (const model of this.candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
        
        // Timeout controller: 4.5 seconds per model to keep user interaction snappy
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1
            }
          })
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.warn(`[SahakarVoiceAssistant] Model ${model} returned HTTP ${response.status}`);
          continue; // try next candidate model
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) continue;

        // Clean JSON markdown fences ```json ... ```
        let cleaned = rawText.trim();
        if (cleaned.startsWith('```json')) {
          cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        const parsed = JSON.parse(cleaned);

        // Sanitize and validate fields
        let trade = parsed.service_type || 'Electrician';
        const validTrades = ['Electrician', 'Plumber', 'Carpenter', 'Mason', 'AC Repair', 'Cleaning'];
        const matchedTrade = validTrades.find(t => t.toLowerCase() === trade.toLowerCase());
        if (matchedTrade) trade = matchedTrade;

        let budget = parseInt(parsed.budget, 10);
        if (isNaN(budget) || budget <= 0) {
          budget = 400;
        }

        return {
          service_type: trade,
          location: parsed.location || 'Detected from Area',
          budget: budget,
          description: parsed.description || `${trade} repair and service required`,
          detected_language: parsed.detected_language || 'Auto-Detected',
          raw_transcript: transcript,
          source: 'gemini'
        };

      } catch (err) {
        console.warn(`[SahakarVoiceAssistant] Error with model ${model}:`, err.message);
      }
    }

    throw new Error('All Gemini candidate models failed');
  },

  /**
   * Offline rule-based NLP Entity Extraction fallback
   */
  parseOffline: function(transcript) {
    if (!transcript) {
      return { service_type: 'Electrician', location: 'Sector 62, Noida', budget: 400, description: 'Electrician service needed', detected_language: 'English', source: 'offline' };
    }

    const text = transcript.trim();
    const lower = text.toLowerCase();

    // 1. Detect Trade using Multilingual Keywords
    let detectedTrade = null;
    let maxMatches = 0;

    for (const [trade, keywords] of Object.entries(this.tradeKeywords)) {
      let matches = 0;
      for (const kw of keywords) {
        if (lower.includes(kw.toLowerCase())) {
          matches += (kw === trade.toLowerCase()) ? 4 : 2;
        }
      }
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedTrade = trade;
      }
    }

    if (!detectedTrade) {
      detectedTrade = 'Electrician';
    }

    // 2. Detect Budget (supports ₹, rs, inr, rupaye, taka, rubai, etc.)
    let detectedBudget = null;
    const indicDigitsMap = {
      '०': 0, '१': 1, '२': 2, '३': 3, '४': 4, '५': 5, '६': 6, '७': 7, '८': 8, '९': 9, // Devanagari
      '০': 0, '১': 1, '২': 2, '৩': 3, '৪': 4, '৫': 5, '৬': 6, '৭': 7, '৮': 8, '৯': 9, // Bengali
      '౦': 0, '౧': 1, '౨': 2, '౩': 3, '౪': 4, '౫': 5, '౬': 6, '౭': 7, '౮': 8, '౯': 9  // Telugu
    };

    // Convert Indic digits to standard digits
    let normalizedDigits = text;
    for (const [indic, standard] of Object.entries(indicDigitsMap)) {
      normalizedDigits = normalizedDigits.split(indic).join(standard.toString());
    }

    const budgetRegexes = [
      /(?:₹|rs\.?|inr|rupees|rupaye|taka|rubai|రూపాయలు|ரூபாய்|টাকা|रुपये|रुपया)\s*(\d{2,5})/i,
      /(\d{2,5})\s*(?:₹|rs\.?|inr|rupees|rupaye|taka|rubai|రూపాయలు|ரூபாய்|টাকা|रुपये|रुपया|bucks)/i,
      /(?:budget|for|offer|बजट|பட்ஜெட்|బడ్జెట్)\s*(?:is|of|hai)?\s*(\d{2,5})/i
    ];

    for (const reg of budgetRegexes) {
      const match = normalizedDigits.match(reg);
      if (match && match[1]) {
        detectedBudget = parseInt(match[1], 10);
        break;
      }
    }

    if (!detectedBudget) {
      // General 3-4 digit extractor
      const numMatch = normalizedDigits.match(/\b([2-9]\d{2,3}|1[0-9]{3})\b/);
      if (numMatch) {
        detectedBudget = parseInt(numMatch[1], 10);
      }
    }

    if (!detectedBudget) {
      detectedBudget = 400;
    }

    // 3. Location Detection
    const knownLocations = [
      { name: 'Sector 62, Noida', triggers: ['sector 62', 'sec 62', 'noida 62'] },
      { name: 'Sector 15, Noida', triggers: ['sector 15', 'sec 15'] },
      { name: 'Lajpat Nagar, Delhi', triggers: ['lajpat nagar', 'lajpat', 'लाजपत नगर'] },
      { name: 'Greater Kailash, Delhi', triggers: ['greater kailash', 'gk'] },
      { name: 'Dwarka, Delhi', triggers: ['dwarka', 'द्वारका'] },
      { name: 'Adyar, Chennai', triggers: ['adyar', 'அடையாறு', 'chennai', 'சென்னை'] },
      { name: 'Madhapur, Hyderabad', triggers: ['madhapur', 'మాదాపూర్', 'hyderabad', 'హైదరాబాద్'] },
      { name: 'Salt Lake, Kolkata', triggers: ['salt lake', 'সল্টলেক', 'kolkata', 'কলকাতা'] },
      { name: 'Kothrud, Pune', triggers: ['kothrud', 'कोथरुड', 'pune', 'पुणे'] },
      { name: 'Indirapuram, Ghaziabad', triggers: ['indirapuram', 'इंदिरापुरम'] }
    ];

    let detectedLocation = null;
    for (const loc of knownLocations) {
      if (loc.triggers.some(trig => lower.includes(trig))) {
        detectedLocation = loc.name;
        break;
      }
    }

    if (!detectedLocation) {
      const prepMatch = text.match(/(?:in|at|near|mein|me|में|இல்|లో|তে)\s+([a-zA-Z0-9\s,]{3,25})/i);
      if (prepMatch && prepMatch[1]) {
        detectedLocation = prepMatch[1].trim();
      }
    }

    if (!detectedLocation) {
      detectedLocation = 'Sector 62, Noida';
    }

    return {
      service_type: detectedTrade,
      location: detectedLocation,
      budget: detectedBudget,
      description: `${detectedTrade} service requested`,
      detected_language: 'Multilingual (Local NLP)',
      raw_transcript: transcript,
      source: 'offline'
    };
  }
};
