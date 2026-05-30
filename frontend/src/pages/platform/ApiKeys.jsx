import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api/v1', '/api/platform')
  : 'http://localhost:5000/api/platform';

const api = axios.create({ baseURL: BASE });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem('saToken');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

const SECTIONS = [
  {
    id: 'ai',
    title: 'AI Copilot',
    icon: '🤖',
    color: '#7C3AED',
    info: 'Priority order: Groq → Gemini → Anthropic. Falls back automatically if one is unavailable or quota-exhausted.',
    fields: [
      {
        key: 'groq_api_key', provider: 'groq',
        label: 'Groq', logo: '⚡', logoColor: '#F55036',
        description: 'LLaMA 3.3 70B · Free tier · 6,000 req/day · No billing required',
        placeholder: 'gsk_...', docsUrl: 'https://console.groq.com/keys',
        recommended: true, canTest: true, isSecret: true,
      },
      {
        key: 'gemini_api_key', provider: 'gemini',
        label: 'Google Gemini', logo: '✦', logoColor: '#4285F4',
        description: 'Gemini 2.0 Flash · Free tier available on Google AI Studio',
        placeholder: 'AIza...', docsUrl: 'https://aistudio.google.com/app/apikey',
        canTest: true, isSecret: true,
      },
      {
        key: 'anthropic_api_key', provider: 'anthropic',
        label: 'Anthropic Claude', logo: '◆', logoColor: '#D97706',
        description: 'Claude Haiku · $5 free trial credits · Pay-as-you-go after',
        placeholder: 'sk-ant-...', docsUrl: 'https://console.anthropic.com',
        canTest: true, isSecret: true,
      },
    ],
  },
  {
    id: 'payments',
    title: 'Payments — Razorpay',
    icon: '💳',
    color: '#0D6EFD',
    fields: [
      {
        key: 'razorpay_key_id',
        label: 'Key ID', logo: 'R', logoColor: '#0D6EFD',
        description: 'Starts with rzp_live_ (production) or rzp_test_ (sandbox)',
        placeholder: 'rzp_live_...', docsUrl: 'https://dashboard.razorpay.com/app/keys',
        isSecret: false,
      },
      {
        key: 'razorpay_key_secret',
        label: 'Key Secret', logo: '🔑', logoColor: '#0D6EFD',
        description: 'Keep private — never expose to the browser or client apps',
        placeholder: 'Key secret from Razorpay dashboard', docsUrl: 'https://dashboard.razorpay.com/app/keys',
        isSecret: true,
      },
      {
        key: 'razorpay_webhook_secret',
        label: 'Webhook Secret', logo: '🪝', logoColor: '#0D6EFD',
        description: 'Set this when creating a webhook in the Razorpay dashboard',
        placeholder: 'Webhook signing secret', docsUrl: 'https://dashboard.razorpay.com/app/webhooks',
        isSecret: true,
      },
    ],
  },
  {
    id: 'whatsapp',
    title: 'Messaging — WhatsApp / Meta',
    icon: '💬',
    color: '#25D366',
    fields: [
      {
        key: 'whatsapp_token',
        label: 'Access Token', logo: '🔐', logoColor: '#25D366',
        description: 'Permanent token from Meta Business Suite → WhatsApp → API Setup',
        placeholder: 'EAAx...', docsUrl: 'https://developers.facebook.com/apps/',
        isSecret: true,
      },
      {
        key: 'whatsapp_phone_id',
        label: 'Phone Number ID', logo: '📱', logoColor: '#25D366',
        description: 'Found under WhatsApp API Setup in Meta for Developers',
        placeholder: '1234567890', docsUrl: 'https://developers.facebook.com/apps/',
        isSecret: false,
      },
      {
        key: 'whatsapp_waba_id',
        label: 'WABA ID', logo: '🏢', logoColor: '#25D366',
        description: 'WhatsApp Business Account ID from Meta Business Suite',
        placeholder: '9876543210', docsUrl: 'https://business.facebook.com/',
        isSecret: false,
      },
      {
        key: 'whatsapp_webhook_secret',
        label: 'Webhook Verify Token', logo: '🔒', logoColor: '#25D366',
        description: 'Custom token you set when configuring the Meta webhook endpoint',
        placeholder: 'Your custom verify token', docsUrl: 'https://developers.facebook.com/apps/',
        isSecret: true,
      },
    ],
  },
  {
    id: 'smtp',
    title: 'Email — SMTP',
    icon: '📧',
    color: '#EA4335',
    fields: [
      {
        key: 'smtp_host',
        label: 'SMTP Host', logo: '🌐', logoColor: '#EA4335',
        description: 'e.g. smtp.gmail.com · smtp.sendgrid.net · mail.your-domain.com',
        placeholder: 'smtp.gmail.com',
        isSecret: false,
      },
      {
        key: 'smtp_port',
        label: 'SMTP Port', logo: '#', logoColor: '#EA4335',
        description: '587 (STARTTLS) · 465 (SSL/TLS) · 25 (unencrypted, not recommended)',
        placeholder: '587',
        isSecret: false,
      },
      {
        key: 'smtp_user',
        label: 'Username', logo: '👤', logoColor: '#EA4335',
        description: 'Usually your full email address (e.g. you@gmail.com)',
        placeholder: 'you@gmail.com',
        isSecret: false,
      },
      {
        key: 'smtp_pass',
        label: 'Password / App Password', logo: '🔑', logoColor: '#EA4335',
        description: 'For Gmail: use an App Password, not your account password',
        placeholder: 'App password or SMTP password',
        isSecret: true,
      },
      {
        key: 'from_email',
        label: 'From Email Address', logo: '✉️', logoColor: '#EA4335',
        description: 'Displayed as the sender on all outgoing emails from Syllabrix',
        placeholder: 'noreply@syllabrix.com',
        isSecret: false,
      },
    ],
  },
];

