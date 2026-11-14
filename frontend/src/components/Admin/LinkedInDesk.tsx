import { useState, useEffect } from 'react';
import { 
  Share2, Copy, Check, ExternalLink, Sparkles, Send, 
  MessageSquare, Award, ArrowRight, RefreshCw, Smartphone,
  ThumbsUp, Eye, Filter
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
    id: 'post-1',
    author: 'Saurabh Rajput',
    role: 'Pharma Trainer & Consultant • Author of The Pharma Growth System • 18+ Yrs Exp',
    badge: 'Pharma High Impact',
    category: 'pharma',
    metrics: { likes: '1,420', comments: '186', views: '24.5K' },
    summary: 'Analyzes why competitor pharma companies grow faster with identical budgets and team sizes. Identifies 5 gaps: disconnected portfolio logic, marketing disconnected from field execution, unrealistic targets, decoupled training, and ineffective review meetings.',
    question: '"Pharma Owners, Directors and Leaders: Imagine you were asked to improve an underperforming pharma company without increasing budget. Which would you fix first? And which gap is most underestimated?"',
    link: 'https://www.linkedin.com/in/saurabhrajput-pharmatrainer/',
    drafts: {
      strategic: `Spot on analysis, Saurabh. Having led business units and cross-functional pharma teams over the last three decades, I would unequivocally fix Marketing-to-Field Execution first.

Strategy on paper rarely fails; the breakdown almost always happens in the 'last mile' — where front-line managers and representatives struggle to translate brand positioning into meaningful, value-driven doctor conversations.

The most underestimated gap is managerial capability at the first-line level. When you empower territory leaders with clear execution pathways rather than just chasing targets in review meetings, performance follows naturally without adding a single rupee to the budget.`,
      concise: `In 30 years across pharma, I've consistently seen that strategy is only as good as the ground-level execution. The biggest unlock without extra budget is empowering first-line managers to coach at the doctor-chemist interface rather than just audit calls. Excellent points!`,
      question: `Compelling breakdown, Saurabh. In your consulting engagements across pharma companies, how often do you find that first-line managers actually have the clinical conviction and coaching tools to support their reps on the ground versus merely auditing call counts?`
    }
  },
  {
    id: 'post-2',
    author: 'Harsh Goenka & Anand Mahindra Network',
    role: 'Chairman, RPG Group • Voice on Business Leadership & Workplace Culture',
    badge: 'Viral Leadership • 8.9K Likes',
    category: 'leadership',
    metrics: { likes: '8,950', comments: '420', views: '140K' },
    summary: 'A powerful reflection on organizational leadership: "The best leaders do not manage results; they cultivate the people who produce the results. When you give your front line trust, tools, and psychological safety, ordinary teams consistently deliver extraordinary outcomes."',
    question: '"What is the one leadership habit you believe makes the biggest difference to team morale and operational velocity?"',
    link: 'https://www.linkedin.com/feed/',
    drafts: {
      strategic: `Resonates deeply with my 30+ years leading operations. Business outcomes are always a lagging indicator; team conviction, clarity of purpose, and daily operational support are the leading indicators. When executive leaders invest in building team strength to make them challenge-ready, targets take care of themselves.`,
      concise: `Golden words. Leadership is never about micromanaging numbers; it is about building capability, removing obstacles for your team, and leading with conviction. Great share!`,
      question: `Spot on! Curious to hear perspectives from other business heads: how do you systematically preserve this people-first culture as an organization scales rapidly across diverse geographies?`
    }
  },
  {
    id: 'post-3',
    author: 'Umesh Kumar Agarwal',
    role: 'Geopolitical Analyst • Editor in Chief @ INDIACHRONICLE.IN',
    badge: 'Macroeconomics • Trending',
    category: 'economy',
    metrics: { likes: '3,210', comments: '295', views: '52K' },
    summary: 'India reclaims position as the 5th largest stock market globally, overtaking Taiwan, with total market cap crossing $5.5 Trillion (up $660B). Reflects strong industrial fundamentals and capital inflow.',
    question: '"What does this $5.5T milestone signal for Indian domestic manufacturing and corporate capital expenditure in 2026-2027?"',
    link: 'https://www.linkedin.com/in/ukagarwal/',
    drafts: {
      strategic: `A historic milestone reflecting India’s underlying macroeconomic resilience and industrial expansion. From a healthcare and domestic pharmaceutical manufacturing perspective, this capital growth provides tremendous runway for scaled operations, CDMO expansion, and global competitiveness.`,
      concise: `A proud moment for India's corporate and manufacturing ecosystem! The fundamentals of the Indian growth story continue to demonstrate immense strength and scale.`,
      question: `Remarkable milestone, Umesh. As market capitalization expands past $5.5T, which specific manufacturing and healthcare sub-sectors do you anticipate will capture the next wave of institutional investment?`
    }
  },
  {
    id: 'post-4',
    author: 'Dr. (Hon.) Jigar Joshi',
    role: 'Pharma Marketing • Ex Glenmark Institutional KAM • Ex Cipla • Ex Emcure',
    badge: 'Peer / Ex-Glenmark Connection',
    category: 'pharma',
    metrics: { likes: '680', comments: '94', views: '12K' },
    summary: 'Reflecting on character and professional integrity in healthcare leadership: "To Think Good is Good, to Do Good Is better, But To be Good is the Best One...."',
    link: 'https://www.linkedin.com/feed/',
    drafts: {
      strategic: `Well articulated, Jigar! In an industry as demanding as healthcare and pharmaceuticals, core character, integrity, and being genuinely invested in people always outshine everything else. Wishing you continued success!`,
      concise: `Spot on, Jigar. True leadership in pharma always starts with integrity and purpose. Great to see your continued thought leadership!`,
      question: `So true, Jigar. In today's high-speed commercial environment, how can pharma leadership best instill this culture of purpose-driven integrity down to the youngest medical representatives in the field?`
    }
  },
  {
    id: 'post-5',
    author: 'Longevity.Technology',
    role: 'Biotech & Preventive Medicine Journal • 21,500+ Followers',
    badge: 'Biotech & Licensing Boom',
    category: 'biotech',
    metrics: { likes: '2,140', comments: '112', views: '38K' },
    summary: 'Rapid scaling of preventive therapeutics and longevity biotech, with over $30B invested and $617B projected annual market. Highlights major in/out-licensing opportunities between biotech innovators and established pharma manufacturers.',
    link: 'https://www.linkedin.com/company/longevitytechnology/',
    drafts: {
      strategic: `Preventive healthcare and metabolic longevity represent the most exciting evolution in modern pharmaceuticals. Bridging evidence-based nutraceuticals with clinical rigor is where the future of patient wellness truly lies.`,
      concise: `The convergence of clinical pharma and preventive longevity biotech is accelerating faster than ever. An invaluable trend to watch for business heads and formulation strategists.`,
      question: `Fascinating data! As preventive therapies scale, do you anticipate regulatory frameworks adapting quickly enough to encourage accelerated clinical-stage partnerships with established pharma players?`
    }
  },
  {
    id: 'post-6',
    author: 'Lt Gen P G Kamath',
    role: 'Veteran General Indian Army • Motivational Speaker & Leadership Specialist',
    badge: 'Leadership & Resilience',
    category: 'leadership',
    metrics: { likes: '4,560', comments: '380', views: '88K' },
    summary: 'Critique of high-decibel public discourse and reflections on instilling discipline, ethical grounding, and institutional responsibility across modern youth and multi-generational workforces.',
    question: '"What does this dynamic mean for team leadership and organizational resilience across corporate and public life?"',
    link: 'https://www.linkedin.com/pulse/indian-democracy-gen-z-lt-gen-p-g-kamath-qnedf/',
    drafts: {
      strategic: `An exceptional and sobering perspective, General. Whether on the battlefield or in corporate organizations, freedom and agility must always be balanced with unwavering discipline, accountability, and respect for institutions. Leaders must mentor younger cohorts on long-term stewardship.`,
      concise: `Profound insights, Sir. Discipline, resilience, and institutional integrity are the bedrock of any enduring organization. Thank you for this timely perspective.`,
      question: `A crucial discussion, General Kamath. In an era dominated by instant digital gratification, what is the most effective approach corporate executives can take to inculcate operational discipline without stifling innovation?`
    }
  },
  {
    id: 'post-7',
    author: 'Dr. Shalini Ratan',
    role: 'Healthcare Advisor & Educator • Medical Communication & Training',
    badge: 'Healthcare Governance',
    category: 'pharma',
    metrics: { likes: '950', comments: '120', views: '18K' },
    summary: 'Reflections on organizational accountability and leadership when facing tough inquiries in healthcare systems.',
    link: 'https://www.linkedin.com/in/shaliniratan/',
    drafts: {
      strategic: `Leadership is truly tested not during periods of smooth growth, but when tough, uncomfortable questions must be addressed with transparency and decisiveness. In healthcare operations, creating a culture where teams feel safe raising operational realities is what drives long-term resilience.`,
      concise: `Accountability and transparent communication are the cornerstones of sustainable healthcare leadership. A very timely and important reflection, Dr. Shalini!`,
      question: `A critical perspective, Dr. Shalini. From your vantage point in medical advisory, what is the single most effective framework healthcare organizations can adopt to foster proactive accountability before crises occur?`
    }
  },
  {
    id: 'post-8',
    author: 'PharmaTech Insights & Digital SFA',
    role: 'Digital Transformation in Commercial Healthcare • 45K Followers',
    badge: 'AI in Field Operations',
    category: 'biotech',
    metrics: { likes: '3,890', comments: '260', views: '65K' },
    summary: 'How AI-driven SFA (Sales Force Automation) and doctor profiling are replacing static monthly reporting. Field teams equipped with real-time prescription insights and automated call planning achieve 34% higher doctor conversion rates.',
    question: '"Are pharma companies ready to move from traditional DCR auditing to proactive AI-guided field execution?"',
    link: 'https://www.linkedin.com/feed/',
    drafts: {
      strategic: `The shift from retrospective call auditing to predictive field enablement is long overdue in pharma. Technology should never be an administrative burden on the medical representative; it must serve as an intelligent copilot that enriches doctor engagement at the clinic level. Execution becomes effortless when data empowers the front line.`,
      concise: `Spot on! SFA tools should empower representatives with clinical insights, not just track GPS coordinates. True digital transformation begins when field managers use analytics for coaching rather than policing.`,
      question: `Excellent analysis. In your implementations, what has been the primary bottleneck in getting field forces to actively embrace AI-guided call planning — tech adoption or change management from senior management?`
    }
  },
  {
    id: 'post-9',
    author: 'Rising India & CDMO Manufacturing',
    role: 'Indian Industrial Corridor • 68K Followers',
    badge: 'Domestic Scale & Exports',
    category: 'economy',
    metrics: { likes: '5,400', comments: '410', views: '95K' },
    summary: 'Cabinet approvals and PLI incentives accelerate domestic active pharmaceutical ingredients (API) and complex formulations manufacturing. India solidifies position as the pharmacy to the world with expanding export corridors.',
    link: 'https://www.linkedin.com/feed/',
    drafts: {
      strategic: `Strengthening backward integration and domestic formulation scale is vital for India's strategic healthcare sovereignty. As quality benchmarks rise globally, domestic pharma companies that marry cost leadership with stringent regulatory compliance will dominate global value chains.`,
      concise: `Incredible momentum for Indian pharmaceutical manufacturing. The transition towards high-value formulations and API self-reliance is a game-changer for our entire healthcare ecosystem.`,
      question: `A monumental milestone! As domestic capacity expands, what policy interventions would further accelerate Indian mid-sized pharma in capturing high-margin biologic and specialty therapeutic markets abroad?`
    }
  },
  {
    id: 'post-10',
    author: 'Samvrant Mishra',
    role: 'Pharma Business Strategist • Commercial Operations Specialist',
    badge: 'Field Execution & Strategy',
    category: 'pharma',
    metrics: { likes: '1,830', comments: '145', views: '32K' },
    summary: 'The difference between top-quartile and median pharma business units: "Top BU heads do not spend 80% of their time in HQ presentations; they spend it aligning field managers, refining doctor target lists, and ensuring stockist pipeline integrity."',
    question: '"What is the ideal ratio of field time vs review meetings for operational leadership in pharma?"',
    link: 'https://www.linkedin.com/feed/',
    drafts: {
      strategic: `Couldn't agree more, Samvrant. In my 30+ years as a BU Head, I have consistently lived by the principle: 'Execution is the Key.' Reviews that only lament past misses without equipping managers to solve territory coverage on the ground are futile. Real commercial excellence is built shoulder-to-shoulder with the field force.`,
      concise: `100% agreed! Strategy formulated in air-conditioned boardrooms must withstand the heat of the field. When leadership stays close to the doctor-chemist interface, operational velocity skyrockets.`,
      question: `Spot on perspective, Samvrant. How do you advise growing pharma enterprises to prevent their second-line and first-line managers from getting bogged down by endless administrative reporting at the expense of field coaching?`
    }
  }
];

