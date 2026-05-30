import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1' });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem('syllabrix_token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

const fmt = (n) => new Intl.NumberFormat('en-IN').format(n ?? 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

const S = {
  page:    { padding: 28, maxWidth: 1000, margin: '0 auto' },
  h1:      { fontSize: 22, fontWeight: 700, color: 'var(--navy)', marginBottom: 4, fontFamily: 'var(--font-display)' },
  sub:     { fontSize: 13, color: '#6B7280', marginBottom: 28 },
  grid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 },
  card:    { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 22 },
  cardH:   { fontSize: 14, fontWeight: 700, color: 'var(--navy)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 },
  row:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F3F4F6' },
  label:   { fontSize: 13, color: '#374151', fontWeight: 500 },
  meta:    { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  toggle:  (on) => ({
    width: 40, height: 22, borderRadius: 11, background: on ? 'var(--cyan)' : '#D1D5DB',
    position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
  }),
  thumb:   (on) => ({
    position: 'absolute', top: 2, left: on ? 20 : 2, width: 18, height: 18,
    borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  }),
  badge:   (c) => ({ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: `${c}18`, color: c }),
  btn:     (v) => ({
    padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
    ...(v === 'primary' && { background: 'var(--cyan)', color: '#fff' }),
    ...(v === 'ghost'   && { background: '#F3F4F6', color: '#374151' }),
    ...(v === 'danger'  && { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }),
  }),
  input: { padding: '7px 10px', border: '1px solid #D1D5DB', borderRadius: 7, fontSize: 13, width: 80, textAlign: 'center', outline: 'none' },
  previewBox: { background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: 16, marginTop: 16, fontSize: 13, color: '#166534', whiteSpace: 'pre-wrap', fontFamily: 'monospace', lineHeight: 1.6 },
};

function Toggle({ on, onChange }) {
  return (
    <div style={S.toggle(on)} onClick={() => onChange(!on)}>
      <div style={S.thumb(on)} />
    </div>
  );
}

export default function Automation() {
  const { user } = useAuth();
  const isOwner = user?.role === 'OWNER';
  const isAdmin = ['OWNER', 'ADMIN'].includes(user?.role);

  const [config, setConfig]           = useState(null);
  const [pending, setPending]         = useState(null);
  const [summary, setSummary]         = useState(null);
  const [preview, setPreview]         = useState(null);
  const [loadingCfg, setLoadingCfg]   = useState(true);
  const [saving, setSaving]           = useState(false);
  const [sending, setSending]         = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [threshold, setThreshold]     = useState(5);

  const loadAll = useCallback(async () => {
    setLoadingCfg(true);
    try {
      const [cfgRes, pendRes, sumRes] = await Promise.all([
        api.get('/automation/config'),
        api.get('/automation/pending-actions'),
        api.get('/automation/daily-summary'),
      ]);
      const cfg = cfgRes.data.data || {};
      setConfig(cfg);
      setThreshold(cfg.lowStockThreshold ?? 5);
      setPending(pendRes.data.data);
      setSummary(sumRes.data.data);
    } catch { toast.error('Failed to load automation data'); }
    finally { setLoadingCfg(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const saveConfig = async (patch) => {
    const next = { ...config, ...patch };
    setSaving(true);
    try {
      const r = await api.put('/automation/config', next);
      setConfig(r.data.data);
      toast.success('Automation settings saved');
    } catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  const loadPreview = async () => {
    setLoadingPreview(true);
    setPreview(null);
    try {
      const r = await api.get('/automation/digest-preview');
      setPreview(r.data.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Preview unavailable');
    } finally { setLoadingPreview(false); }
  };

  const sendDigest = async () => {
    setSending(true);
    try {
      await api.post('/automation/send-digest');
      toast.success('Daily digest sent!');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to send digest');
    } finally { setSending(false); }
  };

  if (loadingCfg) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
      Loading automation settings…
    </div>
  );

  const cfg = config || {};
  const p = pending || {};

  return (
    <div style={S.page}>
      <h1 style={S.h1}>Automation</h1>
      <p style={S.sub}>Configure automatic reminders, alerts, and digest emails for your business.</p>

      {/* Today's Snapshot */}
      {summary && (
        <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: "Today's Revenue", value: `₹${fmt(summary.totalSales)}`, color: '#059669' },
            { label: "Today's Expenses", value: `₹${fmt(summary.totalExp)}`, color: '#DC2626' },
            { label: 'Net Today', value: `₹${fmt(summary.net)}`, color: summary.net >= 0 ? '#059669' : '#DC2626' },
            { label: 'Bills Raised', value: summary.bills, color: '#1FB8D6' },
          ].map((s) => (
            <div key={s.label} style={{ flex: 1, minWidth: 140, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '14px 18px' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={S.grid}>
        {/* Automation Toggles */}
        <div style={S.card}>
          <div style={S.cardH}><span>⚡</span> Automation Rules</div>

          {[
            { key: 'dailyDigest', label: 'Daily Digest Email', meta: 'Morning summary of sales, expenses, and alerts sent to your WhatsApp' },
            { key: 'birthdayWishes', label: 'Birthday Wishes', meta: 'Auto-send birthday greetings to customers on their birthday' },
            { key: 'paymentReminders', label: 'Payment Reminders', meta: 'Remind customers about overdue invoices via WhatsApp' },
            { key: 'lowStockAlerts', label: 'Low Stock Alerts', meta: 'Alert when product stock falls below threshold' },
          ].map((item) => (
            <div key={item.key} style={S.row}>
              <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
                <div style={S.label}>{item.label}</div>
                <div style={S.meta}>{item.meta}</div>
              </div>
              <Toggle on={!!cfg[item.key]} onChange={(v) => isAdmin && saveConfig({ [item.key]: v })} />
            </div>
          ))}

          <div style={{ ...S.row, borderBottom: 'none', marginTop: 4 }}>
            <div>
              <div style={S.label}>Low Stock Threshold</div>
              <div style={S.meta}>Alert when stock ≤ this number</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number" min={1} max={100}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                style={S.input}
              />
              <button
                style={S.btn('ghost')}
                disabled={saving || !isAdmin}
                onClick={() => saveConfig({ lowStockThreshold: threshold })}
              >
                {saving ? '…' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        {/* Daily Digest */}
        <div style={S.card}>
          <div style={S.cardH}><span>📧</span> Daily Digest</div>
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16, lineHeight: 1.6 }}>
            The daily digest sends a WhatsApp message to your registered business phone with yesterday's summary — sales, expenses, pending fees, and more.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button style={S.btn('ghost')} onClick={loadPreview} disabled={loadingPreview}>
              {loadingPreview ? 'Loading…' : '👁 Preview Message'}
            </button>
            {isOwner && (
              <button style={S.btn('primary')} onClick={sendDigest} disabled={sending}>
                {sending ? 'Sending…' : '📤 Send Now'}
              </button>
            )}
          </div>
          {preview && (
            <div style={S.previewBox}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', marginBottom: 8, fontFamily: 'var(--font-body)' }}>
                To: +91 {preview.phone} (WhatsApp)
              </div>
              {preview.message}
            </div>
          )}
        </div>
      </div>

      {/* Pending Actions */}
      <div style={S.card}>
        <div style={S.cardH}><span>🔔</span> Pending Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>

          {/* Overdue Fees */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Overdue / Due Fees ({(p.fees || []).length})
            </div>
            {(p.fees || []).length === 0
              ? <div style={{ fontSize: 13, color: '#9CA3AF' }}>All clear</div>
              : (p.fees || []).slice(0, 5).map((f) => (
                <div key={f.id} style={{ padding: '6px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{f.student?.name || '—'}</div>
                  <div style={{ fontSize: 12, color: '#DC2626' }}>₹{fmt(f.amount)} due {fmtDate(f.dueDate)}</div>
                </div>
              ))
            }
          </div>

          {/* Today's Appointments */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Today's Appointments ({(p.appointments || []).length})
            </div>
            {(p.appointments || []).length === 0
              ? <div style={{ fontSize: 13, color: '#9CA3AF' }}>No appointments today</div>
              : (p.appointments || []).slice(0, 5).map((a) => (
                <div key={a.id} style={{ padding: '6px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{a.customer?.name || '—'}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{a.service?.name} · {fmtTime(a.startTime)}</div>
                </div>
              ))
            }
          </div>

          {/* Low Stock */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Low Stock ({(p.lowStock || []).length})
            </div>
            {(p.lowStock || []).length === 0
              ? <div style={{ fontSize: 13, color: '#9CA3AF' }}>Stock levels OK</div>
              : (p.lowStock || []).slice(0, 5).map((pr) => (
                <div key={pr.id} style={{ padding: '6px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{pr.name}</div>
                  <div style={{ fontSize: 12, color: '#D97706' }}>Only {pr.stock} left</div>
                </div>
              ))
            }
          </div>

        </div>
      </div>
    </div>
  );
}
