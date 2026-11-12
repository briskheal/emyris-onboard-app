import { useState } from 'react';
import { 
  Share2, Copy, Check, ExternalLink, Sparkles, Send, 
  MessageSquare, Award, ArrowRight, RefreshCw, Smartphone
} from 'lucide-react';

interface FeedPost {
  id: string;
  author: string;
  role: string;
  badge?: string;
  summary: string;
  question?: string;
  link?: string;
  drafts: {
    strategic: string;
    concise: string;
    question: string;
  };
}

const INITIAL_POSTS: FeedPost[] = [
  {
    id: 'post-1',
    author: 'Saurabh Rajput',
    role: 'Pharma Trainer & Consultant • Author of The Pharma Growth System • 18+ Yrs Exp',
    badge: 'High Industry Relevance',
    summary: 'Analyzes why competitor pharma companies grow faster with identical budgets and team sizes. Identifies 5 gaps: disconnected portfolio logic, marketing disconnected from field execution, unrealistic targets, decoupled training, and ineffective review meetings.',
    question: '"Pharma Owners, Directors and Leaders: Imagine you were asked to improve an underperforming pharma company without increasing budget. Which would you fix first? And which gap is most underestimated?"',
    link: 'https://www.linkedin.com/in/saurabhrajput-pharmatrainer/',
    drafts: {
      strategic: `Spot on analysis, Saurabh. Having led business units and cross-functional pharma teams over the last three decades, I would unequivocally fix Marketing-to-Field Execution first.

Strategy on paper rarely fails; the breakdown almost always happens in the 'last mile' — where front-line managers and representatives struggle to translate brand positioning into meaningful, value-driven doctor conversations.

The most underestimated gap is managerial capability at the first-line level. When you empower territory leaders with clear execution pathways rather than just chasing targets in review meetings, performance follows naturally without adding a single rupee to the budget.`,
      concise: `In 30 years across pharma, I've consistently seen that strategy is only as good as the ground-level execution. The biggest unlock without extra budget is empowering first-line managers to coach and execute at the doctor-chemist interface rather than just audit calls. Excellent points!`,
      question: `Compelling breakdown, Saurabh. In your consulting engagements across mid-sized and large pharma companies, how often do you find that first-line managers actually have the clinical conviction and coaching tools to support their reps on the ground versus merely tracking numbers?`
    }
  },
  {
    id: 'post-2',
    author: 'Dr. (Hon.) Jigar Joshi',
    role: 'Pharma Marketing • Ex Glenmark Institutional KAM • Ex Cipla • Ex Emcure',
    badge: 'Peer / Ex-Glenmark Connection',
    summary: 'Reflecting on character and professional integrity in healthcare leadership: "To Think Good is Good, to Do Good Is better, But To be Good is the Best One...."',
    link: 'https://www.linkedin.com/feed/',
    drafts: {
      strategic: `Well articulated, Jigar! In an industry as demanding as healthcare and pharmaceuticals, core character, integrity, and being genuinely invested in people always outshine everything else. Wishing you continued success!`,
      concise: `Spot on, Jigar. True leadership in pharma always starts with integrity and purpose. Great to see your continued thought leadership!`,
      question: `So true, Jigar. In today's high-speed commercial environment, how can pharma leadership best instill this culture of purpose-driven integrity down to the youngest medical representatives in the field?`
    }
  },
  {
    id: 'post-3',
    author: 'Dr. Shalini Ratan',
    role: 'Healthcare Advisor & Educator • Medical Communication & Training',
    badge: 'Healthcare Leadership',
    summary: 'Reflections on organizational accountability and leadership when facing tough inquiries in healthcare systems.',
    link: 'https://www.linkedin.com/in/shaliniratan/',
    drafts: {
      strategic: `Leadership is truly tested not during periods of smooth growth, but when tough, uncomfortable questions must be addressed with transparency and decisiveness. In healthcare operations, creating a culture where teams feel safe raising operational realities is what drives long-term resilience.`,
      concise: `Accountability and transparent communication are the cornerstones of sustainable healthcare leadership. A very timely and important reflection, Dr. Shalini!`,
      question: `A critical perspective, Dr. Shalini. From your vantage point in medical advisory, what is the single most effective framework healthcare organizations can adopt to foster proactive accountability before crises occur?`
    }
  },
  {
    id: 'post-4',
    author: 'Umesh Kumar Agarwal',
    role: 'Geopolitical Analyst • Editor in Chief @ INDIACHRONICLE.IN',
    badge: 'Macroeconomic Growth',
    summary: 'India reclaims position as the 5th largest stock market globally, overtaking Taiwan, with total market cap crossing $5.5 Trillion.',
    link: 'https://www.linkedin.com/in/ukagarwal/',
    drafts: {
      strategic: `A significant milestone reflecting India’s underlying macroeconomic resilience and industrial expansion. From a healthcare and domestic manufacturing perspective, this capital growth provides tremendous runway for scaled operations and global competitiveness.`,
      concise: `A proud moment for India's corporate and manufacturing ecosystem! The fundamentals of the Indian growth story continue to demonstrate immense strength and scale.`,
      question: `Remarkable milestone, Umesh. As market capitalization expands past $5.5T, which specific manufacturing and healthcare sectors do you anticipate will lead the next phase of value creation?`
    }
  },
  {
    id: 'post-5',
    author: 'Longevity.Technology',
    role: 'Biotech & Preventive Medicine Journal • 21,500+ Followers',
    badge: 'Preventive Biotech & Licensing',
    summary: 'Rapid scaling of preventive therapeutics and longevity biotech, with over $30B invested and high pharma licensing activity.',
    link: 'https://www.linkedin.com/company/longevitytechnology/',
    drafts: {
      strategic: `Preventive healthcare and metabolic longevity represent the most exciting evolution in modern pharmaceuticals. Bridging evidence-based nutraceuticals with clinical rigor is where the future of patient wellness truly lies.`,
      concise: `The convergence of clinical pharma and preventive longevity biotech is accelerating faster than ever. An invaluable trend to watch for business heads and formulation strategists.`,
      question: `Fascinating data! As preventive therapies scale, do you anticipate regulatory pathways adapting quickly enough to encourage accelerated clinical-stage partnerships with established pharma players?`
    }
  }
];

