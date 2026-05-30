import { useEffect, useState, useMemo } from 'react';
import { getSATenants, getSATenant, toggleSATenant, changeSATenantPlan, addSATenantNote, getSAAuditReports, terminateSATenant } from '../../api/platform';
import { MODULE_REGISTRY, MODULE_CATEGORY_COLORS, DEFAULT_ROLES, EXTRA_ROLES } from '../../config/platformCatalog';
import { ChevronDown, ChevronRight, Search, X, Building2, Store, Users, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

// ── Business category definitions (SYL-BC-*) ──────────────────────────────────
const BC = [
  { code: 'SYL-BC-RET', label: 'Retail & Commerce',      icon: '🛒', color: '#10B981',
    types: ['RETAIL','KIRANA','MEDICAL_STORE','STATIONARY','SWEET_SHOP','BAKERY','JEWELLERY','HARDWARE','ELECTRICAL','CLOTHING','FOOTWEAR','ELECTRONICS','MOBILE_REPAIR','OPTICAL','BOOKSTORE','FLORIST'] },
  { code: 'SYL-BC-FNB', label: 'Food & Beverage',         icon: '🍽️', color: '#F59E0B',
    types: ['RESTAURANT','DHABA','CATERING','CLOUD_KITCHEN','JUICE_BAR','CANTEEN_MESS'] },
  { code: 'SYL-BC-HLC', label: 'Healthcare',              icon: '🏥', color: '#EF4444',
    types: ['CLINIC','DENTAL','DIAGNOSTIC_LAB','PHYSIOTHERAPY','AYURVEDA','HOSPITAL','VET_CLINIC'] },
  { code: 'SYL-BC-FIT', label: 'Fitness & Sports',         icon: '🏋️', color: '#10B981',
    types: ['GYM','SPA','YOGA_STUDIO','MARTIAL_ARTS','SPORTS_ACADEMY','SWIMMING_ACADEMY','CROSSFIT_STUDIO'] },
  { code: 'SYL-BC-BPC', label: 'Beauty & Personal Care',  icon: '💅', color: '#EC4899',
    types: ['SALON','BEAUTY_PARLOUR','LAUNDRY','TAILORING','BARBERSHOP'] },
  { code: 'SYL-BC-EDU', label: 'Education',               icon: '📚', color: '#6366F1',
    types: ['COACHING','HOME_TUITION','MUSIC_SCHOOL','DANCE_ACADEMY','DRIVING_SCHOOL','COMPUTER_TRAINING'] },
  { code: 'SYL-BC-PRO', label: 'Professional Services',   icon: '💼', color: '#8B5CF6',
    types: ['CA_FIRM','LAW_FIRM','REAL_ESTATE','INSURANCE_AGENCY','TRAVEL_AGENCY','PHOTOGRAPHY','DIGITAL_AGENCY'] },
  { code: 'SYL-BC-B2B', label: 'Trade & Supply (B2B)',    icon: '🏭', color: '#06B6D4',
    types: ['DEALER','SUPPLIER','WHOLESALE'] },
  { code: 'SYL-BC-SVC', label: 'Other Services',          icon: '⚙️', color: '#64748B',
    types: ['PEST_CONTROL','MALL'] },
  { code: 'SYL-BC-EVT', label: 'Events & Functions',      icon: '🎪', color: '#F97316',
    types: ['EVENT_PLANNER','DECORATOR','TENT_HOUSE'] },
  { code: 'SYL-BC-TRN', label: 'Transport & Logistics',   icon: '🚛', color: '#0EA5E9',
    types: ['CAB_SERVICE','TRANSPORT','CAR_RENTAL','COURIER','PACKERS_MOVERS'] },
  { code: 'SYL-BC-CND', label: 'Construction & Design',   icon: '🏗️', color: '#D97706',
    types: ['CONSTRUCTION','INTERIOR_DESIGN','CO_WORKING','WORKSHOP'] },
  { code: 'SYL-BC-GEN', label: 'General',                 icon: '📋', color: '#94A3B8',
    types: ['OTHER','FREELANCER'] },
];

const typeToBC = {};
BC.forEach(cat => cat.types.forEach(t => { typeToBC[t] = cat; }));
const bcOf = (btype) => typeToBC[btype] || { code: 'SYL-BC-GEN', label: 'General', icon: '📋', color: '#94A3B8' };

const PLANS = ['FREE', 'STARTER', 'GROWTH', 'SCALE'];
const PLAN_COLOR = { FREE: '#64748B', STARTER: '#34D399', GROWTH: '#60A5FA', SCALE: '#A78BFA' };

const inputStyle = { padding: '8px 12px', background: '#192533', border: '1px solid #1E2D3D', borderRadius: 8, color: '#F1F5F9', fontSize: 13, outline: 'none' };
const selectStyle = { ...inputStyle, cursor: 'pointer' };
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' };
const sectionHeadStyle = { fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 };

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Tenants() {
  const [tenants, setTenants]     = useState([]);
  const [search, setSearch]       = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [detail, setDetail]       = useState(null);
  const [detailTab, setDetailTab] = useState('info');
  const [note, setNote]           = useState('');
  const [newPlan, setNewPlan]     = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [complaintsLoadedFor, setComplaintsLoadedFor] = useState(null);
  const [collapsed, setCollapsed] = useState({}); // category code → bool
  const [expandedTenants, setExpandedTenants] = useState({}); // tenant id → bool
  const [terminateModal, setTerminateModal] = useState(null); // { id, name } | null
  const [terminateConfirm, setTerminateConfirm] = useState('');
  const [terminating, setTerminating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getSATenants();
      setTenants(data.data?.tenants || []);
    } catch { toast.error('Failed to load tenants'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Filter tenants
  const filtered = useMemo(() => {
    let list = tenants;
    if (search) list = list.filter(t =>
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.email?.toLowerCase().includes(search.toLowerCase()) ||
      t.syllabrixId?.toLowerCase().includes(search.toLowerCase())
    );
    if (planFilter) list = list.filter(t => t.plan === planFilter);
    if (statusFilter === 'active')    list = list.filter(t => t.isActive);
    if (statusFilter === 'suspended') list = list.filter(t => !t.isActive);
    return list;
  }, [tenants, search, planFilter, statusFilter]);

  // Group filtered tenants by BC category
  const grouped = useMemo(() => {
    const map = {};
    BC.forEach(cat => { map[cat.code] = { ...cat, tenants: [] }; });
    filtered.forEach(t => {
      const cat = bcOf(t.businessType);
      if (map[cat.code]) map[cat.code].tenants.push(t);
    });
    return BC.map(cat => map[cat.code]).filter(cat => cat.tenants.length > 0);
  }, [filtered]);

  const openDetail = async (id) => {
    setSelected(id);
    setDetailLoading(true);
    setDetailTab('info');
    setComplaints([]);
    setComplaintsLoadedFor(null);
    try {
      const { data } = await getSATenant(id);
      setDetail({ ...data.data.tenant, tenantNotes: data.data.notes || [] });
      setNewPlan(data.data.tenant.plan);
    } catch { toast.error('Failed to load tenant detail'); }
    finally { setDetailLoading(false); }
  };

  const handleTabChange = async (tab) => {
    setDetailTab(tab);
    if (tab === 'complaints' && complaintsLoadedFor !== selected) {
      setComplaintsLoading(true);
      try {
        const { data } = await getSAAuditReports({ tenantId: selected, limit: 50 });
        setComplaints(data.data || []);
        setComplaintsLoadedFor(selected);
      } catch { toast.error('Failed to load complaints'); }
      finally { setComplaintsLoading(false); }
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleSATenant(id);
      toast.success('Status updated');
      load();
      if (selected === id) openDetail(id);
    } catch { toast.error('Failed to update'); }
  };

  const handlePlanChange = async () => {
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

  const handleTerminate = async () => {
    if (terminateConfirm !== terminateModal?.name) return;
    setTerminating(true);
    try {
      await terminateSATenant(terminateModal.id);
      toast.success(`${terminateModal.name} — account terminated and all data erased`);
      setTerminateModal(null);
      setTerminateConfirm('');
      setSelected(null);
      setDetail(null);
      load();
    } catch { toast.error('Termination failed'); }
    finally { setTerminating(false); }
  };

  const toggleCat  = (code) => setCollapsed(p => ({ ...p, [code]: !p[code] }));
  const toggleBranches = (id, e) => { e.stopPropagation(); setExpandedTenants(p => ({ ...p, [id]: !p[id] })); };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── Left: category-grouped list ────────────────────────────────────── */}
      <div style={{
        flex: selected ? '0 0 58%' : '1',
        overflowY: 'auto',
        padding: '24px 28px',
        borderRight: selected ? '1px solid #1E2D3D' : 'none',
        transition: 'flex 0.2s',
      }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#F1F5F9', margin: 0 }}>Tenants</h1>
            <span style={{ fontSize: 13, color: '#475569' }}>{filtered.length} businesses · {grouped.length} categories</span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, SYL ID…"
                style={{ ...inputStyle, width: '100%', paddingLeft: 30, boxSizing: 'border-box' }} />
            </div>
            <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} style={selectStyle}>
              <option value="">All Plans</option>
              {PLANS.map(p => <option key={p}>{p}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ color: '#64748B', fontSize: 14, padding: 40, textAlign: 'center' }}>Loading…</div>
        ) : grouped.length === 0 ? (
          <div style={{ color: '#64748B', fontSize: 14, padding: 60, textAlign: 'center' }}>No tenants match your filters</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {grouped.map(cat => (
              <div key={cat.code}>
                {/* Category header */}
                <button
                  onClick={() => toggleCat(cat.code)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', marginBottom: collapsed[cat.code] ? 0 : 8,
                    background: `${cat.color}12`,
                    border: `1px solid ${cat.color}30`,
                    borderLeft: `3px solid ${cat.color}`,
                    borderRadius: 8, cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1 }}>{cat.icon}</span>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: cat.color }}>{cat.label}</span>
                    <span style={{ fontSize: 11, color: '#475569', marginLeft: 8 }}>{cat.code}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: cat.color, background: `${cat.color}20`, padding: '2px 8px', borderRadius: 10 }}>
                    {cat.tenants.length} business{cat.tenants.length !== 1 ? 'es' : ''}
                  </span>
                  {collapsed[cat.code]
                    ? <ChevronRight size={14} color="#475569" />
                    : <ChevronDown size={14} color="#475569" />}
                </button>

                {/* Tenants in category */}
                {!collapsed[cat.code] && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {cat.tenants.map(t => (
                      <div key={t.id}>
                        {/* Tenant row */}
                        <div
                          onClick={() => openDetail(t.id)}
                          style={{
                            background: selected === t.id ? 'rgba(31,184,214,0.08)' : '#192533',
                            border: `1px solid ${selected === t.id ? '#1FB8D6' : '#1E2D3D'}`,
                            borderLeft: `3px solid ${selected === t.id ? '#1FB8D6' : cat.color}55`,
                            borderRadius: 8, padding: '12px 14px',
                            cursor: 'pointer', transition: 'all 0.12s',
                            display: 'flex', alignItems: 'center', gap: 12,
                          }}
                        >
                          {/* Avatar */}
                          <div style={{
                            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                            background: t.hasBranches
                              ? 'linear-gradient(135deg,#1E40AF,#3B82F6)'
                              : 'linear-gradient(135deg,#1FB8D6,#27DCFF)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: 15, color: '#fff',
                          }}>
                            {t.name?.[0]?.toUpperCase()}
                          </div>

                          {/* Name + meta */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                              {t.hasBranches && (
                                <span style={{ fontSize: 9, background: '#1E40AF22', color: '#60A5FA', padding: '1px 6px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
                                  CHAIN · {t.branches?.length || 0}br
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {t.syllabrixId && (
                                <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#27DCFF', letterSpacing: '0.05em' }}>{t.syllabrixId}</span>
                              )}
                              <span style={{ fontSize: 11, color: '#475569' }}>{t.email}</span>
                              {t.city && <span style={{ fontSize: 11, color: '#334155' }}>· {t.city}</span>}
                            </div>
                          </div>

                          {/* Stats */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                            <div style={{ display: 'flex', gap: 10, marginRight: 6 }}>
                              <Stat icon={<Users size={11} />} val={t._count?.users || 0} />
                              <Stat icon={<FileText size={11} />} val={t._count?.invoices || 0} />
                            </div>
                            <PlanBadge plan={t.plan} />
                            <StatusDot active={t.isActive} />
                            {/* Branch toggle */}
                            {t.hasBranches && t.branches?.length > 0 && (
                              <button
                                onClick={e => toggleBranches(t.id, e)}
                                style={{ background: '#1E2D3D', border: '1px solid #334155', borderRadius: 6, color: '#64748B', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                {expandedTenants[t.id] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Branch rows */}
                        {t.hasBranches && expandedTenants[t.id] && t.branches?.map((br, bi) => (
                          <div key={br.id} style={{ display: 'flex', alignItems: 'center', marginLeft: 24, marginTop: 2 }}>
                            {/* Connector line */}
                            <div style={{ width: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                              <div style={{ width: 1, background: '#1E2D3D', flex: 1 }} />
                              <div style={{ width: 10, height: 1, background: '#1E2D3D' }} />
                            </div>
                            <div style={{
                              flex: 1, background: '#111C27',
                              border: '1px solid #1E2D3D',
                              borderLeft: `2px solid ${br.isHQ ? '#1FB8D6' : '#334155'}`,
                              borderRadius: 6, padding: '8px 12px', marginBottom: 2,
                              display: 'flex', alignItems: 'center', gap: 10,
                            }}>
                              <span style={{ fontSize: 15 }}>{br.isHQ ? '🏢' : '🏪'}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: '#CBD5E1' }}>{br.name}</span>
                                  {br.isHQ && <span style={{ fontSize: 9, background: '#FEF3C722', color: '#F59E0B', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>HQ</span>}
                                </div>
                                {br.syllabrixId && (
                                  <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#27DCFF88', letterSpacing: '0.04em' }}>{br.syllabrixId}</span>
                                )}
                              </div>
                              <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 800, color: '#F1F5F9', background: '#1E2D3D', padding: '3px 8px', borderRadius: 5, letterSpacing: '0.06em' }}>
                                {br.code}
                              </span>
                              {br.city && <span style={{ fontSize: 10, color: '#475569' }}>{br.city}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Terminate confirmation modal ──────────────────────────────────── */}
      {terminateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#111C27', border: '1px solid #EF444440', borderRadius: 16, padding: 32, maxWidth: 440, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(239,68,68,0.15)', border: '1px solid #EF444440', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                ⚠️
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#F87171' }}>Terminate Business Account</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>This action is permanent and cannot be undone</div>
              </div>
            </div>

            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid #EF444430', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#FCA5A5', lineHeight: 1.6 }}>
                This will <strong style={{ color: '#F87171' }}>permanently erase</strong> the account for <strong style={{ color: '#FECACA' }}>{terminateModal.name}</strong> including all users, invoices, customers, inventory, staff records, and every other piece of data. It cannot be recovered.
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8 }}>
                Type <strong style={{ color: '#F1F5F9', fontFamily: 'monospace' }}>{terminateModal.name}</strong> to confirm:
              </div>
              <input
                value={terminateConfirm}
                onChange={e => setTerminateConfirm(e.target.value)}
                placeholder={terminateModal.name}
                autoFocus
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', background: '#0B131C', border: `1px solid ${terminateConfirm === terminateModal.name ? '#EF4444' : '#1E2D3D'}`, borderRadius: 8, color: '#F1F5F9', fontSize: 13, outline: 'none', fontFamily: 'monospace' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setTerminateModal(null); setTerminateConfirm(''); }}
                style={{ flex: 1, padding: '10px', background: '#1E2D3D', border: 'none', borderRadius: 8, color: '#94A3B8', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleTerminate}
                disabled={terminateConfirm !== terminateModal.name || terminating}
                style={{ flex: 1, padding: '10px', background: terminateConfirm === terminateModal.name ? '#EF4444' : '#1E2D3D', border: 'none', borderRadius: 8, color: terminateConfirm === terminateModal.name ? '#fff' : '#475569', fontWeight: 700, fontSize: 13, cursor: terminateConfirm === terminateModal.name ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}
              >
                {terminating ? 'Terminating…' : 'Terminate Forever'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Right: detail panel ────────────────────────────────────────────── */}
      {selected && (
        <div style={{ flex: '0 0 42%', overflowY: 'auto', padding: 24, background: '#111C27', borderLeft: '1px solid #1E2D3D' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#F1F5F9', margin: 0 }}>
                {detail?.name || 'Loading…'}
              </h2>
              {detail?.syllabrixId && (
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#27DCFF', letterSpacing: '0.06em' }}>{detail.syllabrixId}</span>
              )}
            </div>
            <button onClick={() => { setSelected(null); setDetail(null); }}
              style={{ background: '#1E2D3D', border: 'none', borderRadius: 6, color: '#64748B', width: 28, height: 28, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} />
            </button>
          </div>

          {/* BC category tag */}
          {detail?.businessType && (() => {
            const cat = bcOf(detail.businessType);
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '8px 12px', background: `${cat.color}10`, border: `1px solid ${cat.color}30`, borderRadius: 8 }}>
                <span style={{ fontSize: 18 }}>{cat.icon}</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: cat.color }}>{cat.label}</div>
                  <div style={{ fontSize: 10, color: '#475569' }}>{cat.code} · {detail.businessType}</div>
                </div>
                {detail.hasBranches && (
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Building2 size={12} color="#60A5FA" />
                    <span style={{ fontSize: 11, color: '#60A5FA', fontWeight: 600 }}>{detail.branches?.length || 0} branches</span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 3, marginBottom: 18, background: '#192533', borderRadius: 8, padding: 4 }}>
            {[
              { id: 'info', label: 'Info' }, { id: 'plan', label: 'Plan' },
              { id: 'notes', label: 'Notes' }, { id: 'modules', label: 'Modules' },
              { id: 'complaints', label: 'Tickets' },
            ].map(({ id, label }) => (
              <button key={id} onClick={() => handleTabChange(id)} style={{
                flex: 1, padding: '7px 4px', borderRadius: 6, border: 'none',
                background: detailTab === id ? '#1FB8D6' : 'transparent',
                color: detailTab === id ? '#0B131C' : '#64748B',
                fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}>{label}</button>
            ))}
          </div>

          {detailLoading ? (
            <div style={{ color: '#64748B', fontSize: 13, textAlign: 'center', padding: 40 }}>Loading…</div>
          ) : detail && (
            <>
              {detailTab === 'info'       && <InfoTab detail={detail} onToggle={() => handleToggle(selected)} onTerminate={() => { setTerminateModal({ id: selected, name: detail.name }); setTerminateConfirm(''); }} />}
              {detailTab === 'plan'       && <PlanTab detail={detail} newPlan={newPlan} setNewPlan={setNewPlan} onSave={handlePlanChange} />}
              {detailTab === 'notes'      && <NotesTab detail={detail} note={note} setNote={setNote} onAdd={handleAddNote} />}
              {detailTab === 'modules'    && <ModulesTab detail={detail} />}
              {detailTab === 'complaints' && <ComplaintsTab complaints={complaints} loading={complaintsLoading} />}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

const Stat = ({ icon, val }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#475569' }}>
    {icon}
    <span style={{ fontSize: 11, fontWeight: 600 }}>{val}</span>
  </div>
);

const PlanBadge = ({ plan }) => (
  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8, letterSpacing: '0.04em', background: `${PLAN_COLOR[plan] || '#64748B'}22`, color: PLAN_COLOR[plan] || '#64748B' }}>
    {plan}
  </span>
);

const StatusDot = ({ active }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
    <div style={{ width: 7, height: 7, borderRadius: '50%', background: active ? '#34D399' : '#F87171', boxShadow: active ? '0 0 0 2px #34D39922' : '0 0 0 2px #F8717122' }} />
  </div>
);

// ── Tab components ────────────────────────────────────────────────────────────

const InfoTab = ({ detail, onToggle, onTerminate }) => (
  <div>
    {[
      ['Business Name', detail.name],
      ['Syllabrix ID',  detail.syllabrixId || '—'],
      ['Email',         detail.email],
      ['Phone',         detail.phone || '—'],
      ['Business Type', detail.businessType],
      ['GSTIN',         detail.gstin || '—'],
      ['City / State',  [detail.city, detail.state].filter(Boolean).join(', ') || '—'],
      ['Plan',          detail.plan, PLAN_COLOR[detail.plan]],
      ['Status',        detail.isActive ? 'Active' : 'Suspended', detail.isActive ? '#34D399' : '#F87171'],
      ['Joined',        new Date(detail.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
    ].map(([label, value, accent]) => (
      <InfoRow key={label} label={label} value={value} accent={accent} />
    ))}

    {/* Branches block */}
    {detail.hasBranches && detail.branches?.length > 0 && (
      <div style={{ marginTop: 16 }}>
        <div style={sectionHeadStyle}>Branch Network ({detail.branches.length})</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {detail.branches.map(br => (
            <div key={br.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: '#192533', border: '1px solid #1E2D3D', borderLeft: `2px solid ${br.isHQ ? '#1FB8D6' : '#334155'}`, borderRadius: 7 }}>
              <span style={{ fontSize: 16 }}>{br.isHQ ? '🏢' : '🏪'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9' }}>{br.name}</div>
                {br.syllabrixId && <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#27DCFF88' }}>{br.syllabrixId}</div>}
              </div>
              <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 800, color: '#F1F5F9', background: '#0B131C', padding: '3px 8px', borderRadius: 5, letterSpacing: '0.06em' }}>{br.code}</span>
              {br.isHQ && <span style={{ fontSize: 9, color: '#F59E0B', fontWeight: 700 }}>HQ</span>}
            </div>
          ))}
        </div>
      </div>
    )}

    <button onClick={onToggle} style={{
      marginTop: 20, width: '100%', padding: '10px',
      background: detail.isActive ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)',
      border: `1px solid ${detail.isActive ? '#F87171' : '#34D399'}`,
      borderRadius: 8, color: detail.isActive ? '#F87171' : '#34D399',
      fontWeight: 700, fontSize: 14, cursor: 'pointer',
    }}>
      {detail.isActive ? '🚫 Suspend Tenant' : '✅ Reactivate Tenant'}
    </button>

    <div style={{ marginTop: 24, borderTop: '1px solid #1E2D3D', paddingTop: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Danger Zone</div>
      <button onClick={onTerminate} style={{
        width: '100%', padding: '10px',
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.35)',
        borderRadius: 8, color: '#F87171',
        fontWeight: 700, fontSize: 13, cursor: 'pointer',
      }}>
        💀 Terminate Account &amp; Erase All Data
      </button>
    </div>
  </div>
);

const PlanTab = ({ detail, newPlan, setNewPlan, onSave }) => (
  <div>
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>Current Plan</label>
      <span style={{ background: `${PLAN_COLOR[detail.plan]}22`, color: PLAN_COLOR[detail.plan], padding: '4px 12px', borderRadius: 99, fontWeight: 700, fontSize: 13 }}>{detail.plan}</span>
    </div>
    <div style={{ marginBottom: 20 }}>
      <label style={labelStyle}>Change Plan</label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {PLANS.map(p => (
          <button key={p} onClick={() => setNewPlan(p)} style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${newPlan === p ? PLAN_COLOR[p] : '#1E2D3D'}`, background: newPlan === p ? `${PLAN_COLOR[p]}22` : '#192533', color: newPlan === p ? PLAN_COLOR[p] : '#64748B', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{p}</button>
        ))}
      </div>
    </div>
    <button onClick={onSave} disabled={newPlan === detail.plan} style={{ width: '100%', padding: '10px', background: newPlan === detail.plan ? '#1E2D3D' : 'linear-gradient(135deg,#1FB8D6,#27DCFF)', border: 'none', borderRadius: 8, color: newPlan === detail.plan ? '#64748B' : '#0B131C', fontWeight: 700, fontSize: 14, cursor: newPlan === detail.plan ? 'not-allowed' : 'pointer' }}>
      Save Plan Change
    </button>
  </div>
);

const NotesTab = ({ detail, note, setNote, onAdd }) => (
  <div>
    <div style={{ marginBottom: 16 }}>
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add internal note about this tenant…" rows={3}
        style={{ ...inputStyle, width: '100%', resize: 'vertical', minHeight: 80, boxSizing: 'border-box' }} />
      <button onClick={onAdd} disabled={!note.trim()} style={{ marginTop: 8, padding: '8px 20px', background: note.trim() ? 'linear-gradient(135deg,#1FB8D6,#27DCFF)' : '#1E2D3D', border: 'none', borderRadius: 8, color: note.trim() ? '#0B131C' : '#64748B', fontWeight: 700, fontSize: 13, cursor: note.trim() ? 'pointer' : 'not-allowed' }}>
        Add Note
      </button>
    </div>
    {detail.tenantNotes?.length > 0
      ? detail.tenantNotes.map(n => (
          <div key={n.id} style={{ background: '#192533', borderRadius: 8, border: '1px solid #1E2D3D', padding: '12px 14px', marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: '#F1F5F9', marginBottom: 6 }}>{n.note}</div>
            <div style={{ fontSize: 11, color: '#64748B' }}>{n.createdBy} · {new Date(n.createdAt).toLocaleString('en-IN')}</div>
          </div>
        ))
      : <div style={{ color: '#64748B', fontSize: 13 }}>No notes yet.</div>}
  </div>
);

function buildFingerprint(tenant) {
  if (!tenant) return null;
  const type = (tenant.businessType || 'SYL').toUpperCase();
  const uid = (tenant.syllabrixId || tenant.id || '').slice(0, 8).toUpperCase();
  return `SYL-${type}-${uid}`;
}

const STATUS_COLORS = { SUBMITTED:'#60A5FA', ASSIGNED:'#A78BFA', IN_PROGRESS:'#FBBF24', RESOLVED:'#34D399', CLOSED:'#64748B' };
const PRIORITY_COLORS = { P1:'#F87171', P2:'#FBBF24', P3:'#64748B' };

const ModulesTab = ({ detail }) => {
  const fingerprint = buildFingerprint(detail);
  const modules = detail.modules || {};
  const allModuleKeys = [...Object.keys(MODULE_REGISTRY), ...Object.keys(modules).filter(k => !(k in MODULE_REGISTRY))];
  const active = allModuleKeys.filter(k => modules[k] === true);
  const inactive = allModuleKeys.filter(k => modules[k] === false);
  const extraRoles = EXTRA_ROLES.filter(r => Array.isArray(r.appliesTo) ? r.appliesTo.includes(detail.businessType) : r.appliesTo === detail.businessType || r.appliesTo === 'all');
  const allRoles = [...DEFAULT_ROLES, ...extraRoles];
  return (
    <div>
      <div style={{ background: '#192533', border: '1px solid #1E2D3D', borderRadius: 10, padding: '14px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Business Fingerprint</div>
          <code style={{ fontSize: 16, fontWeight: 700, color: '#27DCFF', letterSpacing: '0.08em' }}>{fingerprint}</code>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#64748B', marginBottom: 3 }}>{detail.businessType}</div>
          {detail.syllabrixId && <div style={{ fontSize: 10, color: '#27DCFF88', fontWeight: 600, fontFamily: 'monospace' }}>{detail.syllabrixId}</div>}
        </div>
      </div>
      <div style={{ marginBottom: 18 }}>
        <div style={sectionHeadStyle}>Active Modules ({active.length})</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {active.length === 0 && <span style={{ fontSize: 12, color: '#64748B' }}>None enabled</span>}
          {active.map(k => { const reg = MODULE_REGISTRY[k]; const color = reg ? MODULE_CATEGORY_COLORS[reg.category] || '#27DCFF' : '#64748B'; return <span key={k} style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: `${color}18`, border: `1px solid ${color}55`, color }}>{reg?.label || k}</span>; })}
        </div>
      </div>
      {inactive.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={sectionHeadStyle}>Inactive ({inactive.length})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {inactive.map(k => <span key={k} style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: '#192533', border: '1px solid #1E2D3D', color: '#475569' }}>{MODULE_REGISTRY[k]?.label || k}</span>)}
          </div>
        </div>
      )}
      <div style={sectionHeadStyle}>Roles ({allRoles.length})</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {allRoles.map(r => (
          <div key={r.templateKey} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: '#192533', border: '1px solid #1E2D3D', borderRadius: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#F1F5F9' }}>{r.name}</span>
            {r.isSystem && <span style={{ fontSize: 10, color: '#64748B' }}>Standard</span>}
            <span style={{ fontSize: 11, color: '#64748B' }}>{r.isOwner ? 'Full access' : `${Object.keys(r.permissions || {}).length} modules`}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ComplaintsTab = ({ complaints, loading }) => {
  if (loading) return <div style={{ color: '#64748B', fontSize: 13 }}>Loading tickets…</div>;
  if (complaints.length === 0) return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9' }}>No tickets</div>
      <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>This business hasn't submitted any issue reports.</div>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {complaints.map(t => (
        <div key={t.id} style={{ background: '#192533', border: '1px solid #1E2D3D', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9', lineHeight: 1.3, marginBottom: 3 }}>{t.pageRoute}</div>
              <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace' }}>{t.reportId}</div>
            </div>
            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: `${STATUS_COLORS[t.status] || '#64748B'}22`, color: STATUS_COLORS[t.status] || '#64748B', flexShrink: 0 }}>
              {t.status?.replace('_', ' ')}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ padding: '1px 7px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: `${PRIORITY_COLORS[t.priority] || '#64748B'}22`, color: PRIORITY_COLORS[t.priority] || '#64748B' }}>{t.priority}</span>
            <span style={{ fontSize: 10, color: '#475569', padding: '1px 7px', background: '#0F1923', borderRadius: 10, border: '1px solid #1E2D3D' }}>{t.frequency}</span>
            <span style={{ fontSize: 10, color: '#475569', marginLeft: 'auto' }}>{new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</span>
          </div>
          {t.errorDesc && (
            <div style={{ marginTop: 8, padding: '7px 10px', background: '#0F1923', borderRadius: 6, fontSize: 11, color: '#64748B', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {t.errorDesc}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const InfoRow = ({ label, value, accent }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1E2D3D', padding: '10px 0' }}>
    <span style={{ fontSize: 12, color: '#64748B' }}>{label}</span>
    <span style={{ fontSize: 13, fontWeight: 600, color: accent || '#F1F5F9', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all' }}>{value}</span>
  </div>
);
