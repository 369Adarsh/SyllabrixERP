import { useEffect, useState } from 'react';
import {
  getSAMaintenanceWindows, scheduleSAMaintenance,
  activateSAMaintenance, cancelSAMaintenance,
} from '../../api/platform';
import toast from 'react-hot-toast';

const STATUS = (w) => {
  if (w.cancelledAt) return { label: 'Cancelled', color: '#64748B', bg: 'rgba(100,116,139,0.12)' };
  if (w.isActive)    return { label: 'LIVE',       color: '#F87171', bg: 'rgba(248,113,113,0.12)' };
  const now = new Date();
  if (new Date(w.startAt) > now) return { label: 'Scheduled', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' };
  return { label: 'Completed', color: '#34D399', bg: 'rgba(52,211,153,0.12)' };
};

const fmt = (iso) => new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const emptyForm = { title: '', message: '', startAt: '', endAt: '', isEmergency: false };

export default function Maintenance() {
  const [windows, setWindows]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(emptyForm);
  const [saving, setSaving]     = useState(false);
  const [acting, setActing]     = useState(null);

  const load = () => {
    setLoading(true);
    getSAMaintenanceWindows()
      .then(r => setWindows(r.data.data || []))
      .catch(() => toast.error('Failed to load maintenance windows'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const active = windows.find(w => w.isActive);
  const scheduled = windows.filter(w => !w.isActive && !w.cancelledAt && new Date(w.startAt) > new Date());

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!form.title || !form.message || !form.startAt || !form.endAt) {
      toast.error('Fill in all fields'); return;
    }
    setSaving(true);
    try {
      await scheduleSAMaintenance(form);
      toast.success(form.isEmergency ? 'Emergency maintenance activated!' : 'Maintenance window scheduled');
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch {
      toast.error('Failed to schedule maintenance');
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (id) => {
    setActing(id + '-activate');
    try {
      await activateSAMaintenance(id);
      toast.success('Maintenance activated — all tenants will see the banner');
      load();
    } catch {
      toast.error('Failed to activate');
    } finally { setActing(null); }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this maintenance window?')) return;
    setActing(id + '-cancel');
    try {
      await cancelSAMaintenance(id);
      toast.success('Maintenance cancelled');
      load();
    } catch {
      toast.error('Failed to cancel');
    } finally { setActing(null); }
  };

  return (
    <div style={{ padding: 28, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>
            Maintenance Mode
          </h1>
          <p style={{ color: '#64748B', fontSize: 14 }}>
            Schedule downtime windows and notify all tenants instantly
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{
            padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
            background: showForm ? 'rgba(100,116,139,0.15)' : '#1FB8D6',
            color: showForm ? '#94A3B8' : '#0B131C',
            border: 'none', cursor: 'pointer',
          }}
        >
          {showForm ? '✕ Cancel' : '+ Schedule Maintenance'}
        </button>
      </div>

      {/* Active maintenance banner */}
      {active && (
        <div style={{
          background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
          borderRadius: 12, padding: '16px 20px', marginBottom: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F87171', boxShadow: '0 0 0 4px rgba(248,113,113,0.25)', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#F87171' }}>
                MAINTENANCE ACTIVE — {active.title}
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                {active.message} · ends {fmt(active.endAt)}
              </div>
            </div>
          </div>
          <button
            onClick={() => handleCancel(active.id)}
            disabled={acting === active.id + '-cancel'}
            style={{
              padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 700,
              background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)',
              color: '#F87171', cursor: 'pointer',
            }}
          >
            End Now
          </button>
        </div>
      )}

      {/* Schedule form */}
      {showForm && (
        <form onSubmit={handleSchedule} style={{ background: '#192533', borderRadius: 12, border: '1px solid #1E2D3D', padding: 24, marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#CBD5E1', marginBottom: 20 }}>New Maintenance Window</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Title</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Database upgrade v2.1"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Maintenance Type</label>
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                {[false, true].map(v => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, isEmergency: v }))}
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700,
                      border: `1px solid ${form.isEmergency === v ? (v ? '#F87171' : '#1FB8D6') : '#1E2D3D'}`,
                      background: form.isEmergency === v ? (v ? 'rgba(248,113,113,0.12)' : 'rgba(31,184,214,0.12)') : 'transparent',
                      color: form.isEmergency === v ? (v ? '#F87171' : '#1FB8D6') : '#64748B',
                      cursor: 'pointer',
                    }}
                  >
                    {v ? '⚡ Emergency' : '📅 Scheduled'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Message (shown to tenants)</label>
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="We're performing scheduled maintenance to improve system performance. Expected downtime: 2 hours."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={labelStyle}>Start Date & Time</label>
              <input type="datetime-local" value={form.startAt} onChange={e => setForm(f => ({ ...f, startAt: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>End Date & Time</label>
              <input type="datetime-local" value={form.endAt} onChange={e => setForm(f => ({ ...f, endAt: e.target.value }))} style={inputStyle} />
            </div>
          </div>

          {form.isEmergency && (
            <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#F87171' }}>
              ⚡ Emergency mode will activate maintenance immediately upon saving — all tenants will see the downtime banner right away.
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                background: form.isEmergency ? '#F87171' : '#1FB8D6',
                color: form.isEmergency ? '#fff' : '#0B131C',
                border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving…' : form.isEmergency ? '⚡ Activate Now' : '📅 Schedule Window'}
            </button>
            <button
              type="button"
              onClick={() => { setForm(emptyForm); setShowForm(false); }}
              style={{ padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'transparent', border: '1px solid #1E2D3D', color: '#64748B', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Upcoming scheduled */}
      {scheduled.length > 0 && (
        <>
          <SectionLabel>Upcoming ({scheduled.length})</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {scheduled.map(w => (
              <WindowCard key={w.id} w={w} onActivate={handleActivate} onCancel={handleCancel} acting={acting} />
            ))}
          </div>
        </>
      )}

      {/* History */}
      <SectionLabel>History</SectionLabel>
      {loading ? (
        <div style={{ color: '#64748B', fontSize: 13 }}>Loading…</div>
      ) : windows.length === 0 ? (
        <div style={{ background: '#192533', borderRadius: 12, border: '1px solid #1E2D3D', padding: 32, textAlign: 'center', color: '#475569', fontSize: 14 }}>
          No maintenance windows scheduled yet.
        </div>
      ) : (
        <div style={{ background: '#192533', borderRadius: 12, border: '1px solid #1E2D3D', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1E2D3D' }}>
                {['Title', 'Type', 'Start', 'End', 'Status', 'Created By', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {windows.map(w => {
                const s = STATUS(w);
                const canActivate = !w.isActive && !w.cancelledAt;
                const canCancel = (w.isActive || !w.cancelledAt) && new Date(w.endAt) > new Date();
                return (
                  <tr key={w.id} style={{ borderBottom: '1px solid #1E2D3D' }}>
                    <td style={{ padding: '12px 16px', color: '#F1F5F9', fontWeight: 600, fontSize: 13 }}>{w.title}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: w.isEmergency ? '#F87171' : '#1FB8D6' }}>
                        {w.isEmergency ? '⚡ Emergency' : '📅 Scheduled'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#94A3B8' }}>{fmt(w.startAt)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#94A3B8' }}>{fmt(w.endAt)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{s.label}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748B' }}>{w.createdBy}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {canActivate && !w.isActive && (
                          <button
                            onClick={() => handleActivate(w.id)}
                            disabled={acting === w.id + '-activate'}
                            style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', color: '#F87171', cursor: 'pointer' }}
                          >
                            Activate
                          </button>
                        )}
                        {canCancel && !w.cancelledAt && (
                          <button
                            onClick={() => handleCancel(w.id)}
                            disabled={acting === w.id + '-cancel'}
                            style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'transparent', border: '1px solid #1E2D3D', color: '#64748B', cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function WindowCard({ w, onActivate, onCancel, acting }) {
  return (
    <div style={{ background: '#192533', borderRadius: 10, border: '1px solid rgba(245,158,11,0.2)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>{w.title}</div>
        <div style={{ fontSize: 12, color: '#64748B', marginBottom: 6 }}>{w.message}</div>
        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#475569' }}>
          <span>Starts: {new Date(w.startAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
          <span>Ends: {new Date(w.endAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => onActivate(w.id)}
          disabled={acting === w.id + '-activate'}
          style={{ padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', color: '#F87171', cursor: 'pointer' }}
        >
          Activate Now
        </button>
        <button
          onClick={() => onCancel(w.id)}
          disabled={acting === w.id + '-cancel'}
          style={{ padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: 'transparent', border: '1px solid #1E2D3D', color: '#64748B', cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

const SectionLabel = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
    {children}
  </div>
);

const labelStyle = { fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' };
const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
  background: '#0F1923', border: '1px solid #1E2D3D', color: '#F1F5F9',
  outline: 'none', boxSizing: 'border-box',
};
