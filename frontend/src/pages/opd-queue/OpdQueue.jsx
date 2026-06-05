import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getOpdQueue, getOpdQueueStats, assignOpdToken,
  callOpdToken, startOpdToken, completeOpdToken, skipOpdToken, requeueOpdToken,
  getCustomers, getStaff,
} from '../../api';

const todayISO = () => new Date().toISOString().slice(0, 10);
import { P } from '../../styles/page';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import toast from 'react-hot-toast';
import {
  Hash, User, Stethoscope, CheckCircle2, SkipForward, PhoneCall,
  RotateCcw, Tv2, Clock, Users, Activity, RefreshCw, Plus, ChevronDown,
} from 'lucide-react';

const STATUS_CONFIG = {
  WAITING:         { label: 'Waiting',         bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
  CALLED:          { label: 'Called',           bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  IN_CONSULTATION: { label: 'In Consultation',  bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  COMPLETED:       { label: 'Done',             bg: '#F0FDF4', color: '#166534', dot: '#22C55E' },
  SKIPPED:         { label: 'Skipped',          bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444' },
};

const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
const today   = () => new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 120 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', fontFamily: 'var(--font-display)' }}>{value}</div>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{label}</div>
      </div>
    </div>
  );
}

function TokenRow({ token, onAction, loading }) {
  const cfg = STATUS_CONFIG[token.status] || STATUS_CONFIG.WAITING;
  const isActive = token.status === 'WAITING' || token.status === 'CALLED' || token.status === 'IN_CONSULTATION';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
      background: token.status === 'IN_CONSULTATION' ? '#ECFDF5' : '#fff',
      borderBottom: '1px solid var(--border)',
      opacity: token.status === 'SKIPPED' ? 0.5 : 1,
    }}>
      {/* Token number */}
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: token.status === 'IN_CONSULTATION' ? '#10B981' : 'var(--navy)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: '#fff', flexShrink: 0,
      }}>
        {String(token.tokenNumber).padStart(2, '0')}
      </div>

      {/* Patient info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {token.patientName}
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
          {token.doctorName && <span>Dr. {token.doctorName.replace(/^Dr\.?\s*/i, '')}</span>}
          <span>·</span>
          <span>{fmtTime(token.createdAt)}</span>
          {token.calledAt && <><span>·</span><span>Called {fmtTime(token.calledAt)}</span></>}
        </div>
      </div>

      {/* Status badge */}
      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
        {cfg.label}
      </span>

      {/* Actions */}
      {isActive && (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {token.status === 'WAITING' && (
            <ActionBtn icon={PhoneCall} label="Call" color="#F59E0B" onClick={() => onAction('call', token.id)} disabled={loading} />
          )}
          {token.status === 'CALLED' && (
            <ActionBtn icon={Stethoscope} label="Start" color="#10B981" onClick={() => onAction('start', token.id)} disabled={loading} />
          )}
          {token.status === 'IN_CONSULTATION' && (
            <ActionBtn icon={CheckCircle2} label="Done" color="#059669" onClick={() => onAction('complete', token.id)} disabled={loading} />
          )}
          {(token.status === 'WAITING' || token.status === 'CALLED') && (
            <ActionBtn icon={SkipForward} label="Skip" color="#EF4444" onClick={() => onAction('skip', token.id)} disabled={loading} />
          )}
        </div>
      )}
      {(token.status === 'SKIPPED') && (
        <ActionBtn icon={RotateCcw} label="Re-queue" color="#6B7280" onClick={() => onAction('requeue', token.id)} disabled={loading} />
      )}
    </div>
  );
}

function ActionBtn({ icon: Icon, label, color, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} title={label} style={{
      display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
      border: `1px solid ${color}40`, borderRadius: 8, background: `${color}12`,
      color, fontSize: 11, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1, whiteSpace: 'nowrap',
    }}>
      <Icon size={12} />{label}
    </button>
  );
}

