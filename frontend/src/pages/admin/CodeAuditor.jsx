import { useState, useEffect } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { P } from '../../styles/page';
import { submitAuditReport, getMyAuditReports } from '../../api';
import { useAuth } from '../../context/AuthContext';
import {
  Send, ClipboardList, CheckCircle2, Loader2,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_OPTIONS = [
  { route: '/dashboard',        label: 'Dashboard' },
  { route: '/appointments',     label: 'Appointments / Bookings' },
  { route: '/membership-plans', label: 'Membership Plans' },
  { route: '/fees',             label: 'Fee Management' },
  { route: '/staff',            label: 'Staff & Attendance' },
  { route: '/customers',        label: 'Customers / Members' },
  { route: '/inventory',        label: 'Inventory' },
  { route: '/pos',              label: 'Point of Sale (POS)' },
  { route: '/invoices',         label: 'Invoicing' },
  { route: '/expenses',         label: 'Expenses' },
  { route: '/reports',          label: 'Finance & Reports' },
  { route: '/accounts',         label: 'Bank Accounts' },
  { route: '/ai-copilot',       label: 'AI Copilot' },
  { route: '/auth',             label: 'Login / Auth' },
  { route: '/settings',         label: 'Settings' },
];

const FREQ_OPTIONS = [
  { value: 'FIRST_TIME', label: 'First time' },
  { value: 'SOMETIMES',  label: 'Sometimes' },
  { value: 'ALWAYS',     label: 'Every time' },
];

const STATUS_META = {
  SUBMITTED:   { label: 'Submitted',   color: '#6B7280', bg: '#F3F4F6' },
  ASSIGNED:    { label: 'Assigned',    color: '#2563EB', bg: '#EFF6FF' },
  IN_PROGRESS: { label: 'In Progress', color: '#D97706', bg: '#FFFBEB' },
  RESOLVED:    { label: 'Resolved',    color: '#059669', bg: '#D1FAE5' },
  CLOSED:      { label: 'Closed',      color: '#9CA3AF', bg: '#F9FAFB' },
};

const PRIORITY_META = {
  P1: { label: 'P1 Critical', color: '#DC2626', bg: '#FEE2E2' },
  P2: { label: 'P2 Standard', color: '#D97706', bg: '#FEF3C7' },
  P3: { label: 'P3 Low',      color: '#6B7280', bg: '#F3F4F6' },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function Chip({ label, color, bg }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: bg, color }}>
      {label}
    </span>
  );
}

// ── Report Error tab ──────────────────────────────────────────────────────────

