import { useState, useEffect, useRef, useCallback } from 'react';
import { getWAConversations, getWAThread, sendWAMessage } from '../../api';
import toast from 'react-hot-toast';
import { Send, MessageCircle, Search, Phone, RefreshCw } from 'lucide-react';

const fmtTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
const fmtDate = (d) => {
  const date = new Date(d);
  const today = new Date();
  const diff = today.setHours(0,0,0,0) - date.setHours(0,0,0,0);
  if (diff === 0) return 'Today';
  if (diff === 86400000) return 'Yesterday';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

export default function WhatsApp() {
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [thread, setThread] = useState([]);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEnd = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      const r = await getWAConversations();
      setConversations(r.data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (!active) return;
    getWAThread(active.phone).then(r => {
      setThread(r.data.data || []);
      setTimeout(() => messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
  }, [active]);

  const handleSend = async () => {
    if (!message.trim() || !active) return;
    setSending(true);
    try {
      await sendWAMessage({ phone: active.phone, message: message.trim() });
      setMessage('');
      const r = await getWAThread(active.phone);
      setThread(r.data.data || []);
      setTimeout(() => messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      loadConversations();
    } catch { toast.error('Failed to send message'); }
    finally { setSending(false); }
  };

  const filtered = conversations.filter(c =>
    (c.contactName || c.phone).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 0px)', background: '#F8FAFC', overflow: 'hidden' }}>
      {/* Sidebar — conversation list */}
      <div style={{ width: 320, borderRight: '1px solid #E5E7EB', background: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--navy)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageCircle size={20} color="#25D366" /> WhatsApp
            </h2>
            <button onClick={loadConversations} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }} title="Refresh">
              <RefreshCw size={15} />
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search contacts..."
              style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-body)' }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <MessageCircle size={40} color="#E5E7EB" style={{ marginBottom: 8 }} />
              <p style={{ color: '#9CA3AF', fontSize: 13 }}>No conversations yet.<br />Send a message or receive one to start.</p>
            </div>
          ) : (
            filtered.map(conv => (
              <div
                key={conv.phone}
                onClick={() => setActive(conv)}
                style={{
                  padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #F9FAFB',
                  background: active?.phone === conv.phone ? '#F0FDF4' : '#fff',
                  borderLeft: active?.phone === conv.phone ? '3px solid #25D366' : '3px solid transparent',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1, minWidth: 0 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                      {(conv.contactName || conv.phone)[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {conv.contactName || conv.phone}
                        {conv.unread > 0 && <span style={{ background: '#25D366', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 11, fontWeight: 700 }}>{conv.unread}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>{conv.lastMessage}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0, marginLeft: 8 }}>{fmtDate(conv.lastAt)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main chat area */}
      {active ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#ECE5DD', backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'400\' height=\'400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3C/svg%3E")' }}>
          {/* Chat header */}
          <div style={{ padding: '12px 20px', background: '#fff', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16 }}>
              {(active.contactName || active.phone)[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{active.contactName || active.phone}</div>
              <div style={{ fontSize: 12, color: '#25D366', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Phone size={11} /> {active.phone.replace(/(\d{2})(\d{5})(\d{5})/, '+$1 $2 $3')}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 40px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {thread.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, marginTop: 40 }}>No messages yet in this conversation.</div>
            ) : (
              thread.map((msg, i) => {
                const isOutbound = msg.direction === 'OUTBOUND';
                return (
                  <div key={msg.id || i} style={{ display: 'flex', justifyContent: isOutbound ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '65%', padding: '8px 12px', borderRadius: isOutbound ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      background: isOutbound ? '#DCF8C6' : '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      fontSize: 14, color: '#111827', whiteSpace: 'pre-wrap', lineHeight: 1.5,
                    }}>
                      {msg.body}
                      <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginTop: 4 }}>{fmtTime(msg.createdAt)}</div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEnd} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 20px', background: '#fff', borderTop: '1px solid #E5E7EB', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
              rows={1}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 24, border: '1.5px solid #E5E7EB', fontSize: 14,
                fontFamily: 'var(--font-body)', outline: 'none', resize: 'none', lineHeight: 1.5,
                maxHeight: 120, overflow: 'auto',
              }}
            />
            <button
              onClick={handleSend}
              disabled={sending || !message.trim()}
              style={{
                width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: sending || !message.trim() ? '#E5E7EB' : '#25D366',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#ECE5DD' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '40px 48px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#DCF8C6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <MessageCircle size={36} color="#25D366" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: '#111827', margin: '0 0 8px' }}>WhatsApp Business Inbox</h3>
            <p style={{ color: '#6B7280', fontSize: 14, maxWidth: 320, margin: '0 auto 20px' }}>
              Select a conversation to read and reply. You can also send invoices, appointment reminders, and fee alerts directly to customers.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['📄 Invoice → WhatsApp', '📅 Appointment Reminders', '💰 Fee Due Alerts', '🏢 Rent Notifications'].map(f => (
                <span key={f} style={{ padding: '6px 14px', borderRadius: 20, background: '#F0FDF4', color: '#16A34A', fontSize: 12, fontWeight: 600 }}>{f}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