const S = {
  page:        { padding: 28, maxWidth: 900, margin: '0 auto' },
  h1:          { fontSize: 22, fontWeight: 700, color: 'var(--navy)', marginBottom: 4, fontFamily: 'var(--font-display)' },
  sub:         { fontSize: 13, color: '#6B7280', marginBottom: 28 },
  card:        { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: 22, marginBottom: 12 },
  header:      { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  provInfo:    { display: 'flex', alignItems: 'center', gap: 12 },
  logo:        (c) => ({ width: 38, height: 38, borderRadius: 9, background: `${c}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: c, fontWeight: 700, flexShrink: 0 }),
  label:       { fontSize: 14, fontWeight: 700, color: '#111827' },
  desc:        { fontSize: 12, color: '#6B7280', marginTop: 2 },
  badge:       (c) => ({ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: `${c}18`, color: c }),
  inputRow:    { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  input:       { flex: 1, minWidth: 180, padding: '9px 13px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontFamily: 'monospace', outline: 'none', background: '#F9FAFB' },
  btn:         (v) => ({
    padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', whiteSpace: 'nowrap', flexShrink: 0,
    ...(v === 'primary' && { background: 'var(--cyan)', color: '#fff' }),
    ...(v === 'ghost'   && { background: '#F3F4F6', color: '#374151' }),
    ...(v === 'danger'  && { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }),
  }),
  meta:        { fontSize: 12, color: '#9CA3AF', marginTop: 8 },
  status:      (s) => ({
    display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600,
    ...(s === 'valid'   && { color: '#059669' }),
    ...(s === 'invalid' && { color: '#DC2626' }),
    ...(s === 'testing' && { color: '#D97706' }),
  }),
  dot:         (s) => ({ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: s === 'valid' ? '#059669' : s === 'invalid' ? '#DC2626' : '#D97706' }),
  sectionWrap: { marginBottom: 32 },
  sectionHead: (c) => ({ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: `${c}10`, borderRadius: 10, marginBottom: 14, border: `1px solid ${c}30` }),
  sectionIcon: { fontSize: 18 },
  sectionTitle:(c) => ({ fontSize: 15, fontWeight: 700, color: c }),
  infoChip:    (c) => ({ fontSize: 12, color: c, background: `${c}12`, borderRadius: 8, padding: '4px 10px', marginLeft: 'auto' }),
  infoBox:     { background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#0369A1', marginBottom: 28 },
  divider:     { borderTop: '1px solid #F3F4F6', margin: '14px 0' },
};

function FieldCard({ field, savedData, onSaved }) {
  const [value, setValue]     = useState('');
  const [show, setShow]       = useState(!field.isSecret);
  const [saving, setSaving]   = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const hasValue  = savedData?.hasValue;
  const updatedAt = savedData?.updatedAt;
  const updatedBy = savedData?.updatedBy;

  const handleSave = async () => {
    if (!value.trim()) return toast.error('Enter a value first');
    setSaving(true);
    setTestResult(null);
    try {
      await api.put('/settings', { [field.key]: value.trim() });
      toast.success(`${field.label} saved`);
      setValue('');
      onSaved();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleTest = async () => {
    const keyToTest = value.trim() || null;
    if (!keyToTest && !hasValue) return toast.error('Enter or save a key first');
    setTesting(true);
    setTestResult(null);
    try {
      const r = await api.post('/settings/test-key', { provider: field.provider, key: keyToTest || '__saved__' });
      setTestResult({ status: 'valid', message: r.data.data?.message || 'Key is working' });
    } catch (e) {
      setTestResult({ status: 'invalid', message: e.response?.data?.message || 'Key test failed' });
    } finally { setTesting(false); }
  };

  const handleClear = async () => {
    if (!confirm(`Remove ${field.label}?`)) return;
    try {
      await api.put('/settings', { [field.key]: '' });
      toast.success(`${field.label} removed`);
      setValue('');
      setTestResult(null);
      onSaved();
    } catch { toast.error('Failed to remove value'); }
  };

  return (
    <div style={S.card}>
      <div style={S.header}>
        <div style={S.provInfo}>
          <div style={S.logo(field.logoColor)}>{field.logo}</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={S.label}>{field.label}</span>
              {field.recommended && <span style={S.badge('#059669')}>Recommended</span>}
              {hasValue && <span style={S.badge('#1FB8D6')}>Configured</span>}
            </div>
            <div style={S.desc}>{field.description}</div>
          </div>
        </div>
        {field.docsUrl && (
          <a href={field.docsUrl} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: 'var(--cyan)', textDecoration: 'none', fontWeight: 600, flexShrink: 0 }}>
            Open console →
          </a>
        )}
      </div>

      <div style={S.inputRow}>
        <input
          type={show ? 'text' : 'password'}
          placeholder={hasValue
            ? (field.isSecret ? '••••••  (saved — paste new value to replace)' : '(value saved — type to replace)')
            : field.placeholder}
          value={value}
          onChange={(e) => { setValue(e.target.value); setTestResult(null); }}
          style={S.input}
        />
        {field.isSecret && (
          <button style={S.btn('ghost')} onClick={() => setShow((v) => !v)}>
            {show ? 'Hide' : 'Show'}
          </button>
        )}
        {field.canTest && (
          <button style={S.btn('ghost')} onClick={handleTest} disabled={testing}>
            {testing ? 'Testing…' : 'Test'}
          </button>
        )}
        <button style={S.btn('primary')} onClick={handleSave} disabled={saving || !value.trim()}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        {hasValue && (
          <button style={S.btn('danger')} onClick={handleClear}>Remove</button>
        )}
      </div>

      {testResult && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={S.dot(testResult.status)} />
          <span style={S.status(testResult.status)}>{testResult.message}</span>
        </div>
      )}

      {(updatedAt || updatedBy) && (
        <div style={S.meta}>
          Last updated {updatedAt
            ? new Date(updatedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : '—'}
          {updatedBy ? ` by ${updatedBy}` : ''}
        </div>
      )}
    </div>
  );
}

function SectionBlock({ section, settings, onSaved }) {
  const getFieldData = (key) => settings.find((s) => s.key === key);
  const configuredCount = section.fields.filter((f) => getFieldData(f.key)?.hasValue).length;

  return (
    <div style={S.sectionWrap}>
      <div style={S.sectionHead(section.color)}>
        <span style={S.sectionIcon}>{section.icon}</span>
        <span style={S.sectionTitle(section.color)}>{section.title}</span>
        {configuredCount > 0 && (
          <span style={S.infoChip(section.color)}>
            {configuredCount}/{section.fields.length} configured
          </span>
        )}
      </div>

      {section.info && (
        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12, paddingLeft: 4 }}>
          {section.info}
        </div>
      )}

      {section.fields.map((field) => (
        <FieldCard
          key={field.key}
          field={field}
          savedData={getFieldData(field.key)}
          onSaved={onSaved}
        />
      ))}
    </div>
  );
}

export default function ApiKeys() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = async () => {
    try {
      const r = await api.get('/settings');
      setSettings(r.data.data || []);
    } catch { toast.error('Failed to load settings'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Loading…</div>
  );

  const totalConfigured = SECTIONS.reduce((acc, sec) =>
    acc + sec.fields.filter((f) => settings.find((s) => s.key === f.key)?.hasValue).length, 0);
  const totalFields = SECTIONS.reduce((acc, sec) => acc + sec.fields.length, 0);

  return (
    <div style={S.page}>
      <h1 style={S.h1}>API Keys & Integrations</h1>
      <p style={S.sub}>
        Manage all integration keys from one place. Changes take effect immediately — no server restart needed.
        {' '}<strong style={{ color: '#374151' }}>{totalConfigured}/{totalFields} configured.</strong>
      </p>

      <div style={S.infoBox}>
        Keys are stored encrypted in the database. They are never returned in full — only a "configured" status is shown.
        Paste a new value at any time to rotate a key.
      </div>

      {SECTIONS.map((section) => (
        <SectionBlock
          key={section.id}
          section={section}
          settings={settings}
          onSaved={load}
        />
      ))}
    </div>
  );
}