function ReportTab({ user }) {
  const [form, setForm]             = useState({ pageRoute: '', errorDesc: '', frequency: 'SOMETIMES' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(null);
  const [myReports, setMyReports]   = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);

  const fetchReports = () => {
    setLoadingReports(true);
    getMyAuditReports()
      .then(r => setMyReports(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoadingReports(false));
  };

  useEffect(() => { fetchReports(); }, [submitted]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.pageRoute) { toast.error('Select the page where the issue occurred'); return; }
    if (!form.errorDesc.trim()) { toast.error('Describe what happened'); return; }
    setSubmitting(true);
    try {
      const r = await submitAuditReport({
        pageRoute:    form.pageRoute,
        errorDesc:    form.errorDesc,
        frequency:    form.frequency,
        reporterName: user?.name || '',
        reporterRole: user?.role || '',
      });
      const data = r.data?.data;
      setSubmitted({ reportId: data.report?.reportId, isDuplicate: data.isDuplicate });
      setForm({ pageRoute: '', errorDesc: '', frequency: 'SOMETIMES' });
      toast.success(data.isDuplicate ? 'Report merged — priority escalated' : 'Report submitted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed — check backend is running');
    } finally { setSubmitting(false); }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <Send size={15} color="var(--navy)" />
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>Report an Error</span>
        </div>

        {submitted && (
          <div style={{ background: submitted.isDuplicate ? '#FFFBEB' : '#F0FDF4', border: `1.5px solid ${submitted.isDuplicate ? '#FCD34D' : '#86EFAC'}`, borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: submitted.isDuplicate ? '#92400E' : '#065F46', marginBottom: 4 }}>
              {submitted.isDuplicate ? 'Merged with existing report' : 'Report submitted!'}
            </div>
            <div style={{ fontSize: 12, color: '#374151' }}>
              {submitted.isDuplicate
                ? "This error was already reported — we've escalated the priority."
                : <>Report ID: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{submitted.reportId}</span> — our team will look into it.</>
              }
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>WHICH PAGE HAD THE ISSUE?</label>
            <select value={form.pageRoute} onChange={e => setForm(f => ({ ...f, pageRoute: e.target.value }))} style={{ ...inp, background: '#fff' }} required>
              <option value="">— select a page —</option>
              {PAGE_OPTIONS.map(p => <option key={p.route} value={p.route}>{p.label}</option>)}
            </select>
          </div>

          <div>
            <label style={lbl}>WHAT HAPPENED?</label>
            <textarea rows={4} placeholder="e.g. The fee collection page shows 'Failed to load' every time. Members can't check in."
              value={form.errorDesc} onChange={e => setForm(f => ({ ...f, errorDesc: e.target.value }))}
              style={{ ...inp, resize: 'vertical', fontFamily: 'var(--font-body)', lineHeight: 1.5 }} required />
          </div>

          <div>
            <label style={lbl}>HOW OFTEN DOES THIS HAPPEN?</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {FREQ_OPTIONS.map(f => (
                <button key={f.value} type="button"
                  onClick={() => setForm(prev => ({ ...prev, frequency: f.value }))}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    background: form.frequency === f.value ? 'var(--navy)' : '#F3F4F6',
                    color: form.frequency === f.value ? '#fff' : '#374151',
                    border: form.frequency === f.value ? '1.5px solid var(--navy)' : '1.5px solid transparent',
                    transition: 'all 0.12s',
                  }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {form.pageRoute && (
            <div style={{ background: '#F0F9FF', borderRadius: 'var(--radius-md)', padding: '10px 12px', fontSize: 12, color: '#0369A1' }}>
              <strong>Auto-targeting:</strong> Our team will investigate the most relevant code sections for <strong>{PAGE_OPTIONS.find(p => p.route === form.pageRoute)?.label}</strong>.
            </div>
          )}

          <button type="submit" disabled={submitting}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 20px',
              background: submitting ? '#F3F4F6' : 'var(--navy)', color: submitting ? '#9CA3AF' : '#fff',
              border: 'none', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
            }}>
            {submitting ? <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Submitting…</> : <><Send size={14} /> Submit Report</>}
          </button>
        </form>
      </Card>

      {/* Right — my reports */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <ClipboardList size={15} color="var(--navy)" />
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>My Reports</span>
        </div>

        {loadingReports ? (
          <Card><div style={{ textAlign: 'center', padding: 24, color: '#9CA3AF' }}><Loader2 size={20} style={{ animation: 'spin 0.7s linear infinite' }} /></div></Card>
        ) : myReports.length === 0 ? (
          <Card><div style={{ textAlign: 'center', padding: '32px 20px', color: '#9CA3AF', fontSize: 13 }}>No reports submitted yet</div></Card>
        ) : (
          myReports.map(r => {
            const sm = STATUS_META[r.status] || STATUS_META.SUBMITTED;
            const pm = PRIORITY_META[r.priority] || PRIORITY_META.P2;
            return (
              <Card key={r.id} style={{ marginBottom: 10, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>{r.reportId}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Chip label={pm.label} color={pm.color} bg={pm.bg} />
                    <Chip label={sm.label} color={sm.color} bg={sm.bg} />
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#374151', marginBottom: 6, lineHeight: 1.4 }}>
                  {r.errorDesc.length > 100 ? r.errorDesc.slice(0, 100) + '…' : r.errorDesc}
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                  {PAGE_OPTIONS.find(p => p.route === r.pageRoute)?.label || r.pageRoute} · {new Date(r.createdAt).toLocaleDateString('en-IN')}
                  {r.occurrences > 1 && <span style={{ marginLeft: 8, color: '#D97706', fontWeight: 700 }}>{r.occurrences}× reported</span>}
                </div>
                {r.status === 'RESOLVED' && r.fixNotes && (
                  <div style={{ marginTop: 8, background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 6, padding: '8px 10px', fontSize: 12, color: '#065F46' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                      <CheckCircle2 size={12} color="#059669" /> <strong>Resolved</strong>
                    </div>
                    {r.fixNotes}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CodeAuditor() {
  const { isMobile } = useBreakpoint();
  const { user } = useAuth();

  return (
    <div style={{ ...P.wrap(isMobile), maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ ...P.head, marginBottom: 20 }}>
        <div>
          <h1 style={P.h1(isMobile)}>Report an Error</h1>
          <p style={P.sub}>Found a bug? Let us know — our team will investigate and fix it for you</p>
        </div>
      </div>

      <ReportTab user={user} />
    </div>
  );
}

const lbl = { fontSize: 12, fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: 6, letterSpacing: '0.04em' };
const inp = { width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 14, boxSizing: 'border-box' };
