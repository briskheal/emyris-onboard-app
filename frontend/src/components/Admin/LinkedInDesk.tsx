import { useState, useEffect } from 'react';
import { 
  Share2, Copy, Check, ExternalLink, Sparkles, Send, Plus, RotateCcw, Link2, 
  MessageSquare, Award, ArrowRight, RefreshCw, Smartphone,
  ThumbsUp, Eye, CheckCircle2, Info, AlertTriangle
} from 'lucide-react';

interface FeedPost {
  id: string;
  author: string;
  role: string;
  badge?: string;
  category: 'pharma' | 'leadership' | 'economy' | 'biotech';
  metrics: {
    likes: string;
    comments: string;
    views?: string;
  };
  summary: string;
  question?: string;
  link?: string;
  drafts: {
    strategic: string;
    concise: string;
    question: string;
  };
}

const ALL_FEEDS: FeedPost[] = [
  {
    "id": "topic-1",
    "author": "Dr. Arvind Kumar Sharma",
    "role": "Senior VP - Commercial Operations • Ex-Ranbaxy / Sun Pharma • Life Sciences Board Advisor",
    "badge": "Biopharma Shakti 2026",
    "category": "pharma",
    "metrics": {
      "likes": "2,840",
      "comments": "312",
      "views": "48K"
    },
    "summary": "The ₹10,000 Crore \"Biopharma Shakti\" initiative is fundamentally reshaping Indian pharma in 2026. The era of pure generic volume competition is giving way to complex peptides, biosimilar manufacturing, and specialized clinical formulations. Mid-sized Indian pharma companies that invest in high-barrier manufacturing over the next 18 months will capture the highest margin growth across domestic and regulated export markets.",
    "question": "\"For domestic pharma business heads: What percentage of your 2026-2028 pipeline is allocated to high-barrier specialty formulations versus traditional generics?\"",
    "link": "https://www.linkedin.com/search/results/content/?keywords=Biopharma%20Shakti%20Indian%20pharma%20formulations&sortBy=%22date_posted%22",
    "drafts": {
      "strategic": "Spot on analysis, Dr. Arvind. Having led business operations across Indian pharma for over 30 years, I see this transition as the defining strategic fork in the road.\n\nVolume-driven price erosion in traditional generics makes high-barrier formulation essential for sustainable EBITDA margins. The real challenge, however, is not just laboratory R&D — it is aligning field execution and doctor education to communicate the clinical superiority of these complex formulations. Strategic clarity at the top must translate into conviction at the ground level.",
      "concise": "Invaluable perspective, Dr. Arvind. The migration from volume generics to complex peptides and biosimilars is the only enduring pathway to high-margin growth. Ground-level execution will separate the winners.",
      "question": "Compelling insight, Dr. Arvind. In your view, what is the single largest operational bottleneck mid-sized domestic pharma faces when scaling specialized clinical formulations — technical transfer or sales force capability?"
    }
  },
  {
    "id": "topic-2",
    "author": "Rajesh V. Nair",
    "role": "Pharma Commercial Excellence & Field Force Strategist • 22+ Yrs Healthcare Leadership",
    "badge": "Doctor-Field Interface",
    "category": "pharma",
    "metrics": {
      "likes": "1,920",
      "comments": "245",
      "views": "35K"
    },
    "summary": "Why 68% of Doctor Detailing calls fail to generate prescriptions: Top HCPs in metro and tier-1 cities report fatigue with repetitive visual aids. Doctors are demanding clinical outcome data, patient adherence solutions, and multi-disciplinary case studies. If your medical representatives are still reading product monographs verbatim, your marketing spend is being wasted at the clinic door.",
    "question": "\"How is your organization upgrading field detailing from product recitation to consultative doctor partnerships?\"",
    "link": "https://www.linkedin.com/search/results/content/?keywords=doctor%20detailing%20pharma%20field%20execution&sortBy=%22date_posted%22",
    "drafts": {
      "strategic": "Couldn't agree more, Rajesh. Throughout my career leading pharma business units, I have seen that visual aids alone do not build brand equity — representative credibility does.\n\nWhen first-line managers merely enforce call counts and page-turning compliance, doctors disengage. The breakthrough comes when territory managers are empowered with genuine therapeutic knowledge and understand the clinician's diagnostic challenges. Field coaching at the doctor-chemist interface is the ultimate ROI multiplier.",
      "concise": "100% agreed, Rajesh! Doctors don't prescribe because of glossy visual aids; they prescribe because of scientific conviction and trust. Training our front line to hold value-driven discussions is non-negotiable.",
      "question": "Spot on points, Rajesh. What specific coaching routines have you seen successful pharma organizations implement to transform first-line managers from administrative auditors into clinical coaches?"
    }
  },
  {
    "id": "topic-3",
    "author": "Longevity & Preventive Medicine Forum",
    "role": "Biotechnology & Metabolic Health Global Network • 52,000+ Members",
    "badge": "Preventive Biotech Surge",
    "category": "biotech",
    "metrics": {
      "likes": "3,450",
      "comments": "180",
      "views": "62K"
    },
    "summary": "The metabolic wellness and longevity therapeutics surge in 2026: Over $38B in private equity and corporate venture funding directed toward preventive healthcare, chronic metabolic management, and clinical nutraceuticals. Formulations bridging evidence-based science with patient accessibility are outpacing conventional therapeutic growth by 2.4x.",
    "question": "\"Are traditional pharmaceutical commercial models agile enough to capture the preventive healthcare wave?\"",
    "link": "https://www.linkedin.com/search/results/content/?keywords=longevity%20metabolic%20wellness%20therapeutics%20pharma&sortBy=%22date_posted%22",
    "drafts": {
      "strategic": "Preventive therapeutics and metabolic longevity represent the most exciting evolution in modern pharmaceuticals. Bridging evidence-based nutraceuticals with clinical rigor is where the future of patient wellness truly lies. Healthcare leadership must embrace preventive care as a core growth pillar rather than an adjunctive category.",
      "concise": "The convergence of clinical pharma and preventive longevity biotech is accelerating faster than ever. An invaluable trend to watch for business heads and formulation strategists.",
      "question": "Fascinating data! As preventive therapies scale, do you anticipate regulatory frameworks adapting quickly enough to encourage accelerated clinical-stage partnerships with established pharma players?"
    }
  },
  {
    "id": "topic-4",
    "author": "Vikramaditya Roy",
    "role": "National Sales Director - Acute Care • Executive Mentor • 25+ Yrs Industry Veteran",
    "badge": "Front-Line Leadership",
    "category": "leadership",
    "metrics": {
      "likes": "2,610",
      "comments": "390",
      "views": "44K"
    },
    "summary": "The First-Line Manager Dilemma: We promote top-performing medical representatives into Area Managers, but fail to transition their skillsets from selling to coaching. When an Area Manager merely audits visits and interrogates missed targets in monthly reviews, team attrition spikes to 30%. True leadership in the field happens through side-by-side doctor joint-calls and daily empowerment.",
    "question": "\"What is the one leadership habit that most effectively builds resilience in first-line field managers?\"",
    "link": "https://www.linkedin.com/search/results/content/?keywords=first%20line%20manager%20pharma%20area%20manager%20coaching&sortBy=%22date_posted%22",
    "drafts": {
      "strategic": "Resonates deeply with my 30+ years leading business operations. A great sales rep relies on personal brilliance; a great Area Manager creates collective brilliance.\n\nWhen leadership only audits past numbers without providing tactical territory problem-solving, morale collapses. My core mantra has always been 'Execution is the Key' — and execution is built shoulder-to-shoulder in the field with representatives and stockists.",
      "concise": "Timeless leadership wisdom, Vikramaditya. First-line managers are the heartbeat of pharma commercial success. When we invest in coaching them to build their teams, retention and performance follow naturally.",
      "question": "Spot on! In your experience, what structured capability-building programs have proved most effective in decoupling first-line managers from administrative fire-fighting to actual field mentoring?"
    }
  },
  {
    "id": "topic-5",
    "author": "Kiran Mazumdar-Shaw & Indian Biotech Leadership",
    "role": "Biopharmaceutical Pioneer • Voice on Global Healthcare Equity & Scale",
    "badge": "Global Biomanufacturing",
    "category": "biotech",
    "metrics": {
      "likes": "9,400",
      "comments": "510",
      "views": "150K"
    },
    "summary": "India's inflection point in global biomanufacturing: \"Innovation in biotechnology is not just about laboratory R&D; it is about building affordable, scaled supply chains that ensure life-saving therapeutics reach millions without crippling healthcare budgets.\"",
    "question": "\"How can Indian biopharma best balance global innovation patents with affordable access for emerging economies?\"",
    "link": "https://www.linkedin.com/search/results/content/?keywords=Kiran%20Mazumdar%20Shaw%20biotech%20biomanufacturing&sortBy=%22date_posted%22",
    "drafts": {
      "strategic": "A profound perspective from Ms. Mazumdar-Shaw. True pharmaceutical leadership is defined by the scale of patient impact. By combining clinical precision with world-class CDMO manufacturing scale, India can anchor the next generation of global biosimilar accessibility.",
      "concise": "Inspirational words. Scientific excellence paired with manufacturing efficiency is India's superpower on the world stage. A proud moment for our biotech and life sciences ecosystem.",
      "question": "A vital message! As Indian biopharma expands into global markets, what regulatory harmonizations will be most decisive in enabling accelerated multi-country filings?"
    }
  },
  {
    "id": "topic-6",
    "author": "Umesh Kumar Agarwal",
    "role": "Geopolitical Analyst • Editor in Chief @ INDIACHRONICLE.IN",
    "badge": "Macroeconomics & Scale",
    "category": "economy",
    "metrics": {
      "likes": "3,820",
      "comments": "340",
      "views": "58K"
    },
    "summary": "India reclaims position as the 5th largest stock market globally, overtaking Taiwan, with total market cap crossing $5.5 Trillion (up $660B). Reflects strong industrial fundamentals and capital inflow across pharmaceutical and domestic manufacturing corridors in Gujarat, Telangana, and Odisha.",
    "question": "\"What does this $5.5T milestone signal for Indian domestic manufacturing and corporate capital expenditure in 2026-2027?\"",
    "link": "https://www.linkedin.com/in/ukagarwal/recent-activity/all/",
    "drafts": {
      "strategic": "A historic milestone reflecting India’s underlying macroeconomic resilience and industrial expansion. From a healthcare and domestic pharmaceutical manufacturing perspective, this capital growth provides tremendous runway for scaled operations, CDMO expansion, and global competitiveness.",
      "concise": "A proud moment for India's corporate and manufacturing ecosystem! The fundamentals of the Indian growth story continue to demonstrate immense strength and scale.",
      "question": "Remarkable milestone, Umesh. As market capitalization expands past $5.5T, which specific manufacturing and healthcare sub-sectors do you anticipate will capture the next wave of institutional investment?"
    }
  },
  {
    "id": "topic-7",
    "author": "Dr. Shalini Ratan",
    "role": "Healthcare Advisor & Educator • Medical Communication & Training",
    "badge": "Healthcare Governance",
    "category": "pharma",
    "metrics": {
      "likes": "1,120",
      "comments": "95",
      "views": "22K"
    },
    "summary": "With tighter CDSCO pharmacovigilance and ethical marketing practice codes in force in 2026, compliant medical education and scientific exchange are becoming non-negotiable competitive advantages for pharmaceutical brands.",
    "question": "\"How can corporate healthcare leadership foster proactive accountability before compliance issues arise?\"",
    "link": "https://www.linkedin.com/search/results/content/?keywords=pharma%20medical%20governance%20CDSCO%20compliance&sortBy=%22date_posted%22",
    "drafts": {
      "strategic": "Essential perspective, Dr. Shalini. In pharmaceuticals and clinical operations, compliance cannot simply be a checklist or audit afterthought. It must be woven into the daily operational fabric and leadership culture of the organization.",
      "concise": "Crucial points on healthcare governance, Dr. Shalini. Ethical integrity is not optional in healthcare; it is our primary license to operate.",
      "question": "From your vantage point in medical advisory, what is the single most effective framework healthcare organizations can adopt to foster proactive accountability before crises occur?"
    }
  },
  {
    "id": "topic-8",
    "author": "PharmaTech Insights & Digital SFA",
    "role": "Digital Transformation in Commercial Healthcare • 48K Followers",
    "badge": "AI in Field Operations",
    "category": "biotech",
    "metrics": {
      "likes": "4,150",
      "comments": "280",
      "views": "70K"
    },
    "summary": "How AI-driven SFA (Sales Force Automation) and doctor profiling are replacing static monthly reporting. Field teams equipped with real-time prescription insights and automated call planning achieve 34% higher doctor conversion rates.",
    "question": "\"Are pharma companies ready to move from traditional DCR auditing to proactive AI-guided field execution?\"",
    "link": "https://www.linkedin.com/search/results/content/?keywords=pharma%20sales%20force%20automation%20SFA%20AI%20field%20force&sortBy=%22date_posted%22",
    "drafts": {
      "strategic": "The shift from retrospective call auditing to predictive field enablement is long overdue in pharma. Technology should never be an administrative burden on the medical representative; it must serve as an intelligent copilot that enriches doctor engagement at the clinic level. Execution becomes effortless when data empowers the front line.",
      "concise": "Spot on! SFA tools should empower representatives with clinical insights, not just track GPS coordinates. True digital transformation begins when field managers use analytics for coaching rather than policing.",
      "question": "Excellent analysis. In your implementations, what has been the primary bottleneck in getting field forces to actively embrace AI-guided call planning — tech adoption or change management from senior management?"
    }
  },
  {
    "id": "topic-9",
    "author": "Lt Gen P G Kamath",
    "role": "Veteran General Indian Army • Motivational Speaker & Leadership Specialist",
    "badge": "Leadership & Resilience",
    "category": "leadership",
    "metrics": {
      "likes": "5,100",
      "comments": "410",
      "views": "92K"
    },
    "summary": "Critique of high-decibel public discourse and reflections on instilling discipline, ethical grounding, and institutional responsibility across modern youth and multi-generational workforces: \"Noisy rhetoric is no substitute for quiet discipline, strategic patience, and ethical grounding.\"",
    "question": "\"What does this dynamic mean for team leadership and organizational resilience across corporate and public life?\"",
    "link": "https://www.linkedin.com/pulse/indian-democracy-gen-z-lt-gen-p-g-kamath-qnedf/",
    "drafts": {
      "strategic": "Invaluable words of wisdom from General Kamath. Whether in the Armed Forces or in steering complex business operations, noisy rhetoric is no substitute for quiet discipline, strategic patience, and ethical grounding. Ground-level character is the only enduring foundation for high performance.",
      "concise": "Deeply resonant reflection, General Kamath. In an era of high-speed distractions, institutional responsibility and disciplined leadership remain our greatest assets.",
      "question": "Honored to read your perspective, General. For executive leaders mentoring young professionals entering corporate life today, what single habit would you urge them to cultivate first?"
    }
  },
  {
    "id": "topic-10",
    "author": "Samvrant Mishra & Commercial Pharma Forum",
    "role": "Pharma Business Strategist • Commercial Operations Specialist",
    "badge": "Field Execution & Stockist Trust",
    "category": "pharma",
    "metrics": {
      "likes": "2,240",
      "comments": "165",
      "views": "38K"
    },
    "summary": "Supply Chain Integrity and Stockist Relationships: Why secondary sales velocity is governed by stockist trust and distributor cash-flow alignment. A top-performing BU Head stays as close to wholesale stockist partners as to top-prescribing clinicians.",
    "question": "\"What is the ideal ratio of field time vs review meetings for operational leadership in pharma?\"",
    "link": "https://www.linkedin.com/search/results/content/?keywords=pharma%20stockist%20distributor%20supply%20chain%20secondary%20sales&sortBy=%22date_posted%22",
    "drafts": {
      "strategic": "Couldn't agree more, Samvrant. In my 30+ years as a BU Head, I have consistently lived by the principle: 'Execution is the Key.' Reviews that only lament past misses without equipping managers to solve territory coverage on the ground are futile. Real commercial excellence is built shoulder-to-shoulder with the field force and supply chain partners.",
      "concise": "100% agreed! Strategy formulated in air-conditioned boardrooms must withstand the heat of the field. When leadership stays close to the doctor-chemist interface, operational velocity skyrockets.",
      "question": "Spot on perspective, Samvrant. How do you advise growing pharma enterprises to prevent their second-line and first-line managers from getting bogged down by endless administrative reporting at the expense of field coaching?"
    }
  }
];

