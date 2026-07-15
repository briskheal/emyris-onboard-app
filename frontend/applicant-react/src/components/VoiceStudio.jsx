import React, { useState, useEffect, useRef } from 'react';

const PRODUCT_SCRIPTS = {
  'ALOMOS GOLD': {
    id: 'alomos-gold',
    name: 'ALOMOS GOLD',
    tagline: 'The Gold-Standard 5-in-1 Clinical Nutrition Formula',
    hook: "Good Morning/Afternoon Doctor! Today, I am proud to introduce Emyris Biolifesciences' ALOMOS GOLD — The Gold-Standard 5-in-1 Clinical Nutrition Formula engineered specifically to Empower Surgical Recovery, Critical Care, and Muscle Synthesis without the GI distress common in standard protein supplements.",
    need: "Doctor, whether in Post-Surgical Recovery, Post-Bariatric surgery, Critical Care ICU, Cancer Cachexia, or Geriatric Sarcopenia, your patients desperately require rapid tissue repair and positive nitrogen balance without bloating or malabsorption.",
    pillars: [
      "Ultra-High Protein Density (25g WPI per 30g scoop) with 4,706 mg BCAAs: Triggers rapid Muscle Protein Synthesis (MPS) and preserves lean body mass.",
      "Maximal Bioavailability with Zero GI Distress (300mg DigeZyme® + 13.88B CFU Probiotics + 12g Prebiotic Fiber): A proprietary 5-enzyme matrix plus multi-strain probiotics ensuring complete protein breakdown without lactose sensitivity or bloating.",
      "Anti-Inflammatory Recovery (150mg Curcumin Extract): Natural antioxidant support reducing post-surgical swelling and oxidative stress."
    ],
    closing: "Best of all, Doctor, ALOMOS GOLD is completely Sugar-Free and Gluten-Free, enriched with 26 essential vitamins and minerals, and comes in a delicious Chocolate Flavour. Please prescribe ALOMOS GOLD — 1 level scoop (30g) in 200–250ml cold water or milk twice daily for your recovering patients.",
    fullText: "Good Morning Doctor! Today, I am proud to introduce Emyris Biolifesciences' ALOMOS GOLD — The Gold-Standard 5-in-1 Clinical Nutrition Formula engineered specifically to Empower Surgical Recovery, Critical Care, and Muscle Synthesis without GI distress. Doctor, whether in Post-Surgical Recovery, Post-Bariatric surgery, Critical Care ICU, Cancer Cachexia, or Geriatric Sarcopenia, your patients require rapid tissue repair without bloating. First, it delivers Ultra-High Protein Density with 25 grams of 100% Whey Protein Isolate and 4,706 milligrams of BCAAs per scoop to trigger rapid Muscle Protein Synthesis. Second, it guarantees maximal bioavailability with zero GI distress using 300 milligrams of DigeZyme 5-enzyme matrix and 13.88 Billion CFU Probiotics with 12 grams Prebiotic Fiber. Third, it provides anti-inflammatory recovery through 150 milligrams of Curcumin Extract. Best of all, ALOMOS GOLD is completely Sugar-Free and Gluten-Free, fortified with 26 vitamins and minerals in a palatable Chocolate Flavour. Please prescribe ALOMOS GOLD — 1 level scoop (30g) in 200 to 250 millilitres of cold water twice daily.",
    keywords: [
      { word: "Whey Protein Isolate", category: "Core Protein" },
      { word: "25g", category: "Dosage Strength" },
      { word: "BCAAs", category: "Muscle Synthesis" },
      { word: "4,706 mg", category: "BCAA Strength" },
      { word: "DigeZyme", category: "Enzyme Matrix" },
      { word: "Probiotics", category: "Gut Health" },
      { word: "Prebiotic Fiber", category: "Microbiome" },
      { word: "Curcumin", category: "Anti-Inflammatory" },
      { word: "Sugar-Free", category: "Safety Profile" },
      { word: "Gluten-Free", category: "Safety Profile" },
      { word: "26 Vitamins", category: "Micronutrition" },
      { word: "Chocolate Flavour", category: "Palatability" },
      { word: "200", category: "Preparation Protocol" }
    ]
  },
  'GLOWVIT-60K': {
    id: 'glowvit-60k',
    name: 'GLOWVIT-60K',
    tagline: 'Advanced Vitamin D3 Nano Formula Oral Shot',
    hook: "Good Morning Doctor! I am pleased to present GLOWVIT-60K, our advanced ready-to-use Vitamin D3 Nano Oral Solution delivering 60,000 IU for rapid bone mineralization and systemic clinical support.",
    need: "Doctor, standard D3 tablets often suffer from poor intestinal absorption and delayed onset in severe osteopenia, osteoporosis, and elderly patients.",
    pillars: [
      "Advanced Nano-Emulsion Technology: Ensures 95%+ bioavailability and 3x faster absorption directly into circulation compared to conventional oil granules or tablets.",
      "Ready-to-Use 5ml Oral Shot: Zero mixing needed, ensuring 100% patient compliance especially in elderly and post-menopausal women.",
      "Pleasant Palatability: Delivers robust support for bone density, muscular strength, and insulin sensitivity without any metallic aftertaste."
    ],
    closing: "Please prescribe GLOWVIT-60K 5ml oral shot once weekly for 6 to 8 weeks for rapid deficiency correction, and once monthly for maintenance.",
    fullText: "Good Morning Doctor! I am pleased to present GLOWVIT-60K, our advanced ready-to-use Vitamin D3 Nano Oral Solution delivering 60,000 IU for rapid bone mineralization and systemic clinical support. Doctor, standard D3 tablets often suffer from poor intestinal absorption and delayed onset in severe osteopenia, osteoporosis, and elderly patients. First, GLOWVIT-60K utilizes Advanced Nano-Emulsion Technology, ensuring 95% bioavailability and 3 times faster absorption directly into circulation compared to conventional oil granules. Second, it is presented in a ready-to-use 5 millilitre oral shot requiring zero mixing, guaranteeing 100% patient compliance. Third, beyond calcium absorption, it significantly supports skeletal muscle strength and insulin sensitivity. Please prescribe GLOWVIT-60K 5 millilitre oral shot once weekly for 6 to 8 weeks for rapid deficiency correction.",
    keywords: [
      { word: "60,000 IU", category: "Potency" },
      { word: "Nano", category: "Technology" },
      { word: "Bioavailability", category: "Absorption" },
      { word: "Ready-to-Use", category: "Convenience" },
      { word: "5ml", category: "Volume" },
      { word: "Weekly", category: "Regimen" }
    ]
  },
  'Emystein': {
    id: 'emystein',
    name: 'Emystein 3miu',
    tagline: 'Broad-Spectrum Colistimethate Sodium for ICU Infection',
    hook: "Good Morning Doctor! I am introducing Emystein 3 MIU, our critical-care Colistimethate Sodium injection engineered for life-saving efficacy against multi-drug resistant Gram-negative pathogens.",
    need: "Doctor, in Intensive Care Units, Pseudomonas aeruginosa and Acinetobacter infections demand immediate, bactericidal action where conventional beta-lactams fail.",
    pillars: [
      "Targeted Bactericidal Action: Rapidly disrupts bacterial cell membranes of multi-drug resistant Gram-negative organisms.",
      "Optimized 3 MIU Strength: Provides exact clinical titration for IV and aerosolized administration in ventilator-associated pneumonia.",
      "High Purity & Safety Profile: Manufactured under strict lyophilization standards to minimize nephrotoxicity risks when dosed per renal guidelines."
    ],
    closing: "Please consider Emystein 3 MIU as your trusted first-line defense in critical ICU multi-drug resistant infections.",
    fullText: "Good Morning Doctor! I am introducing Emystein 3 MIU, our critical-care Colistimethate Sodium injection engineered for life-saving efficacy against multi-drug resistant Gram-negative pathogens. Doctor, in Intensive Care Units, Pseudomonas aeruginosa and Acinetobacter infections demand immediate, bactericidal action where conventional beta-lactams fail. First, Emystein delivers targeted bactericidal action that rapidly disrupts bacterial cell membranes of resistant Gram-negative organisms. Second, its optimized 3 Million International Units strength allows exact clinical titration for IV and aerosolized administration. Third, it is manufactured under strict lyophilization standards to ensure high purity and consistent ICU performance. Please prescribe Emystein 3 MIU as your trusted defense in critical ICU infections.",
    keywords: [
      { word: "Colistimethate", category: "Molecule" },
      { word: "3 MIU", category: "Strength" },
      { word: "Gram-negative", category: "Spectrum" },
      { word: "ICU", category: "Indication" },
      { word: "Pseudomonas", category: "Pathogen" }
    ]
  }
};

