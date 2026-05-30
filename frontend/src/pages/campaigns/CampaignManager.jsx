import { useState, useEffect, useCallback } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { P } from '../../styles/page';
import { getCampaigns, createCampaign, deleteCampaign, previewCampaignSegment, getCampaignRecipients, markCampaignSent } from '../../api';
import { Megaphone, Plus, Send, Trash2, X, Users, CheckCircle, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import BroadcastLauncher from '../../components/BroadcastLauncher';
import toast from 'react-hot-toast';

const SEGMENTS = [
  { value: 'ALL',           label: 'All customers',        desc: 'Everyone with a phone number' },
  { value: 'EXPIRING_7',   label: 'Expiring in 7 days',   desc: 'Active subscriptions expiring within a week' },
  { value: 'EXPIRING_30',  label: 'Expiring in 30 days',  desc: 'Active subscriptions expiring this month' },
  { value: 'INACTIVE_30',  label: 'Inactive 30 days',     desc: 'No visit in the past 30 days' },
  { value: 'INACTIVE_60',  label: 'Inactive 60 days',     desc: 'No visit in the past 60 days — win-back' },
  { value: 'VIP',          label: 'VIP customers',        desc: 'Top 20% by total spending' },
  { value: 'BIRTHDAY_MONTH', label: 'Birthday this month', desc: 'Customers whose birthday is this month' },
];

const STATUS_META = {
  DRAFT:   { bg: '#F3F4F6', color: '#6B7280', label: 'Draft',   icon: Clock },
  SENDING: { bg: '#EFF6FF', color: '#2563EB', label: 'Sending', icon: RefreshCw },
  SENT:    { bg: '#ECFDF5', color: '#059669', label: 'Sent',    icon: CheckCircle },
  FAILED:  { bg: '#FEF2F2', color: '#DC2626', label: 'Failed',  icon: AlertTriangle },
};

const TEMPLATES = [
  { label: 'Renewal reminder', text: 'Hi {{name}}, your subscription with {{businessName}} is expiring soon. Please renew to continue enjoying our services. Contact us today! 🙏' },
  { label: 'Win-back offer',   text: 'Hi {{name}}, we miss you at {{businessName}}! 😊 Come back and get a special discount on your next visit. We look forward to seeing you!' },
  { label: 'Birthday offer',   text: 'Happy Birthday {{name}}! 🎂 {{businessName}} wishes you a wonderful day. Enjoy a special birthday offer — visit us and celebrate!' },
  { label: 'Promotional',      text: 'Hi {{name}}, {{businessName}} has an exciting offer just for you! Visit us this week for exclusive deals. Don\'t miss out! 🎉' },
  { label: 'Custom',           text: '' },
];

function CreateCampaignModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', segment: 'ALL', message: '' });
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [template, setTemplate] = useState(0);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const loadPreview = useCallback(async (seg) => {
    setPreviewLoading(true);
    try {
      const r = await previewCampaignSegment(seg);
      setPreview(r.data.data?.count ?? 0);
    } catch { setPreview(null); }
    finally { setPreviewLoading(false); }
  }, []);

  useEffect(() => { loadPreview(form.segment); }, [form.segment, loadPreview]);

  const applyTemplate = (idx) => {
    setTemplate(idx);
    setForm((f) => ({ ...f, message: TEMPLATES[idx].text }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) return toast.error('Name and message are required');
    setLoading(true);
    try {
      await createCampaign(form);
      toast.success('Campaign created');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 600, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>New Campaign</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Input label="Campaign name *" placeholder="May Renewal Drive, Birthday Offers..." value={form.name} onChange={set('name')} />

          {/* Segment picker */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Target audience *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {SEGMENTS.map((seg) => (
                <label key={seg.value} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10,
                  border: `1.5px solid ${form.segment === seg.value ? 'var(--cyan)' : 'var(--border)'}`,
                  background: form.segment === seg.value ? 'rgba(31,184,214,0.05)' : '#fff', cursor: 'pointer',
                }}>
                  <input type="radio" name="segment" value={seg.value} checked={form.segment === seg.value}
                    onChange={set('segment')} style={{ marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{seg.label}</div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{seg.desc}</div>
                  </div>
                </label>
              ))}
            </div>
            {preview !== null && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: previewLoading ? '#9CA3AF' : '#059669', fontWeight: 600 }}>
                <Users size={13} />
                {previewLoading ? 'Counting...' : `${preview} recipient${preview !== 1 ? 's' : ''} in this segment`}
              </div>
            )}
          </div>

          {/* Message template */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Message template</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {TEMPLATES.map((t, i) => (
                <button key={i} type="button" onClick={() => applyTemplate(i)}
                  style={{ padding: '4px 10px', borderRadius: 8, border: `1px solid ${template === i ? 'var(--cyan)' : 'var(--border)'}`,
                    background: template === i ? 'rgba(31,184,214,0.1)' : '#fff', fontSize: 12, cursor: 'pointer',
                    color: template === i ? 'var(--navy)' : '#6B7280', fontWeight: template === i ? 600 : 400 }}>
                  {t.label}
                </button>
              ))}
            </div>
            <textarea value={form.message} onChange={set('message')} rows={5}
              placeholder="Hi {{name}}, this message is from {{businessName}}..."
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, resize: 'vertical', fontFamily: 'var(--font-body)', boxSizing: 'border-box', lineHeight: 1.6 }} />
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
              Variables: <code>{'{{name}}'}</code> · <code>{'{{businessName}}'}</code> · <code>{'{{expiryDate}}'}</code>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Create campaign</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CampaignManager() {
  const { isMobile } = useBreakpoint();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [launching, setLaunching] = useState(null); // { campaign, recipients }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getCampaigns();
      setCampaigns(r.data.data || []);
    } catch { toast.error('Failed to load campaigns'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSend = async (campaign) => {
    try {
      toast.loading('Loading recipients…', { id: 'rc' });
      const r = await getCampaignRecipients(campaign.id);
      toast.dismiss('rc');
      const { recipients } = r.data.data;
      if (!recipients.length) { toast.error('No recipients with phone numbers in this segment'); return; }
      setLaunching({ campaign, recipients });
    } catch (err) {
      toast.dismiss('rc');
      toast.error(err.response?.data?.message || 'Failed to load recipients');
    }
  };

  const handleBroadcastComplete = async ({ sent, skipped }) => {
    if (launching?.campaign) {
      try { await markCampaignSent(launching.campaign.id, { sent, failed: skipped }); } catch { /* non-critical */ }
      load();
    }
    setLaunching(null);
    toast.success(`Broadcast complete — ${sent} sent, ${skipped} skipped`);
  };

  const handleDelete = async (campaign) => {
    if (!window.confirm(`Delete "${campaign.name}"?`)) return;
    try {
      await deleteCampaign(campaign.id);
      toast.success('Campaign deleted');
      load();
    } catch { toast.error('Failed'); }
  };

  const totalSent = campaigns.reduce((s, c) => s + (c.sentCount || 0), 0);
  const totalCampaigns = campaigns.length;
  const sentCampaigns = campaigns.filter((c) => c.status === 'SENT').length;

  return (
    <div style={{ ...P.wrap(isMobile), maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={P.head}>
        <div>
          <h1 style={P.h1(isMobile)}>Campaign Manager</h1>
          <p style={P.sub}>Send targeted WhatsApp messages to customer segments</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus size={16} style={{ marginRight: 6 }} />New Campaign</Button>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total campaigns', value: totalCampaigns, icon: Megaphone, color: 'var(--navy)' },
          { label: 'Campaigns sent', value: sentCampaigns, icon: CheckCircle, color: '#059669' },
          { label: 'Messages delivered', value: totalSent.toLocaleString('en-IN'), icon: Send, color: 'var(--cyan)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Icon size={16} color={color} />
              <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>{label}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--navy)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Campaign list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#9CA3AF' }}>Loading...</div>
      ) : campaigns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 64, color: '#9CA3AF', background: '#FAFAFA', borderRadius: 16, border: '2px dashed var(--border)' }}>
          <Megaphone size={40} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.25 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>No campaigns yet</div>
          <div style={{ fontSize: 14, marginBottom: 20 }}>Create your first campaign to reach customers via WhatsApp</div>
          <Button onClick={() => setShowCreate(true)}><Plus size={14} style={{ marginRight: 6 }} />Create first campaign</Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {campaigns.map((campaign) => {
            const meta = STATUS_META[campaign.status] || STATUS_META.DRAFT;
            const StatusIcon = meta.icon;
            const seg = SEGMENTS.find((s) => s.value === campaign.segment);
            return (
              <div key={campaign.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>{campaign.name}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: meta.bg, color: meta.color, fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>
                        <StatusIcon size={10} />{meta.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#6B7280', marginBottom: 10 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={11} />{seg?.label || campaign.segment}</span>
                      {campaign.status === 'SENT' && (
                        <>
                          <span style={{ color: '#059669', fontWeight: 600 }}>✓ {campaign.sentCount} sent</span>
                          {campaign.failedCount > 0 && <span style={{ color: '#DC2626' }}>✗ {campaign.failedCount} failed</span>}
                          {campaign.sentAt && <span>· {new Date(campaign.sentAt).toLocaleDateString('en-IN')}</span>}
                        </>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, background: '#F9FAFB', padding: '10px 12px', borderRadius: 8, maxHeight: 60, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {campaign.message}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginLeft: 16, flexShrink: 0 }}>
                    {(campaign.status === 'DRAFT' || campaign.status === 'SENT') && (
                      <button onClick={() => handleSend(campaign)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#25D366', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        <Send size={13} />{campaign.status === 'SENT' ? 'Send Again' : 'Launch Broadcast'}
                      </button>
                    )}
                    <button onClick={() => handleDelete(campaign)} style={{ background: 'none', border: '1px solid #FCA5A5', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', color: '#DC2626' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Help box */}
      <div style={{ marginTop: 28, background: '#EFF6FF', borderRadius: 12, padding: '16px 20px', border: '1px solid #BFDBFE' }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#1D4ED8', marginBottom: 6 }}>💡 Campaign tips</div>
        <ul style={{ fontSize: 13, color: '#3730A3', paddingLeft: 18, lineHeight: 2, margin: 0 }}>
          <li>Use <strong>Expiring in 7 days</strong> to automatically remind subscribers before renewal</li>
          <li>Use <strong>Birthday this month</strong> to send birthday offers — drives 3× more conversions</li>
          <li>Use <strong>Inactive 60 days</strong> with a special offer to win back lost customers</li>
          <li>Personalise with <code>{'{{name}}'}</code> — messages with names get 40% higher open rates</li>
        </ul>
      </div>

      {showCreate && (
        <CreateCampaignModal
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); load(); }}
        />
      )}

      {launching && (
        <BroadcastLauncher
          title={launching.campaign.name}
          recipients={launching.recipients}
          onClose={() => setLaunching(null)}
          onComplete={handleBroadcastComplete}
        />
      )}
    </div>
  );
}
