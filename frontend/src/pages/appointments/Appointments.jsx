import { useState, useEffect, useCallback } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { P } from '../../styles/page';
import KpiBar from '../../components/ui/KpiBar';
import { getAppointments, createAppointment, updateAppointmentStatus, getServices, getCustomers, getStaff, sendWAAppointmentReminder } from '../../api';
import {
  Plus, Calendar, Search, X, Clock, CheckCircle, MessageCircle,
  User, Dumbbell, Users, Filter, ChevronDown,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const STATUS_STYLES = {
  SCHEDULED: { bg: '#EFF6FF', color: '#3B82F6', label: 'Scheduled' },
  CONFIRMED:  { bg: '#F0FDF4', color: '#16A34A', label: 'Confirmed' },
  COMPLETED:  { bg: '#F3F4F6', color: '#6B7280', label: 'Completed' },
  CANCELLED:  { bg: '#FEF2F2', color: '#DC2626', label: 'Cancelled' },
  NO_SHOW:    { bg: '#FFFBEB', color: '#D97706', label: 'No-show' },
};

const CLASS_PALETTE = [
  '#8B5CF6', '#3B82F6', '#EF4444', '#10B981',
  '#F59E0B', '#06B6D4', '#EC4899', '#6366F1',
];
const classColorCache = {};
const getClassColor = (name) => {
  if (!name) return '#6B7280';
  if (classColorCache[name]) return classColorCache[name];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const color = CLASS_PALETTE[Math.abs(hash) % CLASS_PALETTE.length];
  classColorCache[name] = color;
  return color;
};

const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';
const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const isToday = (d) => new Date(d).toDateString() === new Date().toDateString();
const isTomorrow = (d) => {
  const t = new Date(); t.setDate(t.getDate() + 1);
  return new Date(d).toDateString() === t.toDateString();
};

const GYM_TYPES = ['GYM', 'SPA'];

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.SCHEDULED;
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

// ── Book Modal ─────────────────────────────────────────────────────────────────
function BookModal({ onClose, onBooked, isGym }) {
  const { tenant } = useAuth();
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({ customerId: '', serviceId: '', staffId: '', staffName: '', date: '', time: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    Promise.all([getServices(), getCustomers()])
      .then(([sr, cr]) => { setServices(sr.data.data || []); setCustomers(cr.data.data || []); })
      .catch(() => {});
    if (isGym) {
      getStaff().then(r => setStaff(r.data.data || [])).catch(() => {});
    }
  }, [isGym]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.serviceId || !form.date || !form.time) return toast.error('Service, date and time are required');
    setLoading(true);
    try {
      const dateTime = new Date(`${form.date}T${form.time}`).toISOString();
      const selectedStaff = staff.find(s => s.id === form.staffId);
      await createAppointment({
        customerId: form.customerId || undefined,
        serviceId: form.serviceId,
        staffId: form.staffId || undefined,
        staffName: selectedStaff?.name || form.staffName || undefined,
        scheduledAt: dateTime,
        notes: form.notes,
      });
      toast.success(isGym ? 'Session booked!' : 'Appointment booked');
      const cust = customers.find(c => c.id === form.customerId);
      const svc = services.find(s => s.id === form.serviceId);
      setDone({ name: cust?.name, phone: cust?.phone, service: svc?.name, dateTime });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    const businessName = tenant?.name || 'us';
    const apptTime = new Date(done.dateTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
    const msg = `Hi ${done.name || 'there'}, your ${isGym ? 'training session' : 'appointment'} for *${done.service || 'service'}* at ${businessName} is confirmed for ${apptTime}. See you then!`;
    const waUrl = done.phone
      ? `https://wa.me/91${done.phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(msg)}`
      : null;
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 400, padding: 32, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle size={28} color="#16A34A" />
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)', marginBottom: 6 }}>
            {isGym ? 'Session Booked!' : 'Appointment Booked!'}
          </h3>
          <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>
            {done.service}{done.name ? ` for ${done.name}` : ''} — {new Date(done.dateTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
          </p>
          {waUrl && (
            <a href={waUrl} target="_blank" rel="noopener noreferrer" onClick={onBooked}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#25D366', color: '#fff', padding: '11px 20px', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 14, marginBottom: 10 }}>
              <MessageCircle size={16} />
              Send Confirmation on WhatsApp
            </a>
          )}
          <Button variant="ghost" onClick={onBooked} style={{ width: '100%' }}>Done</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>
            {isGym ? 'Book Training Session' : 'Book Appointment'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>{isGym ? 'Class / Service *' : 'Service *'}</label>
            <select value={form.serviceId} onChange={set('serviceId')} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
              <option value="">{isGym ? 'Select class type' : 'Select service'}</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name} — {fmt(s.price)} ({s.duration || s.durationMinutes} min)</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>{isGym ? 'Member (optional)' : 'Customer (optional)'}</label>
            <select value={form.customerId} onChange={set('customerId')} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
              <option value="">Walk-in</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input label="Date *" type="date" value={form.date} onChange={set('date')} />
            <Input label="Time *" type="time" value={form.time} onChange={set('time')} />
          </div>
          {isGym && staff.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Trainer (optional)</label>
              <select value={form.staffId} onChange={set('staffId')} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
                <option value="">No trainer assigned</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name} {s.role ? `(${s.role})` : ''}</option>)}
              </select>
            </div>
          ) : (
            <Input label="Staff / Trainer (optional)" placeholder="e.g. Rahul sir" value={form.staffName} onChange={set('staffName')} />
          )}
          <Input label="Notes" placeholder={isGym ? 'Special instructions, focus areas...' : 'Any special instructions...'} value={form.notes} onChange={set('notes')} />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Book {isGym ? 'Session' : 'Appointment'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Session Card (Gym view) ────────────────────────────────────────────────────
function SessionCard({ a, onChangeStatus, onMarkComplete }) {
  const dt = new Date(a.startTime || a.scheduledAt);
  const timeStr = fmtTime(a.startTime || a.scheduledAt);
  const today = isToday(a.startTime || a.scheduledAt);
  const tomorrow = isTomorrow(a.startTime || a.scheduledAt);
  const trainerName = a.staff?.name || a.staffName;
  const classColor = getClassColor(a.service?.name);
  const isPast = dt < new Date() && !['SCHEDULED', 'CONFIRMED'].includes(a.status);

  return (
    <div style={{
      background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB',
      overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      transition: 'box-shadow 0.15s, transform 0.12s', opacity: isPast ? 0.7 : 1,
    }}
      onMouseEnter={e => { if (!isPast) { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* Color accent bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${classColor}, ${classColor}88)` }} />

      <div style={{ padding: '14px 16px 12px' }}>
        {/* Header: time + class + status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{
            background: today ? 'var(--navy)' : '#F3F4F6',
            color: today ? '#fff' : '#374151',
            borderRadius: 7, padding: '4px 10px', fontSize: 13, fontWeight: 800,
            fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em', flexShrink: 0,
          }}>
            {today ? timeStr : tomorrow ? `Tomorrow · ${timeStr}` : `${fmtDate(a.startTime || a.scheduledAt)} · ${timeStr}`}
          </div>
          {a.service?.name && (
            <span style={{ background: classColor + '15', color: classColor, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
              {a.service.name}
            </span>
          )}
          <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
            <StatusBadge status={a.status} />
          </div>
        </div>

        {/* Member */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: trainerName ? 8 : 10 }}>
          {a.customer ? (
            <>
              <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${classColor}cc, ${classColor}66)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 15, fontWeight: 800,
              }}>
                {a.customer.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.customer.name}
                </div>
                {a.customer.phone && (
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{a.customer.phone}</div>
                )}
              </div>
            </>
          ) : (
            <>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={16} color="#9CA3AF" />
              </div>
              <span style={{ fontSize: 14, color: '#9CA3AF', fontWeight: 600 }}>Walk-in</span>
            </>
          )}
        </div>

        {/* Trainer chip */}
        {trainerName && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '4px 10px', marginBottom: 10 }}>
            <Dumbbell size={11} color="#16A34A" />
            <span style={{ fontSize: 12, color: '#047857', fontWeight: 600 }}>{trainerName}</span>
          </div>
        )}

        {/* Action buttons */}
        {['SCHEDULED', 'CONFIRMED'].includes(a.status) && (
          <div style={{ display: 'flex', gap: 6, paddingTop: 10, borderTop: '1px solid #F3F4F6', flexWrap: 'wrap' }}>
            {a.status === 'SCHEDULED' && (
              <button onClick={() => onChangeStatus(a.id, 'CONFIRMED')}
                style={{ flex: 1, minWidth: 70, padding: '6px 4px', borderRadius: 8, border: '1.5px solid #16A34A', color: '#16A34A', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'transparent' }}>
                Confirm
              </button>
            )}
            <button onClick={() => onMarkComplete(a)}
              style={{ flex: 1, minWidth: 70, padding: '6px 4px', borderRadius: 8, border: 'none', color: '#fff', background: 'var(--navy)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Complete
            </button>
            {a.status === 'CONFIRMED' && (
              <button onClick={() => onChangeStatus(a.id, 'NO_SHOW')}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #D97706', color: '#D97706', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'transparent' }}>
                No-show
              </button>
            )}
            {a.status === 'SCHEDULED' && (
              <button onClick={() => onChangeStatus(a.id, 'CANCELLED')}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #DC2626', color: '#DC2626', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'transparent' }}>
                Cancel
              </button>
            )}
            {a.customer?.phone && (
              <button
                onClick={async () => { try { await sendWAAppointmentReminder(a.id); toast.success('Reminder sent'); } catch { toast.error('Failed'); } }}
                title="Send WhatsApp Reminder"
                style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #25D366', color: '#25D366', background: 'transparent', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <MessageCircle size={12} /> WA
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Table row (non-gym / fallback) ─────────────────────────────────────────────
function TableRow({ a, onChangeStatus, onMarkComplete }) {
  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}
      onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
      onMouseLeave={e => e.currentTarget.style.background = ''}>
      <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 500 }}>{a.customer?.name || <span style={{ color: '#9CA3AF' }}>Walk-in</span>}</td>
      <td style={{ padding: '14px 16px', fontSize: 14 }}>{a.service?.name || '—'}</td>
      <td style={{ padding: '14px 16px', fontSize: 13, color: '#6B7280' }}>{fmtDate(a.startTime || a.scheduledAt)}</td>
      <td style={{ padding: '14px 16px', fontSize: 13, color: '#6B7280' }}>{fmtTime(a.startTime || a.scheduledAt)}</td>
      <td style={{ padding: '14px 16px', fontSize: 13, color: '#6B7280' }}>{a.staff?.name || a.staffName || '—'}</td>
      <td style={{ padding: '14px 16px' }}><StatusBadge status={a.status} /></td>
      <td style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {a.status === 'SCHEDULED' && (<>
            <button onClick={() => onChangeStatus(a.id, 'CONFIRMED')} style={{ fontSize: 12, color: '#16A34A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Confirm</button>
            <button onClick={() => onMarkComplete(a)} style={{ fontSize: 12, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Complete</button>
            <button onClick={() => onChangeStatus(a.id, 'CANCELLED')} style={{ fontSize: 12, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
          </>)}
          {a.status === 'CONFIRMED' && (<>
            <button onClick={() => onMarkComplete(a)} style={{ fontSize: 12, color: '#16A34A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Complete</button>
            <button onClick={() => onChangeStatus(a.id, 'NO_SHOW')} style={{ fontSize: 12, color: '#D97706', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>No-show</button>
          </>)}
          {a.customer?.phone && ['SCHEDULED', 'CONFIRMED'].includes(a.status) && (
            <button
              onClick={async () => { try { await sendWAAppointmentReminder(a.id); toast.success('Reminder sent via WhatsApp'); } catch { toast.error('Failed to send reminder'); } }}
              title="Send WhatsApp Reminder"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#25D366', padding: 2 }}>
              <MessageCircle size={14} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Section Header ─────────────────────────────────────────────────────────────
function SectionHeader({ title, count, color = 'var(--navy)' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color, margin: 0, letterSpacing: '-0.01em' }}>{title}</h2>
      {count > 0 && (
        <span style={{ background: color + '18', color, fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>{count}</span>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Appointments() {
  const { isMobile } = useBreakpoint();
  const { tenant } = useAuth();
  const isGym = GYM_TYPES.includes(tenant?.businessType);
  const apptLabel = isGym ? 'Session' : 'Appointment';

  const [appointments, setAppointments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [trainerFilter, setTrainerFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [noMemberOnly, setNoMemberOnly] = useState(false);

  // Filter data
  const [staffList, setStaffList] = useState([]);
  const [servicesList, setServicesList] = useState([]);

  const [showBook, setShowBook] = useState(false);
  const [waConfirm, setWaConfirm] = useState(null);

  // Load filter options for gym
  useEffect(() => {
    if (!isGym) return;
    getStaff().then(r => setStaffList(r.data.data || [])).catch(() => {});
    getServices().then(r => setServicesList(r.data.data || [])).catch(() => {});
  }, [isGym]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (trainerFilter) params.staffId = trainerFilter;
      if (serviceFilter) params.serviceId = serviceFilter;
      if (noMemberOnly) params.noCustomer = 'true';
      const r = await getAppointments(params);
      const d = r.data.data;
      const list = Array.isArray(d) ? d : (d?.appointments || []);
      setAppointments(list);
      setTotal(d?.total ?? list.length);
    } catch {
      toast.error('Failed to load');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, trainerFilter, serviceFilter, noMemberOnly]);

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

  const markComplete = async (a) => {
    try {
      await updateAppointmentStatus(a.id, 'COMPLETED');
      toast.success('Marked complete');
      load();
      if (a.customer?.phone) setWaConfirm({ name: a.customer.name, phone: a.customer.phone, service: a.service?.name });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  // Stats derived from loaded data
  const todayAppts = appointments.filter(a => isToday(a.startTime || a.scheduledAt));
  const upcomingAppts = appointments.filter(a => {
    const dt = new Date(a.startTime || a.scheduledAt);
    return dt > new Date() && !isToday(a.startTime || a.scheduledAt);
  });
  const completedAppts = appointments.filter(a => a.status === 'COMPLETED');
  const activeTrainers = [...new Set(appointments.filter(a => isToday(a.startTime || a.scheduledAt) && (a.staff?.name || a.staffName)).map(a => a.staff?.name || a.staffName))];

  const hasActiveFilters = trainerFilter || serviceFilter || noMemberOnly || statusFilter;

  return (
    <div style={{ ...P.wrap(isMobile), maxWidth: 1200, margin: '0 auto' }}>
      {/* Page header */}
      <div style={P.head}>
        <div>
          <h1 style={P.h1(isMobile)}>{isGym ? 'Training Sessions' : 'Appointments'}</h1>
          <p style={P.sub}>
            {total} total · {appointments.length} showing
            {hasActiveFilters && <span style={{ color: 'var(--cyan)', fontWeight: 600 }}> · Filtered</span>}
          </p>
        </div>
        <Button onClick={() => setShowBook(true)} style={{ flexShrink: 0 }}>
          <Plus size={16} style={{ marginRight: 6 }} />Book {apptLabel}
        </Button>
      </div>

      <KpiBar stats={[
        { label: isGym ? "Today's Sessions" : "Today's Bookings", value: todayAppts.length,    color: 'var(--cyan)', icon: Calendar     },
        { label: 'Upcoming',                                       value: upcomingAppts.length,   color: '#3B82F6',    icon: Clock        },
        { label: 'Completed',                                      value: completedAppts.length,  color: '#16A34A',    icon: CheckCircle  },
        ...(isGym ? [{ label: 'Active Trainers', value: activeTrainers.length, color: '#8B5CF6', icon: Dumbbell }] : []),
      ]} />

      {/* Active trainers today (gym only) */}
      {isGym && activeTrainers.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <Dumbbell size={14} color="#16A34A" />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>On duty today:</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {activeTrainers.map(name => (
              <span key={name} style={{ background: '#F0FDF4', color: '#047857', border: '1px solid #BBF7D0', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 0 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', flexShrink: 0 }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={isGym ? 'Search member or class...' : 'Search customer or service...'}
            style={{ width: '100%', padding: '8px 10px 8px 32px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#FAFAFA', boxSizing: 'border-box' }} />
        </div>

        {/* Trainer filter (gym) */}
        {isGym && (
          <select value={trainerFilter} onChange={e => setTrainerFilter(e.target.value)}
            style={{ padding: '8px 12px', border: trainerFilter ? '1.5px solid var(--cyan)' : '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: trainerFilter ? '#F0FDFE' : '#fff', color: trainerFilter ? 'var(--navy)' : '#6B7280', minWidth: 140 }}>
            <option value="">All trainers</option>
            {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}

        {/* Class/Service type filter (gym) */}
        {isGym && (
          <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)}
            style={{ padding: '8px 12px', border: serviceFilter ? '1.5px solid var(--cyan)' : '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: serviceFilter ? '#F0FDFE' : '#fff', color: serviceFilter ? 'var(--navy)' : '#6B7280', minWidth: 140 }}>
            <option value="">All classes</option>
            {servicesList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}

        {/* Status filter */}
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', border: statusFilter ? '1.5px solid var(--cyan)' : '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: statusFilter ? '#F0FDFE' : '#fff', color: statusFilter ? 'var(--navy)' : '#6B7280', minWidth: 120 }}>
          <option value="">All status</option>
          {Object.keys(STATUS_STYLES).map(s => <option key={s} value={s}>{STATUS_STYLES[s].label}</option>)}
        </select>

        {/* Walk-ins toggle (gym) */}
        {isGym && (
          <button onClick={() => setNoMemberOnly(v => !v)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8, border: noMemberOnly ? '1.5px solid #3B82F6' : '1px solid var(--border)',
            background: noMemberOnly ? '#EFF6FF' : '#fff', color: noMemberOnly ? '#1D4ED8' : '#6B7280',
            fontSize: 13, fontWeight: noMemberOnly ? 700 : 500, cursor: 'pointer', flexShrink: 0,
          }}>
            <User size={13} />
            Walk-ins only
          </button>
        )}

        {/* Clear filters */}
        {hasActiveFilters && (
          <button onClick={() => { setTrainerFilter(''); setServiceFilter(''); setNoMemberOnly(false); setStatusFilter(''); }}
            style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: '#FEF2F2', color: '#DC2626', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* ── Gym: Card Layout ── */}
      {isGym ? (
        loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ height: 200, background: '#F3F4F6', borderRadius: 14, animation: 'pulse 1.4s ease-in-out infinite' }} />
            ))}
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
          </div>
        ) : appointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16, border: '1px solid var(--border)' }}>
            <div style={{ width: 64, height: 64, background: '#F3F4F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Calendar size={28} color="#D1D5DB" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--navy)', marginBottom: 6 }}>No sessions found</h3>
            <p style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 20 }}>
              {hasActiveFilters ? 'Try adjusting your filters' : 'Book your first training session'}
            </p>
            {!hasActiveFilters && (
              <Button onClick={() => setShowBook(true)}><Plus size={14} style={{ marginRight: 6 }} />Book Session</Button>
            )}
          </div>
        ) : (
          <div>
            {/* Today's sessions */}
            {todayAppts.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <SectionHeader title="Today's Sessions" count={todayAppts.length} color="var(--cyan)" />
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                  {todayAppts.map(a => (
                    <SessionCard key={a.id} a={a} onChangeStatus={changeStatus} onMarkComplete={markComplete} />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming sessions */}
            {upcomingAppts.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <SectionHeader title="Upcoming" count={upcomingAppts.length} color="#3B82F6" />
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                  {upcomingAppts.map(a => (
                    <SessionCard key={a.id} a={a} onChangeStatus={changeStatus} onMarkComplete={markComplete} />
                  ))}
                </div>
              </div>
            )}

            {/* Past / completed */}
            {appointments.filter(a => {
              const dt = new Date(a.startTime || a.scheduledAt);
              return dt < new Date() && !isToday(a.startTime || a.scheduledAt);
            }).length > 0 && (
              <div>
                <SectionHeader title="Past Sessions" count={appointments.filter(a => { const dt = new Date(a.startTime || a.scheduledAt); return dt < new Date() && !isToday(a.startTime || a.scheduledAt); }).length} color="#9CA3AF" />
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                  {appointments.filter(a => { const dt = new Date(a.startTime || a.scheduledAt); return dt < new Date() && !isToday(a.startTime || a.scheduledAt); }).map(a => (
                    <SessionCard key={a.id} a={a} onChangeStatus={changeStatus} onMarkComplete={markComplete} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        /* ── Non-Gym: Table Layout ── */
        <div style={P.tableWrap}>
          <div style={P.tableScroll}>
            <table style={{ ...P.table, minWidth: isMobile ? 'auto' : 560 }}>
              <thead style={P.thead}>
                <tr>
                  {['Customer', 'Service', 'Date', 'Time', 'Staff', 'Status', 'Actions'].map(h => (
                    <th key={h} style={P.th()}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={P.empty}>Loading...</td></tr>
                ) : appointments.length === 0 ? (
                  <tr><td colSpan={7} style={P.empty}>
                    <Calendar size={32} style={{ marginBottom: 8, opacity: 0.4, display: 'block', margin: '0 auto 8px' }} />
                    No appointments found
                  </td></tr>
                ) : appointments.map(a => (
                  <TableRow key={a.id} a={a} onChangeStatus={changeStatus} onMarkComplete={markComplete} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showBook && <BookModal onClose={() => setShowBook(false)} onBooked={() => { setShowBook(false); load(); }} isGym={isGym} />}

      {waConfirm && (() => {
        const businessName = tenant?.name || 'us';
        const msg = `Hi ${waConfirm.name}, your *${waConfirm.service || 'session'}* at ${businessName} is complete. Great workout! See you next time 💪`;
        const waUrl = `https://wa.me/91${waConfirm.phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(msg)}`;
        return (
          <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#fff', border: '1px solid #DCF8C6', borderRadius: 14, padding: '16px 20px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', zIndex: 300, maxWidth: 320 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>{isGym ? 'Session Completed' : 'Service Completed'}</div>
              <button onClick={() => setWaConfirm(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={16} /></button>
            </div>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>Notify {waConfirm.name} on WhatsApp?</p>
            <a href={waUrl} target="_blank" rel="noopener noreferrer" onClick={() => setWaConfirm(null)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#25D366', color: '#fff', padding: '9px 16px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 13 }}>
              <MessageCircle size={14} />
              Send on WhatsApp
            </a>
          </div>
        );
      })()}
    </div>
  );
}
