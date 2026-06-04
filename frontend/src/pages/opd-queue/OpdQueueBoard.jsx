import { useState, useEffect, useCallback } from 'react';
import { getOpdQueue, getOpdQueueStats } from '../../api';
import { useAuth } from '../../context/AuthContext';

const fmtTime = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
const fmtDate = () => new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
const pad = (n) => String(n).padStart(2, '0');

export default function OpdQueueBoard() {
  const { tenant } = useAuth();
  const [queue, setQueue]   = useState([]);
  const [stats, setStats]   = useState(null);
  const [clock, setClock]   = useState(fmtTime());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [qRes, sRes] = await Promise.all([getOpdQueue(), getOpdQueueStats()]);
      setQueue(qRes.data.data || []);
      setStats(sRes.data.data || {});
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Refresh queue every 20 seconds
  useEffect(() => {
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, [load]);

  // Clock tick every second
  useEffect(() => {
    const id = setInterval(() => setClock(fmtTime()), 1000);
    return () => clearInterval(id);
  }, []);

  const inConsultation = queue.find(t => t.status === 'IN_CONSULTATION');
  const called         = queue.find(t => t.status === 'CALLED');
  const waiting        = queue.filter(t => t.status === 'WAITING').slice(0, 5);
  const currentServing = inConsultation || called;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--navy)',
      color: '#fff', display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--font-body)', overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20 }}>
            +
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.01em' }}>{tenant?.name || 'OPD Queue'}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>{fmtDate()}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 700, color: 'var(--cyan)', letterSpacing: '0.05em' }}>{clock}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Auto-refreshes every 20s</div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 60px', gap: 40 }}>

        {loading ? (
          <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.4)' }}>Loading queue…</div>
        ) : (
          <>
            {/* NOW SERVING */}
            <div style={{ textAlign: 'center', width: '100%', maxWidth: 700 }}>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 16 }}>
                Now Serving
              </div>

              {currentServing ? (
                <div style={{
                  background: 'linear-gradient(135deg, var(--cyan) 0%, #0E9F6E 100%)',
                  borderRadius: 24, padding: '40px 60px',
                  boxShadow: '0 20px 60px rgba(23,185,208,0.3)',
                }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 100, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em', color: '#fff' }}>
                    {pad(currentServing.tokenNumber)}
                  </div>
                  <div style={{ marginTop: 12, fontSize: 22, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                    {currentServing.patientName}
                  </div>
                  {currentServing.doctorName && (
                    <div style={{ marginTop: 6, fontSize: 16, color: 'rgba(255,255,255,0.65)' }}>
                      Dr. {currentServing.doctorName.replace(/^Dr\.?\s*/i, '')}
                    </div>
                  )}
                  <div style={{ marginTop: 10, display: 'inline-block', background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '4px 16px', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {currentServing.status === 'IN_CONSULTATION' ? 'In Consultation' : 'Please Proceed'}
                  </div>
                </div>
              ) : (
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 24, padding: '60px', border: '2px dashed rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.3)' }}>No active consultation</div>
                  {waiting.length > 0 && <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)', marginTop: 8 }}>Patients waiting in queue</div>}
                </div>
              )}
            </div>

            {/* NEXT UP */}
            {waiting.length > 0 && (
              <div style={{ width: '100%', maxWidth: 700 }}>
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 14, textAlign: 'center' }}>
                  Next in Queue
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {waiting.map((t, i) => (
                    <div key={t.id} style={{
                      background: i === 0 ? 'rgba(23,185,208,0.15)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${i === 0 ? 'rgba(23,185,208,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 16, padding: '16px 24px', textAlign: 'center', minWidth: 110,
                    }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 800, color: i === 0 ? 'var(--cyan)' : 'rgba(255,255,255,0.5)' }}>
                        {pad(t.tokenNumber)}
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.patientName.split(' ')[0]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom stats bar */}
      <div style={{ padding: '16px 40px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'center', gap: 48 }}>
        {[
          { label: 'Waiting',   value: stats?.waiting   || 0, color: '#60A5FA' },
          { label: 'Serving',   value: stats?.active    || 0, color: '#34D399' },
          { label: 'Completed', value: stats?.completed || 0, color: '#9CA3AF' },
          { label: 'Total',     value: stats?.total     || 0, color: '#6B7280' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