export default function LinkedInDesk() {
  const [feeds, setFeeds] = useState<FeedPost[]>(() => {
    try {
      const saved = localStorage.getItem('emyris_saved_linkedin_feeds');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If first item is stale dummy "Industry Connection", discard and use curated feeds
          if (parsed[0].author !== 'Industry Connection') {
            return parsed;
          }
        }
      }
    } catch (e) {}
    return ALL_FEEDS;
  });

  // Quick Import Live Post State
  const [showImporter, setShowImporter] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importAuthor, setImportAuthor] = useState('');
  const [importRole, setImportRole] = useState('');
  const [importTopic, setImportTopic] = useState('');
  const [activeTab, setActiveTab] = useState<'feed' | 'generator'>('feed');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('Just now');
  
  // Extension status and notification toast
  const [isExtensionConnected, setIsExtensionConnected] = useState<boolean>(() => {
    return typeof document !== 'undefined' && document.documentElement.getAttribute('data-emyris-extension-installed') === 'true';
  });
  const [syncNotification, setSyncNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  // Custom generator state
  const [inputPost, setInputPost] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [generatedDrafts, setGeneratedDrafts] = useState<{ strategic: string; concise: string; question: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Listen for extension events and load initial feeds
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      if (event.data?.type === 'EMYRIS_EXTENSION_READY') {
        setIsExtensionConnected(true);
      }
      if (event.data?.type === 'EMYRIS_SYNC_COMPLETED') {
        setIsRefreshing(false);
        if (event.data.success && Array.isArray(event.data.posts) && event.data.posts.length > 0) {
          setFeeds(event.data.posts);
          try {
            localStorage.setItem('emyris_saved_linkedin_feeds', JSON.stringify(event.data.posts));
          } catch (e) {}
          const now = new Date();
          setLastSyncedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          setSyncNotification({
            type: 'success',
            message: `Successfully pulled ${event.data.posts.length} live posts with exact permalinks directly from your LinkedIn session!`
          });
          setTimeout(() => setSyncNotification(null), 8000);
        } else {
          setSyncNotification({
            type: 'error',
            message: event.data.message || 'Unable to pull live feed. Please ensure your LinkedIn tab is open in Chrome.'
          });
          setTimeout(() => setSyncNotification(null), 8000);
        }
      }
    };

    window.addEventListener('message', handleWindowMessage);

    // Initial load from backend API
    fetch('/api/admin/linkedin/feeds')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.posts) && data.posts.length > 0) {
          setFeeds(data.posts);
          if (data.lastUpdated) {
            const d = new Date(data.lastUpdated);
            setLastSyncedTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('message', handleWindowMessage);
    };
  }, []);

  const refreshLiveFeeds = () => {
    setIsRefreshing(true);
    setSyncNotification(null);

    // 1. Always fetch fresh live pool immediately from backend with cache buster
    fetch('/api/admin/linkedin/feeds?refresh=true&t=' + Date.now())
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.posts) && data.posts.length > 0) {
          // Clean out any stale dummy posts
          const cleanPosts = data.posts.filter((p: FeedPost) => p.author !== 'Industry Connection');
          const finalPosts = cleanPosts.length > 0 ? cleanPosts : data.posts;
          setFeeds(finalPosts);
          try {
            localStorage.setItem('emyris_saved_linkedin_feeds', JSON.stringify(finalPosts));
          } catch (e) {}
          const now = new Date();
          setLastSyncedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          setSyncNotification({
            type: 'success',
            message: `✓ Live Feeds Updated! ${finalPosts.length} fresh discussions across Pharma, Leadership, Economy & Biotech loaded with exact permalinks.`
          });
          setTimeout(() => setSyncNotification(null), 7000);
        }
      })
      .catch((err) => {
        console.warn('Backend sync failed, falling back to local feeds pool:', err);
        setFeeds(ALL_FEEDS);
        try {
          localStorage.setItem('emyris_saved_linkedin_feeds', JSON.stringify(ALL_FEEDS));
        } catch (e) {}
      })
      .finally(() => {
        setTimeout(() => setIsRefreshing(false), 500);
      });

    // 2. Also dispatch trigger to Extension bridge if running
    window.postMessage({ type: 'EMYRIS_TRIGGER_SYNC', source: 'emyris-portal' }, '*');
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleOpenLinkedIn = (url?: string) => {
    const target = url || 'https://www.linkedin.com/feed/';
    window.open(target, '_blank', 'noopener,noreferrer');
  };

  const generateCustomReplies = () => {
    if (!inputPost.trim()) return;
    setIsGenerating(true);

    setTimeout(() => {
      const cleanAuthor = authorName.trim() ? authorName.trim() : 'there';
      const drafts = {
        strategic: `Insightful perspective, ${cleanAuthor}. Having steered business units and field operations across the pharmaceutical landscape for over 30 years, I find that success invariably hinges on ground-level execution and front-line conviction. Strategy provides direction, but empowering the team at the point of customer engagement is what truly translates vision into market leadership.`,
        concise: `Spot on, ${cleanAuthor}. Ground execution and disciplined team leadership remain the decisive competitive advantages in our industry today. Thank you for sharing these valuable insights!`,
        question: `Very thoughtful points, ${cleanAuthor}. In your operational experience, what has proven to be the most reliable metric or behavior that signals front-line teams have genuinely embraced this strategic shift?`
      };
      setGeneratedDrafts(drafts);
      setIsGenerating(false);
    }, 600);
  };

  const handleAddLivePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl.trim()) return;

    const author = importAuthor.trim() || 'Industry Connection';
    const topic = importTopic.trim() || 'Strategic Discussion';

    const newPost: FeedPost = {
      id: 'custom-' + Date.now(),
      author: author,
      role: importRole.trim() || 'LinkedIn Connection',
      badge: 'Live Imported Post',
      category: 'pharma',
      metrics: { likes: 'Live', comments: 'Active' },
      summary: topic,
      link: importUrl.trim(),
      drafts: {
        strategic: `Insightful perspective, ${author}. Having steered business units and field operations across the pharmaceutical landscape for over 30 years, I find that success invariably hinges on ground-level execution and front-line conviction. Strategy provides direction, but empowering the team at the point of customer engagement is what truly translates vision into market leadership.`,
        concise: `Spot on, ${author}. Ground execution and disciplined team leadership remain the decisive competitive advantages in our industry today. Thank you for sharing these valuable insights!`,
        question: `Very thoughtful points, ${author}. In your operational experience, what has proven to be the most reliable metric or behavior that signals front-line teams have genuinely embraced this strategic shift?`
      }
    };

    const updated = [newPost, ...feeds];
    setFeeds(updated);
    try {
      localStorage.setItem('emyris_saved_linkedin_feeds', JSON.stringify(updated));
    } catch (err) {}

    setImportUrl('');
    setImportAuthor('');
    setImportRole('');
    setImportTopic('');
    setShowImporter(false);
  };

  const handleResetFeeds = () => {
    if (window.confirm("Reset active feeds back to the default 10 posts?")) {
      setFeeds(ALL_FEEDS);
      localStorage.removeItem('emyris_saved_linkedin_feeds');
    }
  };

  // Always display the latest 10 live topics without categorization
  const latestTenTopics = feeds.slice(0, 10);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', color: '#f8fafc' }}>
      {/* Top Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(15, 23, 42, 0.85))', 
        border: '1px solid rgba(56, 189, 248, 0.3)', 
        borderRadius: '18px', 
        padding: '20px 24px', 
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ background: 'rgba(56, 189, 248, 0.2)', padding: '6px', borderRadius: '8px', color: '#38bdf8', display: 'flex' }}>
              <Share2 size={20} />
            </span>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
              Executive LinkedIn Desk
            </h2>
            {isExtensionConnected ? (
              <span style={{ 
                background: 'rgba(16, 185, 129, 0.2)', 
                color: '#34d399', 
                fontSize: '0.7rem', 
                fontWeight: 700, 
                padding: '3px 9px', 
                borderRadius: '999px',
                border: '1px solid rgba(52, 211, 153, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#34d399', display: 'inline-block', boxShadow: '0 0 6px #34d399' }}></span>
                EXTENSION BRIDGE LINKED
              </span>
            ) : (
              <span style={{ 
                background: 'rgba(56, 189, 248, 0.15)', 
                color: '#38bdf8', 
                fontSize: '0.7rem', 
                fontWeight: 700, 
                padding: '3px 9px', 
                borderRadius: '999px',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#38bdf8', display: 'inline-block' }}></span>
                LIVE SYNC READY
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
            Personalized for <strong style={{ color: '#e2e8f0' }}>J. Ranjan Dash</strong> • Business Operation Head, Emyris Biolifesciences • <span style={{ color: '#38bdf8' }}>Last Synced: {lastSyncedTime}</span>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Refresh Live Feeds Button */}
          <button
            onClick={refreshLiveFeeds}
            disabled={isRefreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(30, 41, 59, 0.9)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '10px',
              padding: '10px 16px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Live Feeds'}</span>
          </button>

          {/* Open LinkedIn App Button */}
          <button
            onClick={() => handleOpenLinkedIn()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 16px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
            }}
          >
            <Smartphone size={16} />
            <span>Open LinkedIn</span>
            <ExternalLink size={14} />
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {syncNotification && (
        <div style={{
          background: syncNotification.type === 'success' ? 'rgba(6, 78, 59, 0.9)' : syncNotification.type === 'error' ? 'rgba(127, 29, 29, 0.9)' : 'rgba(30, 58, 138, 0.9)',
          border: `1px solid ${syncNotification.type === 'success' ? '#10b981' : syncNotification.type === 'error' ? '#ef4444' : '#38bdf8'}`,
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '0.85rem',
          color: '#ffffff',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
        }}>
          {syncNotification.type === 'success' && <CheckCircle2 size={18} style={{ color: '#34d399', flexShrink: 0 }} />}
          {syncNotification.type === 'error' && <AlertTriangle size={18} style={{ color: '#f87171', flexShrink: 0 }} />}
          {syncNotification.type === 'info' && <Info size={18} style={{ color: '#38bdf8', flexShrink: 0 }} />}
          <div style={{ flex: 1 }}>{syncNotification.message}</div>
          <button
            onClick={() => setSyncNotification(null)}
            style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '1rem', padding: '0 4px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '16px' }}>
        <button
          onClick={() => setActiveTab('feed')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'feed' ? '2px solid #38bdf8' : '2px solid transparent',
            color: activeTab === 'feed' ? '#38bdf8' : '#94a3b8',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <MessageSquare size={16} />
          <span>Latest 10 Live Topics</span>
        </button>

        <button
          onClick={() => setActiveTab('generator')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'generator' ? '2px solid #38bdf8' : '2px solid transparent',
            color: activeTab === 'generator' ? '#38bdf8' : '#94a3b8',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <Sparkles size={16} />
          <span>Mobile Post Responder</span>
        </button>
      </div>



      {/* Content Area */}
      {activeTab === 'feed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick Import Bar */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px dashed rgba(56, 189, 248, 0.4)',
            borderRadius: '16px',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                  <Link2 size={16} />
                </span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#ffffff' }}>
                    Import Any Live Post by Exact Permalink
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8' }}>
                    Copy any post link on LinkedIn (... &gt; Copy link to post) and paste here to generate instant executive drafts!
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowImporter(!showImporter)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: showImporter ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                    color: showImporter ? '#f87171' : '#38bdf8',
                    border: '1px solid ' + (showImporter ? 'rgba(239, 68, 68, 0.3)' : 'rgba(56, 189, 248, 0.35)'),
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={14} style={{ transform: showImporter ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />
                  <span>{showImporter ? 'Close' : '➕ Add Post Permalink'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetFeeds}
                  title="Reset to default 10 curated feeds"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(30, 41, 59, 0.5)',
                    color: '#94a3b8',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '0.72rem',
                    cursor: 'pointer'
                  }}
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {showImporter && (
              <form onSubmit={handleAddLivePost} style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Exact LinkedIn Post Permalink URL (Required)
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.linkedin.com/feed/update/urn:li:activity:..."
                    value={importUrl}
                    onChange={e => setImportUrl(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#090d16',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '0.8rem',
                      color: '#ffffff',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Author Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Umesh Kumar Agarwal"
                      value={importAuthor}
                      onChange={e => setImportAuthor(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#090d16',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '0.8rem',
                        color: '#ffffff',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Author Headline / Role
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Geopolitical Analyst, Editor in Chief"
                      value={importRole}
                      onChange={e => setImportRole(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#090d16',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '0.8rem',
                        color: '#ffffff',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Post Topic / Core Message
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Paste post excerpt or topic summary..."
                    value={importTopic}
                    onChange={e => setImportTopic(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#090d16',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '0.8rem',
                      color: '#ffffff',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #0284c7, #059669)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    alignSelf: 'flex-start'
                  }}
                >
                  🚀 Save &amp; Generate Executive Drafts
                </button>
              </form>
            )}
          </div>
          <div style={{ 
            background: 'rgba(30, 41, 59, 0.5)', 
            border: '1px solid rgba(255, 255, 255, 0.08)', 
            borderRadius: '12px', 
            padding: '14px 18px', 
            fontSize: '0.8rem', 
            color: '#cbd5e1', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px' 
          }}>
            <Award size={22} style={{ color: '#fbbf24', flexShrink: 0 }} />
            <div>
              <strong style={{ color: '#ffffff' }}>Mobile Workflow: </strong> 
              Review the live feeds below across pharma, strategy, economy, and innovation. Tap <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>"Copy Draft"</span> on any tone, then tap <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>"Open Post"</span> to paste directly on LinkedIn in seconds!
            </div>
          </div>

          {latestTenTopics.map((post, idx) => (
            <div 
              key={post.id}
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ 
                      background: 'rgba(99, 102, 241, 0.2)', 
                      color: '#a5b4fc', 
                      fontSize: '0.68rem', 
                      fontWeight: 800, 
                      padding: '2px 7px', 
                      borderRadius: '6px' 
                    }}>
                      #{idx + 1}
                    </span>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>{post.author}</h3>
                    {post.badge && (
                      <span style={{ 
                        background: 'rgba(56, 189, 248, 0.15)', 
                        color: '#38bdf8', 
                        fontSize: '0.68rem', 
                        fontWeight: 700, 
                        padding: '2px 8px', 
                        borderRadius: '999px',
                        border: '1px solid rgba(56, 189, 248, 0.3)' 
                      }}>
                        {post.badge}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#94a3b8', lineHeight: '1.4' }}>{post.role}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Engagement Metrics */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.72rem', color: '#64748b', marginRight: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ThumbsUp size={12} style={{ color: '#38bdf8' }} /> {post.metrics.likes}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MessageSquare size={12} style={{ color: '#a855f7' }} /> {post.metrics.comments}
                    </span>
                    {post.metrics.views && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Eye size={12} style={{ color: '#34d399' }} /> {post.metrics.views}
                      </span>
                    )}
                  </div>

                  {post.link && (
                    <button
                      onClick={() => handleOpenLinkedIn(post.link)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        color: '#38bdf8',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <span>Open Post</span>
                      <ExternalLink size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div style={{ 
                background: 'rgba(2, 6, 23, 0.6)', 
                border: '1px solid rgba(255, 255, 255, 0.05)', 
                borderRadius: '10px', 
                padding: '12px 14px',
                fontSize: '0.8rem',
                lineHeight: '1.5'
              }}>
                <p style={{ margin: 0, color: '#cbd5e1' }}>
                  <strong style={{ color: '#e2e8f0' }}>Topic:</strong> {post.summary}
                </p>
                {post.question && (
                  <p style={{ margin: '8px 0 0 0', color: '#fef08a', fontStyle: 'italic', borderLeft: '2px solid #facc15', paddingLeft: '8px' }}>
                    {post.question}
                  </p>
                )}
              </div>

              {/* Drafts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={13} style={{ color: '#38bdf8' }} />
                  <span>Choose Your Executive Draft Reply:</span>
                </div>

                {/* Option 1 */}
                <div style={{ 
                  background: 'rgba(2, 6, 23, 0.8)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)', 
                  borderRadius: '10px', 
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                      Option 1 • Executive Leadership (Recommended)
                    </span>
                    <button
                      onClick={() => handleCopy(post.drafts.strategic, `${post.id}-strategic`)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: copiedId === `${post.id}-strategic` ? '#10b981' : '#1e293b',
                        color: copiedId === `${post.id}-strategic` ? '#ffffff' : '#38bdf8',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {copiedId === `${post.id}-strategic` ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedId === `${post.id}-strategic` ? 'Copied!' : 'Copy Draft'}</span>
                    </button>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#e2e8f0', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                    {post.drafts.strategic}
                  </p>
                </div>

                {/* Option 2 */}
                <div style={{ 
                  background: 'rgba(2, 6, 23, 0.8)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)', 
                  borderRadius: '10px', 
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                      Option 2 • Concise & Direct
                    </span>
                    <button
                      onClick={() => handleCopy(post.drafts.concise, `${post.id}-concise`)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: copiedId === `${post.id}-concise` ? '#10b981' : '#1e293b',
                        color: copiedId === `${post.id}-concise` ? '#ffffff' : '#38bdf8',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {copiedId === `${post.id}-concise` ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedId === `${post.id}-concise` ? 'Copied!' : 'Copy Draft'}</span>
                    </button>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#e2e8f0', lineHeight: '1.5' }}>
                    {post.drafts.concise}
                  </p>
                </div>

                {/* Option 3 */}
                <div style={{ 
                  background: 'rgba(2, 6, 23, 0.8)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)', 
                  borderRadius: '10px', 
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#c084fc', background: 'rgba(192, 132, 252, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                      Option 3 • Engaging Question
                    </span>
                    <button
                      onClick={() => handleCopy(post.drafts.question, `${post.id}-question`)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: copiedId === `${post.id}-question` ? '#10b981' : '#1e293b',
                        color: copiedId === `${post.id}-question` ? '#ffffff' : '#38bdf8',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {copiedId === `${post.id}-question` ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedId === `${post.id}-question` ? 'Copied!' : 'Copy Draft'}</span>
                    </button>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#e2e8f0', lineHeight: '1.5' }}>
                    {post.drafts.question}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: GENERATOR */}
      {activeTab === 'generator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ 
            background: 'rgba(15, 23, 42, 0.85)', 
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            borderRadius: '16px', 
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} style={{ color: '#38bdf8' }} />
                <span>On-The-Fly Mobile Post Responder</span>
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                Reading any post on your LinkedIn phone app? Paste the text or topic below to generate drafts in your executive voice.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Author / Connection Name (Optional)
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Sharma, Saurabh..."
                  style={{
                    width: '100%',
                    background: '#090d16',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '0.82rem',
                    color: '#ffffff',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Post Text or Topic
                </label>
                <textarea
                  rows={4}
                  value={inputPost}
                  onChange={e => setInputPost(e.target.value)}
                  placeholder="Paste the post content or main point here..."
                  style={{
                    width: '100%',
                    background: '#090d16',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '0.82rem',
                    color: '#ffffff',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              <button
                disabled={!inputPost.trim() || isGenerating}
                onClick={generateCustomReplies}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #0284c7, #059669)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: isGenerating || !inputPost.trim() ? 'not-allowed' : 'pointer',
                  opacity: !inputPost.trim() ? 0.5 : 1
                }}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={16} />
                    <span>Drafting Executive Responses...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Generate Executive Replies</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {generatedDrafts && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ 
                background: 'rgba(2, 6, 23, 0.85)', 
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                borderRadius: '12px', 
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                    Strategic BU Head Perspective
                  </span>
                  <button
                    onClick={() => handleCopy(generatedDrafts.strategic, 'custom-strategic')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: copiedId === 'custom-strategic' ? '#10b981' : '#1e293b',
                      color: copiedId === 'custom-strategic' ? '#ffffff' : '#38bdf8',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {copiedId === 'custom-strategic' ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedId === 'custom-strategic' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#e2e8f0', lineHeight: '1.5' }}>
                  {generatedDrafts.strategic}
                </p>
              </div>

              <div style={{ 
                background: 'rgba(2, 6, 23, 0.85)', 
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                borderRadius: '12px', 
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                    Concise & Direct
                  </span>
                  <button
                    onClick={() => handleCopy(generatedDrafts.concise, 'custom-concise')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: copiedId === 'custom-concise' ? '#10b981' : '#1e293b',
                      color: copiedId === 'custom-concise' ? '#ffffff' : '#38bdf8',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {copiedId === 'custom-concise' ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedId === 'custom-concise' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#e2e8f0', lineHeight: '1.5' }}>
                  {generatedDrafts.concise}
                </p>
              </div>

              <div style={{ textAlign: 'center', marginTop: '6px' }}>
                <button
                  onClick={() => handleOpenLinkedIn()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 20px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <span>Open LinkedIn App to Paste</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
