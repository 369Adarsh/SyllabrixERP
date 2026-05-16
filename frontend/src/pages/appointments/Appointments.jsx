import { useState, useEffect, useCallback } from 'react';
import { getAppointments, createAppointment, updateAppointmentStatus, cancelAppointment, getServices, getCustomers, sendWAAppointmentReminder } from '../../api';
import { Plus, Calendar, Search, X, Clock, CheckCircle, XCircle, MessageCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  SCHEDULED: { bg: '#EFF6FF', color: '#3B82F6', label: 'Scheduled' },
  CONFIRMED:  { bg: '#F0FDF4', color: '#16A34A', label: 'Confirmed' },
  COMPLETED:  { bg: '#F3F4F6', color: '#6B7280', label: 'Completed' },
  CANCELLED:  { bg: '#FEF2F2', color: '#DC2626', label: 'Cancelled' },
  NO_SHOW:    { bg: '#FFFBEB', color: '#D97706', label: 'No-show' },
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

function Badge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.SCHEDULED;
  return <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{s.label}</span>;
}

function BookModal({ onClose, onBooked }) {
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ customerId: '', serviceId: '', staffName: '', date: '', time: '', notes: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([getServices(), getCustomers()])
      .then(([sr, cr]) => { setServices(sr.data.data || []); setCustomers(cr.data.data || []); })
      .catch(() => {});
  }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.serviceId || !form.date || !form.time) return toast.error('Service, date and time are required');
    setLoading(true);
    try {
      const dateTime = new Date(`${form.date}T${form.time}`).toISOString();
      await createAppointment({
        customerId: form.customerId || undefined,
        serviceId: form.serviceId,
        staffName: form.staffName || undefined,
        scheduledAt: dateTime,
        notes: form.notes,
      });
      toast.success('Appointment booked');
      onBooked();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>Book Appointment</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Service *</label>
            <select value={form.serviceId} onChange={set('serviceId')} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
              <option value="">Select service</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name} — {fmt(s.price)} ({s.durationMinutes} min)</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Customer (optional)</label>
            <select value={form.customerId} onChange={set('customerId')} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
              <option value="">Walk-in</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input label="Date *" type="date" value={form.date} onChange={set('date')} />
            <Input label="Time *" type="time" value={form.time} onChange={set('time')} />
          </div>
          <Input label="Staff / Trainer (optional)" placeholder="e.g. Rahul sir" value={form.staffName} onChange={set('staffName')} />
          <Input label="Notes" placeholder="Any special instructions..." value={form.notes} onChange={set('notes')} />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Book</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showBook, setShowBook] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const r = await getAppointments(params);
      setAppointments(r.data.data || []);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (id, status) => {
    try {
      await updateAppointmentStatus(id, status);
      toast.success('Status updated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const todayCount = appointments.filter(a => {
    const d = new Date(a.scheduledAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  const scheduled = appointments.filter(a => a.status === 'SCHEDULED').length;
  const completed = appointments.filter(a => a.status === 'COMPLETED').length;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Appointments</h1>
          <p style={{ color: '#6B7280', fontSize: 14, marginTop: 2 }}>{appointments.length} total</p>
        </div>
        <Button onClick={() => setShowBook(true)}><Plus size={16} style={{ marginRight: 6 }} />Book Appointment</Button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: "Today's Bookings", value: todayCount, color: 'var(--cyan)', icon: Calendar },
          { label: 'Upcoming', value: scheduled, color: '#3B82F6', icon: Clock },
          { label: 'Completed', value: completed, color: '#16A34A', icon: CheckCircle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, background: color + '18', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)' }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer or service..."
            style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff', boxSizing: 'border-box' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '9px 14px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
          <option value="">All status</option>
          {Object.keys(STATUS_STYLES).map(s => <option key={s} value={s}>{STATUS_STYLES[s].label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border)' }}>
              {['Customer', 'Service', 'Date', 'Time', 'Staff', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: '#9CA3AF' }}>Loading...</td></tr>
            ) : appointments.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: '#9CA3AF' }}>
                <Calendar size={32} style={{ marginBottom: 8, opacity: 0.4, display: 'block', margin: '0 auto 8px' }} />
                No appointments found
              </td></tr>
            ) : appointments.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 500 }}>{a.customer?.name || <span style={{ color: '#9CA3AF' }}>Walk-in</span>}</td>
                <td style={{ padding: '14px 16px', fontSize: 14 }}>{a.service?.name || '—'}</td>
                <td style={{ padding: '14px 16px', fontSize: 13, color: '#6B7280' }}>{fmtDate(a.scheduledAt)}</td>
                <td style={{ padding: '14px 16px', fontSize: 13, color: '#6B7280' }}>{fmtTime(a.scheduledAt)}</td>
                <td style={{ padding: '14px 16px', fontSize: 13, color: '#6B7280' }}>{a.staffName || '—'}</td>
                <td style={{ padding: '14px 16px' }}><Badge status={a.status} /></td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {a.status === 'SCHEDULED' && (<>
                      <button onClick={() => changeStatus(a.id, 'CONFIRMED')} style={{ fontSize: 12, color: '#16A34A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Confirm</button>
                      <button onClick={() => changeStatus(a.id, 'COMPLETED')} style={{ fontSize: 12, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Complete</button>
                      <button onClick={() => changeStatus(a.id, 'CANCELLED')} style={{ fontSize: 12, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                    </>)}
                    {a.status === 'CONFIRMED' && (<>
                      <button onClick={() => changeStatus(a.id, 'COMPLETED')} style={{ fontSize: 12, color: '#16A34A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Complete</button>
                      <button onClick={() => changeStatus(a.id, 'NO_SHOW')} style={{ fontSize: 12, color: '#D97706', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>No-show</button>
                    </>)}
                    {a.customer?.phone && ['SCHEDULED', 'CONFIRMED'].includes(a.status) && (
                      <button
                        onClick={async () => { try { await sendWAAppointmentReminder(a.id); toast.success('Reminder sent via WhatsApp'); } catch { toast.error('Failed to send reminder'); } }}
                        title="Send WhatsApp Reminder"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#25D366', padding: 2 }}
                      >
                        <MessageCircle size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showBook && <BookModal onClose={() => setShowBook(false)} onBooked={() => { setShowBook(false); load(); }} />}
    </div>
  );
}
