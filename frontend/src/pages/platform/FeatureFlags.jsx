import { useEffect, useState } from 'react';
import { getSAFeatureFlags, toggleSAFeatureFlag, getSATenantModules, setSATenantModule } from '../../api/platform';
import { getSATenants } from '../../api/platform';
import toast from 'react-hot-toast';

const getSATenantsList = (search) =>
  import('../../api/platform').then(m => m.getSAPlansOverview({ search, limit: 20 }));

export default function FeatureFlags() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingKey, setTogglingKey] = useState(null);
  const [killModal, setKillModal] = useState(null); // { moduleKey, label, currentState }
  const [reason, setReason] = useState('');

  // Per-tenant section
  const [tenantSearch, setTenantSearch] = useState('');
  const [tenantResults, setTenantResults] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [tenantModules, setTenantModules] = useState(null);
  const [tenantLoading, setTenantLoading] = useState(false);
  const [overrideLoading, setOverrideLoading] = useState(null);

  const loadFlags = async () => {
    setLoading(true);
    try {
      const r = await getSAFeatureFlags();
      setFlags(r.data.data);
    } catch { toast.error('Failed to load feature flags'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadFlags(); }, []);

  useEffect(() => {
    if (!tenantSearch || tenantSearch.length < 2) { setTenantResults([]); return; }
    const t = setTimeout(() => {
      getSATenantsList(tenantSearch)
        .then(r => setTenantResults(r.data.data?.tenants || []))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [tenantSearch]);

  const openKillModal = (flag) => {
    setKillModal(flag);
    setReason('');
  };

  const confirmToggle = async () => {
    if (!killModal) return;
    setTogglingKey(killModal.key);
    try {
      await toggleSAFeatureFlag(killModal.key, !killModal.isEnabled, reason);
      toast.success(`${killModal.label} ${killModal.isEnabled ? 'disabled' : 'enabled'} globally`);
      setKillModal(null);
      loadFlags();
    } catch { toast.error('Failed to toggle flag'); }
    finally { setTogglingKey(null); }
  };

  const selectTenant = async (tenant) => {
    setSelectedTenant(tenant);
    setTenantSearch(tenant.name);
    setTenantResults([]);
    setTenantLoading(true);
    try {
      const r = await getSATenantModules(tenant.id);
      setTenantModules(r.data.data);
    } catch { toast.error('Failed to load tenant modules'); }
    finally { setTenantLoading(false); }
  };

  const handleTenantModuleToggle = async (moduleKey, currentlyEnabled) => {
    if (!selectedTenant) return;
    setOverrideLoading(moduleKey);
    try {
      await setSATenantModule(selectedTenant.id, moduleKey, currentlyEnabled ? 'disable' : 'enable');
      toast.success(`Module ${currentlyEnabled ? 'disabled' : 'enabled'} for ${selectedTenant.name}`);
      const r = await getSATenantModules(selectedTenant.id);
      setTenantModules(r.data.data);
    } catch { toast.error('Failed to update tenant module'); }
    finally { setOverrideLoading(null); }
  };

  const disabledCount = flags.filter(f => !f.isEnabled).length;

  return (
    <div style={{ padding: 28, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: '#F1F5F9' }}>
            Feature Flags
          </h1>
          {disabledCount > 0 && (
            <span style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, border: '1px solid rgba(248,113,113,0.3)' }}>
              {disabledCount} MODULE{disabledCount > 1 ? 'S' : ''} DISABLED
            </span>
          )}
        </div>
        <p style={{ color: '#64748B', fontSize: 14 }}>
          Global toggles affect all tenants instantly. Per-tenant overrides only affect that business.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* LEFT — Global Flags */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 16 }}>🌐</span>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9' }}>Global Module Flags</h2>
            <span style={{ fontSize: 12, color: '#64748B', marginLeft: 4 }}>SUPER only</span>
          </div>

          {loading ? (
            <div style={{ color: '#64748B', fontSize: 14 }}>Loading…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {flags.map(flag => (
                <div key={flag.key} style={{
                  background: flag.isEnabled ? '#192533' : 'rgba(248,113,113,0.06)',
                  border: `1px solid ${flag.isEnabled ? '#1E2D3D' : 'rgba(248,113,113,0.25)'}`,
                  borderRadius: 10, padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{flag.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: flag.isEnabled ? '#F1F5F9' : '#F87171' }}>
                        {flag.label}
                      </span>
                      {!flag.isEnabled && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#F87171', background: 'rgba(248,113,113,0.15)', padding: '1px 6px', borderRadius: 4, letterSpacing: '0.08em' }}>
                          DISABLED
                        </span>
                      )}
                    </div>
                    {!flag.isEnabled && flag.toggledBy && (
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                        by {flag.toggledBy} · {flag.reason || 'No reason given'}
                      </div>
                    )}
                  </div>

                  {/* Toggle switch */}
                  <button
                    onClick={() => openKillModal(flag)}
                    disabled={togglingKey === flag.key}
                    style={{
                      width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: flag.isEnabled ? '#1FB8D6' : '#374151',
                      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 3, left: flag.isEnabled ? 22 : 3,
                      width: 18, height: 18, borderRadius: '50%',
                      background: '#fff', transition: 'left 0.2s',
                    }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — Per-Tenant Overrides */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 16 }}>🏢</span>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9' }}>Per-Tenant Module Override</h2>
          </div>

          {/* Tenant search */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <input
              value={tenantSearch}
              onChange={e => { setTenantSearch(e.target.value); setSelectedTenant(null); setTenantModules(null); }}
              placeholder="Search tenant by name or email…"
              style={{
                width: '100%', padding: '9px 14px',
                background: '#192533', border: '1px solid #1E2D3D',
                borderRadius: 8, color: '#F1F5F9', fontSize: 14, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {tenantResults.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                background: '#192533', border: '1px solid #1E2D3D', borderRadius: 8,
                marginTop: 4, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}>
                {tenantResults.map(t => (
                  <button key={t.id} onClick={() => selectTenant(t)} style={{
                    width: '100%', padding: '10px 14px', textAlign: 'left',
                    background: 'transparent', border: 'none', borderBottom: '1px solid #1E2D3D',
                    cursor: 'pointer', color: '#F1F5F9',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1E2D3D'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{t.businessType} · {t.syllabrixId || t.email}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tenant module list */}
          {!selectedTenant && !tenantLoading && (
            <div style={{ background: '#192533', border: '1px solid #1E2D3D', borderRadius: 10, padding: 32, textAlign: 'center', color: '#475569' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 13 }}>Search and select a tenant to manage their modules</div>
            </div>
          )}

          {tenantLoading && (
            <div style={{ color: '#64748B', fontSize: 14, padding: 20, textAlign: 'center' }}>Loading tenant modules…</div>
          )}

          {tenantModules && !tenantLoading && (
            <div style={{ background: '#192533', border: '1px solid #1E2D3D', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #1E2D3D', background: '#111C27' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>{tenantModules.name}</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>{tenantModules.businessType} · {Array.isArray(tenantModules.modules) ? tenantModules.modules.length : 0} modules active</div>
              </div>
              <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                {flags.map(flag => {
                  const enabled = Array.isArray(tenantModules.modules) && tenantModules.modules.includes(flag.key);
                  const globallyDisabled = !flag.isEnabled;
                  return (
                    <div key={flag.key} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                      borderBottom: '1px solid #1E2D3D',
                      opacity: globallyDisabled ? 0.5 : 1,
                    }}>
                      <span style={{ fontSize: 15, width: 22, textAlign: 'center' }}>{flag.icon}</span>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: enabled ? '#F1F5F9' : '#64748B' }}>
                        {flag.label}
                      </span>
                      {globallyDisabled && (
                        <span style={{ fontSize: 10, color: '#F87171', fontWeight: 700 }}>GLOBAL OFF</span>
                      )}
                      <button
                        onClick={() => !globallyDisabled && handleTenantModuleToggle(flag.key, enabled)}
                        disabled={overrideLoading === flag.key || globallyDisabled}
                        style={{
                          width: 40, height: 22, borderRadius: 11, border: 'none',
                          cursor: globallyDisabled ? 'not-allowed' : 'pointer',
                          background: enabled ? '#1FB8D6' : '#374151',
                          position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                        }}
                      >
                        <div style={{
                          position: 'absolute', top: 3, left: enabled ? 20 : 3,
                          width: 16, height: 16, borderRadius: '50%',
                          background: '#fff', transition: 'left 0.2s',
                        }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Kill Switch Confirmation Modal */}
      {killModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setKillModal(null)}>
          <div style={{
            background: '#192533', border: `1px solid ${killModal.isEnabled ? 'rgba(248,113,113,0.4)' : 'rgba(31,184,214,0.4)'}`,
            borderRadius: 16, padding: 28, width: 420, maxWidth: '90vw',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 32, marginBottom: 12, textAlign: 'center' }}>
              {killModal.isEnabled ? '⚠️' : '✅'}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9', textAlign: 'center', marginBottom: 8, fontFamily: 'var(--font-display)' }}>
              {killModal.isEnabled ? `Disable ${killModal.label} globally?` : `Re-enable ${killModal.label} globally?`}
            </h3>
            <p style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', marginBottom: 20 }}>
              {killModal.isEnabled
                ? 'This will immediately hide this module from all tenants across the platform.'
                : 'This will restore this module for all tenants who have it enabled.'}
            </p>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={killModal.isEnabled ? 'Reason for disabling (optional)…' : 'Reason for re-enabling (optional)…'}
              rows={2}
              style={{
                width: '100%', padding: '9px 12px', boxSizing: 'border-box',
                background: '#111C27', border: '1px solid #1E2D3D',
                borderRadius: 8, color: '#F1F5F9', fontSize: 13, resize: 'none', outline: 'none',
                marginBottom: 20,
              }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setKillModal(null)} style={{
                flex: 1, padding: '10px', background: '#1E2D3D', border: 'none',
                borderRadius: 8, color: '#94A3B8', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={confirmToggle} disabled={togglingKey === killModal.key} style={{
                flex: 1, padding: '10px',
                background: killModal.isEnabled ? 'rgba(248,113,113,0.2)' : 'rgba(31,184,214,0.2)',
                border: `1px solid ${killModal.isEnabled ? 'rgba(248,113,113,0.4)' : 'rgba(31,184,214,0.4)'}`,
                borderRadius: 8,
                color: killModal.isEnabled ? '#F87171' : '#1FB8D6',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}>
                {togglingKey === killModal.key ? 'Applying…' : killModal.isEnabled ? 'Disable Module' : 'Enable Module'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
