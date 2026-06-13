import { useEffect, useState, useCallback } from 'react';
import { ToggleLeft, ToggleRight, Send, Clock, Users, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import {
  getWAStatus, disconnectWA,
  getWaSettings, updateWaSettings,
  previewBroadcast, sendBroadcast, listBroadcasts,
} from '../../api/freelancer';
import toast from 'react-hot-toast';

const OR    = '#f97316';
const TEXT  = '#f1f5f9';
const MUTED = '#64748b';
const CARD  = '#141414';
const BORDER= '#1e1e1e';
const WA    = '#25D366';

// ── Helpers ───────────────────────────────────────────────────────────────────
function Toggle({ value, onChange, disabled }) {
  return (
    <button onClick={() => !disabled && onChange(!value)}
      style={{ background: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', padding: 0, opacity: disabled ? 0.4 : 1 }}>
      {value ? <ToggleRight size={30} color={WA} /> : <ToggleLeft size={30} color={MUTED} />}
    </button>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</div>
      </div>
      <div style={{ padding: '18px 20px' }}>{children}</div>
    </div>
  );
}

function TemplateField({ label, field, value, placeholder, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 10, borderTop: `1px solid ${BORDER}`, paddingTop: 10 }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: MUTED, fontSize: 12, padding: 0 }}>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {open ? 'Hide custom message' : 'Customise message (optional)'}
      </button>
      {open && (
        <div style={{ marginTop: 8 }}>
          <textarea
            value={value || ''}
            onChange={e => onChange(field, e.target.value || null)}
            placeholder={placeholder}
            rows={3}
            style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: '#0f0f0f', border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12, color: TEXT, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
          />
          <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>
            Variables: <code style={{ color: WA }}>{'{name}'}</code> <code style={{ color: WA }}>{'{biz}'}</code> <code style={{ color: WA }}>{'{jobNumber}'}</code> <code style={{ color: WA }}>{'{work}'}</code> <code style={{ color: WA }}>{'{amount}'}</code> <code style={{ color: WA }}>{'{status}'}</code>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FreelancerWhatsApp() {
  const [waStatus, setWaStatus] = useState(null);
  const [settings, setSettings] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [tab, setTab]           = useState('automation');

  const fetchWaStatus = useCallback(async () => {
    try { const { data } = await getWAStatus(); setWaStatus(data); } catch { setWaStatus({ status: 'disconnected' }); }
  }, []);

  const fetchSettings = useCallback(async () => {
    try { const { data } = await getWaSettings(); setSettings(data); } catch { toast.error('Could not load WA settings'); }
  }, []);

  useEffect(() => { fetchWaStatus(); fetchSettings(); }, [fetchWaStatus, fetchSettings]);

  const setField = (key, val) => setSettings(s => ({ ...s, [key]: val }));

  const save = async () => {
    setSaving(true);
    try { await updateWaSettings(settings); toast.success('Saved'); }
    catch { toast.error('Could not save'); }
    finally { setSaving(false); }
  };

  const isConnected = waStatus?.status === 'connected';

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: TEXT, marginBottom: 2 }}>WhatsApp Automation</h1>
        <p style={{ fontSize: 13, color: MUTED }}>Control what gets automated and send bulk messages to your clients</p>
      </div>

      {/* Connection status bar */}
      <div style={{ background: CARD, border: `1px solid ${isConnected ? WA + '40' : BORDER}`, borderRadius: 12, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: isConnected ? WA : '#ef4444', display: 'inline-block', flexShrink: 0 }} />
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: isConnected ? WA : '#ef4444' }}>
              {isConnected ? 'WhatsApp Connected' : 'WhatsApp Not Connected'}
            </span>
            <div style={{ fontSize: 11, color: MUTED }}>
              {isConnected ? 'Automation is active — messages will be sent automatically' : 'Go to Settings → link your WhatsApp number first'}
            </div>
          </div>
        </div>
        {isConnected && (
          <button onClick={async () => { if (!window.confirm('Unlink WhatsApp?')) return; await disconnectWA().catch(() => {}); fetchWaStatus(); }}
            style={{ fontSize: 11, color: '#ef4444', background: 'transparent', border: '1px solid #ef444440', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
            Unlink
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: '#111', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[{k:'automation',l:'Automation'},{k:'broadcast',l:'Bulk Broadcast'}].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            style={{ padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: tab === t.k ? CARD : 'transparent', color: tab === t.k ? OR : MUTED }}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'automation' && settings && (
        <AutomationTab settings={settings} setField={setField} saving={saving} onSave={save} isConnected={isConnected} />
      )}
      {tab === 'broadcast' && (
        <BroadcastTab isConnected={isConnected} />
      )}
    </div>
  );
}

// ── Automation Tab ────────────────────────────────────────────────────────────
function AutomationTab({ settings, setField, saving, onSave, isConnected }) {
  const automations = [
    {
      key: 'notifyNewJob', msgKey: 'msgNewJob',
      label: 'New Job Created',
      desc: 'Client gets a message when you create a new job for them',
      placeholder: 'Hi {name}! Your job {jobNumber} ({work}) has been created. We\'ll keep you updated. — {biz}',
    },
    {
      key: 'notifyStatus', msgKey: 'msgStatus',
      label: 'Job Status Update',
      desc: 'Client is notified every time job status changes (In Progress, Completed, etc.)',
      placeholder: '{emoji} Status update for job {jobNumber}: *{status}*. — {biz}',
    },
    {
      key: 'notifyPayment', msgKey: 'msgPayment',
      label: 'Payment Received',
      desc: 'Client gets a receipt when you record a payment',
      placeholder: '✅ Payment of {amount} received for job {jobNumber}. Thank you! — {biz}',
    },
    {
      key: 'notifyAmcRenewal', msgKey: 'msgAmcRenewal',
      label: 'AMC Renewal Reminder',
      desc: 'Client gets reminder 30 days and 7 days before their AMC contract expires',
      placeholder: 'Hi {name}, your AMC contract is expiring soon. Please contact us to renew. — {biz}',
    },
  ];

  return (
    <>
      {automations.map(a => (
        <Section key={a.key} title={a.label}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <Toggle value={settings[a.key]} onChange={v => setField(a.key, v)} disabled={!isConnected} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: TEXT, fontWeight: 500, marginBottom: 3 }}>{a.label}</div>
              <div style={{ fontSize: 12, color: MUTED }}>{a.desc}</div>
              <TemplateField label={a.label} field={a.msgKey} value={settings[a.msgKey]} placeholder={a.placeholder} onChange={setField} />
            </div>
          </div>
        </Section>
      ))}

      <Section title="Follow-Up Automation">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
          <Toggle value={settings.followUpEnabled} onChange={v => setField('followUpEnabled', v)} disabled={!isConnected} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: TEXT, fontWeight: 500, marginBottom: 2 }}>Job Completion Follow-Up</div>
            <div style={{ fontSize: 12, color: MUTED }}>Auto-send a thank you / feedback request message after job is completed</div>
            {settings.followUpEnabled && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: MUTED }}>Send after</span>
                <input type="number" min={1} max={30} value={settings.followUpDays} onChange={e => setField('followUpDays', Number(e.target.value))}
                  style={{ width: 60, padding: '5px 8px', background: '#0f0f0f', border: `1px solid ${BORDER}`, borderRadius: 6, color: TEXT, fontSize: 12, outline: 'none' }} />
                <span style={{ fontSize: 12, color: MUTED }}>day(s)</span>
              </div>
            )}
            <TemplateField field="followUpMsg" value={settings.followUpMsg} placeholder="Hi {name}, thank you for choosing {biz} for job {jobNumber}! We'd love your feedback. 🙏" onChange={setField} />
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <Toggle value={settings.payReminderEnabled} onChange={v => setField('payReminderEnabled', v)} disabled={!isConnected} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: TEXT, fontWeight: 500, marginBottom: 2 }}>Payment Reminder</div>
            <div style={{ fontSize: 12, color: MUTED }}>Auto-send a payment reminder if balance is still due after job completion</div>
            {settings.payReminderEnabled && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: MUTED }}>Remind after</span>
                <input type="number" min={1} max={30} value={settings.payReminderDays} onChange={e => setField('payReminderDays', Number(e.target.value))}
                  style={{ width: 60, padding: '5px 8px', background: '#0f0f0f', border: `1px solid ${BORDER}`, borderRadius: 6, color: TEXT, fontSize: 12, outline: 'none' }} />
                <span style={{ fontSize: 12, color: MUTED }}>day(s) after completion</span>
              </div>
            )}
            <TemplateField field="payReminderMsg" value={settings.payReminderMsg} placeholder="Hi {name}, a gentle reminder for payment on job {jobNumber}. Please clear when convenient. — {biz}" onChange={setField} />
          </div>
        </div>
      </Section>

      <button onClick={onSave} disabled={saving}
        style={{ padding: '11px 28px', background: WA, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
        {saving ? 'Saving…' : 'Save Automation Settings'}
      </button>
      {!isConnected && (
        <p style={{ fontSize: 12, color: '#fbbf24', marginTop: 10 }}>⚠️ Connect your WhatsApp first — go to Settings page</p>
      )}
    </>
  );
}

