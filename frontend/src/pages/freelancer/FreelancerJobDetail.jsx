import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import {
  getJob, updateJobStatus, addMaterial, deleteMaterial,
  recordPayment, assignHelper, listHelpers,
} from '../../api/freelancer';
import toast from 'react-hot-toast';

const WA_GREEN = '#25D366';
function waLink(phone, text) {
  if (!phone) return null;
  let p = String(phone).replace(/\D/g, '');
  if (p.startsWith('0')) p = p.slice(1);
  if (p.length === 10) p = '91' + p;
  return `https://wa.me/${p}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
function WABtn({ phone, text, label = 'WhatsApp' }) {
  const link = waLink(phone, text);
  if (!link) return null;
  return (
    <a href={link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: `${WA_GREEN}18`, border: `1px solid ${WA_GREEN}50`, borderRadius: 7, color: WA_GREEN, fontSize: 12, fontWeight: 600, textDecoration: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill={WA_GREEN}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      {label}
    </a>
  );
}

const OR = '#F97316';
const TEXT = '#F3F4F6';
const MUTED = '#9CA3AF';
const CARD = '#161616';
const BORDER = '#222';

const STATUS_OPTIONS = ['ENQUIRY', 'ESTIMATE_SENT', 'IN_PROGRESS', 'COMPLETED', 'PAYMENT_PENDING', 'CLOSED', 'CANCELLED'];
const STATUS_LABELS = { ENQUIRY: 'Enquiry', ESTIMATE_SENT: 'Estimate Sent', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed', PAYMENT_PENDING: 'Payment Pending', CLOSED: 'Closed', CANCELLED: 'Cancelled' };

const fmt = (n) => n != null ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n) : '—';

const TABS = ['Overview', 'Materials', 'Payments', 'Team'];

export default function FreelancerJobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Overview');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const load = () => {
    getJob(id)
      .then(r => setJob(r.data))
      .catch(() => toast.error('Job not found'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const changeStatus = async (s) => {
    setUpdatingStatus(true);
    try {
      await updateJobStatus(id, s);
      setJob(j => ({ ...j, status: s }));
      toast.success(`Status → ${STATUS_LABELS[s]}`);
    } catch {
      toast.error('Could not update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) return <div style={{ color: MUTED, padding: '20px 0' }}>Loading…</div>;
  if (!job) return <div style={{ color: MUTED, padding: '20px 0' }}>Job not found.</div>;

  const totalPaid = job.payments?.reduce((s, p) => s + p.amount, 0) || 0;
  const balance = (job.jobValue || 0) - totalPaid;
  const matTotal = job.materials?.reduce((s, m) => s + m.total, 0) || 0;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/freelancer/jobs')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, paddingTop: 4 }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: OR }}>{job.jobNumber}</h1>
            <select
              value={job.status}
              onChange={e => changeStatus(e.target.value)}
              disabled={updatingStatus}
              style={{ padding: '5px 10px', background: '#1a1a1a', border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 13, cursor: 'pointer', outline: 'none' }}
            >
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <p style={{ fontSize: 14, color: TEXT, marginTop: 4 }}>
            {job.customerName}{job.workType ? ` — ${job.workType}` : ''}
          </p>
          {job.customerPhone && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <WABtn phone={job.customerPhone} label="Message" />
              <WABtn phone={job.customerPhone} label="Send Update"
                text={`Hi ${job.customerName}! Update on your job ${job.jobNumber} (${job.workType || 'service'}): Status is now *${STATUS_LABELS[job.status]}*. For any queries, please reach out to us. Thank you! 🙏`} />
              <WABtn phone={job.customerPhone} label="Payment Reminder"
                text={`Hi ${job.customerName}, this is a gentle reminder regarding payment for job *${job.jobNumber}* (${job.workType || 'service'}). Please make the payment at your convenience. Thank you! 🙏`} />
            </div>
          )}
        </div>
        {/* Money summary */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <Stat label="Job Value" value={fmt(job.jobValue)} />
          <Stat label="Received" value={fmt(totalPaid)} color="#4ADE80" />
          <Stat label="Balance" value={fmt(balance)} color={balance > 0 ? '#FBBF24' : '#4ADE80'} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: '#111', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{ padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s', background: tab === t ? CARD : 'transparent', color: tab === t ? OR : MUTED }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'Overview' && <OverviewTab job={job} />}
      {tab === 'Materials' && <MaterialsTab job={job} reload={load} />}
      {tab === 'Payments' && <PaymentsTab job={job} reload={load} balance={balance} />}
      {tab === 'Team' && <TeamTab job={job} reload={load} />}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 11, color: MUTED, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: color || TEXT }}>{value}</div>
    </div>
  );
}

function OverviewTab({ job }) {
  const rows = [
    ['Customer', job.customerName],
    ['Address', job.siteAddress || '—'],
    ['Work Type', job.workType || '—'],
    ['Description', job.description || '—'],
    ['Start Date', job.startDate ? new Date(job.startDate).toLocaleDateString('en-IN') : '—'],
    ['End Date', job.endDate ? new Date(job.endDate).toLocaleDateString('en-IN') : '—'],
    ['Advance Req', job.advanceReq ? `₹${job.advanceReq}` : '—'],
    ['Created', new Date(job.createdAt).toLocaleString('en-IN')],
  ];
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 22px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '14px 20px' }}>
        <span style={{ fontSize: 13, color: MUTED }}>Phone</span>
        <span style={{ fontSize: 13, color: TEXT, display: 'flex', alignItems: 'center', gap: 8 }}>
          {job.customerPhone || '—'}
          {job.customerPhone && <WABtn phone={job.customerPhone} label="Chat" />}
        </span>
        {rows.map(([k, v]) => (
          <>
            <span key={`k-${k}`} style={{ fontSize: 13, color: MUTED }}>{k}</span>
            <span key={`v-${k}`} style={{ fontSize: 13, color: TEXT }}>{v}</span>
          </>
        ))}
      </div>
    </div>
  );
}

function MaterialsTab({ job, reload }) {
  const [form, setForm] = useState({ name: '', qty: '', unit: '', rate: '', total: '' });
  const [adding, setAdding] = useState(false);

  const set = (k) => (e) => {
    const v = e.target.value;
    setForm(f => {
      const updated = { ...f, [k]: v };
      if (k === 'qty' || k === 'rate') {
        const qty = parseFloat(k === 'qty' ? v : updated.qty) || 0;
        const up = parseFloat(k === 'rate' ? v : updated.rate) || 0;
        updated.total = String(qty * up);
      }
      return updated;
    });
  };

  const add = async () => {
    if (!form.name.trim()) return toast.error('Material name required');
    setAdding(true);
    try {
      await addMaterial(job.id, { name: form.name, qty: parseFloat(form.qty) || 1, unit: form.unit, rate: parseFloat(form.rate) || 0, total: parseFloat(form.total) || 0 });
      toast.success('Material added');
      setForm({ name: '', qty: '', unit: '', rate: '', total: '' });
      reload();
    } catch { toast.error('Could not add material'); }
    finally { setAdding(false); }
  };

  const remove = async (mid) => {
    try { await deleteMaterial(job.id, mid); reload(); toast.success('Removed'); }
    catch { toast.error('Could not remove'); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Add row */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px' }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: OR, marginBottom: 14 }}>ADD MATERIAL</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
          {[['Name', 'name', 'Wire, PVC pipe…'], ['Qty', 'qty', '1'], ['Unit', 'unit', 'pcs'], ['Unit Price ₹', 'rate', '0'], ['Total ₹', 'total', '0']].map(([label, key, ph]) => (
            <div key={key}>
              <label style={{ fontSize: 11, color: MUTED, display: 'block', marginBottom: 4 }}>{label}</label>
              <input type={key === 'name' || key === 'unit' ? 'text' : 'number'} value={form[key]} onChange={set(key)} placeholder={ph}
                style={{ padding: '8px 10px', background: '#111', border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 13, color: TEXT, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
            </div>
          ))}
          <button onClick={add} disabled={adding}
            style={{ padding: '8px 14px', background: OR, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', alignSelf: 'end' }}>
            {adding ? '…' : '+ Add'}
          </button>
        </div>
      </div>

      {/* List */}
      {job.materials?.length > 0 && (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {['Material', 'Qty', 'Unit', 'Unit Price', 'Total', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: MUTED }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {job.materials.map((m, i) => (
                <tr key={m.id} style={{ borderBottom: i < job.materials.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: TEXT }}>{m.name}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: MUTED }}>{m.qty}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: MUTED }}>{m.unit || '—'}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: MUTED }}>{fmt(m.rate)}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: TEXT, fontWeight: 500 }}>{fmt(m.total)}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <button onClick={() => remove(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, display: 'flex' }}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: `1px solid ${BORDER}`, background: '#111' }}>
                <td colSpan={4} style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: MUTED }}>Total Materials Cost</td>
                <td style={{ padding: '10px 16px', fontSize: 14, fontWeight: 700, color: TEXT }}>{fmt(job.materials.reduce((s, m) => s + m.total, 0))}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PaymentsTab({ job, reload, balance }) {
  const [form, setForm] = useState({ amount: '', mode: 'CASH', note: '', paidAt: '' });
  const [adding, setAdding] = useState(false);

  const add = async () => {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) return toast.error('Enter valid amount');
    setAdding(true);
    try {
      await recordPayment(job.id, { amount: amt, mode: form.mode, note: form.note, paidAt: form.paidAt || undefined });
      toast.success(`₹${amt} recorded`);
      setForm({ amount: '', mode: 'CASH', note: '', paidAt: '' });
      reload();
    } catch { toast.error('Could not record payment'); }
    finally { setAdding(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Record payment */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px' }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: OR, marginBottom: 14 }}>RECORD PAYMENT</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
          {[['Amount ₹', 'amount', 'number', '0'], ['Date', 'paidAt', 'date', ''], ['Note', 'note', 'text', 'Advance, final…']].map(([label, key, type, ph]) => (
            <div key={key}>
              <label style={{ fontSize: 11, color: MUTED, display: 'block', marginBottom: 4 }}>{label}</label>
              <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph}
                style={{ padding: '8px 10px', background: '#111', border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 13, color: TEXT, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 11, color: MUTED, display: 'block', marginBottom: 4 }}>Mode</label>
            <select value={form.mode} onChange={e => setForm(f => ({ ...f, mode: e.target.value }))}
              style={{ padding: '8px 10px', background: '#111', border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 13, color: TEXT, outline: 'none', width: '100%' }}>
              {['CASH', 'UPI', 'NEFT', 'CHEQUE', 'OTHER'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <button onClick={add} disabled={adding}
            style={{ padding: '8px 14px', background: OR, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', alignSelf: 'end' }}>
            {adding ? '…' : '+ Add'}
          </button>
        </div>
      </div>

      {/* Payment history */}
      {job.payments?.length > 0 && (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {['Date', 'Amount', 'Mode', 'Note'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: MUTED }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {job.payments.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < job.payments.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: MUTED }}>{new Date(p.paidAt || p.createdAt).toLocaleDateString('en-IN')}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: '#4ADE80' }}>{fmt(p.amount)}</td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: MUTED }}>{p.mode}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: MUTED }}>{p.note || '—'}</td>
                </tr>
              ))}
              <tr style={{ borderTop: `1px solid ${BORDER}`, background: '#111' }}>
                <td colSpan={1} style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: MUTED }}>Balance Due</td>
                <td style={{ padding: '10px 16px', fontSize: 14, fontWeight: 700, color: balance > 0 ? '#FBBF24' : '#4ADE80' }}>{fmt(balance)}</td>
                <td colSpan={2} />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TeamTab({ job, reload }) {
  const [helpers, setHelpers] = useState([]);
  const [form, setForm] = useState({ helperId: '', daysWorked: '' });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    listHelpers().then(r => setHelpers(r.data)).catch(() => {});
  }, []);

  const assign = async () => {
    if (!form.helperId) return toast.error('Select a helper');
    setAdding(true);
    try {
      await assignHelper(job.id, { helperId: form.helperId, daysWorked: parseFloat(form.daysWorked) || 0 });
      toast.success('Helper assigned');
      setForm({ helperId: '', daysWorked: '' });
      reload();
    } catch { toast.error('Could not assign'); }
    finally { setAdding(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {helpers.length > 0 && (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px' }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: OR, marginBottom: 14 }}>ASSIGN HELPER</h3>
          <div style={{ display: 'flex', gap: 10, alignItems: 'end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: MUTED, display: 'block', marginBottom: 4 }}>Helper</label>
              <select value={form.helperId} onChange={e => setForm(f => ({ ...f, helperId: e.target.value }))}
                style={{ padding: '8px 10px', background: '#111', border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 13, color: form.helperId ? TEXT : MUTED, outline: 'none', width: '100%' }}>
                <option value="">Select helper</option>
                {helpers.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: MUTED, display: 'block', marginBottom: 4 }}>Days Worked</label>
              <input type="number" value={form.daysWorked} onChange={e => setForm(f => ({ ...f, daysWorked: e.target.value }))} placeholder="0"
                style={{ padding: '8px 10px', background: '#111', border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 13, color: TEXT, outline: 'none', width: 80 }} />
            </div>
            <button onClick={assign} disabled={adding}
              style={{ padding: '8px 14px', background: OR, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', alignSelf: 'end' }}>
              Assign
            </button>
          </div>
        </div>
      )}

      {job.helpers?.length > 0 ? (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {['Helper', 'Daily Rate', 'Days Worked', 'Total Wages'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: MUTED }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {job.helpers.map((jh, i) => (
                <tr key={jh.helperId} style={{ borderBottom: i < job.helpers.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: TEXT }}>{jh.helper?.name || '—'}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: MUTED }}>{fmt(jh.helper?.dailyRate)}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: MUTED }}>{jh.daysWorked}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500, color: TEXT }}>{fmt(jh.totalWages)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '24px', textAlign: 'center', color: MUTED, fontSize: 13 }}>
          No team members assigned to this job.
          {helpers.length === 0 && (
            <><br /><span>Add helpers first at <strong style={{ color: OR }}>My Team</strong> page.</span></>
          )}
        </div>
      )}
    </div>
  );
}
