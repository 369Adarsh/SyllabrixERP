import { useEffect, useState, useMemo } from 'react';
import { Search, X, RefreshCw, Users, Briefcase, MessageCircle } from 'lucide-react';
import { getFreelancerTenants, getSATenant, toggleSATenant, changeSATenantPlan, addSATenantNote } from '../../api/platform';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────────
const PLANS      = ['FREE', 'STARTER', 'GROWTH', 'SCALE'];
const PLAN_COLOR = { FREE: '#64748B', STARTER: '#34D399', GROWTH: '#60A5FA', SCALE: '#A78BFA' };
const OR         = '#f97316';   // freelancer accent
const WA         = '#25D366';

const C  = { bg: '#0B131C', card: '#111C27', border: '#1E2D3D', muted: '#64748B', text: '#F1F5F9', sub: '#475569' };
const inp = { padding: '8px 12px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, outline: 'none' };

// ── Helpers ───────────────────────────────────────────────────────────────────
const PlanBadge = ({ plan }) => (
  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8, letterSpacing: '0.04em', background: `${PLAN_COLOR[plan] || '#64748B'}22`, color: PLAN_COLOR[plan] || '#64748B' }}>{plan}</span>
);

const StatusDot = ({ active }) => (
  <div style={{ width: 8, height: 8, borderRadius: '50%', background: active ? '#34D399' : '#F87171', boxShadow: active ? '0 0 0 2px #34D39920' : '0 0 0 2px #F8717120', flexShrink: 0 }} />
);

const Stat = ({ icon, val, label, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: color || C.muted }} title={label}>
    {icon}
    <span style={{ fontSize: 12, fontWeight: 600 }}>{val}</span>
  </div>
);