// ── Broadcast Tab ─────────────────────────────────────────────────────────────
function BroadcastTab({ isConnected }) {
  const [filter, setFilter]   = useState('all');
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState(null);
  const [history, setHistory] = useState([]);
  const [sending, setSending] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const FILTERS = [
    { key: 'all',             label: 'All Clients',       desc: 'Every client in your contacts' },
    { key: 'pending_payment', label: 'Pending Payment',   desc: 'Clients with outstanding balance' },
    { key: 'active_jobs',     label: 'Active Jobs',       desc: 'Clients with ongoing work' },
    { key: 'amc',             label: 'AMC Clients',       desc: 'All your AMC contract holders' },
  ];

  const loadPreview = async () => {
    setLoadingPreview(true);
    try { const { data } = await previewBroadcast(filter); setPreview(data); }
    catch { toast.error('Could not load preview'); }
    finally { setLoadingPreview(false); }
  };

  const loadHistory = async () => {
    try { const { data } = await listBroadcasts(); setHistory(data); setShowHistory(true); }
    catch { toast.error('Could not load history'); }
  };

  const send = async () => {
    if (!message.trim()) return toast.error('Please write a message');
    if (!preview) return toast.error('Please preview recipients first');
    if (!preview.count) return toast.error('No recipients match this filter');
    if (!window.confirm(`Send to ${preview.count} contact(s)? This cannot be undone.`)) return;

    setSending(true);
    try {
      const { data } = await sendBroadcast({ message, filter });
      toast.success(`Sent to ${data.sentCount} contacts${data.failCount ? `, ${data.failCount} failed` : ''}`);
      setMessage('');
      setPreview(null);
    } catch { toast.error('Broadcast failed'); }
    finally { setSending(false); }
  };

  return (
    <div>
      <Section title="Who to Message">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => { setFilter(f.key); setPreview(null); }}
              style={{ padding: '12px 14px', textAlign: 'left', background: filter === f.key ? `${WA}15` : '#0f0f0f', border: `1.5px solid ${filter === f.key ? WA : BORDER}`, borderRadius: 10, cursor: 'pointer' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: filter === f.key ? WA : TEXT, marginBottom: 2 }}>{f.label}</div>
              <div style={{ fontSize: 11, color: MUTED }}>{f.desc}</div>
            </button>
          ))}
        </div>
        <button onClick={loadPreview} disabled={loadingPreview}
          style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 12, cursor: 'pointer' }}>
          <Users size={13} /> {loadingPreview ? 'Loading…' : 'Preview Recipients'}
        </button>
        {preview && (
          <div style={{ marginTop: 12, padding: '12px 14px', background: '#0f0f0f', borderRadius: 10, border: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: WA, marginBottom: 8 }}>{preview.count} recipient{preview.count !== 1 ? 's' : ''}</div>
            {preview.sample?.map((s, i) => (
              <div key={i} style={{ fontSize: 12, color: MUTED, marginBottom: 2 }}>
                {s.name} · {s.phone}{s.ref ? ` · ${s.ref}` : ''}
              </div>
            ))}
            {preview.count > 5 && <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>…and {preview.count - 5} more</div>}
          </div>
        )}
      </Section>

      <Section title="Your Message">
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder={`Write your message here…\n\nUse {name} for client name, {ref} for job/contract reference.\n\nExample: Hi {name}! We have a special offer this month. Contact us for details! 😊`}
          rows={6}
          style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', background: '#0f0f0f', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, color: TEXT, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
        />
        <div style={{ fontSize: 11, color: MUTED, marginTop: 6 }}>
          Messages are sent 1 per second to avoid WhatsApp ban. Large broadcasts may take a few minutes.
        </div>
      </Section>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <button onClick={send} disabled={sending || !isConnected}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', background: isConnected ? WA : MUTED, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: (sending || !isConnected) ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1 }}>
          {sending ? <RefreshCw size={15} /> : <Send size={15} />}
          {sending ? 'Sending…' : 'Send Broadcast'}
        </button>
        <button onClick={loadHistory}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 10, color: MUTED, fontSize: 13, cursor: 'pointer' }}>
          <Clock size={13} /> History
        </button>
      </div>

      {!isConnected && (
        <p style={{ fontSize: 12, color: '#fbbf24', marginTop: -10, marginBottom: 16 }}>⚠️ Connect your WhatsApp first — go to Settings page</p>
      )}

      {showHistory && (
        <Section title="Broadcast History">
          {history.length === 0 ? (
            <p style={{ fontSize: 13, color: MUTED }}>No broadcasts sent yet.</p>
          ) : history.map(b => (
            <div key={b.id} style={{ borderBottom: `1px solid ${BORDER}`, paddingBottom: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: b.status === 'DONE' ? '#4ade80' : OR }}>{b.status}</span>
                <span style={{ fontSize: 11, color: MUTED }}>{new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>Filter: {b.filter} · Sent: {b.sentCount}{b.failCount ? ` · Failed: ${b.failCount}` : ''}</div>
              <div style={{ fontSize: 12, color: TEXT, background: '#0f0f0f', padding: '8px 10px', borderRadius: 6, whiteSpace: 'pre-wrap' }}>{b.message.slice(0, 120)}{b.message.length > 120 ? '…' : ''}</div>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}
