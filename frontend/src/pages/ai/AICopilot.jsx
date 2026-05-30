import { useState, useEffect, useRef } from 'react';
import { aiChat, getAiInsights } from '../../api';
import { Sparkles, Send, AlertTriangle, Info, TrendingUp, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

const SUGGESTED = [
  'How is my business doing today?',
  'Which products sell the most?',
  'How much revenue did I make this week?',
  'Which customers spend the most?',
  'What should I restock urgently?',
  'Compare this week vs last week sales',
];

function InsightCard({ type, message, action }) {
  const styles = {
    warning: { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E', icon: AlertTriangle, iconColor: '#D97706' },
    danger:  { bg: '#FEF2F2', border: '#FECACA', color: '#7F1D1D', icon: AlertTriangle, iconColor: '#DC2626' },
    info:    { bg: '#EFF6FF', border: '#BFDBFE', color: '#1E3A5F', icon: Info, iconColor: '#3B82F6' },
    success: { bg: '#F0FDF4', border: '#BBF7D0', color: '#14532D', icon: TrendingUp, iconColor: '#16A34A' },
  };
  const s = styles[type] || styles.info;
  const Icon = s.icon;

  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <Icon size={15} color={s.iconColor} style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: s.color, fontWeight: 500 }}>{message}</div>
        {action && <div style={{ fontSize: 12, color: s.iconColor, fontWeight: 600, marginTop: 3 }}>{action}</div>}
      </div>
    </div>
  );
}