const InfoRow = ({ label, value, accent }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, padding: '10px 0' }}>
    <span style={{ fontSize: 12, color: C.muted }}>{label}</span>
    <span style={{ fontSize: 13, fontWeight: 600, color: accent || C.text, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all' }}>{value || '—'}</span>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FreelancerTenants() {
  const [tenants, setTenants]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [planFilter, setPlan]   = useState('');
  const [statusFilter, setStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail]     = useState(null);
  const [detailLoading, setDL]  = useState(false);
  const [detailTab, setDTab]    = useState('info');
  const [note, setNote]         = useState('');
  const [newPlan, setNewPlan]   = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getFreelancerTenants({ search: search || undefined, plan: planFilter || undefined });
      setTenants(data.data?.tenants || []);
    } catch { toast.error('Failed to load freelancer accounts'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = tenants;
    if (search) list = list.filter(t =>
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.email?.toLowerCase().includes(search.toLowerCase()) ||
      t.syllabrixId?.toLowerCase().includes(search.toLowerCase()) ||
      t.phone?.includes(search)
    );
    if (planFilter)             list = list.filter(t => t.plan === planFilter);
    if (statusFilter === 'active')    list = list.filter(t => t.isActive);
    if (statusFilter === 'suspended') list = list.filter(t => !t.isActive);
    return list;
  }, [tenants, search, planFilter, statusFilter]);

  const openDetail = async (id) => {
    setSelected(id);
    setDL(true);
    setDTab('info');
    try {
      const { data } = await getSATenant(id);
      setDetail({ ...data.data.tenant, tenantNotes: data.data.notes || [] });
      setNewPlan(data.data.tenant.plan);
    } catch { toast.error('Failed to load account detail'); }
    finally { setDL(false); }
  };

  const handleToggle = async () => {
    try {
      await toggleSATenant(selected);
      toast.success('Status updated');
      load();
      openDetail(selected);
    } catch { toast.error('Failed to update status'); }
  };

  const handlePlanSave = async () => {
    if (!newPlan || newPlan === detail?.plan) return;
    try {
      await changeSATenantPlan(selected, newPlan);
      toast.success('Plan updated');
      openDetail(selected);
    } catch { toast.error('Failed to update plan'); }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    try {
      await addSATenantNote(selected, note.trim());
      toast.success('Note added');
      setNote('');
      openDetail(selected);
    } catch { toast.error('Failed to add note'); }
  };

  // Summary counts
  const totalJobs    = tenants.reduce((s, t) => s + (t._count?.flJobs || 0), 0);
  const totalClients = tenants.reduce((s, t) => s + (t._count?.flClients || 0), 0);
  const active       = tenants.filter(t => t.isActive).length;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: C.bg }}>

      {/* ── Left panel ──────────────────────────────────────────────────────── */}
      <div style={{ flex: selected ? '0 0 58%' : '1', overflowY: 'auto', padding: '24px 28px', borderRight: selected ? `1px solid ${C.border}` : 'none', transition: 'flex 0.2s' }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>Freelancer Accounts</h1>
            <span style={{ fontSize: 13, color: C.muted }}>{filtered.length} accounts</span>
          </div>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>All Syllabrix Freelancer tenants — SYL-BC-GEN/FREELANCER</p>

          {/* Summary stats */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Accounts', val: tenants.length, color: OR },
              { label: 'Active',         val: active,          color: '#34D399' },
              { label: 'Total Jobs',     val: totalJobs,       color: '#60A5FA' },
              { label: 'Total Clients',  val: totalClients,    color: '#A78BFA' },
            ].map(s => (
              <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 16px', minWidth: 110 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
            <button onClick={load} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', cursor: 'pointer', color: C.muted, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, SYL ID, phone…"
                style={{ ...inp, width: '100%', paddingLeft: 30, boxSizing: 'border-box' }} />
            </div>
            <select value={planFilter} onChange={e => setPlan(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              <option value="">All Plans</option>
              {PLANS.map(p => <option key={p}>{p}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatus(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ color: C.muted, textAlign: 'center', padding: 60, fontSize: 14 }}>Loading accounts…</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: C.muted, textAlign: 'center', padding: 60, fontSize: 14 }}>No freelancer accounts found</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filtered.map(t => (
              <div key={t.id} onClick={() => openDetail(t.id)}
                style={{
                  background: selected === t.id ? 'rgba(249,115,22,0.06)' : C.card,
                  border: `1px solid ${selected === t.id ? OR + '60' : C.border}`,
                  borderLeft: `3px solid ${selected === t.id ? OR : OR + '30'}`,
                  borderRadius: 10, padding: '13px 16px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
                  transition: 'all 0.12s',
                }}>
                {/* Avatar */}
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg,${OR},#fb923c)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#fff', flexShrink: 0 }}>
                  {t.name?.[0]?.toUpperCase()}
                </div>

                {/* Name + meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                    {t.syllabrixId && (
                      <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#1FB8D6', background: 'rgba(31,184,214,0.1)', padding: '1px 6px', borderRadius: 4, flexShrink: 0 }}>{t.syllabrixId}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: C.sub }}>{t.email}</span>
                    {t.phone && <span style={{ fontSize: 11, color: C.sub }}>· {t.phone}</span>}
                    {t.city && <span style={{ fontSize: 11, color: '#334155' }}>· {t.city}</span>}
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                  <Stat icon={<Briefcase size={12} />} val={t._count?.flJobs || 0} label="Jobs" color="#60A5FA" />
                  <Stat icon={<Users size={12} />} val={t._count?.flClients || 0} label="Clients" color="#A78BFA" />
                  <PlanBadge plan={t.plan} />
                  <StatusDot active={t.isActive} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Right: detail panel ──────────────────────────────────────────────── */}
      {selected && (
        <div style={{ flex: '0 0 42%', overflowY: 'auto', padding: 24, background: C.card, borderLeft: `1px solid ${C.border}` }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: 0, marginBottom: 3 }}>{detail?.name || '…'}</h2>
              {detail?.syllabrixId && (
                <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: '#1FB8D6', background: 'rgba(31,184,214,0.08)', padding: '2px 8px', borderRadius: 5 }}>
                  {detail.syllabrixId}
                </span>
              )}
            </div>
            <button onClick={() => { setSelected(null); setDetail(null); }}
              style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, color: C.muted, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} />
            </button>
          </div>

          {/* Freelancer badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: `${OR}10`, border: `1px solid ${OR}30`, borderRadius: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>🧑‍💼</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: OR }}>Freelancer Account</div>
              <div style={{ fontSize: 10, color: C.muted }}>SYL-BC-GEN · FREELANCER · Joined {detail ? new Date(detail.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '…'}</div>
            </div>
            {detail && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
                <Stat icon={<Briefcase size={11} />} val={detail._count?.flJobs || 0} label="Jobs" color="#60A5FA" />
                <Stat icon={<Users size={11} />} val={detail._count?.flClients || 0} label="Clients" color="#A78BFA" />
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 3, marginBottom: 18, background: C.bg, borderRadius: 8, padding: 4 }}>
            {[{ id: 'info', l: 'Info' }, { id: 'plan', l: 'Plan' }, { id: 'notes', l: 'Notes' }].map(({ id, l }) => (
              <button key={id} onClick={() => setDTab(id)} style={{
                flex: 1, padding: '7px 4px', borderRadius: 6, border: 'none', fontFamily: 'inherit',
                background: detailTab === id ? OR : 'transparent',
                color: detailTab === id ? '#fff' : C.muted,
                fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}>{l}</button>
            ))}
          </div>

          {detailLoading ? (
            <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: 40 }}>Loading…</div>
          ) : detail && (
            <>
              {/* ── Info tab ── */}
              {detailTab === 'info' && (
                <div>
                  {[
                    ['Business Name',  detail.name],
                    ['Syllabrix ID',   detail.syllabrixId],
                    ['Email',          detail.email],
                    ['Phone',          detail.phone],
                    ['City / State',   [detail.city, detail.state].filter(Boolean).join(', ')],
                    ['Plan',           detail.plan,     PLAN_COLOR[detail.plan]],
                    ['Status',         detail.isActive ? 'Active' : 'Suspended', detail.isActive ? '#34D399' : '#F87171'],
                  ].map(([l, v, a]) => <InfoRow key={l} label={l} value={v} accent={a} />)}

                  {/* FL stats block */}
                  <div style={{ marginTop: 16, marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      { label: 'Total Jobs',    val: detail._count?.flJobs    || 0, color: '#60A5FA', icon: <Briefcase size={14} /> },
                      { label: 'Total Clients', val: detail._count?.flClients || 0, color: '#A78BFA', icon: <Users size={14} /> },
                      { label: 'Invoices',      val: detail._count?.invoices  || 0, color: '#34D399', icon: null },
                      { label: 'Users',         val: detail._count?.users     || 0, color: C.muted,   icon: null },
                    ].map(s => (
                      <div key={s.label} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.val}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Users list */}
                  {detail.users?.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Account Users</div>
                      {detail.users.map(u => (
                        <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 4 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${OR}22`, border: `1.5px solid ${OR}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: OR, flexShrink: 0 }}>
                            {u.name?.[0]?.toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                            <div style={{ fontSize: 10, color: C.sub }}>{u.email} · {u.role}</div>
                          </div>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: u.isActive ? '#34D399' : '#F87171', flexShrink: 0 }} />
                        </div>
                      ))}
                    </div>
                  )}

                  <button onClick={handleToggle} style={{
                    width: '100%', padding: '10px', fontFamily: 'inherit',
                    background: detail.isActive ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)',
                    border: `1px solid ${detail.isActive ? '#F87171' : '#34D399'}`,
                    borderRadius: 8, color: detail.isActive ? '#F87171' : '#34D399',
                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  }}>
                    {detail.isActive ? '🚫 Suspend Account' : '✅ Reactivate Account'}
                  </button>
                </div>
              )}

              {/* ── Plan tab ── */}
              {detailTab === 'plan' && (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Current Plan</div>
                    <span style={{ background: `${PLAN_COLOR[detail.plan]}22`, color: PLAN_COLOR[detail.plan], padding: '5px 14px', borderRadius: 99, fontWeight: 700, fontSize: 14 }}>{detail.plan}</span>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Change Plan</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {PLANS.map(p => (
                        <button key={p} onClick={() => setNewPlan(p)} style={{ padding: '7px 16px', borderRadius: 8, border: `1px solid ${newPlan === p ? PLAN_COLOR[p] : C.border}`, background: newPlan === p ? `${PLAN_COLOR[p]}22` : C.bg, color: newPlan === p ? PLAN_COLOR[p] : C.muted, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>{p}</button>
                      ))}
                    </div>
                  </div>
                  <button onClick={handlePlanSave} disabled={newPlan === detail.plan} style={{ width: '100%', padding: '10px', background: newPlan === detail.plan ? C.bg : `linear-gradient(135deg,${OR},#fb923c)`, border: 'none', borderRadius: 8, color: newPlan === detail.plan ? C.muted : '#fff', fontWeight: 700, fontSize: 14, cursor: newPlan === detail.plan ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                    Save Plan Change
                  </button>
                </div>
              )}

              {/* ── Notes tab ── */}
              {detailTab === 'notes' && (
                <div>
                  <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add internal note about this freelancer account…" rows={3}
                    style={{ ...inp, width: '100%', resize: 'vertical', minHeight: 80, boxSizing: 'border-box', marginBottom: 10, fontFamily: 'inherit' }} />
                  <button onClick={handleAddNote} disabled={!note.trim()} style={{ padding: '8px 20px', background: note.trim() ? `linear-gradient(135deg,${OR},#fb923c)` : C.bg, border: 'none', borderRadius: 8, color: note.trim() ? '#fff' : C.muted, fontWeight: 700, fontSize: 13, cursor: note.trim() ? 'pointer' : 'not-allowed', marginBottom: 16, fontFamily: 'inherit' }}>
                    Add Note
                  </button>
                  {detail.tenantNotes?.length > 0
                    ? detail.tenantNotes.map(n => (
                        <div key={n.id} style={{ background: C.bg, borderRadius: 8, border: `1px solid ${C.border}`, padding: '12px 14px', marginBottom: 8 }}>
                          <div style={{ fontSize: 13, color: C.text, marginBottom: 6 }}>{n.note}</div>
                          <div style={{ fontSize: 11, color: C.muted }}>{n.createdBy} · {new Date(n.createdAt).toLocaleString('en-IN')}</div>
                        </div>
                      ))
                    : <div style={{ color: C.muted, fontSize: 13 }}>No notes yet.</div>}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