export default function OpdQueue() {
  const { isMobile } = useBreakpoint();
  const navigate = useNavigate();

  // Date filter — defaults to today
  const [queueDate, setQueueDate] = useState(todayISO());
  const isToday = queueDate === todayISO();

  const [queue, setQueue]     = useState([]);
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState(false);

  // Typeahead patient search
  const [patientQuery, setPatientQuery]   = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [showPatientDrop, setShowPatientDrop] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const patientTimer = useRef(null);
  const patientRef   = useRef(null);

  const [doctors,  setDoctors]  = useState([]);
  const [form, setForm] = useState({ patientId: '', walkInName: '', doctorId: '' });
  const [assigning, setAssigning] = useState(false);
  const refreshRef = useRef(null);

  // Close patient dropdown on outside click
  useEffect(() => {
    const h = (e) => { if (patientRef.current && !patientRef.current.contains(e.target)) setShowPatientDrop(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Debounced patient search
  const searchPatients = useCallback((q) => {
    clearTimeout(patientTimer.current);
    if (!q.trim()) { setPatientResults([]); setShowPatientDrop(false); return; }
    patientTimer.current = setTimeout(async () => {
      try {
        const r = await getCustomers({ search: q, limit: 8 });
        setPatientResults(r.data.data || []);
        setShowPatientDrop(true);
      } catch { /* silent */ }
    }, 280);
  }, []);

  const load = useCallback(async () => {
    try {
      const params = isToday ? {} : { date: queueDate };
      const [qRes, sRes] = await Promise.all([
        getOpdQueue(params),
        getOpdQueueStats(),
      ]);
      setQueue(qRes.data.data || []);
      setStats(sRes.data.data || {});
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [queueDate, isToday]);

  useEffect(() => {
    load();
    if (isToday) {
      refreshRef.current = setInterval(load, 30000);
      return () => clearInterval(refreshRef.current);
    }
  }, [load, isToday]);

  useEffect(() => {
    getStaff().then(r => setDoctors(r.data.data || [])).catch(() => {});
  }, []);

  const handleAction = async (action, id) => {
    setActing(true);
    const fns = { call: callOpdToken, start: startOpdToken, complete: completeOpdToken, skip: skipOpdToken, requeue: requeueOpdToken };
    try {
      await fns[action](id);
      await load();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
    finally { setActing(false); }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!form.patientId && !form.walkInName.trim()) {
      return toast.error('Enter patient name or select a registered patient');
    }
    setAssigning(true);
    try {
      const payload = form.patientId
        ? { patientId: form.patientId, doctorId: form.doctorId || undefined }
        : { patientName: form.walkInName.trim(), doctorId: form.doctorId || undefined };
      await assignOpdToken(payload);
      toast.success('Token assigned');
      setForm({ patientId: '', walkInName: '', doctorId: '' });
      setSelectedPatient(null);
      setPatientQuery('');
      await load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to assign token'); }
    finally { setAssigning(false); }
  };

  const activeTokens    = queue.filter(t => ['WAITING', 'CALLED', 'IN_CONSULTATION'].includes(t.status));
  const completedTokens = queue.filter(t => ['COMPLETED', 'SKIPPED'].includes(t.status));
  const inConsultation  = queue.find(t => t.status === 'IN_CONSULTATION');

  return (
    <div style={{ ...P.wrap(isMobile), maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={P.head}>
        <div>
          <h1 style={P.h1(isMobile)}>OPD Queue</h1>
          <p style={P.sub}>{isToday ? today() : `Queue for ${new Date(queueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Date picker */}
          <input
            type="date"
            value={queueDate}
            onChange={e => setQueueDate(e.target.value)}
            style={{ padding: '7px 12px', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 13, background: isToday ? '#fff' : '#FFF7ED', color: isToday ? 'var(--navy)' : '#C2410C', cursor: 'pointer', outline: 'none' }}
          />
          {!isToday && (
            <button onClick={() => setQueueDate(todayISO())}
              style={{ padding: '7px 12px', borderRadius: 9, border: '1.5px solid var(--cyan)', color: 'var(--cyan)', background: 'transparent', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Today
            </button>
          )}
          <button onClick={load} style={{ ...P.btn('ghost'), display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => window.open('/opd-queue/board', '_blank')}
            style={{ ...P.btn('secondary'), display: 'flex', alignItems: 'center', gap: 6 }}>
            <Tv2 size={14} /> TV Board
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {stats && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <StatCard icon={Clock}     label="Waiting"         value={stats.waiting   || 0} color="#3B82F6" />
          <StatCard icon={Activity}  label="In Consultation" value={stats.active    || 0} color="#10B981" />
          <StatCard icon={Users}     label="Served today"    value={stats.completed || 0} color="#059669" />
          <StatCard icon={Hash}      label="Total issued"    value={stats.total     || 0} color="#6B7280" />
          {stats.avgWaitMin > 0 && (
            <StatCard icon={Clock} label="Avg wait (min)" value={stats.avgWaitMin} color="#F59E0B" />
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '300px 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── Left: Token assignment form ── */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', background: 'var(--navy)', color: '#fff' }}>
            <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={16} /> Assign New Token
            </div>
            {stats?.total > 0 && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                Next token: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--cyan)' }}>#{String((stats.total || 0) + 1).padStart(2, '0')}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleAssign} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Patient typeahead */}
            <div ref={patientRef} style={{ position: 'relative' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Patient</div>
              {selectedPatient ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', border: '1.5px solid var(--cyan)', borderRadius: 9, background: '#F0FDFA' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--navy)' }}>{selectedPatient.name}</div>
                    {selectedPatient.phone && <div style={{ fontSize: 11, color: '#6B7280' }}>{selectedPatient.phone}</div>}
                  </div>
                  <button type="button" onClick={() => { setSelectedPatient(null); setForm(f => ({ ...f, patientId: '', walkInName: '' })); setPatientQuery(''); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 16 }}>×</button>
                </div>
              ) : (
                <>
                  <input
                    value={patientQuery}
                    onChange={e => { setPatientQuery(e.target.value); searchPatients(e.target.value); }}
                    onFocus={() => patientResults.length > 0 && setShowPatientDrop(true)}
                    placeholder="Search registered patient…"
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
                  />
                  {showPatientDrop && patientResults.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid var(--border)', borderRadius: 9, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: 200, overflowY: 'auto' }}>
                      {patientResults.map(p => (
                        <div key={p.id}
                          onMouseDown={() => { setSelectedPatient(p); setForm(f => ({ ...f, patientId: p.id, walkInName: '' })); setShowPatientDrop(false); setPatientQuery(''); }}
                          style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 1 }}
                          onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                          onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</span>
                          {p.phone && <span style={{ fontSize: 11, color: '#9CA3AF' }}>{p.phone}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Walk-in name — only shown when no registered patient selected */}
            {!form.patientId && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Walk-in Name <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(if not registered)</span></div>
                <input
                  value={form.walkInName}
                  onChange={e => setForm(f => ({ ...f, walkInName: e.target.value }))}
                  placeholder="Enter patient name"
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
            )}

            {/* Doctor selector */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Assign to Doctor <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional)</span></div>
              <select value={form.doctorId} onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 13, background: '#fff', boxSizing: 'border-box' }}>
                <option value="">— Any Doctor —</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.name}{d.specialization?.length ? ` (${d.specialization[0]})` : ''}</option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={assigning}
              style={{ padding: '11px 0', background: assigning ? '#9CA3AF' : 'var(--navy)', color: '#fff', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: assigning ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Hash size={14} />
              {assigning ? 'Assigning…' : 'Assign Token'}
            </button>
          </form>
        </div>

        {/* ── Right: Live queue ── */}
        <div>
          {/* Active queue */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={15} color="var(--cyan)" /> Active Queue
                <span style={{ background: 'var(--cyan)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 20 }}>{activeTokens.length}</span>
              </div>
              {inConsultation && (
                <div style={{ fontSize: 12, color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                  Token #{String(inConsultation.tokenNumber).padStart(2, '0')} in session
                </div>
              )}
            </div>
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
            {loading
              ? <div style={{ padding: 32, textAlign: 'center', color: '#9CA3AF' }}>Loading queue…</div>
              : activeTokens.length === 0
                ? <div style={{ padding: 32, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No active tokens — assign the first token to start the queue</div>
                : activeTokens.map(t => <TokenRow key={t.id} token={t} onAction={handleAction} loading={acting} />)
            }
          </div>

          {/* Completed today */}
          {completedTokens.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={15} color="#22C55E" /> Completed Today
                  <span style={{ background: '#F0FDF4', color: '#166534', fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 20 }}>{completedTokens.length}</span>
                </div>
              </div>
              {completedTokens.map(t => <TokenRow key={t.id} token={t} onAction={handleAction} loading={acting} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
