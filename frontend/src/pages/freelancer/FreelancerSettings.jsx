import { useEffect, useState, useCallback } from 'react';
import { Save, RefreshCw, ToggleLeft, ToggleRight, Wifi, WifiOff, QrCode, Unlink } from 'lucide-react';
import { getSettings, updateSettings, getWAStatus, disconnectWA } from '../../api/freelancer';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const OR = '#f97316';
const TEXT = '#f1f5f9';
const MUTED = '#64748b';
const CARD = '#141414';
const BORDER = '#1e1e1e';
const GR = '#10b981';

const ALL_MODULES = [
  { key: 'jobs',      defaultLabel: 'Jobs',           description: 'Track all your work orders and projects', required: true  },
  { key: 'clients',   defaultLabel: 'Clients',        description: 'Manage your client contacts',             required: true  },
  { key: 'finance',   defaultLabel: 'Finance',        description: 'Full P&L, tally, and business overview',  required: true  },
  { key: 'expenses',  defaultLabel: 'Expenses',       description: 'Log and categorize your spending',        required: true  },
  { key: 'bills',     defaultLabel: 'Bills',          description: 'Pending payments and job profit report',  required: true  },
  { key: 'team',      defaultLabel: 'My Team',        description: 'Helpers (daily wage) and business partners', required: false },
  { key: 'suppliers', defaultLabel: 'Suppliers',      description: 'Material suppliers and credit tracking',  required: false },
  { key: 'tools',     defaultLabel: 'My Tools',       description: 'Equipment tracking and maintenance',      required: false },
  { key: 'amc',       defaultLabel: 'AMC Contracts',  description: 'Annual maintenance contract renewals',    required: false },
];