function renderInline(text, keyBase) {
  const parts = [];
  let remaining = text;
  let k = 0;
  while (remaining.length > 0) {
    const bold   = remaining.match(/\*\*(.+?)\*\*/);
    const italic = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);
    const code   = remaining.match(/`([^`]+)`/);
    const candidates = [bold, italic, code].filter(Boolean);
    if (!candidates.length) { parts.push(<span key={`${keyBase}-t${k++}`}>{remaining}</span>); break; }
    const first = candidates.reduce((a, b) => a.index <= b.index ? a : b);
    if (first.index > 0) parts.push(<span key={`${keyBase}-t${k++}`}>{remaining.slice(0, first.index)}</span>);
    if (first === bold)   parts.push(<strong key={`${keyBase}-b${k++}`}>{first[1]}</strong>);
    else if (first === code) parts.push(<code key={`${keyBase}-c${k++}`} style={{ background: '#F3F4F6', borderRadius: 4, padding: '1px 5px', fontFamily: 'monospace', fontSize: 13 }}>{first[1]}</code>);
    else parts.push(<em key={`${keyBase}-i${k++}`}>{first[1]}</em>);
    remaining = remaining.slice(first.index + first[0].length);
  }
  return parts;
}

function MarkdownMessage({ content }) {
  const blocks = content.split(/\n\n+/);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {blocks.map((block, bi) => {
        const lines = block.split('\n').filter(l => l.trim());
        if (!lines.length) return null;

        if (/^#{1,3} /.test(lines[0])) {
          const level = lines[0].match(/^(#{1,3}) /)[1].length;
          const text = lines[0].replace(/^#{1,3} /, '');
          const sz = [17, 15, 14][level - 1];
          return <div key={bi} style={{ fontWeight: 700, fontSize: sz, color: 'var(--navy)', marginTop: 4 }}>{renderInline(text, `h${bi}`)}</div>;
        }

        const isBullet = lines.every(l => /^[-*•]\s/.test(l));
        const isNumbered = lines.every(l => /^\d+\.\s/.test(l));

        if (isBullet) {
          return (
            <ul key={bi} style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {lines.map((l, li) => <li key={li} style={{ fontSize: 14, lineHeight: 1.55 }}>{renderInline(l.replace(/^[-*•]\s+/, ''), `ul${bi}-${li}`)}</li>)}
            </ul>
          );
        }
        if (isNumbered) {
          return (
            <ol key={bi} style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {lines.map((l, li) => <li key={li} style={{ fontSize: 14, lineHeight: 1.55 }}>{renderInline(l.replace(/^\d+\.\s+/, ''), `ol${bi}-${li}`)}</li>)}
            </ol>
          );
        }

        return <p key={bi} style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{renderInline(lines.join(' '), `p${bi}`)}</p>;
      })}
    </div>
  );
}

function ChatBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 14 }}>
      {!isUser && (
        <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg, var(--cyan), var(--electric))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 8, marginTop: 2 }}>
          <Sparkles size={14} color="#fff" />
        </div>
      )}
      <div style={{
        maxWidth: '75%',
        padding: '10px 14px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
        background: isUser ? 'var(--navy)' : '#fff',
        color: isUser ? '#fff' : 'var(--ink)',
        fontSize: 14,
        lineHeight: 1.6,
        border: isUser ? 'none' : '1px solid var(--border)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        {isUser ? msg.content : <MarkdownMessage content={msg.content} />}
      </div>
    </div>
  );
}

export default function AICopilot() {
  const { tenant } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadInsights();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadInsights = async () => {
    setInsightsLoading(true);
    try {
      const r = await getAiInsights();
      setInsights(r.data.data || r.data);
    } catch {
      // insights are optional — don't toast
    } finally {
      setInsightsLoading(false);
    }
  };

  const sendMessage = async (text) => {
    const message = (text || input).trim();
    if (!message || loading) return;

    const userMsg = { role: 'user', content: message };
    const history = messages.map(m => ({ role: m.role, content: m.content }));

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const r = await aiChat({ message, history });
      const reply = r.data.data?.reply || r.data.reply || 'No response';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      const raw = err.response?.data?.message || '';
      const isQuota = raw.toLowerCase().includes('quota') || raw.toLowerCase().includes('429');
      const errMsg = isQuota
        ? 'Free AI quota exhausted for today. Add ANTHROPIC_API_KEY to backend .env for unlimited access, or try again tomorrow.'
        : raw || 'AI is unavailable right now. Check that GEMINI_API_KEY or ANTHROPIC_API_KEY is set in the backend .env.';
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - var(--topbar-h))', overflow: 'hidden' }}>
      {/* Left panel — insights */}
      <div style={{ width: 280, flexShrink: 0, borderRight: '1px solid var(--border)', background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px 18px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>Live Insights</h3>
            <button onClick={loadInsights} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}>
              <RefreshCw size={13} />
            </button>
          </div>
          <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Real-time alerts from your data</p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px' }}>
          {insightsLoading ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#9CA3AF', fontSize: 13 }}>Loading...</div>
          ) : (
            <>
              {insights?.kpis && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  <div style={{ background: 'var(--navy)', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today's Revenue</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginTop: 2 }}>{fmt(insights.kpis.todayRevenue)}</div>
                  </div>
                  <div style={{ background: '#F0FDF4', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>This Week</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#16A34A', marginTop: 2 }}>{fmt(insights.kpis.weekRevenue)}</div>
                  </div>
                </div>
              )}

              {insights?.insights?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {insights.insights.map((ins, i) => <InsightCard key={i} {...ins} />)}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#9CA3AF', fontSize: 13 }}>
                  <TrendingUp size={24} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
                  All looks good — no alerts right now
                </div>
              )}
            </>
          )}
        </div>

        {/* Suggested questions */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Ask something</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {SUGGESTED.map(q => (
              <button key={q} onClick={() => sendMessage(q)} style={{
                background: 'none', border: '1px solid var(--border)', borderRadius: 8,
                padding: '7px 10px', fontSize: 12, color: '#374151', cursor: 'pointer',
                textAlign: 'left', lineHeight: 1.4,
                transition: 'background 0.1s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--cream)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '16px 24px', background: '#fff', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, var(--cyan), var(--electric))', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>AI Copilot</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>Powered by Claude · Knows your {tenant?.name} data</div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {isEmpty && (
            <div style={{ textAlign: 'center', paddingTop: 60 }}>
              <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, var(--cyan), var(--electric))', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Sparkles size={28} color="#fff" />
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--navy)', marginBottom: 6 }}>
                Hello! I'm your business AI.
              </h2>
              <p style={{ color: '#6B7280', fontSize: 14, maxWidth: 400, margin: '0 auto' }}>
                Ask me anything about your sales, customers, inventory or performance. I analyse your live data and give you straight answers.
              </p>
            </div>
          )}

          {messages.map((msg, i) => <ChatBubble key={i} msg={msg} />)}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 14, gap: 8 }}>
              <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg, var(--cyan), var(--electric))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Sparkles size={14} color="#fff" />
              </div>
              <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '4px 16px 16px 16px', padding: '12px 16px', display: 'flex', gap: 5, alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 7, height: 7, background: 'var(--cyan)', borderRadius: '50%', animation: `bounce 1s ${i * 0.15}s ease-in-out infinite` }} />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div style={{ padding: '16px 24px', background: '#fff', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', background: '#F9FAFB', border: '1px solid var(--border)', borderRadius: 14, padding: '10px 14px' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about your sales, customers, inventory..."
              rows={1}
              style={{
                flex: 1, border: 'none', background: 'transparent', resize: 'none',
                fontSize: 14, lineHeight: 1.5, outline: 'none', fontFamily: 'var(--font-body)',
                maxHeight: 120, overflowY: 'auto', color: 'var(--ink)',
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{
                width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
                background: input.trim() && !loading ? 'var(--navy)' : '#E5E7EB',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s', flexShrink: 0,
              }}>
              <Send size={15} />
            </button>
          </div>
          <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6, textAlign: 'center' }}>
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
