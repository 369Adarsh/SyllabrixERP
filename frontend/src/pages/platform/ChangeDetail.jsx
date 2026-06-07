import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCR, approveCR, rejectCR, downloadCRDocument } from '../../api/platform';
import toast from 'react-hot-toast';

const STATUS_META = {
  DRAFT:          { label: 'Draft',          color: '#94A3B8' },
  APPROVED:       { label: 'Approved',       color: '#1FB8D6' },
  IN_DEVELOPMENT: { label: 'In Development', color: '#EAB308' },
  COMPLETED:      { label: 'Completed',      color: '#34D399' },
  REJECTED:       { label: 'Rejected',       color: '#F87171' },
};

const LOG_ICON = {
  CREATED:        '✦',
  APPROVED:       '✔',
  REJECTED:       '✕',
  LINKED_TO_TR:   '→',
  STATUS_CHANGED: '·',
};

const PRIORITY_COLOR = { CRITICAL: '#EF4444', HIGH: '#F97316', MEDIUM: '#EAB308', LOW: '#64748B' };

export default function ChangeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cr, setCR]           = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [tab, setTab]         = useState('document'); // document | audit
  const [rejectModal, setRejectModal]   = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    try {
      const { data } = await getCR(id);
      setCR(data.data);
    } catch { toast.error('Failed to load change request'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleApprove = async () => {
    if (!window.confirm(`Approve "${cr.crCode}: ${cr.title}"? This will allow development to proceed.`)) return;
    setWorking(true);
    try {
      await approveCR(id);
      toast.success(`${cr.crCode} approved`);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Approval failed'); }
    finally    { setWorking(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return toast.error('Please enter a reason');
    setWorking(true);
    try {
      await rejectCR(id, rejectReason);
      toast.success(`${cr.crCode} rejected`);
      setRejectModal(false);
      setRejectReason('');
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Rejection failed'); }
    finally    { setWorking(false); }
  };

  const handleDownload = async () => {
    try {
      const { data } = await downloadCRDocument(id);
      const url  = URL.createObjectURL(new Blob([data], { type: 'text/markdown' }));
      const link = document.createElement('a');
      link.href     = url;
      link.download = `${cr.crCode}.md`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`${cr.crCode}.md downloaded`);
    } catch (e) { toast.error(e.response?.data?.message || 'Download failed'); }
  };

  if (loading) return <div style={{ padding: 40, color: '#64748B', fontSize: 14 }}>Loading…</div>;
  if (!cr)     return <div style={{ padding: 40, color: '#F87171', fontSize: 14 }}>Change request not found</div>;

  const sm       = STATUS_META[cr.status] || STATUS_META.DRAFT;
  const isDraft  = cr.status === 'DRAFT';
  const isApproved = ['APPROVED', 'IN_DEVELOPMENT', 'COMPLETED'].includes(cr.status);

  return (
    <div style={{ padding: 28, maxWidth: 900, margin: '0 auto' }}>
      {/* Back */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={() => navigate('/platform/changes')} style={backBtn}>← All Changes</button>
        <span style={{ color: '#334155', fontSize: 13 }}>/</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#1FB8D6' }}>{cr.crCode}</span>
      </div>

      {/* Title + Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#64748B' }}>{cr.crCode}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: cr.type === 'CR' ? '#A78BFA' : '#1FB8D6', background: cr.type === 'CR' ? 'rgba(167,139,250,0.12)' : 'rgba(31,184,214,0.12)', padding: '2px 9px', borderRadius: 99 }}>
              {cr.type === 'CR' ? 'Change Request' : 'Enhancement'}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: sm.color, background: `${sm.color}18`, padding: '2px 9px', borderRadius: 99 }}>
              {sm.label}
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#F1F5F9', lineHeight: 1.3 }}>
            {cr.title}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {isApproved && (
            <button onClick={handleDownload}
              style={{ padding: '8px 18px', background: 'linear-gradient(135deg,#1FB8D6,#27DCFF)', border: 'none', borderRadius: 8, color: '#0B131C', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Download Document
            </button>
          )}
          {isDraft && (
            <>
              <button onClick={() => setRejectModal(true)} disabled={working}
                style={{ ...ghostBtn, color: '#F87171', borderColor: 'rgba(248,113,113,0.3)' }}>
                Reject
              </button>
              <button onClick={handleApprove} disabled={working}
                style={{ padding: '8px 20px', background: 'linear-gradient(135deg,#34D399,#10B981)', border: 'none', borderRadius: 8, color: '#0B131C', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                {working ? '…' : 'Approve'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Meta chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <Chip color={PRIORITY_COLOR[cr.priority]} label={`${cr.priority} PRIORITY`} />
        <Chip color="#64748B" label={cr.businessTypeCode} mono />
        <Chip
          color={cr.crTarget === 'NERVE_CENTER' ? '#A78BFA' : '#1FB8D6'}
          label={cr.crTarget === 'NERVE_CENTER' ? 'NERVE CENTER' : 'BUSINESS PLATFORM'}
        />
        {cr.raisedFrom && (
          <Chip
            color={cr.raisedFrom === 'PRODUCTION' ? '#34D399' : '#A78BFA'}
            label={`FROM ${cr.raisedFrom}`}
          />
        )}
        {(cr.modulesAffected || []).map((m) => <Chip key={m} color="#334155" label={m} />)}
      </div>

      {/* Approved banner */}
      {isApproved && (
        <div style={{ background: 'rgba(31,184,214,0.08)', border: '1px solid rgba(31,184,214,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, color: '#1FB8D6' }}>
            Approved by <strong>{cr.approvedBy}</strong> on {new Date(cr.approvedAt).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 12, color: '#64748B' }}>Download the document file and upload it to Claude Code to begin development</div>
        </div>
      )}

      {/* Rejected banner */}
      {cr.status === 'REJECTED' && (
        <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: '#F87171' }}>Rejected by <strong>{cr.rejectedBy}</strong> — {cr.rejectionReason || 'No reason given'}</div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #1E2D3D', marginBottom: 24 }}>
        {[['document', 'Document'], ['audit', `Audit Log (${cr.logs?.length || 0})`]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding: '9px 16px', background: 'none', border: 'none', borderBottom: `2px solid ${tab === key ? '#1FB8D6' : 'transparent'}`, color: tab === key ? '#1FB8D6' : '#64748B', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: -1 }}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Document */}
      {tab === 'document' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {cr.description && (
            <Section title="Description">
              <p style={{ color: '#94A3B8', fontSize: 14, lineHeight: 1.7 }}>{cr.description}</p>
            </Section>
          )}
          <Section title="Problem">
            <p style={{ color: '#94A3B8', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{cr.problem || '—'}</p>
          </Section>
          <Section title="Solution">
            <p style={{ color: '#94A3B8', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{cr.solution || '—'}</p>
          </Section>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Section title="In Scope">
              <p style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{cr.inScope || '—'}</p>
            </Section>
            <Section title="Out of Scope">
              <p style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{cr.outOfScope || '—'}</p>
            </Section>
          </div>
          <Section title="Details">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Detail label="Created By"  value={cr.createdBy} />
              <Detail label="Created At"  value={new Date(cr.createdAt).toLocaleString('en-IN')} />
              <Detail label="CR Target"   value={cr.crTarget === 'NERVE_CENTER' ? 'Nerve Center' : 'Business Platform'} />
              {cr.raisedFrom && <Detail label="Raised From" value={cr.raisedFrom} />}
              {cr.approvedBy && <Detail label="Approved By" value={cr.approvedBy} />}
              {cr.approvedAt && <Detail label="Approved At" value={new Date(cr.approvedAt).toLocaleString('en-IN')} />}
              {cr.linkedTRId && <Detail label="Linked TR"   value={cr.linkedTRId} />}
            </div>
          </Section>
        </div>
      )}

      {/* Tab: Audit Log */}
      {tab === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {cr.logs?.map((log, i) => (
            <div key={log.id} style={{ display: 'flex', gap: 14, paddingBottom: 16, position: 'relative' }}>
              {i < cr.logs.length - 1 && (
                <div style={{ position: 'absolute', left: 16, top: 28, bottom: 0, width: 1, background: '#1E2D3D' }} />
              )}
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1E2D3D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, zIndex: 1 }}>
                {LOG_ICON[log.action] || '·'}
              </div>
              <div style={{ flex: 1, paddingTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0' }}>{log.action.replace(/_/g, ' ')}</span>
                  <span style={{ fontSize: 11, color: '#64748B', fontFamily: 'var(--font-mono)' }}>{new Date(log.createdAt).toLocaleString('en-IN')}</span>
                </div>
                <span style={{ fontSize: 12, color: '#64748B' }}>by {log.performedBy}</span>
                {log.notes && <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>{log.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#192533', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 12, padding: 28, width: 460, maxWidth: '90vw' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#F87171', marginBottom: 12 }}>Reject {cr.crCode}</h3>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (required)…" rows={3}
              style={{ width: '100%', padding: '9px 12px', background: '#0F1923', border: '1px solid #1E2D3D', borderRadius: 8, color: '#F1F5F9', fontSize: 13, outline: 'none', boxSizing: 'border-box', resize: 'vertical', marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setRejectModal(false); setRejectReason(''); }}
                style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #1E2D3D', borderRadius: 8, color: '#64748B', fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleReject} disabled={working || !rejectReason.trim()}
                style={{ padding: '8px 20px', background: rejectReason.trim() ? 'rgba(248,113,113,0.15)' : '#1E2D3D', border: '1px solid rgba(248,113,113,0.4)', borderRadius: 8, color: rejectReason.trim() ? '#F87171' : '#64748B', fontWeight: 700, fontSize: 13, cursor: rejectReason.trim() ? 'pointer' : 'not-allowed' }}>
                {working ? 'Rejecting…' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const Chip = ({ color, label, mono }) => (
  <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}18`, padding: '3px 10px', borderRadius: 99, fontFamily: mono ? 'var(--font-mono)' : undefined }}>{label}</span>
);

const Section = ({ title, children }) => (
  <div style={{ background: '#192533', border: '1px solid #1E2D3D', borderRadius: 10, padding: '16px 18px' }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>{title}</div>
    {children}
  </div>
);

const Detail = ({ label, value }) => (
  <div>
    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
    <div style={{ fontSize: 13, color: '#94A3B8' }}>{value}</div>
  </div>
);

const backBtn  = { padding: '7px 14px', background: 'transparent', border: '1px solid #1E2D3D', borderRadius: 7, color: '#64748B', fontSize: 12, fontWeight: 600, cursor: 'pointer' };
const ghostBtn = { padding: '8px 14px', background: 'transparent', border: '1px solid #1E2D3D', borderRadius: 8, color: '#64748B', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
