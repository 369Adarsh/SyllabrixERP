import { useEffect, useState } from 'react';
import { getSARoleRequests, updateSARoleRequest } from '../../api/platform';
import toast from 'react-hot-toast';

const STATUS_COLOR = { PENDING: '#F59E0B', APPROVED: '#34D399', REJECTED: '#F87171', IMPLEMENTED: '#60A5FA' };

const Badge = ({ children, color }) => (
  <span style={{ background: `${color}22`, color, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
    {children}
  </span>
);

export default function RoleRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [adminNote, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('PENDING');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getSARoleRequests();
      setRequests(data.data || []);
    } catch { toast.error('Failed to load role requests'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openDetail = (r) => {
    setSelected(r);
    setAdminNotes(r.adminNote || '');
  };

  const handleAction = async (status) => {
    setSaving(true);
    try {
      await updateSARoleRequest(selected.id, { status, adminNote: adminNote.trim() || undefined });
      toast.success(`Request ${status.toLowerCase()}`);
      load();
      setSelected(null);
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  const filtered = requests.filter((r) => !filter || r.status === filter);

  const counts = requests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ padding: 28, maxWidth: 900 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#F1F5F9', marginBottom: 20 }}>
        Role Requests
      </h1>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: '#192533', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'IMPLEMENTED'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s === 'ALL' ? '' : s)}
            style={{
              padding: '7px 14px', borderRadius: 7, border: 'none',
              background: (filter === s || (s === 'ALL' && !filter)) ? '#1FB8D6' : 'transparent',
              color: (filter === s || (s === 'ALL' && !filter)) ? '#0B131C' : '#64748B',
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
              fontFamily: 'var(--font-body)',
            }}
          >
            {s}{counts[s] ? ` (${counts[s]})` : s === 'ALL' ? ` (${requests.length})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: '#64748B', fontSize: 14 }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((r) => (
            <div key={r.id} style={{ background: '#192533', borderRadius: 12, border: '1px solid #1E2D3D', padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', fontFamily: 'var(--font-display)' }}>
                      {r.roleName}
                    </span>
                    <Badge color={STATUS_COLOR[r.status]}>{r.status}</Badge>
                  </div>
                  <div style={{ fontSize: 13, color: '#64748B' }}>
                    <span style={{ color: '#94A3B8' }}>{r.tenant?.businessName}</span>
                    {' · '}
                    {new Date(r.createdAt).toLocaleDateString('en-IN')}
                  </div>
                </div>
                {r.status === 'PENDING' && (
                  <button
                    onClick={() => openDetail(r)}
                    style={{
                      padding: '7px 16px', background: 'rgba(31,184,214,0.1)', border: '1px solid #1FB8D6',
                      borderRadius: 8, color: '#1FB8D6', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                    }}
                  >
                    Review
                  </button>
                )}
              </div>

              {r.reason && (
                <div style={{ background: '#111C27', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reason</div>
                  <div style={{ fontSize: 13, color: '#CBD5E1' }}>{r.reason}</div>
                </div>
              )}

              {r.permissions?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Requested Permissions
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {r.permissions.map((p) => (
                      <span key={p} style={{ background: '#1E2D3D', borderRadius: 6, padding: '3px 10px', fontSize: 12, color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {r.adminNote && (
                <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(52,211,153,0.06)', border: '1px solid #34D39933', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: '#34D399', fontWeight: 700, marginBottom: 2 }}>Admin Notes</div>
                  <div style={{ fontSize: 13, color: '#CBD5E1' }}>{r.adminNote}</div>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ color: '#64748B', textAlign: 'center', padding: 48, fontSize: 14 }}>No requests in this category</div>
          )}
        </div>
      )}

      {/* Review Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#192533', borderRadius: 16, border: '1px solid #1E2D3D', width: '100%', maxWidth: 520, padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: '#F1F5F9' }}>
                Review: {selected.roleName}
              </h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#64748B', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ background: '#111C27', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 6 }}>
                <strong style={{ color: '#94A3B8' }}>{selected.tenant?.businessName}</strong> · {selected.tenant?.businessType}
              </div>
              {selected.reason && <div style={{ fontSize: 13, color: '#CBD5E1' }}>{selected.reason}</div>}
            </div>

            {selected.permissions?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Requested Permissions</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selected.permissions.map((p) => (
                    <span key={p} style={{ background: '#1E2D3D', borderRadius: 6, padding: '3px 10px', fontSize: 12, color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>{p}</span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#64748B', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Admin Notes (optional)
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Reason for approval/rejection, or implementation details…"
                rows={3}
                style={{ width: '100%', background: '#111C27', border: '1px solid #1E2D3D', borderRadius: 8, color: '#F1F5F9', fontSize: 13, padding: '10px 12px', resize: 'vertical', fontFamily: 'var(--font-body)', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => handleAction('APPROVED')}
                disabled={saving}
                style={{ flex: 1, padding: '11px', background: 'rgba(52,211,153,0.15)', border: '1px solid #34D399', borderRadius: 8, color: '#34D399', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                ✓ Approve
              </button>
              <button
                onClick={() => handleAction('IMPLEMENTED')}
                disabled={saving}
                style={{ flex: 1, padding: '11px', background: 'rgba(96,165,250,0.15)', border: '1px solid #60A5FA', borderRadius: 8, color: '#60A5FA', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                🚀 Implemented
              </button>
              <button
                onClick={() => handleAction('REJECTED')}
                disabled={saving}
                style={{ flex: 1, padding: '11px', background: 'rgba(248,113,113,0.15)', border: '1px solid #F87171', borderRadius: 8, color: '#F87171', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                ✕ Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
