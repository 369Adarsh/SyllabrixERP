import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const api = () => import('../../api/platform').then(m => m);

// Direct calls via platform axios
const loadFeatures  = (moduleKey) => import('../../api/platform').then(m => m.platformApi.get('/features', { params: moduleKey ? { moduleKey } : {} }));
const loadAdoption  = (moduleKey) => import('../../api/platform').then(m => m.platformApi.get('/features/adoption', { params: moduleKey ? { moduleKey } : {} }));
const toggleFeature = (featureKey, isActive) => import('../../api/platform').then(m => m.platformApi.patch(`/features/${featureKey}/toggle`, { isActive }));

const MODULE_LABELS = {
  'SYL-MOD-POS': { name: 'Point of Sale',      emoji: '🛒' },
  'SYL-MOD-INV': { name: 'Invoicing',           emoji: '🧾' },
  'SYL-MOD-STK': { name: 'Inventory',           emoji: '📦' },
  'SYL-MOD-CUS': { name: 'Customers',           emoji: '👥' },
  'SYL-MOD-EXP': { name: 'Expenses',            emoji: '💸' },
  'SYL-MOD-VND': { name: 'Vendors',             emoji: '🤝' },
  'SYL-MOD-ACC': { name: 'Accounts',            emoji: '📊' },
  'SYL-MOD-REP': { name: 'Reports',             emoji: '📈' },
  'SYL-MOD-STF': { name: 'Staff',               emoji: '👤' },
  'SYL-MOD-ATT': { name: 'Attendance',          emoji: '📅' },
  'SYL-MOD-PAY': { name: 'Payroll',             emoji: '💰' },
  'SYL-MOD-APT': { name: 'Appointments',        emoji: '📆' },
  'SYL-MOD-FEE': { name: 'Fees',                emoji: '🎓' },
  'SYL-MOD-STU': { name: 'Students',            emoji: '🎒' },
  'SYL-MOD-AST': { name: 'Assets',              emoji: '🏗' },
  'SYL-MOD-LSE': { name: 'Lease',               emoji: '🏠' },
  'SYL-MOD-MBR': { name: 'Membership Plans',    emoji: '⭐' },
  'SYL-MOD-WA':  { name: 'WhatsApp',            emoji: '💬' },
  'SYL-MOD-CMP': { name: 'Campaigns',           emoji: '📣' },
  'SYL-MOD-AIC': { name: 'AI Copilot',          emoji: '🤖' },
  'SYL-MOD-AUT': { name: 'Automation',          emoji: '⚡' },
  'SYL-MOD-B2B': { name: 'B2B Portal',          emoji: '🏢' },
  'SYL-MOD-TRN': { name: 'Training Plans',      emoji: '🏋️' },
};

