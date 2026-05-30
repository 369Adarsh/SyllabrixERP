import { useEffect, useState } from 'react';
import { getSATickets, getSATicketStats, getSATicket, replySATicket, updateSATicketStatus, updateSATicketPriority } from '../../api/platform';
import { ALL_ROLES, getModuleAccess, MODULE_REGISTRY, MODULE_CATEGORY_COLORS } from '../../config/platformCatalog';
import toast from 'react-hot-toast';

// ── Static maps ───────────────────────────────────────────────────────────────

const STATUS_META = {
  OPEN:           { color: '#F87171',  label: 'Open'           },
  IN_PROGRESS:    { color: '#F59E0B',  label: 'In Progress'    },
  WAITING_TENANT: { color: '#60A5FA',  label: 'Waiting Tenant' },
  RESOLVED:       { color: '#34D399',  label: 'Resolved'       },
  CLOSED:         { color: '#64748B',  label: 'Closed'         },
};

const PRIORITY_META = {
  LOW:      { color: '#64748B', label: 'Low'      },
  MEDIUM:   { color: '#60A5FA', label: 'Medium'   },
  HIGH:     { color: '#F59E0B', label: 'High'     },
  CRITICAL: { color: '#F87171', label: 'Critical' },
};

const CATEGORY_LABELS = {
  TECHNICAL:       'Technical',
  DATA_ISSUE:      'Data Issue',
  ROLE_REQUEST:    'Role Request',
  BILLING:         'Billing',
  FEATURE_REQUEST: 'Feature Request',
  COMPLIANCE:      'Compliance',
  OTHER:           'Other',
};

// Build role color + name map from catalog
const ROLE_META = Object.fromEntries(
  ALL_ROLES.map(r => [r.templateKey, { color: r.color, name: r.name }])
);

// ── Permission verdict ────────────────────────────────────────────────────────
// Returns { verdict: 'access'|'denied'|'unknown', ... }

function checkAccess(reporterRole, moduleKey) {
  if (!reporterRole || !moduleKey) return null;
  const key = reporterRole.toUpperCase();
  const role = ALL_ROLES.find(r => r.templateKey === key);
  if (!role) return { verdict: 'unknown', role: key, moduleLabel: MODULE_REGISTRY[moduleKey]?.label || moduleKey };
  const mod = MODULE_REGISTRY[moduleKey];
  const moduleLabel = mod?.label || moduleKey;
  if (role.isOwner) return { verdict: 'access', role, moduleLabel };
  const hasAccess = getModuleAccess(role, moduleKey);
  return { verdict: hasAccess ? 'access' : 'denied', role, moduleLabel };
}

// ── Sub-components ────────────────────────────────────────────────────────────

const Badge = ({ children, color }) => (
  <span style={{
    background: `${color}22`, color,
    padding: '2px 8px', borderRadius: 99,
    fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
  }}>{children}</span>
);

const RoleBadge = ({ role }) => {
  if (!role) return null;
  const meta = ROLE_META[role.toUpperCase()];
  const color = meta?.color || '#64748B';
  const name  = meta?.name  || role;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 99,
      background: `${color}22`, border: `1px solid ${color}44`,
      fontSize: 11, fontWeight: 700, color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {name}
    </span>
  );
};

const ModuleBadge = ({ moduleKey, featureKey }) => {
  if (!moduleKey) return null;
  const reg = MODULE_REGISTRY[moduleKey];
  const color = reg ? MODULE_CATEGORY_COLORS[reg.category] || '#27DCFF' : '#27DCFF';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: `${color}18`, border: `1px solid ${color}44`, color }}>
        {reg?.label || moduleKey}
      </span>
      {featureKey && (
        <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: '#1E2D3D', color: '#94A3B8' }}>
          {featureKey}
        </span>
      )}
    </span>
  );
};

