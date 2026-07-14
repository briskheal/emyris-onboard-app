import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Mic, MicOff, RefreshCw, CheckCircle, AlertCircle, Sparkles, Award, BookOpen } from 'lucide-react';

interface DetailingScript {
  id: string;
  name: string;
  tagline: string;
  hook: string;
  need: string;
  pillars: string[];
  closing: string;
  fullText: string;
  keywords: { word: string; category: string }[];
}

const PRODUCT_SCRIPTS: Record<string, DetailingScript> = {
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

const DoctorDetailingStudio: React.FC<{ onClose?: () => void; isAdmin?: boolean }> = ({ onClose, isAdmin = false }) => {
  const [scriptsMap, setScriptsMap] = useState<Record<string, DetailingScript>>(PRODUCT_SCRIPTS);
  const [selectedProd, setSelectedProd] = useState<string>('ALOMOS GOLD');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(0.95);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [practiceScore, setPracticeScore] = useState<number | null>(null);
  const [matchedWords, setMatchedWords] = useState<string[]>([]);
  const [missedWords, setMissedWords] = useState<string[]>([]);

  // Editing state for Admin
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editScript, setEditScript] = useState<DetailingScript | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

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

  const handleSaveEditedScript = async () => {
    if (!editScript) return;
    setIsSaving(true);
    const updatedMap = {
      ...scriptsMap,
      [editScript.name]: editScript
    };
    try {
      const res = await fetch('/api/save-detailing-scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detailingScripts: updatedMap })
      });
      const data = await res.json();
      if (data.success) {
        setScriptsMap(updatedMap);
        setSelectedProd(editScript.name);
        setIsEditing(false);
        setEditScript(null);
        alert("✅ Detailing script saved successfully! The Voice Studio will now read this edited version.");
      } else {
        alert("Error saving script: " + (data.error || 'Unknown error'));
      }
    } catch (e: any) {
      alert("Failed to save: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartAddNewProduct = () => {
    const newName = prompt("Enter new product name (e.g., Alomos DM or Glowvit 60K):", "New Product");
    if (!newName || !newName.trim()) return;
    const cleanName = newName.trim();
    const newScriptObj: DetailingScript = {
      id: cleanName.toLowerCase().replace(/\s+/g, '-'),
      name: cleanName,
      tagline: `Clinical Detailing Formula for ${cleanName}`,
      hook: `Good Morning Doctor! Today I am introducing ${cleanName}, our advanced clinical formulation engineered for superior patient recovery and efficacy.`,
      need: `Doctor, standard therapies often suffer from poor compliance or delayed onset in acute and chronic patient care.`,
      pillars: [
        "High Clinical Efficacy: Engineered with targeted active ingredients ensuring prompt therapeutic action.",
        "Optimized Tolerability & Safety Profile: Formulated to prevent common gastrointestinal distress or adverse interactions.",
        "Convenient Patient Regimen: Designed for straightforward daily administration and improved adherence."
      ],
      closing: `Please prescribe ${cleanName} twice daily for your recovering patients for optimum clinical outcomes.`,
      fullText: `Good Morning Doctor! Today I am introducing ${cleanName}, our advanced clinical formulation engineered for superior patient recovery and efficacy. Doctor, standard therapies often suffer from poor compliance or delayed onset in acute and chronic patient care. First, it delivers high clinical efficacy engineered with targeted active ingredients. Second, it ensures an optimized tolerability and safety profile. Third, it provides a convenient patient regimen designed for straightforward daily administration. Please prescribe ${cleanName} twice daily for your recovering patients.`,
      keywords: [
        { word: cleanName.split(' ')[0], category: "Product Name" },
        { word: "Clinical Efficacy", category: "Benefit" },
        { word: "Safety Profile", category: "Tolerability" },
        { word: "Regimen", category: "Dosage" }
      ]
    };
    setEditScript(newScriptObj);
    setIsEditing(true);
  };

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
      // Convert all-caps brand names to Title Case or phonetics so browser TTS pronounces Alomos Gold completely without spelling letters
      const pronounceableText = currentScript.fullText
        .replace(/ALOMOS GOLD/gi, 'Alomos Gold')
        .replace(/ALOMOS HP ADVANCED/gi, 'Alomos H P Advanced')
        .replace(/ALOMOS DM/gi, 'Alomos D M')
        .replace(/ALOMOS MAMA/gi, 'Alomos Mama')
        .replace(/ALOMOS/gi, 'Alomos')
        .replace(/GLOWVIT-60K/gi, 'Glowvit Sixty K')
        .replace(/GulpCDZ/gi, 'Gulp C D Z');
      const utterance = new SpeechSynthesisUtterance(pronounceableText);
      utterance.rate = speechRate;
      utterance.pitch = 1.0;
      utterance.lang = 'en-IN';

      // Explicitly pick a consistent Female voice (en-IN or Female English voice) across all browsers
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => (v.lang.includes('IN') || v.lang.includes('en-GB') || v.lang.includes('en-US')) && (v.name.includes('Heera') || v.name.includes('Female') || v.name.includes('Google English (India)') || v.name.includes('Zira')))
                       || voices.find(v => v.name.includes('Female') || v.name.includes('Heera') || v.name.includes('Google'))
                       || voices.find(v => v.lang.includes('IN'))
                       || voices[0];
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      utterance.onend = () => {
        setIsPlaying(false);
      };
      utterance.onerror = () => {
        setIsPlaying(false);
      };

      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handleToggleRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice microphone practice is not supported in this browser. Please use Google Chrome on desktop or mobile.");
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      evaluatePracticePitch(transcript);
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      setTranscript('');
      setPracticeScore(null);
      setMatchedWords([]);
      setMissedWords([]);

      // Start parallel audio recording for applicant self-modulation playback
      audioChunksRef.current = [];
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            const recorder = new MediaRecorder(stream);
            recorder.ondataavailable = (e) => {
              if (e.data && e.data.size > 0) {
                audioChunksRef.current.push(e.data);
              }
            };
            recorder.onstop = () => {
              const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
              const url = URL.createObjectURL(audioBlob);
              setAudioUrl(url);
              stream.getTracks().forEach(track => track.stop());
            };
            recorder.start();
            mediaRecorderRef.current = recorder;
          })
          .catch(err => {
            console.warn("Parallel audio recording failed (continuing with speech recognition only):", err);
          });
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    }
  };

  const evaluatePracticePitch = (spokenText: string) => {
    if (!spokenText || spokenText.trim().length < 10) {
      alert("We couldn't hear enough spoken words. Please click 'Practice Pitch' and speak aloud clearly into your microphone.");
      return;
    }

    const lowerSpoken = spokenText.toLowerCase();
    const matched: string[] = [];
    const missed: string[] = [];

    currentScript.keywords.forEach(kw => {
      const cleanWord = kw.word.toLowerCase();
      if (lowerSpoken.includes(cleanWord)) {
        matched.push(kw.word);
      } else {
        const parts = cleanWord.split(' ');
        if (parts.some(p => p.length > 3 && lowerSpoken.includes(p))) {
          matched.push(kw.word);
        } else {
          missed.push(kw.word);
        }
      }
    });

    const score = Math.round((matched.length / currentScript.keywords.length) * 100);
    setMatchedWords(matched);
    setMissedWords(missed);
    setPracticeScore(score);
  };

  return (
    <div className="dash-card" style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))', border: '1px solid rgba(99, 102, 241, 0.4)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', borderRadius: '16px', padding: '2rem', position: 'relative' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#fff' }}>
              🎙️ Voice Integration Module
            </span>
            <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={14} /> AI Detailing & Practice Lab
            </span>
          </div>
          <h2 style={{ fontSize: '1.8rem', margin: 0, color: '#fff' }}>Doctor Detailing Voice Studio</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Listen to the exact 4-step In-Clinic MR Pitch, practice your delivery into the microphone, and get instant clinical score evaluation.
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="btn btn-sm btn-outline" style={{ border: 'none', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '1.1rem' }}>
            ✕
          </button>
        )}
      </div>

      {/* Admin Edit / Add Banner */}
      {isAdmin && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', background: 'rgba(168, 85, 247, 0.15)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.4)', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div>
            <span style={{ color: '#c084fc', fontWeight: 700, fontSize: '0.95rem' }}>👑 Admin Customization Mode</span>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#e2e8f0' }}>You can edit any product's detailing story or add new products. Changes take effect instantly across both Admin & Applicant Voice Studios.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                setEditScript(JSON.parse(JSON.stringify(currentScript)));
                setIsEditing(true);
              }}
              className="btn btn-sm"
              style={{ background: '#3b82f6', color: '#fff', fontWeight: 600, border: 'none', padding: '6px 12px', borderRadius: '8px' }}
            >
              ✏️ Edit Story ({currentScript.name})
            </button>
            <button
              onClick={handleStartAddNewProduct}
              className="btn btn-sm"
              style={{ background: '#10b981', color: '#fff', fontWeight: 600, border: 'none', padding: '6px 12px', borderRadius: '8px' }}
            >
              ➕ Add New Product
            </button>
          </div>
        </div>
      )}

      {/* Editable Story Box Modal / Form for Admin */}
      {isEditing && editScript && (
        <div style={{ background: 'rgba(15, 23, 42, 0.98)', border: '2px solid #3b82f6', borderRadius: '16px', padding: '1.8rem', marginBottom: '2rem', boxShadow: '0 25px 50px rgba(0,0,0,0.7)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem' }}>
            <h3 style={{ margin: 0, color: '#60a5fa', fontSize: '1.4rem' }}>✏️ Editing Detailing Script: {editScript.name}</h3>
            <button onClick={() => { setIsEditing(false); setEditScript(null); }} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Product Name</label>
              <input
                type="text"
                value={editScript.name}
                onChange={e => setEditScript({ ...editScript, name: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#1e293b', border: '1px solid #475569', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Tagline</label>
              <input
                type="text"
                value={editScript.tagline}
                onChange={e => setEditScript({ ...editScript, tagline: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#1e293b', border: '1px solid #475569', color: '#fff' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Hook (Opening Greeting & Introduction)</label>
            <textarea
              rows={2}
              value={editScript.hook}
              onChange={e => setEditScript({ ...editScript, hook: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#1e293b', border: '1px solid #475569', color: '#fff', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Clinical Need (Why Doctor Needs This)</label>
            <textarea
              rows={2}
              value={editScript.need}
              onChange={e => setEditScript({ ...editScript, need: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#1e293b', border: '1px solid #475569', color: '#fff', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Pillars / Key Benefits (One per line)</label>
            <textarea
              rows={3}
              value={editScript.pillars.join('\n')}
              onChange={e => setEditScript({ ...editScript, pillars: e.target.value.split('\n').filter(Boolean) })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#1e293b', border: '1px solid #475569', color: '#fff', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Closing & Dosage Regimen</label>
            <textarea
              rows={2}
              value={editScript.closing}
              onChange={e => setEditScript({ ...editScript, closing: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#1e293b', border: '1px solid #475569', color: '#fff', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Full Spoken Pitch Text (Exact Text Read Aloud by Voiceover & Checked Against Applicant Speech)</label>
            <textarea
              rows={4}
              value={editScript.fullText}
              onChange={e => setEditScript({ ...editScript, fullText: e.target.value })}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: '#0f172a', border: '2px solid #10b981', color: '#fff', fontSize: '0.95rem', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Target Keywords (Comma separated words/phrases evaluated by AI scorer)</label>
            <input
              type="text"
              value={editScript.keywords.map(k => k.word).join(', ')}
              onChange={e => {
                const words = e.target.value.split(',').map(w => w.trim()).filter(Boolean);
                setEditScript({
                  ...editScript,
                  keywords: words.map(w => ({ word: w, category: "Core Target" }))
                });
              }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#1e293b', border: '1px solid #475569', color: '#fff' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              onClick={() => { setIsEditing(false); setEditScript(null); }}
              className="btn btn-outline"
              style={{ border: '1px solid #64748b', color: '#fff', padding: '8px 16px', borderRadius: '8px' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEditedScript}
              disabled={isSaving}
              className="btn"
              style={{ background: '#10b981', color: '#fff', fontWeight: 700, padding: '8px 20px', borderRadius: '8px', border: 'none' }}
            >
              {isSaving ? 'Saving...' : '💾 Save & Update Voiceover'}
            </button>
          </div>
        </div>
      )}

      {/* Product Selector Bar */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '2rem', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '12px' }}>
        {Object.keys(scriptsMap).map(prod => (
          <button
            key={prod}
            onClick={() => {
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
                setAudioUrl(null);
              }
              setIsPlaying(false);
              setSelectedProd(prod);
              setTranscript('');
              setPracticeScore(null);
            }}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: selectedProd === prod ? 'var(--primary)' : 'transparent',
              color: '#fff',
              fontWeight: selectedProd === prod ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <BookOpen size={16} /> {prod}
          </button>
        ))}
      </div>

      {/* Main Studio Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Column: The 4-Step Detailing Script & Audio Player */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.5rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.3rem' }}>{currentScript.name}</h3>
              <span style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: 600 }}>{currentScript.tagline}</span>
            </div>

            {/* Audio Speed Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Speed:</span>
              <select 
                value={speechRate} 
                onChange={e => setSpeechRate(Number(e.target.value))}
                style={{ background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', padding: '4px 8px', fontSize: '0.8rem' }}
              >
                <option value={0.85}>0.85x (Slow Practice)</option>
                <option value={0.95}>0.95x (Standard Pace)</option>
                <option value={1.1}>1.10x (Fast Clinical)</option>
              </select>
            </div>
          </div>

          {/* Audio Play/Stop Button */}
          <button
            onClick={handleToggleAudio}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '10px',
              border: 'none',
              background: isPlaying ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff',
              fontSize: '1.05rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '1.5rem',
              boxShadow: isPlaying ? '0 0 20px rgba(239, 68, 68, 0.4)' : '0 10px 25px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s'
            }}
          >
            {isPlaying ? (
              <>
                <VolumeX size={22} className="animate-pulse" /> Stop Audio Playback
              </>
            ) : (
              <>
                <Volume2 size={22} /> Listen to 4-Step MR Pitch (`Text-to-Speech`)
              </>
            )}
          </button>

          {/* Script Breakdown Tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '6px' }}>
            
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', borderLeft: '4px solid #6366f1', padding: '12px 14px', borderRadius: '0 8px 8px 0' }}>
              <strong style={{ display: 'block', color: '#818cf8', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                Step 1: The Hook (15 seconds)
              </strong>
              <p style={{ margin: 0, fontSize: '0.92rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                "{currentScript.hook}"
              </p>
            </div>

            <div style={{ background: 'rgba(245, 158, 11, 0.1)', borderLeft: '4px solid #f59e0b', padding: '12px 14px', borderRadius: '0 8px 8px 0' }}>
              <strong style={{ display: 'block', color: '#fbbf24', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                Step 2: Patient Need & Indication (20 seconds)
              </strong>
              <p style={{ margin: 0, fontSize: '0.92rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                "{currentScript.need}"
              </p>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.1)', borderLeft: '4px solid #10b981', padding: '12px 14px', borderRadius: '0 8px 8px 0' }}>
              <strong style={{ display: 'block', color: '#34d399', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '8px' }}>
                Step 3: 3 Core Pillars of Superiority (60 seconds)
              </strong>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {currentScript.pillars.map((pillar, idx) => (
                  <li key={idx} style={{ fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.4 }}>
                    {pillar}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ background: 'rgba(236, 72, 153, 0.1)', borderLeft: '4px solid #ec4899', padding: '12px 14px', borderRadius: '0 8px 8px 0' }}>
              <strong style={{ display: 'block', color: '#f472b6', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                Step 4: Rx Closing & Prescription Request (25 seconds)
              </strong>
              <p style={{ margin: 0, fontSize: '0.92rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                "{currentScript.closing}"
              </p>
            </div>

          </div>
        </div>

        {/* Right Column: Doctor's Chamber Voice Practice & Scorer */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🎙️ Practice in Dr's Chamber
                </h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Speak aloud as if delivering the pitch to a Bariatric Surgeon or Intensivist.
                </span>
              </div>
            </div>

            {/* Microphone Recording Button */}
            <button
              onClick={handleToggleRecording}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '10px',
                border: isRecording ? '2px solid #ef4444' : 'none',
                background: isRecording ? 'rgba(239, 68, 68, 0.2)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#fff',
                fontSize: '1.05rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                marginBottom: '1.5rem',
                boxShadow: isRecording ? '0 0 25px rgba(239, 68, 68, 0.5)' : '0 10px 25px rgba(99, 102, 241, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              {isRecording ? (
                <>
                  <MicOff size={22} className="animate-pulse" style={{ color: '#ef4444' }} />
                  <span>Recording Active... Click when Finished Speaking (`Evaluate Score`)</span>
                </>
              ) : (
                <>
                  <Mic size={22} />
                  <span>Start Microphone Practice (`Speech-to-Text`)</span>
                </>
              )}
            </button>

            {/* Spoken Transcript Area */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Spoken Pitch Transcription (`Live Speech Recognition`):
              </label>
              <div 
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: isRecording ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  padding: '14px',
                  minHeight: '140px',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  color: transcript ? '#f8fafc' : '#64748b',
                  fontSize: '0.95rem',
                  lineHeight: 1.5,
                  fontStyle: transcript ? 'normal' : 'italic'
                }}
              >
                {transcript || (isRecording ? "Listening to your voice... Speak clearly now into your microphone..." : "Click 'Start Microphone Practice' above and deliver your 2-minute detailing pitch. Your spoken words will appear right here!")}
              </div>
            </div>

            {/* Recorded Voice Playback (`Self-Modulation Lab`) */}
            {audioUrl && (
              <div style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.18), rgba(99, 102, 241, 0.18))', border: '1px solid rgba(168, 85, 247, 0.6)', borderRadius: '12px', padding: '1.4rem', boxShadow: '0 8px 25px rgba(168, 85, 247, 0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f3e8ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🎧 Recorded Voice Playback (`Self-Modulation Lab`)
                  </span>
                  <span style={{ fontSize: '0.72rem', background: '#a855f7', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    ✨ AUDIO READY TO PLAY
                  </span>
                </div>
                <p style={{ fontSize: '0.88rem', color: '#e2e8f0', margin: '0 0 12px 0', lineHeight: '1.5' }}>
                  Listen to your exact spoken delivery below. Compare your pacing, vocal clarity, and clinical tone against the doctor's chamber standard to modulate and perfect your pitch.
                </p>
                <audio 
                  controls 
                  src={audioUrl} 
                  style={{ width: '100%', borderRadius: '8px', height: '44px', outline: 'none' }}
                />
              </div>
            )}

            {/* AI Pitch Evaluation Scorecard */}
            {practiceScore !== null && (
              <div style={{ background: practiceScore >= 80 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)', border: practiceScore >= 80 ? '1px solid #10b981' : '1px solid #f59e0b', borderRadius: '12px', padding: '1.2rem', animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: practiceScore >= 80 ? '#34d399' : '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={18} /> Clinical Keyword Match Score
                  </span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: practiceScore >= 80 ? '#10b981' : '#f59e0b' }}>
                    {practiceScore}%
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: '0 0 10px 0' }}>
                  {practiceScore >= 80 ? "🎉 Outstanding Pitch! You successfully mentioned key clinical superiority pillars and dosage recommendations." : "⚠️ Good effort! Try to incorporate more exact clinical metrics and proprietary ingredient strengths in your next practice."}
                </p>

                {/* Keyword Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {matchedWords.map((word, idx) => (
                    <span key={idx} style={{ background: '#065f46', color: '#6ee7b7', fontSize: '0.75rem', fontWeight: 600, padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={12} /> {word}
                    </span>
                  ))}
                  {missedWords.map((word, idx) => (
                    <span key={idx} style={{ background: '#7f1d1d', color: '#fca5a5', fontSize: '0.75rem', fontWeight: 600, padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'line-through' }}>
                      <AlertCircle size={12} /> {word}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Practice Tips Footer */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              💡 Tip: Maintain eye contact & emphasize <strong>"Zero GI Distress"</strong> when pitching to surgeons.
            </span>
            {transcript && !isRecording && (
              <button 
                onClick={() => evaluatePracticePitch(transcript)}
                className="btn btn-sm btn-outline"
                style={{ fontSize: '0.8rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <RefreshCw size={12} /> Re-Evaluate
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

export default DoctorDetailingStudio;