export default function FreelancerSettings() {
  const { tenant } = useAuth();
  const [activeModules, setActiveModules] = useState([]);
  const [moduleLabels, setModuleLabels] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getSettings()
      .then(r => {
        setActiveModules(r.data.activeModules || ALL_MODULES.map(m => m.key));
        setModuleLabels(r.data.moduleLabels || {});
      })
      .catch(() => toast.error('Could not load settings'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleModule = (key) => {
    setActiveModules(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const setLabel = (key, val) => {
    setModuleLabels(prev => ({ ...prev, [key]: val || undefined }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateSettings({ activeModules, moduleLabels });
      toast.success('Settings saved — reload the page to see updated sidebar');
    } catch {
      toast.error('Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ color: MUTED, fontSize: 14 }}>Loading settings…</div>;

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: TEXT, marginBottom: 3 }}>Settings</h1>
        <p style={{ fontSize: 13, color: MUTED }}>Choose which modules you need and rename them to fit your work</p>
      </div>

      {/* Profile summary */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '18px 22px', marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Your Account</div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: TEXT, marginBottom: 3 }}>{tenant?.name}</div>
            <div style={{ fontSize: 13, color: MUTED }}>{tenant?.email}</div>
            {tenant?.city && <div style={{ fontSize: 13, color: MUTED }}>{tenant.city}</div>}
          </div>
          {tenant?.syllabrixId && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Syllabrix ID</div>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: '#1FB8D6', background: 'rgba(31,184,214,0.08)', border: '1px solid rgba(31,184,214,0.2)', padding: '4px 10px', borderRadius: 7, letterSpacing: '0.05em' }}>
                {tenant.syllabrixId}
              </div>
              <div style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>Your unique platform ID</div>
            </div>
          )}
        </div>
      </div>

      {/* Module configuration */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 2 }}>Modules</div>
          <div style={{ fontSize: 12, color: MUTED }}>Toggle the modules you use. Required modules cannot be turned off.</div>
        </div>
        {ALL_MODULES.map((mod, i) => {
          const isActive = activeModules.includes(mod.key);
          const customLabel = moduleLabels[mod.key];
          return (
            <div key={mod.key} style={{ padding: '14px 20px', borderBottom: i < ALL_MODULES.length - 1 ? `1px solid ${BORDER}` : 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Toggle */}
              <button
                onClick={() => !mod.required && toggleModule(mod.key)}
                style={{ background: 'none', border: 'none', cursor: mod.required ? 'not-allowed' : 'pointer', padding: 0, flexShrink: 0, opacity: mod.required ? 0.5 : 1 }}
                title={mod.required ? 'This module is required' : ''}
              >
                {isActive
                  ? <ToggleRight size={28} color={OR} />
                  : <ToggleLeft size={28} color={MUTED} />
                }
              </button>

              {/* Label + description */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: isActive ? TEXT : MUTED }}>{mod.defaultLabel}</span>
                  {mod.required && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: `${OR}18`, color: OR, fontWeight: 600 }}>Required</span>}
                  {!isActive && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: '#1a1a1a', color: MUTED, fontWeight: 500 }}>Off</span>}
                </div>
                <div style={{ fontSize: 12, color: MUTED }}>{mod.description}</div>
              </div>

              {/* Custom name input */}
              {isActive && (
                <input
                  type="text"
                  value={customLabel || ''}
                  onChange={e => setLabel(mod.key, e.target.value)}
                  placeholder={`Rename (default: ${mod.defaultLabel})`}
                  style={{ padding: '6px 10px', background: '#0f0f0f', border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12, color: TEXT, outline: 'none', width: 160, flexShrink: 0 }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Save */}
      <button
        onClick={save}
        disabled={saving}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', background: OR, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
      >
        {saving ? <RefreshCw size={15} /> : <Save size={15} />}
        {saving ? 'Saving…' : 'Save Settings'}
      </button>

      <p style={{ fontSize: 12, color: MUTED, marginTop: 12 }}>After saving, reload the page to see your updated sidebar.</p>

      <WhatsAppConnect />
    </div>
  );
}

function WhatsAppConnect() {
  const [waStatus, setWaStatus] = useState(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [qrImg, setQrImg] = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await getWAStatus();
      setWaStatus(data);
      if (data.qr) {
        setQrImg(`https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=8&data=${encodeURIComponent(data.qr)}`);
      } else {
        setQrImg(null);
      }
    } catch { setWaStatus({ status: 'disconnected', hasQR: false }); }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Poll every 5s while QR pending, every 15s otherwise
    const interval = setInterval(fetchStatus, waStatus?.status === 'qr_pending' ? 5000 : 15000);
    return () => clearInterval(interval);
  }, [fetchStatus, waStatus?.status]);

  const handleDisconnect = async () => {
    if (!window.confirm('Unlink WhatsApp? Automation will stop sending messages.')) return;
    setDisconnecting(true);
    try {
      await disconnectWA();
      toast.success('WhatsApp unlinked');
      fetchStatus();
    } catch { toast.error('Could not disconnect'); }
    finally { setDisconnecting(false); }
  };

  const statusColor = { connected: '#4ade80', qr_pending: '#fbbf24', connecting: '#60a5fa', disconnected: '#ef4444' };
  const statusLabel = { connected: 'Connected', qr_pending: 'Scan QR to connect', connecting: 'Connecting…', disconnected: 'Not connected' };

  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden', marginTop: 24 }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 2 }}>WhatsApp Automation</div>
          <div style={{ fontSize: 12, color: MUTED }}>Link your WhatsApp to send job updates, payment receipts, and receive inquiries automatically</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor[waStatus?.status] || '#ef4444', display: 'inline-block' }} />
          <span style={{ fontSize: 12, color: statusColor[waStatus?.status] || '#ef4444', fontWeight: 500 }}>
            {statusLabel[waStatus?.status] || 'Not connected'}
          </span>
        </div>
      </div>

      <div style={{ padding: '20px 22px' }}>
        {waStatus?.status === 'connected' ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Wifi size={20} color="#4ade80" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>WhatsApp is active</div>
                <div style={{ fontSize: 12, color: MUTED }}>Clients will receive automatic updates from your number</div>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'transparent', border: '1px solid #ef4444', borderRadius: 8, color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              <Unlink size={13} /> {disconnecting ? 'Unlinking…' : 'Unlink WhatsApp'}
            </button>
          </div>
        ) : waStatus?.status === 'qr_pending' && qrImg ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <QrCode size={16} color={OR} />
              <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>Scan with WhatsApp to activate</span>
            </div>
            <img src={qrImg} width={280} height={280} alt="WhatsApp QR" style={{ borderRadius: 10, border: `2px solid ${BORDER}` }} />
            <div style={{ fontSize: 12, color: MUTED, textAlign: 'center' }}>
              On your phone → WhatsApp → <strong style={{ color: TEXT }}>⋮ Menu</strong> → <strong style={{ color: TEXT }}>Linked Devices</strong> → <strong style={{ color: TEXT }}>Link a Device</strong>
            </div>
            <div style={{ fontSize: 11, color: MUTED }}>QR refreshes automatically every 5 seconds</div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
              <WifiOff size={20} color={MUTED} />
              <div>
                <div style={{ fontSize: 13, color: TEXT }}>
                  {waStatus?.status === 'connecting' ? 'Connecting to WhatsApp…' : 'WhatsApp not linked'}
                </div>
                <div style={{ fontSize: 12, color: MUTED }}>
                  {waStatus?.status === 'connecting' ? 'Please wait, QR will appear shortly' : 'Click below to get your QR code'}
                </div>
              </div>
            </div>
            <button
              onClick={fetchStatus}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: OR, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              <QrCode size={13} /> Get QR Code
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
