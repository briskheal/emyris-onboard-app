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
    <div style={{ maxWidth: '1100px', margin: '0 auto', color: '#f8fafc' }}>
      {/* Top Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(15, 23, 42, 0.8))', 
        border: '1px solid rgba(56, 189, 248, 0.3)', 
        borderRadius: '16px', 
        padding: '20px 24px', 
        marginBottom: '24px',
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
              LIVE FEED CONNECTED
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
            Personalized for <strong style={{ color: '#e2e8f0' }}>J. Ranjan Dash</strong> • Business Operation Head, Emyris Biolifesciences
          </p>
        </div>

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
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
          }}
        >
          <Smartphone size={16} />
          <span>Open LinkedIn</span>
          <ExternalLink size={14} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '24px' }}>
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
          <span>Today's Discussions ({INITIAL_POSTS.length})</span>
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
              <strong style={{ color: '#ffffff' }}>How to respond from mobile: </strong> 
              Review the curated posts from your feed below, tap <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>"Copy Draft"</span> on your preferred response, and tap <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>"Open Post"</span> to paste directly on LinkedIn.
            </div>
          </div>

          {INITIAL_POSTS.map(post => (
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
                  <span>Executive Draft Options:</span>
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
