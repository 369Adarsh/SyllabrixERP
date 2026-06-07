import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTRStats, listTRs, promoteTR, implementTR, getTRSettings, updateTRSettings } from '../../api/platform';
import toast from 'react-hot-toast';

const STATUS_META = {
  DRAFT:                  { label: 'Draft',              color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
  APPROVED:               { label: 'Approved',           color: '#1FB8D6', bg: 'rgba(31,184,214,0.12)'  },
  DEVELOPMENT:            { label: 'Development',        color: '#64748B', bg: 'rgba(100,116,139,0.12)' },
  TESTING:                { label: 'Testing',            color: '#EAB308', bg: 'rgba(234,179,8,0.12)'   },
  IN_QUALITY_RECEIVED:    { label: 'Received',           color: '#F97316', bg: 'rgba(249,115,22,0.12)'  },
  IN_QUALITY:             { label: 'In Quality',         color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  IN_PRODUCTION_RECEIVED: { label: 'Received',           color: '#F97316', bg: 'rgba(249,115,22,0.12)'  },
  IN_PRODUCTION:          { label: 'Production',         color: '#34D399', bg: 'rgba(52,211,153,0.12)'  },
  ROLLED_BACK:            { label: 'Rolled Back',        color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
};

const CATEGORY_COLOR = {
  FEATURE: '#1FB8D6', BUGFIX: '#F87171', ENHANCEMENT: '#A78BFA', CONFIG: '#94A3B8', HOTFIX: '#EF4444',
};

const PRIORITY_COLOR = { CRITICAL: '#EF4444', HIGH: '#F97316', MEDIUM: '#EAB308', LOW: '#64748B' };

const NEXT_LABEL = { APPROVED: 'Development', DEVELOPMENT: 'Testing', TESTING: 'Quality', IN_QUALITY: 'Production' };
const IMPLEMENT_LABEL = { IN_QUALITY_RECEIVED: 'Quality', IN_PRODUCTION_RECEIVED: 'Production' };

export default function TransportManager() {
  const navigate  = useNavigate();
  const [trs, setTrs]             = useState([]);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [promoting, setPromoting] = useState(null);
  const [implementing, setImplementing] = useState(null);
  const [activeEnv, setActiveEnv] = useState('DEV');
  const [settings, setSettings]   = useState({ autoImplementQuality: false, autoImplementProduction: false });
  const [pushBanner, setPushBanner] = useState(null); // 'quality' | 'production' | null

  const load = async () => {
    setLoading(true);
    try {
      const [trRes, statsRes, settingsRes] = await Promise.all([listTRs(), getTRStats(), getTRSettings()]);
      setTrs(trRes.data.data || []);
      setStats(statsRes.data.data);
      setSettings(settingsRes.data.data);
    } catch { toast.error('Failed to load transport requests'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = trs.filter((tr) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return tr.trCode.toLowerCase().includes(s) || tr.title.toLowerCase().includes(s) || tr.businessTypeCode.toLowerCase().includes(s);
  });

  const byStatus = (status) => filtered.filter((tr) => tr.status === status);

  const handlePromote = async (tr) => {
    const nextLabel = NEXT_LABEL[tr.status];
    if (!window.confirm(`Push "${tr.trCode}" to ${nextLabel}?`)) return;
    setPromoting(tr.id);
    try {
      await promoteTR(tr.id);
      if (tr.status === 'TESTING') {
        setPushBanner('quality');
        setActiveEnv('QUALITY');
        setTimeout(() => setPushBanner(null), 8000);
      } else if (tr.status === 'IN_QUALITY') {
        setPushBanner('production');
        setActiveEnv('PRODUCTION');
        setTimeout(() => setPushBanner(null), 8000);
      }
      toast.success(`${tr.trCode} pushed to ${nextLabel}`);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Promotion failed'); }
    finally    { setPromoting(null); }
  };

  const handleImplement = async (tr) => {
    setImplementing(tr.id);
    try {
      await implementTR(tr.id);
      toast.success(`${tr.trCode} implemented in ${IMPLEMENT_LABEL[tr.status]}`);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Implement failed'); }
    finally    { setImplementing(null); }
  };

  const handleToggleSetting = async (key) => {
    const newVal = !settings[key];
    try {
      await updateTRSettings({ [key]: newVal });
      setSettings((s) => ({ ...s, [key]: newVal }));
      toast.success(`Auto-implement ${newVal ? 'enabled' : 'disabled'}`);
    } catch { toast.error('Failed to update settings'); }
  };

  const TRCard = ({ tr }) => {
    const isProduction = tr.status === 'IN_PRODUCTION';
    const isReceived   = tr.status === 'IN_QUALITY_RECEIVED' || tr.status === 'IN_PRODUCTION_RECEIVED';
    const canPromote   = !!NEXT_LABEL[tr.status] && !tr.scopeLocked && !isProduction && !isReceived;
    return (
      <div
        onClick={() => navigate(`/platform/transport/${tr.id}`)}
        style={{ background: '#192533', border: `1px solid ${isProduction ? 'rgba(52,211,153,0.25)' : '#1E2D3D'}`, borderRadius: 10, padding: '14px 16px', cursor: 'pointer', transition: 'border-color 0.15s', marginBottom: 10 }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = isProduction ? '#34D399' : '#1FB8D6'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = isProduction ? 'rgba(52,211,153,0.25)' : '#1E2D3D'}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#1FB8D6', fontWeight: 700 }}>{tr.trCode}</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {isProduction && <span style={{ fontSize: 9, fontWeight: 700, color: '#34D399', background: 'rgba(52,211,153,0.15)', padding: '2px 7px', borderRadius: 99, letterSpacing: '0.08em' }}>LIVE</span>}
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLOR[tr.priority], flexShrink: 0 }} title={tr.priority} />
          </div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0', marginBottom: 10, lineHeight: 1.4 }}>{tr.title}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: CATEGORY_COLOR[tr.category], background: `${CATEGORY_COLOR[tr.category]}18`, padding: '2px 7px', borderRadius: 99 }}>{tr.category}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#64748B', background: '#0F1923', padding: '2px 7px', borderRadius: 99, fontFamily: 'var(--font-mono)' }}>{tr.businessTypeCode}</span>
          {tr.scopeLocked && <span style={{ fontSize: 10, fontWeight: 700, color: '#F97316', background: 'rgba(249,115,22,0.12)', padding: '2px 7px', borderRadius: 99 }}>LOCKED</span>}
          {tr.crNumber && <span style={{ fontSize: 10, fontWeight: 600, color: '#1FB8D6', background: 'rgba(31,184,214,0.08)', padding: '2px 7px', borderRadius: 99, fontFamily: 'var(--font-mono)' }}>{tr.crNumber}</span>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#64748B' }}>{new Date(tr.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
          {isProduction ? (
            <span style={{ fontSize: 11, color: '#34D399', fontWeight: 600 }}>Rollback only</span>
          ) : isReceived ? (
            <button onClick={(e) => { e.stopPropagation(); handleImplement(tr); }}
              disabled={implementing === tr.id}
              style={{ padding: '4px 12px', fontSize: 11, fontWeight: 700, background: 'rgba(249,115,22,0.15)', border: '1px solid #F97316', color: '#F97316', borderRadius: 6, cursor: 'pointer' }}>
              {implementing === tr.id ? '…' : 'Implement'}
            </button>
          ) : canPromote ? (
            <button onClick={(e) => { e.stopPropagation(); handlePromote(tr); }}
              disabled={promoting === tr.id || tr.scopeLocked}
              style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, background: tr.scopeLocked ? 'rgba(249,115,22,0.1)' : 'rgba(31,184,214,0.1)', border: `1px solid ${tr.scopeLocked ? '#F97316' : '#1FB8D6'}`, color: tr.scopeLocked ? '#F97316' : '#1FB8D6', borderRadius: 6, cursor: tr.scopeLocked ? 'not-allowed' : 'pointer' }}>
              {promoting === tr.id ? '…' : tr.scopeLocked ? 'Locked' : `→ ${NEXT_LABEL[tr.status]}`}
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  const EnvBlock = ({ label, branch, color, borderColor, children, fullWidth }) => (
    <div style={{ background: '#0F1923', border: `1px solid ${borderColor}`, borderRadius: 12, padding: 16, flex: fullWidth ? '0 0 100%' : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${borderColor}` }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, color: '#334155', background: '#192533', padding: '2px 8px', borderRadius: 99 }}>branch: {branch}</span>
      </div>
      {children}
    </div>
  );

  const KanbanCol = ({ status }) => {
    const meta  = STATUS_META[status];
    const items = byStatus(status);
    return (
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: meta.color, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{meta.label}</span>
          <span style={{ background: meta.bg, color: meta.color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>{items.length}</span>
        </div>
        {items.length === 0 ? (
          <div style={{ border: '1px dashed #1E2D3D', borderRadius: 10, padding: '18px 12px', textAlign: 'center', color: '#334155', fontSize: 12 }}>No TRs</div>
        ) : items.map((tr) => <TRCard key={tr.id} tr={tr} />)}
      </div>
    );
  };

  return (
    <div style={{ padding: 28, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>Transport Manager</h1>
          <p style={{ fontSize: 13, color: '#64748B' }}>Track, promote, and rollback every change across Dev → Quality → Production</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/platform/transport/environments')} style={ghostBtn}>Environments</button>
          <button onClick={() => navigate('/platform/transport/new')}
            style={{ padding: '8px 18px', background: 'linear-gradient(135deg,#1FB8D6,#27DCFF)', border: 'none', borderRadius: 8, color: '#0B131C', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            + New TR
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total TRs',   value: stats.total,        color: '#94A3B8' },
            { label: 'Draft',       value: stats.draft,        color: '#94A3B8' },
            { label: 'Approved',    value: stats.approved,     color: '#1FB8D6' },
            { label: 'Development', value: stats.development,  color: '#64748B' },
            { label: 'Testing',     value: stats.testing,      color: '#EAB308' },
            { label: 'In Quality',  value: stats.inQuality,    color: '#A78BFA' },
            { label: 'Production',  value: stats.inProduction, color: '#34D399' },
          ].map((s) => (
            <div key={s.label} style={{ background: '#192533', border: '1px solid #1E2D3D', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#64748B', marginTop: 2, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Environment Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: '#192533', border: '1px solid #1E2D3D', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[
          { key: 'DEV',        label: 'DEV',        branch: 'dev',     color: '#64748B' },
          { key: 'QUALITY',    label: 'Quality',    branch: 'quality', color: '#A78BFA' },
          { key: 'PRODUCTION', label: 'Production', branch: 'main',    color: '#34D399' },
          { key: 'ALL',        label: 'All',        branch: null,      color: '#94A3B8' },
        ].map(({ key, label, branch, color }) => (
          <button key={key} onClick={() => setActiveEnv(key)}
            style={{
              padding: '8px 20px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
              background: activeEnv === key ? `${color}20` : 'transparent',
              color: activeEnv === key ? color : '#64748B',
            }}>
            {label}
            {branch && <span style={{ marginLeft: 6, fontSize: 10, color: activeEnv === key ? `${color}99` : '#334155', fontFamily: 'var(--font-mono)' }}>:{branch}</span>}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by TR code, title, or business type…"
          style={inputStyle} />
      </div>

      {loading ? (
        <div style={{ color: '#64748B', fontSize: 14, textAlign: 'center', paddingTop: 60 }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* DEV view */}
          {(activeEnv === 'DEV' || activeEnv === 'ALL') && (
            <EnvBlock label="DEV" branch="dev" color="#64748B" borderColor="#1E2D3D">
              {(byStatus('DRAFT').length > 0 || byStatus('APPROVED').length > 0) && (
                <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px dashed #1E2D3D' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#334155', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Intake — Awaiting Development</div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <KanbanCol status="DRAFT" />
                    <KanbanCol status="APPROVED" />
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 16 }}>
                <KanbanCol status="DEVELOPMENT" />
                <KanbanCol status="TESTING" />
              </div>
            </EnvBlock>
          )}

          {/* QUALITY view */}
          {(activeEnv === 'QUALITY' || activeEnv === 'ALL') && (
            <EnvBlock label="Quality" branch="quality" color="#A78BFA" borderColor="rgba(167,139,250,0.25)">
              {pushBanner === 'quality' && (
                <div style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#F97316', fontWeight: 600 }}>TR pushed to Quality — verify receipt below and click Implement to begin testing</span>
                  <button onClick={() => setPushBanner(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 16 }}>✕</button>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: '#64748B' }}>RECEIVED TRs must be implemented before quality testing begins</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Auto-implement</span>
                  <Toggle checked={settings.autoImplementQuality} onChange={() => handleToggleSetting('autoImplementQuality')} />
                </label>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <KanbanCol status="IN_QUALITY_RECEIVED" />
                <KanbanCol status="IN_QUALITY" />
              </div>
            </EnvBlock>
          )}

          {/* PRODUCTION view */}
          {(activeEnv === 'PRODUCTION' || activeEnv === 'ALL') && (
            <EnvBlock label="Production" branch="main" color="#34D399" borderColor="rgba(52,211,153,0.25)">
              {pushBanner === 'production' && (
                <div style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#F97316', fontWeight: 600 }}>TR pushed to Production — verify receipt below and click Implement to go LIVE</span>
                  <button onClick={() => setPushBanner(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 16 }}>✕</button>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: '#64748B' }}>RECEIVED TRs must be implemented before going LIVE. Rollback only after implementation.</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Auto-implement</span>
                  <Toggle checked={settings.autoImplementProduction} onChange={() => handleToggleSetting('autoImplementProduction')} />
                </label>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <KanbanCol status="IN_PRODUCTION_RECEIVED" />
                <KanbanCol status="IN_PRODUCTION" />
              </div>
            </EnvBlock>
          )}

          {/* Rolled Back */}
          {filtered.filter((t) => t.status === 'ROLLED_BACK').length > 0 && (activeEnv === 'ALL' || activeEnv === 'PRODUCTION') && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#F87171', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Rolled Back</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {filtered.filter((t) => t.status === 'ROLLED_BACK').map((tr) => (
                  <div key={tr.id} onClick={() => navigate(`/platform/transport/${tr.id}`)}
                    style={{ background: '#192533', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '12px 14px', cursor: 'pointer', opacity: 0.7 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#F87171', marginBottom: 4 }}>{tr.trCode}</div>
                    <div style={{ fontSize: 12, color: '#94A3B8' }}>{tr.title}</div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 6 }}>{tr.rolledBackReason || 'No reason given'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const Toggle = ({ checked, onChange }) => (
  <div onClick={onChange} style={{ width: 36, height: 20, borderRadius: 99, background: checked ? '#1FB8D6' : '#1E2D3D', border: `1px solid ${checked ? '#1FB8D6' : '#334155'}`, cursor: 'pointer', position: 'relative', transition: 'all 0.2s', flexShrink: 0 }}>
    <div style={{ position: 'absolute', top: 2, left: checked ? 17 : 2, width: 14, height: 14, borderRadius: '50%', background: checked ? '#0B131C' : '#64748B', transition: 'left 0.2s' }} />
  </div>
);

const inputStyle = { padding: '8px 14px', background: '#192533', border: '1px solid #1E2D3D', borderRadius: 8, color: '#F1F5F9', fontSize: 13, outline: 'none', width: 340 };
const ghostBtn   = { padding: '8px 16px', background: 'transparent', border: '1px solid #1E2D3D', borderRadius: 8, color: '#94A3B8', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