const TIER_COLORS = {
  BASIC:      { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  STANDARD:   { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  ADVANCED:   { bg: '#FDF4FF', text: '#7E22CE', border: '#E9D5FF' },
  ENTERPRISE: { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
};

function TierBadge({ tier }) {
  const c = TIER_COLORS[tier] || TIER_COLORS.BASIC;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: c.bg, color: c.text, border: `1px solid ${c.border}`, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
      {tier}
    </span>
  );
}

function AdoptionBar({ percent }) {
  const color = percent >= 70 ? '#22C55E' : percent >= 40 ? '#F59E0B' : '#94A3B8';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: '#1E2D3D', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${percent}%`, background: color, borderRadius: 99, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 32, textAlign: 'right' }}>{percent}%</span>
    </div>
  );
}

export default function FeatureCatalog() {
  const [features, setFeatures]       = useState([]);
  const [adoption, setAdoption]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeModule, setActiveModule] = useState('');
  const [view, setView]               = useState('catalog'); // 'catalog' | 'adoption'
  const [togglingKey, setTogglingKey] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [fRes, aRes] = await Promise.all([
        loadFeatures(activeModule || null),
        loadAdoption(activeModule || null),
      ]);
      setFeatures(fRes.data.data || []);
      setAdoption(aRes.data.data || []);
    } catch {
      toast.error('Failed to load feature catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [activeModule]);

  const handleToggle = async (featureKey, currentState) => {
    setTogglingKey(featureKey);
    try {
      await toggleFeature(featureKey, !currentState);
      await load();
      toast.success(`Feature ${!currentState ? 'enabled' : 'disabled'} globally`);
    } catch {
      toast.error('Toggle failed');
    } finally {
      setTogglingKey(null);
    }
  };

  // Group by module then tier
  const modules = [...new Set(features.map(f => f.moduleKey))];
  const adoptionMap = Object.fromEntries(adoption.map(a => [a.featureKey, a]));

  const grouped = modules.reduce((acc, mod) => {
    acc[mod] = ['BASIC', 'STANDARD', 'ADVANCED', 'ENTERPRISE'].reduce((tAcc, tier) => {
      tAcc[tier] = features.filter(f => f.moduleKey === mod && f.tier === tier);
      return tAcc;
    }, {});
    return acc;
  }, {});

  const totalFeatures   = features.length;
  const activeFeatures  = features.filter(f => f.isActive).length;
  const avgAdoption     = adoption.length > 0 ? Math.round(adoption.reduce((s, a) => s + a.adoptionPercent, 0) / adoption.length) : 0;

  return (
    <div style={{ padding: 32, color: '#E2E8F0', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
              🎛 Feature Catalog
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748B' }}>
              All module features — manage tiers, toggle global availability, view adoption.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 4, background: '#0B131C', borderRadius: 8, padding: 3 }}>
            <button onClick={() => setView('catalog')} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: view === 'catalog' ? '#1E2D3D' : 'transparent', color: view === 'catalog' ? '#fff' : '#64748B' }}>Catalog</button>
            <button onClick={() => setView('adoption')} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: view === 'adoption' ? '#1E2D3D' : 'transparent', color: view === 'adoption' ? '#27DCFF' : '#64748B' }}>Adoption</button>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 20 }}>
          {[
            { label: 'Total Features',    value: totalFeatures },
            { label: 'Active Globally',   value: `${activeFeatures} / ${totalFeatures}` },
            { label: 'Avg. Adoption',     value: `${avgAdoption}%` },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#0B131C', border: '1px solid #1E2D3D', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{stat.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#27DCFF' }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Module filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={() => setActiveModule('')}
          style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${activeModule === '' ? '#27DCFF' : '#1E2D3D'}`, background: activeModule === '' ? '#0E3344' : '#0B131C', color: activeModule === '' ? '#27DCFF' : '#64748B', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
          All Modules
        </button>
        {Object.entries(MODULE_LABELS).map(([key, info]) => (
          <button key={key} onClick={() => setActiveModule(key)}
            style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${activeModule === key ? '#27DCFF' : '#1E2D3D'}`, background: activeModule === key ? '#0E3344' : '#0B131C', color: activeModule === key ? '#27DCFF' : '#64748B', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{info.emoji}</span> {info.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 64, color: '#475569' }}>Loading feature catalog…</div>
      ) : view === 'adoption' ? (
        /* ── ADOPTION VIEW ── */
        <div style={{ background: '#0B131C', border: '1px solid #1E2D3D', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', background: '#0D1D2B', borderBottom: '1px solid #1E2D3D', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr', gap: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Feature</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tier</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tenants</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Adoption</span>
          </div>
          {adoption.sort((a, b) => b.adoptionPercent - a.adoptionPercent).map(f => (
            <div key={f.featureKey} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr', gap: 12, padding: '12px 20px', borderBottom: '1px solid #0F1923', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0', marginBottom: 2 }}>{f.name}</div>
                <div style={{ fontSize: 11, color: '#475569', fontFamily: 'var(--font-mono)' }}>{f.featureKey}</div>
              </div>
              <TierBadge tier={f.tier} />
              <span style={{ fontSize: 13, color: '#94A3B8' }}>{f.adoptionCount} / {f.totalTenants}</span>
              <AdoptionBar percent={f.adoptionPercent} />
            </div>
          ))}
        </div>
      ) : (
        /* ── CATALOG VIEW ── */
        modules.map(mod => (
          <div key={mod} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 18 }}>{MODULE_LABELS[mod]?.emoji || '📦'}</span>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff' }}>{MODULE_LABELS[mod]?.name || mod}</h2>
              <span style={{ fontSize: 11, color: '#475569', fontFamily: 'var(--font-mono)' }}>{mod}</span>
            </div>

            {['BASIC', 'STANDARD', 'ADVANCED', 'ENTERPRISE'].map(tier => {
              const tierFeatures = grouped[mod]?.[tier] || [];
              if (tierFeatures.length === 0) return null;
              const tc = TIER_COLORS[tier];
              return (
                <div key={tier} style={{ marginBottom: 12, borderRadius: 10, border: '1px solid #1E2D3D', overflow: 'hidden' }}>
                  <div style={{ padding: '8px 16px', background: '#0B131C', borderBottom: '1px solid #1E2D3D', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <TierBadge tier={tier} />
                    <span style={{ fontSize: 12, color: '#64748B' }}>{tierFeatures.length} features</span>
                  </div>
                  {tierFeatures.map(f => {
                    const ad = adoptionMap[f.featureKey];
                    return (
                      <div key={f.featureKey} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', borderBottom: '1px solid #0F1923', background: f.isActive ? 'transparent' : '#0D0F14' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: f.isActive ? '#E2E8F0' : '#475569' }}>{f.name}</span>
                            {f.dependencies?.length > 0 && (
                              <span style={{ fontSize: 10, color: '#475569', background: '#0B131C', border: '1px solid #1E2D3D', padding: '1px 6px', borderRadius: 4 }}>
                                deps: {f.dependencies.join(', ')}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: '#475569', fontFamily: 'var(--font-mono)' }}>{f.featureKey}</div>
                          {f.description && <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{f.description}</div>}
                        </div>

                        {ad && (
                          <div style={{ width: 120, flexShrink: 0 }}>
                            <div style={{ fontSize: 10, color: '#475569', marginBottom: 2 }}>{ad.adoptionCount} tenants</div>
                            <AdoptionBar percent={ad.adoptionPercent} />
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <span style={{ fontSize: 11, color: f.isActive ? '#22C55E' : '#EF4444', fontWeight: 600 }}>
                            {f.isActive ? 'ACTIVE' : 'DISABLED'}
                          </span>
                          <button
                            onClick={() => handleToggle(f.featureKey, f.isActive)}
                            disabled={togglingKey === f.featureKey}
                            title={f.isActive ? 'Disable globally' : 'Enable globally'}
                            style={{ width: 40, height: 22, borderRadius: 99, border: 'none', cursor: 'pointer', background: f.isActive ? '#22C55E' : '#1E2D3D', position: 'relative', transition: 'background 0.2s', opacity: togglingKey === f.featureKey ? 0.5 : 1 }}>
                            <span style={{ position: 'absolute', top: 3, left: f.isActive ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', display: 'block', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