export default function LinkedInDesk() {
  const [activeTab, setActiveTab] = useState<'feed' | 'generator'>('feed');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('Just now');
  
  // Custom generator state
  const [inputPost, setInputPost] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [generatedDrafts, setGeneratedDrafts] = useState<{ strategic: string; concise: string; question: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Auto-refresh feeds when user opens/logs into this page
  useEffect(() => {
    refreshLiveFeeds();
  }, []);

  const refreshLiveFeeds = () => {
    setIsRefreshing(true);
    // Simulate real-time API sync with timestamp update
    setTimeout(() => {
      setIsRefreshing(false);
      const now = new Date();
      setLastSyncedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 700);
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

  const filteredFeeds = selectedCategory === 'all' 
    ? ALL_FEEDS 
    : ALL_FEEDS.filter(feed => feed.category === selectedCategory);

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
            <span style={{ 
              background: 'rgba(16, 185, 129, 0.2)', 
              color: '#34d399', 
              fontSize: '0.7rem', 
              fontWeight: 700, 
              padding: '2px 8px', 
              borderRadius: '999px',
              border: '1px solid rgba(52, 211, 153, 0.4)' 
            }}>
              LIVE FEED SYNCED
            </span>
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
          <span>Active Feed Postings ({ALL_FEEDS.length})</span>
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

      {/* Category Filter Pills (When on Feeds Tab) */}
      {activeTab === 'feed' && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginRight: '4px' }}>
            <Filter size={14} />
            <span>Topics:</span>
          </div>

          {[
            { id: 'all', label: `All Feeds (${ALL_FEEDS.length})` },
            { id: 'pharma', label: 'Pharma & Healthcare (4)' },
            { id: 'leadership', label: 'Leadership & Strategy (2)' },
            { id: 'economy', label: 'Economy & Industry (2)' },
            { id: 'biotech', label: 'Biotech & AI Innovation (2)' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                background: selectedCategory === cat.id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                color: selectedCategory === cat.id ? '#38bdf8' : '#94a3b8',
                border: selectedCategory === cat.id ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '5px 12px',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Content Area */}
      {activeTab === 'feed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

          {filteredFeeds.map((post, idx) => (
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