export default function LinkedInDesk() {
  const [activeTab, setActiveTab] = useState<'feed' | 'generator'>('feed');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Custom generator state
  const [inputPost, setInputPost] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [generatedDrafts, setGeneratedDrafts] = useState<{ strategic: string; concise: string; question: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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
                Executive LinkedIn Assistant
              </h1>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                LIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Personalized for <strong className="text-slate-200">J. Ranjan Dash</strong> • Business Operation Head, Emyris Biolifesciences
            </p>
          </div>

          <button
            onClick={() => handleOpenLinkedIn()}
            className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-sky-600/20 active:scale-95 transition-all self-start md:self-auto"
          >
            <Smartphone size={16} />
            <span>Open LinkedIn App</span>
            <ExternalLink size={14} />
          </button>
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
            <span>Today's Feed Discussions ({INITIAL_POSTS.length})</span>
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
      </div>

      {/* Content Area */}
      <div className="max-w-4xl mx-auto w-full px-4 pt-6 space-y-6">

        {/* TAB 1: CURATED FEED POSTS */}
        {activeTab === 'feed' && (
          <div className="space-y-6">
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 text-xs text-slate-300 flex items-center gap-3">
              <Award className="text-amber-400 shrink-0" size={24} />
              <div>
                <span className="font-bold text-white">How this mobile workflow works: </span>
                Review the posts from your feed below, tap <strong className="text-sky-400">"Copy Draft"</strong> on your preferred tone, and tap <strong className="text-sky-400">"Open Post"</strong> to paste your comment on LinkedIn in seconds!
              </div>
            </div>

            {INITIAL_POSTS.map((post) => (
              <div 
                key={post.id} 
                className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 md:p-6 shadow-xl space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-white text-base">{post.author}</h3>
                      {post.badge && (
                        <span className="bg-sky-500/10 text-sky-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-sky-500/20">
                          {post.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{post.role}</p>
                  </div>

                  {post.link && (
                    <button
                      onClick={() => handleOpenLinkedIn(post.link)}
                      className="self-start flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-bold bg-sky-500/10 px-3 py-1.5 rounded-lg border border-sky-500/20 active:scale-95 transition-all"
                    >
                      <span>Open Post</span>
                      <ExternalLink size={13} />
                    </button>
                  )}
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
                  Reading a post on your LinkedIn phone app right now? Paste the author name and post text below to instantly generate executive drafts in your voice.
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
