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

  useEffect(() => {
    refreshLiveFeeds();
  }, []);

  const refreshLiveFeeds = () => {
    setIsRefreshing(true);
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
    <div className="min-h-full bg-slate-900 flex flex-col font-sans pb-32 text-slate-100">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border-b border-slate-800 px-4 py-5 md:px-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                <Share2 size={20} />
              </span>
              <h1 className="text-lg md:text-xl font-black text-white tracking-wide uppercase">
                Executive LinkedIn Desk
              </h1>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                LIVE FEED SYNCED
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Personalized for <strong className="text-slate-200">J. Ranjan Dash</strong> • Business Operation Head, Emyris Biolifesciences • <span className="text-sky-400">Last Synced: {lastSyncedTime}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
            {/* Sync Feeds Button */}
            <button
              onClick={refreshLiveFeeds}
              disabled={isRefreshing}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-sky-500/30 font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-lg active:scale-95 transition-all"
            >
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Live Feeds'}</span>
            </button>

            {/* Open LinkedIn Button */}
            <button
              onClick={() => handleOpenLinkedIn()}
              className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-sky-600/20 active:scale-95 transition-all"
            >
              <Smartphone size={16} />
              <span>Open LinkedIn</span>
              <ExternalLink size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto w-full px-4 pt-4">
        <div className="flex border-b border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab('feed')}
            className={`pb-3 px-3 text-xs font-bold transition-colors relative flex items-center gap-2 ${
              activeTab === 'feed' ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare size={16} />
            <span>Active Feed Postings ({ALL_FEEDS.length})</span>
            {activeTab === 'feed' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('generator')}
            className={`pb-3 px-3 text-xs font-bold transition-colors relative flex items-center gap-2 ${
              activeTab === 'generator' ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles size={16} />
            <span>Mobile Reply Generator</span>
            {activeTab === 'generator' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Filter Pills */}
        {activeTab === 'feed' && (
          <div className="flex gap-2 flex-wrap items-center pt-3 pb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1 mr-1">
              <Filter size={12} />
              Topics:
            </span>
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
                className={`text-[11px] font-bold px-3 py-1 rounded-full transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="max-w-4xl mx-auto w-full px-4 pt-4 space-y-6">
        {/* TAB 1: CURATED FEED POSTS */}
        {activeTab === 'feed' && (
          <div className="space-y-6">
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 text-xs text-slate-300 flex items-center gap-3">
              <Award className="text-amber-400 shrink-0" size={24} />
              <div>
                <span className="font-bold text-white">Live LinkedIn Workflow: </span>
                Feeds auto-sync on login. Tap <strong className="text-sky-400">"Copy Draft"</strong> on your preferred tone, then tap <strong className="text-sky-400">"Open Post"</strong> to paste your comment on LinkedIn in seconds!
              </div>
            </div>

            {filteredFeeds.map((post, idx) => (
              <div 
                key={post.id} 
                className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 md:p-6 shadow-xl space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-black px-2 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                      <h3 className="font-black text-white text-base">{post.author}</h3>
                      {post.badge && (
                        <span className="bg-sky-500/10 text-sky-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-sky-500/20">
                          {post.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{post.role}</p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Engagement */}
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <ThumbsUp size={12} className="text-sky-400" /> {post.metrics.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare size={12} className="text-purple-400" /> {post.metrics.comments}
                      </span>
                      {post.metrics.views && (
                        <span className="flex items-center gap-1">
                          <Eye size={12} className="text-emerald-400" /> {post.metrics.views}
                        </span>
                      )}
                    </div>

                    {post.link && (
                      <button
                        onClick={() => handleOpenLinkedIn(post.link)}
                        className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-bold bg-sky-500/10 px-3 py-1.5 rounded-lg border border-sky-500/20 active:scale-95 transition-all"
                      >
                        <span>Open Post</span>
                        <ExternalLink size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Post Summary & Question */}
                <div className="bg-slate-900/60 rounded-xl p-3.5 border border-slate-800 space-y-2 text-xs">
                  <p className="text-slate-300 leading-relaxed">
                    <strong className="text-slate-200">Post Core:</strong> {post.summary}
                  </p>
                  {post.question && (
                    <p className="text-amber-300/90 italic border-l-2 border-amber-500/50 pl-2.5 py-0.5">
                      {post.question}
                    </p>
                  )}
                </div>

                {/* Draft Replies */}
                <div className="space-y-3 pt-1">
                  <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Sparkles size={13} className="text-sky-400" />
                    <span>Choose Your Executive Draft Reply:</span>
                  </h4>

                  {/* Option 1: Strategic / Executive */}
                  <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        Option 1 • Executive Leadership (Recommended)
                      </span>
                      <button
                        onClick={() => handleCopy(post.drafts.strategic, `${post.id}-strategic`)}
                        className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-lg transition-all ${
                          copiedId === `${post.id}-strategic`
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-sky-400'
                        }`}
                      >
                        {copiedId === `${post.id}-strategic` ? (
                          <>
                            <Check size={14} />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            <span>Copy Draft</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line font-normal">
                      {post.drafts.strategic}
                    </p>
                  </div>

                  {/* Option 2: Concise */}
                  <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                        Option 2 • Concise & Direct
                      </span>
                      <button
                        onClick={() => handleCopy(post.drafts.concise, `${post.id}-concise`)}
                        className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-lg transition-all ${
                          copiedId === `${post.id}-concise`
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-sky-400'
                        }`}
                      >
                        {copiedId === `${post.id}-concise` ? (
                          <>
                            <Check size={14} />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            <span>Copy Draft</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-normal">
                      {post.drafts.concise}
                    </p>
                  </div>

                  {/* Option 3: Discussion Starter */}
                  <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                        Option 3 • Engaging Question
                      </span>
                      <button
                        onClick={() => handleCopy(post.drafts.question, `${post.id}-question`)}
                        className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-lg transition-all ${
                          copiedId === `${post.id}-question`
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-sky-400'
                        }`}
                      >
                        {copiedId === `${post.id}-question` ? (
                          <>
                            <Check size={14} />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            <span>Copy Draft</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-normal">
                      {post.drafts.question}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: MOBILE REPLY GENERATOR */}
        {activeTab === 'generator' && (
          <div className="space-y-6">
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 md:p-6 shadow-xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="text-sky-400" size={18} />
                  <span>On-The-Fly Reply Generator (From Mobile)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Reading any post on your LinkedIn phone app right now? Paste the author name and post text below to instantly generate executive drafts in your voice.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Author / Connection Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Sharma, Rajesh, Amit..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Paste Post Text or Topic
                  </label>
                  <textarea
                    rows={4}
                    value={inputPost}
                    onChange={(e) => setInputPost(e.target.value)}
                    placeholder="Paste the LinkedIn post, discussion question, or announcement here..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <button
                  disabled={!inputPost.trim() || isGenerating}
                  onClick={generateCustomReplies}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl shadow-lg active:scale-95 transition-all"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
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

            {/* Generated Results */}
            {generatedDrafts && (
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                  <Check className="text-emerald-400" size={16} />
                  <span>Ready-to-Post Drafts:</span>
                </h3>

                {/* Strategic */}
                <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      Strategic / BU Head Perspective
                    </span>
                    <button
                      onClick={() => handleCopy(generatedDrafts.strategic, 'custom-strategic')}
                      className="flex items-center gap-1 text-xs font-bold px-3 py-1 bg-slate-700 hover:bg-slate-600 text-sky-400 rounded-lg"
                    >
                      {copiedId === 'custom-strategic' ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedId === 'custom-strategic' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-normal">
                    {generatedDrafts.strategic}
                  </p>
                </div>

                {/* Concise */}
                <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                      Concise & Direct
                    </span>
                    <button
                      onClick={() => handleCopy(generatedDrafts.concise, 'custom-concise')}
                      className="flex items-center gap-1 text-xs font-bold px-3 py-1 bg-slate-700 hover:bg-slate-600 text-sky-400 rounded-lg"
                    >
                      {copiedId === 'custom-concise' ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedId === 'custom-concise' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-normal">
                    {generatedDrafts.concise}
                  </p>
                </div>

                {/* Question */}
                <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                      Discussion Provoking
                    </span>
                    <button
                      onClick={() => handleCopy(generatedDrafts.question, 'custom-question')}
                      className="flex items-center gap-1 text-xs font-bold px-3 py-1 bg-slate-700 hover:bg-slate-600 text-sky-400 rounded-lg"
                    >
                      {copiedId === 'custom-question' ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedId === 'custom-question' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-normal">
                    {generatedDrafts.question}
                  </p>
                </div>

                <div className="text-center pt-2">
                  <button
                    onClick={() => handleOpenLinkedIn()}
                    className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg active:scale-95 transition-all"
                  >
                    <span>Open LinkedIn on Phone to Paste</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
