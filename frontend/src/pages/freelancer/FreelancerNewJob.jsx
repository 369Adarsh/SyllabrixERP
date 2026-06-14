import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, ChevronDown, X } from 'lucide-react';
import { createJob, listClients } from '../../api/freelancer';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const OR = '#F97316';
const TEXT = '#F3F4F6';
const MUTED = '#9CA3AF';
const BORDER = '#222';

export default function FreelancerNewJob() {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const jobSingular = tenant?.labelConfig?.flLabels?.jobSingular || 'Job';
  const workTypeHint = tenant?.sidebarConfig?.workTypeHint || 'e.g. Describe the work…';
  const [form, setForm] = useState({
    customerId: '',
    customerName: '', customerPhone: '', siteAddress: '',
    workType: '', description: '', jobValue: '', advanceReq: '',
    startDate: '', endDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDrop, setShowClientDrop] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    listClients().then(r => setClients(r.data)).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const pickClient = (c) => {
    setSelectedClient(c);
    setForm(f => ({
      ...f,
      customerId: c.id,
      customerName: c.name,
      customerPhone: c.phone || '',
      siteAddress: c.address || f.siteAddress,
    }));
    setClientSearch('');
    setShowClientDrop(false);
  };

  const clearClient = () => {
    setSelectedClient(null);
    setForm(f => ({ ...f, customerId: '', customerName: '', customerPhone: '', siteAddress: '' }));
  };

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.phone || '').includes(clientSearch)
  );

  const validate = () => {
    const e = {};
    if (!form.customerName.trim()) e.customerName = 'Customer name is required';
    if (!form.workType.trim()) e.workType = 'Work type is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        jobValue: parseFloat(form.jobValue) || 0,
        advanceReq: parseFloat(form.advanceReq) || 0,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        customerId: form.customerId || undefined,
      };
      const { data } = await createJob(payload);
      toast.success(`Job ${data.jobNumber} created`);
      navigate(`/freelancer/jobs/${data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: TEXT }}>New {jobSingular}</h1>
      </div>

      <div style={{ maxWidth: 640 }}>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

          <Section title="Customer Details">
            {/* Client picker */}
            {clients.length > 0 && (
              <Field label="Link to Existing Client">
                {selectedClient ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: '#111', border: `1.5px solid ${OR}`, borderRadius: 8 }}>
                    <span style={{ flex: 1, fontSize: 14, color: TEXT }}>{selectedClient.name}</span>
                    {selectedClient.phone && <span style={{ fontSize: 12, color: MUTED }}>{selectedClient.phone}</span>}
                    <button type="button" onClick={clearClient} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, display: 'flex', padding: 0 }}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <div
                      onClick={() => setShowClientDrop(v => !v)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: '#111', border: `1.5px solid #2a2a2a`, borderRadius: 8, cursor: 'pointer', fontSize: 14, color: MUTED }}
                    >
                      <span>Select client (optional)</span>
                      <ChevronDown size={14} color={MUTED} />
                    </div>
                    {showClientDrop && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1a1a1a', border: `1px solid #333`, borderRadius: 8, zIndex: 50, marginTop: 4, maxHeight: 220, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '8px 10px', borderBottom: '1px solid #333' }}>
                          <input
                            autoFocus
                            type="text"
                            placeholder="Search clients…"
                            value={clientSearch}
                            onChange={e => setClientSearch(e.target.value)}
                            style={{ width: '100%', background: 'none', border: 'none', outline: 'none', fontSize: 13, color: TEXT, boxSizing: 'border-box' }}
                          />
                        </div>
                        <div style={{ overflowY: 'auto' }}>
                          {filtered.length === 0
                            ? <div style={{ padding: '12px 14px', fontSize: 13, color: MUTED }}>No clients found</div>
                            : filtered.map(c => (
                              <div
                                key={c.id}
                                onClick={() => pickClient(c)}
                                style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13, color: TEXT, borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#222'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                <span>{c.name}</span>
                                {c.phone && <span style={{ color: MUTED, fontSize: 12 }}>{c.phone}</span>}
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Field>
            )}

            <TwoCol>
              <Field label="Customer Name *" error={errors.customerName}>
                <FInput value={form.customerName} onChange={set('customerName')} placeholder="Suresh Sharma" />
              </Field>
              <Field label="Phone">
                <FInput type="tel" value={form.customerPhone} onChange={set('customerPhone')} placeholder="9876543210" />
              </Field>
            </TwoCol>
            <Field label="Address">
              <FInput value={form.siteAddress} onChange={set('siteAddress')} placeholder="House no., street, area…" />
            </Field>
          </Section>

          <Section title="Job Details">
            <Field label="Work Type *" error={errors.workType}>
              <FInput value={form.workType} onChange={set('workType')} placeholder={workTypeHint} />
            </Field>
            <Field label="Description">
              <textarea
                value={form.description}
                onChange={set('description')}
                placeholder="Details about the work to be done…"
                rows={3}
                style={{ padding: '10px 12px', background: '#111', border: `1.5px solid ${BORDER}`, borderRadius: 10, fontSize: 14, color: TEXT, outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </Field>
          </Section>

          <Section title="Money & Dates">
            <TwoCol>
              <Field label="Job Value (₹)">
                <FInput type="number" value={form.jobValue} onChange={set('jobValue')} placeholder="0" />
              </Field>
              <Field label="Advance Required (₹)">
                <FInput type="number" value={form.advanceReq} onChange={set('advanceReq')} placeholder="0" />
              </Field>
            </TwoCol>
            <TwoCol>
              <Field label="Start Date">
                <DateInput value={form.startDate} onChange={set('startDate')} />
              </Field>
              <Field label="Expected End Date">
                <DateInput value={form.endDate} onChange={set('endDate')} />
              </Field>
            </TwoCol>
          </Section>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{ flex: 1, padding: '12px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 10, color: MUTED, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ flex: 2, padding: '12px', background: OR, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Creating…' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: '#161616', border: '1px solid #222', borderRadius: 14, padding: '20px 22px', marginBottom: 16 }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: '#F97316', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>
  );
}

function TwoCol({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>{children}</div>;
}

function Field({ label, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: '#9CA3AF' }}>{label}</label>}
      {children}
      {error && <span style={{ fontSize: 12, color: '#EF4444' }}>{error}</span>}
    </div>
  );
}

function FInput({ type = 'text', value, onChange, placeholder }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{ padding: '9px 12px', background: '#111', border: '1.5px solid #2a2a2a', borderRadius: 8, fontSize: 14, color: '#F3F4F6', outline: 'none', width: '100%', boxSizing: 'border-box' }}
    />
  );
}

function DateInput({ value, onChange }) {
  const ref = useRef();
  const display = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';
  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={() => ref.current?.showPicker?.() || ref.current?.click()}
        style={{
          padding: '9px 38px 9px 12px', background: '#111', border: '1.5px solid #2a2a2a',
          borderRadius: 8, fontSize: 14, color: value ? '#F3F4F6' : '#6B7280',
          cursor: 'pointer', userSelect: 'none', minHeight: 38, boxSizing: 'border-box',
        }}
      >
        {display || 'Select date'}
      </div>
      <Calendar
        size={15} color="#F97316"
        style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
      />
      <input
        ref={ref}
        type="date"
        value={value}
        onChange={onChange}
        style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', cursor: 'pointer' }}
      />
    </div>
  );
}