const VoiceStudio = ({ applicant }) => {
  const [scriptsMap, setScriptsMap] = useState(PRODUCT_SCRIPTS);
  const [selectedProd, setSelectedProd] = useState('ALOMOS GOLD');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.95);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [practiceScore, setPracticeScore] = useState(null);
  const [matchedWords, setMatchedWords] = useState([]);
  const [missedWords, setMissedWords] = useState([]);
  const [audioUrl, setAudioUrl] = useState(null);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    fetch('/api/company-data')
      .then(res => res.json())
      .then(data => {
        if (data && data.detailingScripts && typeof data.detailingScripts === 'object' && Object.keys(data.detailingScripts).length > 0) {
          setScriptsMap(data.detailingScripts);
          if (!data.detailingScripts[selectedProd]) {
            setSelectedProd(Object.keys(data.detailingScripts)[0] || 'ALOMOS GOLD');
          }
        }
      })
      .catch(err => console.warn("Could not load dynamic detailing scripts, using defaults:", err));
  }, []);

  const currentScript = scriptsMap[selectedProd] || scriptsMap['ALOMOS GOLD'] || PRODUCT_SCRIPTS['ALOMOS GOLD'];

  const handleToggleAudio = () => {
    if (!('speechSynthesis' in window)) {
      alert("Your browser does not support Web Speech Audio. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.cancel();
      const pronounceableText = currentScript.fullText
        .replace(/ALOMOS GOLD/gi, 'Alomos Gold')
        .replace(/ALOMOS HP ADVANCED/gi, 'Alomos H P Advanced')
        .replace(/ALOMOS DM/gi, 'Alomos D M')
        .replace(/ALOMOS MAMA/gi, 'Alomos Mama')
        .replace(/ALOMOS/gi, 'Alomos')
        .replace(/GLOWVIT-60K/gi, 'Glowvit Sixty K')
        .replace(/GulpCDZ/gi, 'Gulp C D Z');
      
      const utterance = new window.SpeechSynthesisUtterance(pronounceableText);
      utterance.rate = speechRate;
      utterance.pitch = 1.0;
      utterance.lang = 'en-IN';

      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => (v.lang.includes('IN') || v.lang.includes('en-GB') || v.lang.includes('en-US')) && (v.name.includes('Heera') || v.name.includes('Female') || v.name.includes('Google English (India)') || v.name.includes('Zira')))
        || voices.find(v => v.name.includes('Female') || v.name.includes('Heera') || v.name.includes('Google'))
        || voices[0];
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  const handleStartRecording = async () => {
    setTranscript('');
    setPracticeScore(null);
    setMatchedWords([]);
    setMissedWords([]);
    setAudioUrl(null);
    audioChunksRef.current = [];

    // Start Audio Recording for playback
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
    } catch (e) {
      console.warn("Could not start microphone recording:", e);
    }

    // Start Web Speech Recognition for scoring
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Microphone recognition for scoring is not supported in this browser. However, you can still record and listen to your voice.");
      setIsRecording(true);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      let fullTranscript = '';
      recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            fullTranscript += res[0].transcript + ' ';
          } else {
            interim += res[0].transcript;
          }
        }
        const currentText = (fullTranscript + interim).trim();
        setTranscript(currentText);
        calculateScore(currentText);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error !== 'no-speech') {
          setIsRecording(false);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Speech rec start error:", err);
      setIsRecording(true);
    }
  };

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (transcript) {
      calculateScore(transcript);
    } else {
      setTranscript("Audio recorded successfully! Listen to your own voice below to self-modulate and practice.");
    }
  };

  const calculateScore = (text) => {
    if (!text || !currentScript.keywords || currentScript.keywords.length === 0) return;
    const lower = text.toLowerCase();
    const matched = [];
    const missed = [];

    currentScript.keywords.forEach(k => {
      if (lower.includes(k.word.toLowerCase())) {
        matched.push(k.word);
      } else {
        missed.push(k.word);
      }
    });

    const score = Math.round((matched.length / currentScript.keywords.length) * 100);
    setMatchedWords(matched);
    setMissedWords(missed);
    setPracticeScore(score);
  };

  return (
    <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '16px', padding: '28px', color: '#f8fafc', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '18px', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🎙️ Doctor Detailing Voice Studio (`AI Lab`)</span>
          </h2>
          <div style={{ fontSize: '0.88rem', color: '#94a3b8', marginTop: '4px' }}>
            Standardized Female Voice Detailing • Audio Recording & Self-Modulation Practice Center
          </div>
        </div>

        {/* Product Selection Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {Object.keys(scriptsMap).map(prodKey => (
            <button
              key={prodKey}
              onClick={() => {
                if (isPlaying && window.speechSynthesis) window.speechSynthesis.cancel();
                setIsPlaying(false);
                setSelectedProd(prodKey);
              }}
              style={{
                background: selectedProd === prodKey ? 'linear-gradient(135deg, #a855f7, #6366f1)' : '#1e293b',
                color: '#fff',
                border: `1px solid ${selectedProd === prodKey ? '#c084fc' : '#334155'}`,
                padding: '8px 16px',
                borderRadius: '10px',
                fontWeight: selectedProd === prodKey ? '700' : '600',
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: selectedProd === prodKey ? '0 4px 15px rgba(168, 85, 247, 0.4)' : 'none'
              }}
            >
              💊 {prodKey}
            </button>
          ))}
        </div>
      </div>

      {/* 2-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        
        {/* Left Column: Script Breakdown */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', color: '#a855f7', fontSize: '1.25rem', fontWeight: '800' }}>{currentScript.name}</h3>
            <div style={{ color: '#cbd5e1', fontSize: '0.9rem', fontStyle: 'italic' }}>{currentScript.tagline}</div>
          </div>

          <div style={{ background: '#0f172a', padding: '14px', borderRadius: '10px', borderLeft: '4px solid #3b82f6' }}>
            <strong style={{ color: '#60a5fa', fontSize: '0.82rem', display: 'block', textTransform: 'uppercase', marginBottom: '4px' }}>🎣 Opening Hook</strong>
            <div style={{ fontSize: '0.92rem', color: '#e2e8f0', lineHeight: '1.5' }}>"{currentScript.hook}"</div>
          </div>

          <div style={{ background: '#0f172a', padding: '14px', borderRadius: '10px', borderLeft: '4px solid #f59e0b' }}>
            <strong style={{ color: '#fbbf24', fontSize: '0.82rem', display: 'block', textTransform: 'uppercase', marginBottom: '4px' }}>🩺 Clinical Need</strong>
            <div style={{ fontSize: '0.92rem', color: '#e2e8f0', lineHeight: '1.5' }}>"{currentScript.need}"</div>
          </div>

          <div style={{ background: '#0f172a', padding: '14px', borderRadius: '10px', borderLeft: '4px solid #10b981' }}>
            <strong style={{ color: '#34d399', fontSize: '0.82rem', display: 'block', textTransform: 'uppercase', marginBottom: '8px' }}>⚡ Key Scientific Pillars</strong>
            <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: '#e2e8f0' }}>
              {(currentScript.pillars || []).map((p, idx) => (
                <li key={idx} style={{ lineHeight: '1.4' }}>{p}</li>
              ))}
            </ul>
          </div>

          <div style={{ background: '#0f172a', padding: '14px', borderRadius: '10px', borderLeft: '4px solid #ec4899' }}>
            <strong style={{ color: '#f472b6', fontSize: '0.82rem', display: 'block', textTransform: 'uppercase', marginBottom: '4px' }}>🎯 Closing & Prescription Request</strong>
            <div style={{ fontSize: '0.92rem', color: '#e2e8f0', lineHeight: '1.5' }}>"{currentScript.closing}"</div>
          </div>

          {/* Target Keywords */}
          <div>
            <strong style={{ fontSize: '0.82rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>🔑 Mandatory Clinical Keywords to Hit:</strong>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(currentScript.keywords || []).map((k, idx) => (
                <span key={idx} style={{ background: 'rgba(168,85,247,0.18)', border: '1px solid rgba(168,85,247,0.4)', color: '#d8b4fe', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600' }}>
                  {k.word}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Audio Lab & Practice Center */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '1.15rem', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
            🎧 AI Detailing & Audio Practice Lab
          </h3>

          {/* Sample Pitch TTS */}
          <div style={{ background: '#0f172a', border: '1px solid #475569', borderRadius: '12px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <strong style={{ color: '#fff', fontSize: '0.98rem', display: 'block' }}>🔊 Standard Female Voice Pitch</strong>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Listen to ideal pacing, clinical pronunciation, and emphasis.</span>
              </div>
              <button
                onClick={handleToggleAudio}
                style={{
                  background: isPlaying ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: isPlaying ? '0 4px 15px rgba(239, 68, 68, 0.4)' : '0 4px 15px rgba(16, 185, 129, 0.4)'
                }}
              >
                {isPlaying ? '⏹️ Stop Audio Pitch' : '🔊 Listen to Sample Pitch'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem', color: '#cbd5e1' }}>
              <span>Speech Pacing: <strong>{speechRate}x</strong></span>
              <input
                type="range"
                min="0.75"
                max="1.25"
                step="0.05"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: '#a855f7', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Self-Modulation Recording Lab */}
          <div style={{ background: '#0f172a', border: '1px solid #a855f7', borderRadius: '12px', padding: '18px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#d8b4fe', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎙️ Record Your Own Pitch (`Self-Modulation Lab`)</span>
            </h4>
            <p style={{ fontSize: '0.84rem', color: '#94a3b8', margin: '0 0 16px 0', lineHeight: '1.4' }}>
              Speak clearly into your microphone as if addressing a specialist doctor. The AI will evaluate keyword accuracy and generate a recording for you to listen back and fine-tune your tone.
            </p>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              {!isRecording ? (
                <button
                  onClick={handleStartRecording}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                    color: '#fff',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 15px rgba(168, 85, 247, 0.4)'
                  }}
                >
                  🎙️ Start Practice Pitch
                </button>
              ) : (
                <button
                  onClick={handleStopRecording}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: '#fff',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
                    animation: 'pulse 1.5s infinite'
                  }}
                >
                  ⏹️ Stop & Evaluate Pitch
                </button>
              )}
            </div>

            {/* Audio Playback of Recorded Pitch */}
            {audioUrl && (
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                <strong style={{ color: '#34d399', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>🎧 Listen Back to Self-Modulate Pacing & Tone:</strong>
                <audio controls src={audioUrl} style={{ width: '100%', height: '38px', borderRadius: '6px' }} />
              </div>
            )}

            {/* Transcript & Evaluation */}
            {transcript && (
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '14px' }}>
                <strong style={{ color: '#e2e8f0', fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>📝 Live Speech Recognition / Feedback:</strong>
                <div style={{ fontSize: '0.88rem', color: '#cbd5e1', fontStyle: 'italic', marginBottom: '14px', lineHeight: '1.4' }}>
                  "{transcript}"
                </div>

                {practiceScore !== null && (
                  <div style={{ borderTop: '1px solid #334155', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '700', color: '#fff' }}>🎯 Keyword Match Score:</span>
                      <span style={{ fontWeight: '800', fontSize: '1.2rem', color: practiceScore >= 70 ? '#34d399' : '#facc15' }}>
                        {practiceScore}%
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {matchedWords.map((w, idx) => (
                        <span key={idx} style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid #10b981', color: '#34d399', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>
                          ✓ {w}
                        </span>
                      ))}
                      {missedWords.map((w, idx) => (
                        <span key={idx} style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', color: '#f87171', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>
                          ✗ Missed: {w}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default VoiceStudio;
