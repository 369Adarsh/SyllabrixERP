import { useState } from 'react';
import { X, MessageCircle, CheckCircle, SkipForward, Users, Send } from 'lucide-react';

const normalizePhone = (phone) => {
  if (!phone) return null;
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('0')) p = p.slice(1);
  if (p.length === 10) p = '91' + p;
  return p;
};

// recipients: [{ id, name, phone, message }]
// title: string
// onClose: fn
// onComplete: fn({ sent, skipped })
export default function BroadcastLauncher({ recipients, title, onClose, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sentIds, setSentIds] = useState(new Set());
  const [skippedIds, setSkippedIds] = useState(new Set());
  const [done, setDone] = useState(false);
  const [waOpened, setWaOpened] = useState(false);

  const total = recipients.length;
  const current = recipients[currentIndex];
  const processedCount = sentIds.size + skippedIds.size;
  const progressPct = total > 0 ? Math.round((processedCount / total) * 100) : 0;

  const openWhatsApp = () => {
    const phone = normalizePhone(current?.phone);
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(current.message)}`
      : `https://wa.me/?text=${encodeURIComponent(current.message)}`;
    window.open(url, '_blank');
    setWaOpened(true);
  };

  const advance = (wasSent) => {
    const newSent = wasSent ? new Set([...sentIds, current.id]) : sentIds;
    const newSkipped = !wasSent ? new Set([...skippedIds, current.id]) : skippedIds;
    if (wasSent) setSentIds(newSent);
    else setSkippedIds(newSkipped);
    setWaOpened(false);

    if (currentIndex + 1 >= total) {
      setDone(true);
      onComplete?.({ sent: newSent.size, skipped: newSkipped.size });
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  const jumpTo = (index) => {
    setCurrentIndex(index);
    setWaOpened(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>{title}</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Users size={11} /> {total} recipients · {sentIds.size} sent · {skippedIds.size} skipped
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#F3F4F6', border: 'none', borderRadius: 8, padding: 7, cursor: 'pointer', color: '#6B7280' }}><X size={15} /></button>
        </div>

        {/* Progress bar */}
        <div style={{ padding: '12px 22px', borderBottom: '1px solid #F9FAFB' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>
            <span style={{ color: '#6B7280' }}>Progress</span>
            <span style={{ color: 'var(--navy)' }}>{processedCount} / {total}</span>
          </div>
          <div style={{ height: 6, background: '#F3F4F6', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, var(--cyan), #22C55E)', borderRadius: 999, transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {done ? (
          /* ── Done state ── */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle size={32} color="#16A34A" />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>Broadcast Complete!</div>
            <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>
              Sent to <strong>{sentIds.size}</strong> customers · Skipped <strong>{skippedIds.size}</strong>
            </div>
            <button onClick={onClose} style={{ padding: '10px 28px', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Done
            </button>
          </div>
        ) : (
          <>
            {/* ── Current recipient ── */}
            <div style={{ padding: '20px 22px', borderBottom: '1px solid #F3F4F6' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                Recipient {currentIndex + 1} of {total}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, background: 'var(--navy)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {current?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>{current?.name}</div>
                  <div style={{ fontSize: 13, color: '#6B7280' }}>{current?.phone}</div>
                </div>
              </div>

              {/* Message preview */}
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#166534', lineHeight: 1.6, maxHeight: 90, overflowY: 'auto', marginBottom: 14, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {current?.message}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={openWhatsApp}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 16px', background: '#25D366', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  <MessageCircle size={16} /> Open WhatsApp
                </button>
              </div>

              {waOpened && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button onClick={() => advance(true)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', background: '#ECFDF5', color: '#15803D', border: '1.5px solid #86EFAC', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    <CheckCircle size={14} /> Mark Sent &amp; Next
                  </button>
                  <button onClick={() => advance(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 16px', background: '#F9FAFB', color: '#6B7280', border: '1px solid var(--border)', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    <SkipForward size={13} /> Skip
                  </button>
                </div>
              )}
            </div>

            {/* ── Recipient list ── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {recipients.map((r, i) => {
                const isSent = sentIds.has(r.id);
                const isSkipped = skippedIds.has(r.id);
                const isCurrent = i === currentIndex;
                return (
                  <div key={r.id}
                    onClick={() => !isSent && !isSkipped && jumpTo(i)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '9px 22px',
                      background: isCurrent ? '#EFF6FF' : 'transparent',
                      cursor: (!isSent && !isSkipped && !isCurrent) ? 'pointer' : 'default',
                      borderLeft: isCurrent ? '3px solid var(--cyan)' : '3px solid transparent',
                    }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: isSent ? '#DCFCE7' : isSkipped ? '#F3F4F6' : isCurrent ? 'var(--cyan)' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isSent
                        ? <CheckCircle size={14} color="#16A34A" />
                        : isSkipped
                        ? <SkipForward size={12} color="#9CA3AF" />
                        : <span style={{ fontSize: 11, fontWeight: 700, color: isCurrent ? '#fff' : '#6B7280' }}>{i + 1}</span>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? 'var(--navy)' : '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{r.phone}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: isSent ? '#16A34A' : isSkipped ? '#9CA3AF' : isCurrent ? 'var(--cyan)' : '#D1D5DB' }}>
                      {isSent ? 'Sent' : isSkipped ? 'Skipped' : isCurrent ? 'Current' : 'Pending'}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