function PermissionVerdict({ reporterRole, moduleKey, featureKey }) {
  const check = checkAccess(reporterRole, moduleKey);
  if (!check) return null;

  const configs = {
    access: {
      bg:     'rgba(52,211,153,0.07)',
      border: 'rgba(52,211,153,0.25)',
      icon:   '✓',
      iconColor: '#34D399',
      headline: `${check.role?.name || reporterRole} has access to ${check.moduleLabel}`,
      sub: 'This is a legitimate complaint — the user should be able to use this feature. Investigate the bug.',
      tag: { label: 'Legitimate', color: '#34D399' },
    },
    denied: {
      bg:     'rgba(245,158,11,0.07)',
      border: 'rgba(245,158,11,0.25)',
      icon:   '⚠',
      iconColor: '#F59E0B',
      headline: `${check.role?.name || reporterRole} has NO permission in ${check.moduleLabel}`,
      sub: "This may be expected behavior. The user's role does not grant access to this module. Verify before investigating — may be a training issue.",
      tag: { label: 'Access Denied', color: '#F59E0B' },
    },
    unknown: {
      bg:     'rgba(100,116,139,0.07)',
      border: 'rgba(100,116,139,0.25)',
      icon:   '?',
      iconColor: '#64748B',
      headline: `Role "${check.role}" is not in the platform catalog`,
      sub: 'Cannot auto-verify permissions. Review manually.',
      tag: { label: 'Unknown Role', color: '#64748B' },
    },
  };

  const cfg = configs[check.verdict];

  return (
    <div style={{
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: 10,
      padding: '14px 16px',
      marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: `${cfg.iconColor}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: cfg.iconColor,
        }}>
          {cfg.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>{cfg.headline}</span>
            <span style={{
              padding: '1px 7px', borderRadius: 10,
              fontSize: 10, fontWeight: 700,
              background: `${cfg.tag.color}22`, color: cfg.tag.color,
              flexShrink: 0,
            }}>{cfg.tag.label}</span>
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.5 }}>{cfg.sub}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#64748B' }}>Reporter role:</span>
            <RoleBadge role={reporterRole} />
            <ModuleBadge moduleKey={moduleKey} featureKey={featureKey} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Support() {
  const [tickets, setTickets]       = useState([]);
  const [stats,   setStats]         = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected]     = useState(null);
  const [detail,   setDetail]       = useState(null);
  const [loading,  setLoading]      = useState(true);
  const [reply,    setReply]        = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [replying, setReplying]     = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [t, s] = await Promise.all([
        getSATickets(statusFilter ? { status: statusFilter } : {}),
        getSATicketStats(),
      ]);
      setTickets(t.data.data?.tickets || []);
      setStats(s.data.data);
    } catch { toast.error('Failed to load tickets'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const openDetail = async (id) => {
    setSelected(id);
    try {
      const { data } = await getSATicket(id);
      setDetail(data.data);
    } catch { toast.error('Failed to load ticket'); }
  };

  const handleStatusChange = async (status) => {
    try {
      await updateSATicketStatus(selected, status);
      toast.success('Status updated');
      load();
      openDetail(selected);
    } catch { toast.error('Failed'); }
  };

  const handlePriorityChange = async (priority) => {
    try {
      await updateSATicketPriority(selected, priority);
      toast.success('Priority updated');
      openDetail(selected);
    } catch { toast.error('Failed'); }
  };

  const handleReply = async () => {
    if (!reply.trim()) return;
    setReplying(true);
    try {
      await replySATicket(selected, { content: reply.trim(), isInternal });
      toast.success(isInternal ? 'Internal note added' : 'Reply sent');
      setReply('');
      setIsInternal(false);
      openDetail(selected);
    } catch { toast.error('Failed to send reply'); }
    finally { setReplying(false); }
  };

  // Parse stats from byStatus groupBy format
  const statCounts = stats ? {
    OPEN:           stats.byStatus?.find(s => s.status === 'OPEN')?._count        ?? 0,
    IN_PROGRESS:    stats.byStatus?.find(s => s.status === 'IN_PROGRESS')?._count ?? 0,
    WAITING_TENANT: stats.byStatus?.find(s => s.status === 'WAITING_TENANT')?._count ?? 0,
    RESOLVED:       stats.byStatus?.find(s => s.status === 'RESOLVED')?._count    ?? 0,
    CLOSED:         stats.byStatus?.find(s => s.status === 'CLOSED')?._count      ?? 0,
    total:          stats.byStatus?.reduce((a, s) => a + (s._count ?? 0), 0)      ?? 0,
  } : null;

  return (
    <div style={{ display: 'flex', height: '100vh' }}>

      {/* ── Left: List ────────────────────────────────────────────────────── */}
      <div style={{ flex: selected ? '0 0 42%' : '1', padding: 28, overflowY: 'auto', borderRight: selected ? '1px solid #1E2D3D' : 'none', transition: 'flex 0.2s' }}>

        {/* Stats bar */}
        {statCounts && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {[
              { label: 'Open',     val: statCounts.OPEN,           color: '#F87171' },
              { label: 'Working',  val: statCounts.IN_PROGRESS,    color: '#F59E0B' },
              { label: 'Waiting',  val: statCounts.WAITING_TENANT, color: '#60A5FA' },
              { label: 'Resolved', val: statCounts.RESOLVED,       color: '#34D399' },
              { label: 'Total',    val: statCounts.total,          color: '#64748B' },
            ].map(s => (
              <div key={s.label} style={{ background: `${s.color}11`, border: `1px solid ${s.color}33`, borderRadius: 10, padding: '10px 14px', flex: 1, minWidth: 60 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: 'var(--font-display)' }}>{s.val}</div>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#F1F5F9' }}>
            Support Tickets
          </h1>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
            <option value="">All Status</option>
            {Object.entries(STATUS_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div style={{ color: '#64748B', fontSize: 14 }}>Loading…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tickets.map(t => {
              const verdict = checkAccess(t.reporterRole, t.moduleKey);
              const statusMeta   = STATUS_META[t.status]   || { color: '#64748B', label: t.status };
              const priorityMeta = PRIORITY_META[t.priority] || { color: '#64748B', label: t.priority };
              return (
                <div
                  key={t.id}
                  onClick={() => openDetail(t.id)}
                  style={{
                    background: selected === t.id ? 'rgba(31,184,214,0.08)' : '#192533',
                    border: `1px solid ${selected === t.id ? '#1FB8D6' : '#1E2D3D'}`,
                    borderRadius: 10, padding: '13px 15px', cursor: 'pointer',
                    transition: 'all 0.12s',
                  }}
                >
                  {/* Row 1: ticket number + status + priority */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: '#1FB8D6', fontWeight: 700, fontFamily: 'monospace' }}>{t.ticketNumber}</span>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                      {/* Permission verdict pill */}
                      {verdict && (
                        <span style={{
                          padding: '1px 6px', borderRadius: 10, fontSize: 9, fontWeight: 700,
                          background: verdict.verdict === 'access' ? 'rgba(52,211,153,0.15)' : verdict.verdict === 'denied' ? 'rgba(245,158,11,0.15)' : 'rgba(100,116,139,0.15)',
                          color: verdict.verdict === 'access' ? '#34D399' : verdict.verdict === 'denied' ? '#F59E0B' : '#64748B',
                        }}>
                          {verdict.verdict === 'access' ? '✓ Legitimate' : verdict.verdict === 'denied' ? '⚠ Access Denied' : '? Unknown'}
                        </span>
                      )}
                      <Badge color={statusMeta.color}>{statusMeta.label}</Badge>
                      <Badge color={priorityMeta.color}>{priorityMeta.label}</Badge>
                    </div>
                  </div>

                  {/* Row 2: title */}
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9', marginBottom: 6, lineHeight: 1.3 }}>{t.title}</div>

                  {/* Row 3: tenant + role */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: '#64748B' }}>
                      {t.tenant?.name || 'Unknown'} · {t.tenant?.businessType}
                    </span>
                    {t.reporterRole && (
                      <>
                        <span style={{ fontSize: 10, color: '#1E2D3D' }}>·</span>
                        <RoleBadge role={t.reporterRole} />
                      </>
                    )}
                  </div>

                  {/* Row 4: module + feature */}
                  {(t.moduleKey || t.featureKey) && (
                    <div style={{ marginTop: 6 }}>
                      <ModuleBadge moduleKey={t.moduleKey} featureKey={t.featureKey} />
                    </div>
                  )}
                </div>
              );
            })}
            {tickets.length === 0 && (
              <div style={{ color: '#64748B', textAlign: 'center', padding: 40, fontSize: 14 }}>No tickets found</div>
            )}
          </div>
        )}
      </div>

      {/* ── Right: Detail ─────────────────────────────────────────────────── */}
      {selected && (
        <div style={{ flex: '0 0 58%', overflowY: 'auto', padding: 28, background: '#111C27', display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: '#1FB8D6', fontWeight: 700, fontFamily: 'monospace' }}>{detail?.ticketNumber}</span>
                <Badge color={STATUS_META[detail?.status]?.color || '#64748B'}>{STATUS_META[detail?.status]?.label || detail?.status}</Badge>
                <Badge color={PRIORITY_META[detail?.priority]?.color || '#64748B'}>{PRIORITY_META[detail?.priority]?.label || detail?.priority}</Badge>
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#F1F5F9', marginBottom: 4, lineHeight: 1.3 }}>
                {detail?.title}
              </h2>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                {detail?.tenant?.name}
                {detail?.tenant?.businessType && ` · ${detail.tenant.businessType}`}
                {detail?.reporterName && ` · Reported by ${detail.reporterName}`}
              </div>
            </div>
            <button onClick={() => { setSelected(null); setDetail(null); }} style={closeBtn}>✕</button>
          </div>

          {/* ── Permission Verdict ── */}
          {detail && (
            <PermissionVerdict
              reporterRole={detail.reporterRole}
              moduleKey={detail.moduleKey}
              featureKey={detail.featureKey}
            />
          )}

          {/* Controls */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={detail?.status || ''} onChange={e => handleStatusChange(e.target.value)} style={selectStyle}>
                {Object.entries(STATUS_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <select value={detail?.priority || ''} onChange={e => handlePriorityChange(e.target.value)} style={selectStyle}>
                {Object.entries(PRIORITY_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <label style={labelStyle}>Category</label>
              <span style={{ fontSize: 13, color: '#94A3B8', display: 'block', paddingTop: 6 }}>
                {CATEGORY_LABELS[detail?.category] || detail?.category}
              </span>
            </div>
          </div>

          {/* Thread */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {detail?.messages?.map(m => {
              const isSyl = m.senderType === 'SYLLABRIX';
              const isInt = m.isInternal;
              return (
                <div key={m.id} style={{
                  background: isInt ? 'rgba(167,139,250,0.07)' : isSyl ? 'rgba(31,184,214,0.07)' : '#192533',
                  border: `1px solid ${isInt ? '#A78BFA33' : isSyl ? '#1FB8D633' : '#1E2D3D'}`,
                  borderRadius: 10, padding: '12px 14px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: isSyl ? '#1FB8D6' : '#F1F5F9' }}>
                      {isSyl ? '🔵 ' : '👤 '}{m.senderName || m.senderType}
                      {isInt && <span style={{ color: '#A78BFA', marginLeft: 6, fontWeight: 500 }}>· Internal</span>}
                    </span>
                    <span style={{ fontSize: 11, color: '#475569' }}>{new Date(m.createdAt).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                    {/* Show description only, hide the auto-appended context block */}
                    {m.content.includes('\n---\n') ? m.content.split('\n---\n')[0] : m.content}
                  </div>
                  {/* Show context block as a collapsed info section */}
                  {m.content.includes('\n---\n') && (
                    <details style={{ marginTop: 8 }}>
                      <summary style={{ fontSize: 11, color: '#475569', cursor: 'pointer' }}>Context info</summary>
                      <pre style={{ fontSize: 11, color: '#64748B', marginTop: 6, fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                        {m.content.split('\n---\n')[1]}
                      </pre>
                    </details>
                  )}
                </div>
              );
            })}
            {!detail?.messages?.length && (
              <div style={{ color: '#64748B', fontSize: 13 }}>No messages yet.</div>
            )}
          </div>

          {/* Reply box */}
          <div style={{ background: '#192533', borderRadius: 10, border: '1px solid #1E2D3D', padding: 14, flexShrink: 0 }}>
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              placeholder={isInternal ? 'Add internal note (not shown to tenant)…' : 'Type your reply to the business…'}
              rows={3}
              style={{
                width: '100%', background: '#0B131C', border: '1px solid #1E2D3D',
                borderRadius: 8, color: '#F1F5F9', fontSize: 13, padding: '10px 12px',
                resize: 'vertical', fontFamily: 'var(--font-body)', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 12, color: '#A78BFA' }}>
                <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} style={{ accentColor: '#A78BFA' }} />
                Internal note (not visible to tenant)
              </label>
              <button
                onClick={handleReply}
                disabled={!reply.trim() || replying}
                style={{
                  padding: '8px 20px', border: 'none', borderRadius: 8,
                  background: reply.trim() ? (isInternal ? 'rgba(167,139,250,0.3)' : 'linear-gradient(135deg,#1FB8D6,#27DCFF)') : '#1E2D3D',
                  color: reply.trim() ? (isInternal ? '#A78BFA' : '#0B131C') : '#64748B',
                  fontWeight: 700, fontSize: 13, cursor: reply.trim() ? 'pointer' : 'not-allowed',
                  border: isInternal ? '1px solid #A78BFA55' : 'none',
                }}
              >
                {replying ? 'Sending…' : isInternal ? 'Add Note' : 'Send Reply'}
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

const selectStyle = {
  padding: '8px 12px', background: '#192533', border: '1px solid #1E2D3D',
  borderRadius: 8, color: '#F1F5F9', fontSize: 13, outline: 'none', cursor: 'pointer',
};
const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B',
  marginBottom: 4, letterSpacing: '0.06em', textTransform: 'uppercase',
};
const closeBtn = {
  background: '#1E2D3D', border: 'none', borderRadius: 6,
  color: '#64748B', width: 28, height: 28, cursor: 'pointer', fontSize: 14,
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};
