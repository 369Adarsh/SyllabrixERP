import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  X, Phone, Mail, Calendar, TrendingUp, Activity, User,
  ChevronDown, ChevronUp, Plus, MessageCircle, Scale,
  Dumbbell, Target, Flame, Clock, Check, AlertTriangle,
  BarChart3, RefreshCw,
} from 'lucide-react';
import {
  getMemberCard, addMemberBodyStats, addMemberTrainerNote,
  logWorkoutSession,
} from '../../api';

// ── Colours (reused from TrainingPlans) ──────────────────────────────────────
const GOAL_COLORS = {
  'Fat Loss':       { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' },
  'Muscle Gain':    { bg: '#EDE9FE', color: '#7C3AED', border: '#DDD6FE' },
  'Endurance':      { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
  'Flexibility':    { bg: '#FDF2F8', color: '#9D174D', border: '#FBCFE8' },
  'General Fitness':{ bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  'Strength':       { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
  'Rehabilitation': { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
};
const LEVEL_COLORS = {
  Beginner:     { bg: '#ECFDF5', color: '#059669' },
  Intermediate: { bg: '#FEF3C7', color: '#D97706' },
  Advanced:     { bg: '#FEF2F2', color: '#DC2626' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const Pill = ({ label, bg, color, border }) => (
  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
    background: bg || '#F3F4F6', color: color || '#374151',
    border: `1px solid ${border || bg || '#E5E7EB'}` }}>{label}</span>
);

const avatarGradient = (name = '') => {
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return `linear-gradient(135deg,hsl(${h},60%,38%),hsl(${(h+40)%360},70%,50%))`;
};

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtShort = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

// Compute BMI
const calcBMI = (weightKg, heightCm) => {
  if (!weightKg || !heightCm) return null;
  return (weightKg / Math.pow(heightCm / 100, 2)).toFixed(1);
};

// Map JS getDay() (0=Sun) to Mon=1…Sun=7
const todayDayNumber = () => ((new Date().getDay() + 6) % 7) + 1;

// Build last-N-days heatmap data from sessions array
const buildHeatmap = (sessions, days = 84) => {
  const map = {};
  for (const s of sessions) {
    const key = new Date(s.date).toISOString().slice(0, 10);
    map[key] = s.completed ? 'done' : 'missed';
  }
  const cells = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    cells.push({ date: d, key, status: map[key] || null });
  }
  return cells;
};

// Build this-week array (Mon=0 … Sun=6)
const buildThisWeek = (sessions, template) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay(); // 0=Sun
  const monday = new Date(today); monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  const sessionMap = {};
  for (const s of sessions) {
    const key = new Date(s.date).toISOString().slice(0, 10);
    if (!sessionMap[key] || s.completed) sessionMap[key] = s;
  }
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    const dayNum = i + 1; // 1=Mon…7=Sun
    const key = d.toISOString().slice(0, 10);
    const session = sessionMap[key] || null;
    const templateDay = template?.days?.find(td => td.dayNumber === dayNum) || null;
    const isToday = d.getTime() === today.getTime();
    const isPast = d < today;
    days.push({ date: d, key, dayNum, session, templateDay, isToday, isPast });
  }
  return days;
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── Quick Log Session Modal ───────────────────────────────────────────────────
function QuickLogModal({ plan, dayNumber, onClose, onLogged }) {
  const [form, setForm] = useState({ dayNumber: dayNumber || 1, completed: true, duration: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await logWorkoutSession(plan.id, {
        dayNumber: Number(form.dayNumber),
        completed: form.completed,
        duration: form.duration ? Number(form.duration) : null,
        notes: form.notes || null,
        date: new Date().toISOString(),
      });
      toast.success('Session logged!');
      onLogged();
    } catch { toast.error('Failed to log session'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 380,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', padding: '16px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>Log Today's Session</div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
            padding: 6, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}><X size={14} /></button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Day Number</div>
              <input type="number" min={1} max={7} value={form.dayNumber} onChange={set('dayNumber')}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 9, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Duration (min)</div>
              <input type="number" placeholder="45" value={form.duration} onChange={set('duration')}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 9, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151' }}>
            <input type="checkbox" checked={form.completed} onChange={set('completed')} style={{ width: 16, height: 16, accentColor: '#059669' }} />
            Mark as Completed
          </label>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Notes</div>
            <textarea value={form.notes} onChange={set('notes')} placeholder="How did the session go?" rows={2}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 9, fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 9, border: '1.5px solid #E5E7EB',
              background: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', color: '#374151' }}>Cancel</button>
            <button onClick={handleSave} disabled={saving}
              style={{ flex: 2, padding: '10px', borderRadius: 9, border: 'none',
                background: 'linear-gradient(135deg,#065F46,#059669)', color: '#fff',
                fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Logging…' : '✓ Log Session'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MemberExerciseCard({ memberId, memberName, currentUser, onClose }) {
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [rightTab, setRightTab]   = useState('week');
  const [expandSession, setExpandSession] = useState(null);
  const [showLogStats, setShowLogStats]   = useState(false);
  const [statsForm, setStatsForm]  = useState({ weight: '', height: '', bodyFat: '', chest: '', waist: '', hips: '', notes: '' });
  const [savingStats, setSavingStats]   = useState(false);
  const [noteText, setNoteText]    = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [showQuickLog, setShowQuickLog] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getMemberCard(memberId);
      setData(r.data.data);
    } catch { toast.error('Failed to load member data'); }
    finally { setLoading(false); }
  }, [memberId]);

  useEffect(() => { load(); }, [load]);

  const activePlan = data?.plans?.find(p => p.status === 'ACTIVE') || data?.plans?.[0] || null;
  const allSessions = activePlan?.sessions || [];
  const latestStats = data?.bodyStats?.length ? data.bodyStats[data.bodyStats.length - 1] : null;
  const bmi = calcBMI(latestStats?.weight, latestStats?.height);
  const thisWeek = activePlan ? buildThisWeek(allSessions, activePlan.template) : [];
  const heatmap  = buildHeatmap(allSessions, 84);

  // Heatmap grouped into 12 weeks
  const heatmapWeeks = [];
  for (let i = 0; i < 12; i++) heatmapWeeks.push(heatmap.slice(i * 7, i * 7 + 7));

  // Plan progress
  const planWeek = activePlan
    ? Math.floor((Date.now() - new Date(activePlan.startDate).getTime()) / (7 * 86400000)) + 1 : 0;
  const planWeekCapped = Math.min(planWeek, activePlan?.template?.durationWeeks || 1);
  const planProgress = activePlan?.template?.durationWeeks
    ? Math.round(planWeekCapped / activePlan.template.durationWeeks * 100) : 0;

  const handleAddStats = async () => {
    const payload = Object.fromEntries(
      Object.entries(statsForm).filter(([, v]) => v !== '').map(([k, v]) => [k, k === 'notes' ? v : parseFloat(v)])
    );
    if (!Object.keys(payload).length) return toast.error('Enter at least one measurement');
    payload.memberId = memberId;
    setSavingStats(true);
    try {
      await addMemberBodyStats(payload);
      toast.success('Stats logged!');
      setStatsForm({ weight: '', height: '', bodyFat: '', chest: '', waist: '', hips: '', notes: '' });
      setShowLogStats(false);
      load();
    } catch { toast.error('Failed'); }
    finally { setSavingStats(false); }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      await addMemberTrainerNote({
        memberId,
        trainerId: currentUser?.staffId || currentUser?.id,
        content: noteText.trim(),
      });
      setNoteText('');
      load();
      toast.success('Note added');
    } catch { toast.error('Failed'); }
    finally { setSavingNote(false); }
  };

  const todayNum = todayDayNumber();
  const todaysTemplateDay = activePlan?.template?.days?.find(d => d.dayNumber === todayNum) || null;
  const isRestDay = !todaysTemplateDay || todaysTemplateDay.isRestDay;

  const heatColor = (status) => {
    if (status === 'done')   return '#16a34a';
    if (status === 'missed') return '#fca5a5';
    return '#e5e7eb';
  };

  const RIGHT_TABS = [
    { key: 'week', label: 'This Week' },
    { key: 'heatmap', label: '12-Week History' },
    { key: 'sessions', label: 'All Sessions' },
  ];

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 900,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
        <div style={{ background: '#fff', borderRadius: 22, width: '100%', maxWidth: 1060,
          maxHeight: '93vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 32px 100px rgba(0,0,0,0.4)' }}>

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div style={{ background: 'linear-gradient(135deg,#0f1e36,#1e3a5f)', padding: '18px 24px',
            display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: avatarGradient(memberName),
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              fontWeight: 900, color: '#fff', flexShrink: 0, border: '2px solid rgba(255,255,255,0.2)' }}>
              {memberName?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: '#fff' }}>
                {memberName}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                {activePlan?.template?.goal && (
                  <Pill label={activePlan.template.goal} {...(GOAL_COLORS[activePlan.template.goal] || {})} />
                )}
                {activePlan?.template?.level && (
                  <Pill label={activePlan.template.level} {...(LEVEL_COLORS[activePlan.template.level] || {})} />
                )}
                {activePlan && (
                  <Pill label={activePlan.status} bg="#ECFDF5" color="#059669" />
                )}
              </div>
            </div>
            <button onClick={load} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 9,
              padding: 8, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}>
              <RefreshCw size={14} />
            </button>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 9,
              padding: 8, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}>
              <X size={16} />
            </button>
          </div>

          {/* ── Body ────────────────────────────────────────────────────── */}
          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, color: '#9CA3AF' }}>Loading training profile…</div>
          ) : !data ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, color: '#9CA3AF' }}>No data found</div>
          ) : (
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

              {/* ── LEFT SIDEBAR ─────────────────────────────────────── */}
              <div style={{ width: 268, flexShrink: 0, borderRight: '1px solid #F3F4F6',
                overflowY: 'auto', background: '#FAFAFA', display: 'flex', flexDirection: 'column' }}>

                {/* Contact */}
                <div style={{ padding: '16px 18px', borderBottom: '1px solid #F0F0F0' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase',
                    letterSpacing: '0.08em', marginBottom: 10 }}>Member Info</div>
                  {data.member?.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Phone size={12} color="#6B7280" />
                      <span style={{ fontSize: 12, color: '#374151' }}>{data.member.phone}</span>
                    </div>
                  )}
                  {data.member?.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Mail size={12} color="#6B7280" />
                      <span style={{ fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.member.email}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Calendar size={12} color="#6B7280" />
                    <span style={{ fontSize: 12, color: '#374151' }}>Since {fmtDate(data.member?.createdAt)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Activity size={12} color="#6B7280" />
                    <span style={{ fontSize: 12, color: '#374151' }}>{data.member?.visitCount || 0} visits · ₹{(data.member?.totalSpent || 0).toLocaleString('en-IN')} spent</span>
                  </div>
                </div>

                {/* Body Stats */}
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #F0F0F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Body Stats</div>
                    <button onClick={() => setShowLogStats(s => !s)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700,
                        color: '#7C3AED', background: '#EDE9FE', border: 'none', borderRadius: 7,
                        padding: '3px 8px', cursor: 'pointer' }}>
                      <Plus size={10} /> Log
                    </button>
                  </div>

                  {latestStats ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      {[
                        { label: 'Weight', value: latestStats.weight ? `${latestStats.weight} kg` : '—' },
                        { label: 'Height', value: latestStats.height ? `${latestStats.height} cm` : '—' },
                        { label: 'BMI', value: bmi ? bmi : '—' },
                        { label: 'Body Fat', value: latestStats.bodyFat ? `${latestStats.bodyFat}%` : '—' },
                        { label: 'Chest', value: latestStats.chest ? `${latestStats.chest} cm` : '—' },
                        { label: 'Waist', value: latestStats.waist ? `${latestStats.waist} cm` : '—' },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ background: '#fff', borderRadius: 8, padding: '7px 10px',
                          border: '1px solid #E5E7EB' }}>
                          <div style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', marginTop: 1 }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', padding: '12px 0' }}>
                      No measurements logged yet
                    </div>
                  )}

                  {/* Weight trend (last 6) */}
                  {data.bodyStats?.length >= 2 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', marginBottom: 5 }}>Weight Trend</div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 32 }}>
                        {data.bodyStats.slice(-6).map((s, i) => {
                          const weights = data.bodyStats.slice(-6).map(x => x.weight).filter(Boolean);
                          const min = Math.min(...weights); const max = Math.max(...weights);
                          const pct = max > min ? ((s.weight - min) / (max - min)) : 0.5;
                          return s.weight ? (
                            <div key={i} title={`${s.weight}kg · ${fmtShort(s.recordedAt)}`}
                              style={{ flex: 1, background: '#7C3AED', borderRadius: 3,
                                height: `${Math.max(4, Math.round(pct * 28) + 4)}px`,
                                opacity: 0.6 + i * 0.07 }} />
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Log stats inline form */}
                  {showLogStats && (
                    <div style={{ marginTop: 12, background: '#fff', borderRadius: 10, padding: 12,
                      border: '1px solid #E5E7EB' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 8 }}>Log Measurements</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {[
                          { key: 'weight', placeholder: 'Weight (kg)' },
                          { key: 'height', placeholder: 'Height (cm)' },
                          { key: 'bodyFat', placeholder: 'Body Fat %' },
                          { key: 'chest',   placeholder: 'Chest (cm)' },
                          { key: 'waist',   placeholder: 'Waist (cm)' },
                          { key: 'hips',    placeholder: 'Hips (cm)' },
                        ].map(f => (
                          <input key={f.key} type="number" placeholder={f.placeholder} value={statsForm[f.key]}
                            onChange={e => setStatsForm(s => ({ ...s, [f.key]: e.target.value }))}
                            style={{ padding: '7px 9px', border: '1.5px solid #E5E7EB', borderRadius: 8,
                              fontSize: 11, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                        ))}
                      </div>
                      <input placeholder="Notes" value={statsForm.notes}
                        onChange={e => setStatsForm(s => ({ ...s, notes: e.target.value }))}
                        style={{ width: '100%', marginTop: 6, padding: '7px 9px', border: '1.5px solid #E5E7EB',
                          borderRadius: 8, fontSize: 11, outline: 'none', boxSizing: 'border-box' }} />
                      <button onClick={handleAddStats} disabled={savingStats}
                        style={{ width: '100%', marginTop: 8, padding: '8px', borderRadius: 8, border: 'none',
                          background: '#7C3AED', color: '#fff', fontWeight: 700, fontSize: 11, cursor: 'pointer',
                          opacity: savingStats ? 0.7 : 1 }}>
                        {savingStats ? 'Saving…' : 'Save Stats'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Plan Progress */}
                {activePlan && (
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid #F0F0F0' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase',
                      letterSpacing: '0.08em', marginBottom: 10 }}>Plan Progress</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 4, overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activePlan.template?.name}</div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 8 }}>
                      Week {planWeekCapped} of {activePlan.template?.durationWeeks} · {activePlan.template?.daysPerWeek}×/week
                    </div>
                    <div style={{ background: '#E5E7EB', borderRadius: 6, height: 7, overflow: 'hidden', marginBottom: 6 }}>
                      <div style={{ height: '100%', borderRadius: 6,
                        background: 'linear-gradient(90deg,#059669,#10B981)', width: `${planProgress}%`,
                        transition: 'width 0.4s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9CA3AF' }}>
                      <span>{planProgress}% complete</span>
                      <span>Started {fmtShort(activePlan.startDate)}</span>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: '#6B7280' }}>
                      {allSessions.filter(s => s.completed).length} sessions completed · {allSessions.length} total
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 4 }}>Assigned Trainer</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%',
                          background: avatarGradient(activePlan.trainer?.name || ''),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 800, color: '#fff' }}>
                          {activePlan.trainer?.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>{activePlan.trainer?.name}</div>
                          {activePlan.trainer?.specialization?.length > 0 && (
                            <div style={{ fontSize: 10, color: '#9CA3AF' }}>{activePlan.trainer.specialization.join(', ')}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Trainer Notes */}
                <div style={{ padding: '14px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase',
                    letterSpacing: '0.08em', marginBottom: 10 }}>Trainer Notes</div>

                  {/* Note input */}
                  <div style={{ marginBottom: 12 }}>
                    <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                      placeholder="Add a note for this member…" rows={2}
                      style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB', borderRadius: 9,
                        fontSize: 11, outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 6 }} />
                    <button onClick={handleAddNote} disabled={!noteText.trim() || savingNote}
                      style={{ width: '100%', padding: '7px', borderRadius: 8, border: 'none',
                        background: noteText.trim() ? '#1e3a5f' : '#E5E7EB',
                        color: noteText.trim() ? '#fff' : '#9CA3AF',
                        fontWeight: 700, fontSize: 11, cursor: noteText.trim() ? 'pointer' : 'default',
                        transition: 'all 0.15s' }}>
                      {savingNote ? 'Saving…' : '+ Add Note'}
                    </button>
                  </div>

                  {/* Notes feed */}
                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    {(data.trainerNotes || []).length === 0 ? (
                      <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', paddingTop: 8 }}>No notes yet</div>
                    ) : (data.trainerNotes || []).map(note => (
                      <div key={note.id} style={{ background: '#fff', border: '1px solid #E5E7EB',
                        borderRadius: 10, padding: '9px 11px', marginBottom: 7 }}>
                        <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.4, marginBottom: 5 }}>{note.content}</div>
                        <div style={{ fontSize: 10, color: '#9CA3AF' }}>
                          — {note.trainer?.name || 'Trainer'} · {fmtShort(note.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── RIGHT CONTENT ─────────────────────────────────────── */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

                {/* Right sub-tabs */}
                <div style={{ display: 'flex', gap: 2, padding: '14px 20px 0', borderBottom: '1px solid #F3F4F6',
                  flexShrink: 0, background: '#fff' }}>
                  {RIGHT_TABS.map(({ key, label }) => (
                    <button key={key} onClick={() => setRightTab(key)} style={{
                      padding: '7px 16px', border: 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer',
                      fontSize: 12, fontWeight: 600,
                      background: rightTab === key ? 'var(--navy)' : 'transparent',
                      color: rightTab === key ? '#fff' : '#6B7280',
                      transition: 'all 0.15s',
                    }}>{label}</button>
                  ))}
                  {activePlan && (
                    <button onClick={() => setShowQuickLog(true)}
                      style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', border: 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer',
                        background: '#ECFDF5', color: '#059669', fontWeight: 700, fontSize: 12 }}>
                      <Plus size={12} /> Log Session
                    </button>
                  )}
                </div>

                <div style={{ padding: 20, flex: 1 }}>

                  {/* ── THIS WEEK ──────────────────────────────────────── */}
                  {rightTab === 'week' && (
                    <div>
                      {/* 7-day strip */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8, marginBottom: 24 }}>
                        {thisWeek.map((day, i) => {
                          const isRest = day.templateDay?.isRestDay || !day.templateDay;
                          const done   = day.session?.completed;
                          const missed = day.isPast && !isRest && !done;
                          const bg = day.isToday ? 'var(--navy)' : done ? '#ECFDF5' : missed ? '#FEF2F2' : isRest ? '#F9FAFB' : '#fff';
                          const border = day.isToday ? 'var(--navy)' : done ? '#A7F3D0' : missed ? '#FCA5A5' : '#E5E7EB';
                          const textColor = day.isToday ? '#fff' : 'var(--navy)';
                          return (
                            <div key={day.key} style={{ background: bg, border: `1.5px solid ${border}`,
                              borderRadius: 12, padding: '10px 6px', textAlign: 'center',
                              boxShadow: day.isToday ? '0 4px 16px rgba(30,58,95,0.25)' : 'none' }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: day.isToday ? 'rgba(255,255,255,0.7)' : '#9CA3AF', textTransform: 'uppercase' }}>
                                {DAY_LABELS[i]}
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 800, color: textColor, marginTop: 3 }}>
                                {day.date.getDate()}
                              </div>
                              <div style={{ fontSize: 14, marginTop: 4 }}>
                                {done ? '✅' : missed ? '❌' : isRest ? '😴' : day.isToday ? '🏋️' : '○'}
                              </div>
                              <div style={{ fontSize: 9, color: day.isToday ? 'rgba(255,255,255,0.8)' : '#9CA3AF', marginTop: 3,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {isRest ? 'Rest' : day.templateDay?.label || `Day ${day.dayNum}`}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Today's workout */}
                      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                        <div style={{ padding: '14px 18px', borderBottom: '1px solid #F3F4F6',
                          background: isRestDay ? '#F9FAFB' : 'linear-gradient(90deg,#0f1e36,#1e3a5f)',
                          display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 18 }}>{isRestDay ? '😴' : '🏋️'}</span>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 14,
                              color: isRestDay ? 'var(--navy)' : '#fff' }}>
                              {isRestDay ? 'Rest Day' : `Today — ${todaysTemplateDay?.label || `Day ${todayNum}`}`}
                            </div>
                            {!isRestDay && todaysTemplateDay?.exercises?.length > 0 && (
                              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                                {todaysTemplateDay.exercises.length} exercises
                              </div>
                            )}
                          </div>
                        </div>
                        {!isRestDay && todaysTemplateDay?.exercises?.length > 0 ? (
                          <div style={{ padding: '12px 18px' }}>
                            {todaysTemplateDay.exercises.map((ex, idx) => (
                              <div key={ex.id} style={{ display: 'flex', alignItems: 'center', gap: 12,
                                padding: '10px 0', borderBottom: idx < todaysTemplateDay.exercises.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EFF6FF',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 12, fontWeight: 800, color: 'var(--navy)', flexShrink: 0 }}>
                                  {idx + 1}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>
                                    {ex.exercise?.name}
                                  </div>
                                  <div style={{ fontSize: 11, color: '#6B7280' }}>
                                    {ex.exercise?.muscleGroup} · {ex.exercise?.category}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                  {ex.sets && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: '#EFF6FF', color: '#1D4ED8' }}>{ex.sets} sets</span>}
                                  {ex.reps && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: '#F0FDF4', color: '#059669' }}>{ex.reps} reps</span>}
                                  {ex.duration && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: '#FFF7ED', color: '#C2410C' }}>{ex.duration}s</span>}
                                  {ex.weight && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: '#EDE9FE', color: '#7C3AED' }}>{ex.weight}kg</span>}
                                  {ex.restSeconds && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: '#F3F4F6', color: '#6B7280' }}>{ex.restSeconds}s rest</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : !isRestDay ? (
                          <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>
                            No exercises configured for today — add them in the program builder
                          </div>
                        ) : (
                          <div style={{ padding: '16px 18px', fontSize: 12, color: '#6B7280' }}>
                            Recovery day. Encourage stretching or light walking.
                          </div>
                        )}
                      </div>

                      {/* All plan days summary */}
                      {activePlan?.template?.days?.length > 0 && (
                        <div style={{ marginTop: 20 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>
                            Full Week Schedule
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
                            {activePlan.template.days.map(day => (
                              <div key={day.id} style={{ background: day.isRestDay ? '#F9FAFB' : '#fff',
                                border: `1px solid ${day.isRestDay ? '#E5E7EB' : '#BFDBFE'}`,
                                borderRadius: 12, padding: '12px 14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                  <span style={{ fontSize: 14 }}>{day.isRestDay ? '😴' : '🏋️'}</span>
                                  <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--navy)' }}>
                                    {DAY_LABELS[day.dayNumber - 1]} — {day.label || (day.isRestDay ? 'Rest Day' : `Day ${day.dayNumber}`)}
                                  </div>
                                </div>
                                {!day.isRestDay && day.exercises?.length > 0 && (
                                  <div>
                                    {day.exercises.slice(0, 4).map(ex => (
                                      <div key={ex.id} style={{ fontSize: 11, color: '#6B7280', marginBottom: 2,
                                        display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#93C5FD', flexShrink: 0 }} />
                                        {ex.exercise?.name}
                                        {ex.sets && ex.reps && <span style={{ color: '#9CA3AF' }}>{ex.sets}×{ex.reps}</span>}
                                      </div>
                                    ))}
                                    {day.exercises.length > 4 && (
                                      <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>+{day.exercises.length - 4} more</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── 12-WEEK HEATMAP ───────────────────────────────── */}
                  {rightTab === 'heatmap' && (
                    <div>
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>12-Week Activity</div>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>
                          Session completion over the last 84 days
                        </div>
                      </div>

                      {/* Week labels + grid */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {/* Day headers */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
                          {DAY_LABELS.map(d => (
                            <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700,
                              color: '#9CA3AF', textTransform: 'uppercase' }}>{d}</div>
                          ))}
                        </div>
                        {heatmapWeeks.map((week, wi) => (
                          <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
                            {week.map(cell => {
                              const isFuture = cell.date > new Date();
                              return (
                                <div key={cell.key} title={`${cell.key}: ${cell.status || 'no session'}`}
                                  style={{ height: 28, borderRadius: 6, cursor: 'default',
                                    background: isFuture ? '#F9FAFB' : heatColor(cell.status),
                                    border: '1px solid rgba(0,0,0,0.05)',
                                    transition: 'transform 0.1s',
                                    position: 'relative',
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                                  {cell.status === 'done' && (
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex',
                                      alignItems: 'center', justifyContent: 'center' }}>
                                      <Check size={10} color="#fff" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>

                      {/* Legend */}
                      <div style={{ display: 'flex', gap: 16, marginTop: 16, alignItems: 'center' }}>
                        {[
                          { color: '#16a34a', label: 'Completed' },
                          { color: '#fca5a5', label: 'Missed' },
                          { color: '#e5e7eb', label: 'No session' },
                          { color: '#F9FAFB', label: 'Future' },
                        ].map(({ color, label }) => (
                          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 12, height: 12, borderRadius: 3, background: color, border: '1px solid rgba(0,0,0,0.08)' }} />
                            <span style={{ fontSize: 10, color: '#6B7280' }}>{label}</span>
                          </div>
                        ))}
                      </div>

                      {/* Summary stats */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 20 }}>
                        {[
                          { label: 'Total Completed', value: heatmap.filter(c => c.status === 'done').length, color: '#059669', bg: '#ECFDF5' },
                          { label: 'Missed Sessions', value: heatmap.filter(c => c.status === 'missed').length, color: '#DC2626', bg: '#FEF2F2' },
                          { label: 'Completion Rate', value: `${Math.round(heatmap.filter(c => c.status !== null).length > 0 ? heatmap.filter(c => c.status === 'done').length / heatmap.filter(c => c.status !== null).length * 100 : 0)}%`, color: '#7C3AED', bg: '#EDE9FE' },
                        ].map(({ label, value, color, bg }) => (
                          <div key={label} style={{ background: bg, borderRadius: 12, padding: '14px 16px', border: `1px solid ${color}30` }}>
                            <div style={{ fontSize: 22, fontWeight: 900, color, fontFamily: 'var(--font-mono)' }}>{value}</div>
                            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── ALL SESSIONS ──────────────────────────────────── */}
                  {rightTab === 'sessions' && (
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', marginBottom: 16 }}>
                        Session History ({allSessions.length})
                      </div>
                      {allSessions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
                          <Activity size={32} color="#E5E7EB" style={{ display: 'block', margin: '0 auto 10px' }} />
                          No sessions logged yet
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {allSessions.map(s => {
                            const isExpanded = expandSession === s.id;
                            const dayInfo = activePlan?.template?.days?.find(d => d.dayNumber === s.dayNumber);
                            return (
                              <div key={s.id} style={{ background: '#fff', borderRadius: 14,
                                border: `1px solid ${s.completed ? '#A7F3D0' : '#FCA5A5'}`,
                                overflow: 'hidden' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                                  cursor: s.logs?.length ? 'pointer' : 'default' }}
                                  onClick={() => s.logs?.length && setExpandSession(isExpanded ? null : s.id)}>
                                  <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                    background: s.completed ? '#ECFDF5' : '#FEF2F2',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                                    {s.completed ? '✅' : '❌'}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>
                                      {dayInfo?.label || `Day ${s.dayNumber}`}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#6B7280' }}>
                                      {fmtDate(s.date)}
                                      {s.duration && ` · ${s.duration} min`}
                                      {s.logs?.length > 0 && ` · ${s.logs.length} exercises logged`}
                                    </div>
                                  </div>
                                  {s.logs?.length > 0 && (
                                    <div style={{ color: '#9CA3AF' }}>
                                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </div>
                                  )}
                                </div>
                                {isExpanded && s.logs?.length > 0 && (
                                  <div style={{ padding: '0 16px 12px', borderTop: '1px solid #F3F4F6' }}>
                                    {s.logs.map(log => (
                                      <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '7px 0', borderBottom: '1px solid #F9FAFB' }}>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--navy)', flex: 1 }}>
                                          Exercise #{log.exerciseId?.slice(-4) || '?'}
                                        </div>
                                        {log.sets && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 5, background: '#EFF6FF', color: '#1D4ED8' }}>{log.sets}×{log.reps}</span>}
                                        {log.weight && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 5, background: '#EDE9FE', color: '#7C3AED' }}>{log.weight}kg</span>}
                                        {log.notes && <span style={{ fontSize: 10, color: '#6B7280', fontStyle: 'italic' }}>{log.notes}</span>}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {s.notes && (
                                  <div style={{ padding: '6px 16px 10px', fontSize: 11, color: '#6B7280', fontStyle: 'italic',
                                    borderTop: '1px solid #F9FAFB' }}>"{s.notes}"</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showQuickLog && activePlan && (
        <QuickLogModal
          plan={activePlan}
          dayNumber={todayNum}
          onClose={() => setShowQuickLog(false)}
          onLogged={() => { setShowQuickLog(false); load(); }}
        />
      )}
    </>
  );
}
