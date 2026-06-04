import { useState, useEffect, useCallback, useRef } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useNavigate } from 'react-router-dom';
import { P } from '../../styles/page';
import KpiBar from '../../components/ui/KpiBar';
import {
  getAppointments, createAppointment, updateAppointmentStatus,
  rescheduleAppointment, getServices, getCustomers, getStaff,
  sendWAAppointmentReminder,
} from '../../api';
import VitalsModal from '../../components/clinic/VitalsModal';
import {
  Plus, Calendar, Search, X, Clock, CheckCircle, MessageCircle,
  User, Dumbbell, Filter, Activity, Stethoscope,
  ChevronLeft, ChevronRight, RefreshCw, RepeatIcon, LayoutList, CalendarDays,
  AlertTriangle,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  SCHEDULED: { bg: '#EFF6FF', color: '#3B82F6', label: 'Scheduled' },
  CONFIRMED:  { bg: '#F0FDF4', color: '#16A34A', label: 'Confirmed' },
  COMPLETED:  { bg: '#F3F4F6', color: '#6B7280', label: 'Completed' },
  CANCELLED:  { bg: '#FEF2F2', color: '#DC2626', label: 'Cancelled' },
  NO_SHOW:    { bg: '#FFFBEB', color: '#D97706', label: 'No-show'   },
};

const CLASS_PALETTE = ['#8B5CF6','#3B82F6','#EF4444','#10B981','#F59E0B','#06B6D4','#EC4899','#6366F1'];
const classColorCache = {};
const getClassColor = (name) => {
  if (!name) return '#6B7280';
  if (classColorCache[name]) return classColorCache[name];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return (classColorCache[name] = CLASS_PALETTE[Math.abs(h) % CLASS_PALETTE.length]);
};

const fmtTime  = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';
const fmtFull  = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmt      = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const isToday  = (d) => new Date(d).toDateString() === new Date().toDateString();
const isTomorrow = (d) => { const t = new Date(); t.setDate(t.getDate() + 1); return new Date(d).toDateString() === t.toDateString(); };

const GYM_TYPES = ['GYM', 'SPA'];

// ── PatientTypeahead ──────────────────────────────────────────────────────────
function PatientTypeahead({ value, name, onChange, onSelect, placeholder = 'Search patient…' }) {
  const [query, setQuery]     = useState(name || '');
  const [results, setResults] = useState([]);
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef              = useRef(null);
  const wrapRef               = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = useCallback((q) => {
    clearTimeout(timerRef.current);
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await getCustomers({ search: q, limit: 8 });
        setResults(r.data.data || []);
        setOpen(true);
      } catch { /* silent */ } finally { setLoading(false); }
    }, 280);
  }, []);

  const handleInput = (e) => {
    const q = e.target.value;
    setQuery(q);
    if (!q) { onSelect(null); setOpen(false); return; }
    search(q);
    // If user clears the typeahead, unset the selected ID
    onChange(null);
  };

  const handleSelect = (customer) => {
    setQuery(customer.name + (customer.phone ? ` (${customer.phone})` : ''));
    onSelect(customer.id);
    setOpen(false);
    setResults([]);
  };

  const handleWalkIn = () => {
    setQuery('Walk-in');
    onSelect(null);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
        <input
          value={query}
          onChange={handleInput}
          onFocus={() => query && results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '9px 12px 9px 32px',
            border: '1.5px solid #E5E7EB', borderRadius: 8,
            fontSize: 14, outline: 'none', background: '#fff',
          }}
        />
        {loading && (
          <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, borderRadius: '50%', border: '2px solid #E5E7EB', borderTopColor: 'var(--cyan)', animation: 'spin 0.6s linear infinite' }} />
        )}
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
          background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: 4,
          maxHeight: 240, overflowY: 'auto',
        }}>
          {results.map(c => (
            <button key={c.id} onMouseDown={() => handleSelect(c)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', textAlign: 'left', padding: '10px 14px',
              border: 'none', background: 'none', cursor: 'pointer',
              borderBottom: '1px solid #F9FAFB',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                {c.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{c.name}</div>
                {c.phone && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{c.phone}</div>}
              </div>
            </button>
          ))}
          {results.length === 0 && !loading && (
            <div style={{ padding: '10px 14px', fontSize: 12, color: '#9CA3AF' }}>No patients found</div>
          )}
          <button onMouseDown={handleWalkIn} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', textAlign: 'left', padding: '10px 14px',
            border: 'none', background: '#FAFAFA', cursor: 'pointer',
            borderTop: '1px solid #F3F4F6', fontSize: 12, color: '#6B7280', fontWeight: 600,
          }}>
            <User size={13} /> Continue as Walk-in
          </button>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── StatusBadge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.SCHEDULED;
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

// ── RescheduleModal ───────────────────────────────────────────────────────────
function RescheduleModal({ appointment, onClose, onSaved }) {
  const dt   = appointment.startTime || appointment.scheduledAt;
  const d    = dt ? new Date(dt) : new Date();
  const [date, setDate] = useState(d.toISOString().slice(0, 10));
  const [time, setTime] = useState(d.toTimeString().slice(0, 5));
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!date || !time) return toast.error('Date and time required');
    setLoading(true);
    try {
      await rescheduleAppointment(appointment.id, { date, time });
      toast.success('Appointment rescheduled');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reschedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 380, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--navy)', margin: 0 }}>
              Reschedule Appointment
            </h3>
            <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0' }}>
              {appointment.customer?.name || 'Walk-in'} · {appointment.service?.name}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={18} /></button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#92400E', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={13} />
            Current: {fmtFull(dt)} at {fmtTime(dt)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="New date *" type="date" value={date} onChange={e => setDate(e.target.value)} />
            <Input label="New time *" type="time" value={time} onChange={e => setTime(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Reschedule</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── BookModal (with typeahead + recurring) ────────────────────────────────────
function BookModal({ onClose, onBooked, isGym }) {
  const { tenant } = useAuth();
  const [services, setServices] = useState([]);
  const [staff,    setStaff]    = useState([]);
  const [form, setForm] = useState({
    customerId: '', customerName: '', serviceId: '',
    staffId: '', staffName: '', date: '', time: '', notes: '',
  });
  const [recurring, setRecurring] = useState({ enabled: false, frequency: 'weekly', count: 4 });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    getServices().then(r => setServices(r.data.data || [])).catch(() => {});
    if (isGym) getStaff().then(r => setStaff(r.data.data || [])).catch(() => {});
  }, [isGym]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.serviceId || !form.date || !form.time) return toast.error('Service, date and time are required');
    setLoading(true);
    try {
      const selectedStaff = staff.find(s => s.id === form.staffId);
      const payload = {
        customerId: form.customerId || undefined,
        serviceId:  form.serviceId,
        staffId:    form.staffId   || undefined,
        staffName:  selectedStaff?.name || form.staffName || undefined,
        scheduledAt: new Date(`${form.date}T${form.time}`).toISOString(),
        notes: form.notes,
        ...(recurring.enabled && { recurring: { frequency: recurring.frequency, count: recurring.count } }),
      };

      await createAppointment(payload);

      if (recurring.enabled) {
        toast.success(`${recurring.count} appointments created`);
        onBooked();
        return;
      }

      const cust = { id: form.customerId, name: form.customerName || null };
      const svc  = services.find(s => s.id === form.serviceId);
      setDone({ name: cust.name, phone: null, service: svc?.name, dateTime: payload.scheduledAt });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    const businessName = tenant?.name || 'us';
    const apptTime = new Date(done.dateTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
    const msg = `Hi ${done.name || 'there'}, your ${isGym ? 'training session' : 'appointment'} for *${done.service || 'service'}* at ${businessName} is confirmed for ${apptTime}. See you then!`;

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
          <Button variant="ghost" onClick={onBooked} style={{ width: '100%' }}>Done</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540, padding: 28, maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)', margin: 0 }}>
            {isGym ? 'Book Training Session' : 'Book Appointment'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Patient typeahead */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{isGym ? 'Member (optional)' : 'Patient (optional)'}</label>
            <PatientTypeahead
              value={form.customerId}
              name={form.customerName}
              onChange={(id) => setForm(f => ({ ...f, customerId: id || '' }))}
              onSelect={(id) => setForm(f => ({ ...f, customerId: id || '' }))}
              placeholder={isGym ? 'Search member or walk-in…' : 'Search patient or walk-in…'}
            />
          </div>

          {/* Service */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{isGym ? 'Class / Service *' : 'Service *'}</label>
            <select value={form.serviceId} onChange={set('serviceId')} style={{ padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, background: '#fff' }}>
              <option value="">{isGym ? 'Select class type' : 'Select service'}</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name} — {fmt(s.price)} ({s.duration || s.durationMinutes} min)</option>)}
            </select>
          </div>

          {/* Date + Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input label="Date *" type="date" value={form.date} onChange={set('date')} />
            <Input label="Time *" type="time" value={form.time} onChange={set('time')} />
          </div>

          {/* Staff */}
          {isGym && staff.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Trainer (optional)</label>
              <select value={form.staffId} onChange={set('staffId')} style={{ padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, background: '#fff' }}>
                <option value="">No trainer assigned</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}{s.role ? ` (${s.role})` : ''}</option>)}
              </select>
            </div>
          ) : (
            <Input label="Doctor / Staff (optional)" placeholder="e.g. Dr. Arjun Sharma" value={form.staffName} onChange={set('staffName')} />
          )}

          <Input label="Notes" placeholder="Any special instructions…" value={form.notes} onChange={set('notes')} />

          {/* ── Recurring section ─────────────────────────────────────────── */}
          <div style={{ border: '1.5px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
            <button type="button"
              onClick={() => setRecurring(r => ({ ...r, enabled: !r.enabled }))}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '10px 14px', background: recurring.enabled ? '#EFF6FF' : '#FAFAFA',
                border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                color: recurring.enabled ? '#1D4ED8' : '#374151',
              }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <RepeatIcon size={14} />
                Recurring appointment
              </span>
              <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400 }}>
                {recurring.enabled ? 'ON' : 'OFF'}
              </span>
            </button>

            {recurring.enabled && (
              <div style={{ padding: '12px 14px', display: 'flex', gap: 12, background: '#F8FAFF' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Repeat every</label>
                  <select value={recurring.frequency} onChange={e => setRecurring(r => ({ ...r, frequency: e.target.value }))}
                    style={{ padding: '7px 10px', border: '1px solid #D1D5DB', borderRadius: 7, fontSize: 13, background: '#fff' }}>
                    <option value="daily">Day</option>
                    <option value="weekly">Week</option>
                    <option value="monthly">Month</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Times</label>
                  <input type="number" min={2} max={52} value={recurring.count}
                    onChange={e => setRecurring(r => ({ ...r, count: Math.max(2, Math.min(52, +e.target.value)) }))}
                    style={{ padding: '7px 10px', border: '1px solid #D1D5DB', borderRadius: 7, fontSize: 13, background: '#fff' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 0 }}>
                  <div style={{ fontSize: 12, color: '#6B7280', paddingBottom: 7 }}>
                    = {recurring.count} appointments
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>
              {recurring.enabled ? `Book ${recurring.count} appointments` : `Book ${isGym ? 'Session' : 'Appointment'}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Week Calendar View ────────────────────────────────────────────────────────
function WeekCalendar({ appointments, weekStart, onChangeStatus, onReschedule, onVitals, onEMR, isClinic, isGym }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const byDay = {};
  days.forEach(d => { byDay[d.toDateString()] = []; });
  appointments.forEach(a => {
    const key = new Date(a.startTime || a.scheduledAt).toDateString();
    if (byDay[key]) byDay[key].push(a);
  });

  const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
      {days.map((day, i) => {
        const isNow    = isToday(day);
        const dayAppts = byDay[day.toDateString()] || [];
        return (
          <div key={i} style={{
            background: '#fff', borderRadius: 12,
            border: `1.5px solid ${isNow ? 'var(--cyan)' : '#E5E7EB'}`,
            minHeight: 160, overflow: 'hidden',
          }}>
            {/* Day header */}
            <div style={{
              padding: '8px 10px',
              background: isNow ? 'var(--navy)' : '#F9FAFB',
              borderBottom: '1px solid #F0F0F0',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: isNow ? 'rgba(255,255,255,0.6)' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {DAY_NAMES[day.getDay()]}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: isNow ? '#fff' : 'var(--navy)', lineHeight: 1.1 }}>
                {day.getDate()}
              </div>
              {dayAppts.length > 0 && (
                <div style={{ fontSize: 10, color: isNow ? 'rgba(255,255,255,0.6)' : '#9CA3AF', marginTop: 2 }}>
                  {dayAppts.length} appt{dayAppts.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Appointments */}
            <div style={{ padding: '6px 6px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {dayAppts.length === 0 ? (
                <div style={{ fontSize: 10, color: '#D1D5DB', textAlign: 'center', padding: '16px 0' }}>—</div>
              ) : dayAppts.map(a => {
                const color = getClassColor(a.service?.name);
                const s = STATUS_STYLES[a.status] || STATUS_STYLES.SCHEDULED;
                return (
                  <div key={a.id} style={{
                    background: `${color}10`,
                    border: `1px solid ${color}35`,
                    borderLeft: `3px solid ${color}`,
                    borderRadius: 7, padding: '5px 7px',
                    fontSize: 11,
                  }}>
                    <div style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: 2 }}>
                      {fmtTime(a.startTime || a.scheduledAt)}
                    </div>
                    <div style={{ color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.customer?.name || 'Walk-in'}
                    </div>
                    <div style={{ color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                      {a.service?.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                      <span style={{ background: s.bg, color: s.color, fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>{s.label}</span>
                      {['SCHEDULED','CONFIRMED'].includes(a.status) && (
                        <button onClick={() => onReschedule(a)} title="Reschedule"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 0, display: 'flex', alignItems: 'center' }}>
                          <RefreshCw size={10} />
                        </button>
                      )}
                      {isClinic && (
                        <button onClick={() => onVitals(a)} title="Vitals"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0891B2', padding: 0, display: 'flex', alignItems: 'center' }}>
                          <Activity size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ title, count, color = 'var(--navy)' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color, margin: 0 }}>{title}</h2>
      {count > 0 && <span style={{ background: color + '18', color, fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>{count}</span>}
    </div>
  );
}

// ── Session Card (Gym) ────────────────────────────────────────────────────────
function SessionCard({ a, onChangeStatus, onMarkComplete, onReschedule }) {
  const dt          = new Date(a.startTime || a.scheduledAt);
  const timeStr     = fmtTime(a.startTime || a.scheduledAt);
  const today       = isToday(a.startTime || a.scheduledAt);
  const tomorrow    = isTomorrow(a.startTime || a.scheduledAt);
  const trainerName = a.staff?.name || a.staffName;
  const classColor  = getClassColor(a.service?.name);
  const isPast      = dt < new Date() && !['SCHEDULED','CONFIRMED'].includes(a.status);

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', opacity: isPast ? 0.7 : 1 }}>
      <div style={{ height: 3, background: `linear-gradient(90deg,${classColor},${classColor}88)` }} />
      <div style={{ padding: '14px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ background: today ? 'var(--navy)' : '#F3F4F6', color: today ? '#fff' : '#374151', borderRadius: 7, padding: '4px 10px', fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
            {today ? timeStr : tomorrow ? `Tomorrow · ${timeStr}` : `${fmtDate(a.startTime || a.scheduledAt)} · ${timeStr}`}
          </div>
          {a.service?.name && (
            <span style={{ background: classColor + '15', color: classColor, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{a.service.name}</span>
          )}
          <div style={{ marginLeft: 'auto' }}><StatusBadge status={a.status} /></div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: trainerName ? 8 : 10 }}>
          {a.customer ? (
            <>
              <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg,${classColor}cc,${classColor}66)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 800 }}>
                {a.customer.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>{a.customer.name}</div>
                {a.customer.phone && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{a.customer.phone}</div>}
              </div>
            </>
          ) : (
            <>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={16} color="#9CA3AF" />
              </div>
              <span style={{ fontSize: 14, color: '#9CA3AF', fontWeight: 600 }}>Walk-in</span>
            </>
          )}
        </div>

        {trainerName && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '4px 10px', marginBottom: 10 }}>
            <Dumbbell size={11} color="#16A34A" />
            <span style={{ fontSize: 12, color: '#047857', fontWeight: 600 }}>{trainerName}</span>
          </div>
        )}

        {['SCHEDULED','CONFIRMED'].includes(a.status) && (
          <div style={{ display: 'flex', gap: 6, paddingTop: 10, borderTop: '1px solid #F3F4F6', flexWrap: 'wrap' }}>
            {a.status === 'SCHEDULED' && (
              <button onClick={() => onChangeStatus(a.id, 'CONFIRMED')} style={{ flex: 1, minWidth: 60, padding: '6px 4px', borderRadius: 8, border: '1.5px solid #16A34A', color: '#16A34A', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'transparent' }}>Confirm</button>
            )}
            <button onClick={() => onMarkComplete(a)} style={{ flex: 1, minWidth: 60, padding: '6px 4px', borderRadius: 8, border: 'none', color: '#fff', background: 'var(--navy)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Complete</button>
            {a.status === 'CONFIRMED' && (
              <button onClick={() => onChangeStatus(a.id, 'NO_SHOW')} style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #D97706', color: '#D97706', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'transparent' }}>No-show</button>
            )}
            {a.status === 'SCHEDULED' && (
              <button onClick={() => onChangeStatus(a.id, 'CANCELLED')} style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #DC2626', color: '#DC2626', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'transparent' }}>Cancel</button>
            )}
            <button onClick={() => onReschedule(a)} title="Reschedule" style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #6B7280', color: '#6B7280', background: 'transparent', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <RefreshCw size={11} /> Reschedule
            </button>
            {a.customer?.phone && (
              <button onClick={async () => { try { await sendWAAppointmentReminder(a.id); toast.success('Reminder sent'); } catch { toast.error('Failed'); } }}
                title="WhatsApp Reminder"
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

// ── Table Row (clinic/non-gym) ────────────────────────────────────────────────
function TableRow({ a, onChangeStatus, onMarkComplete, isClinic, onVitals, onEMR, onReschedule }) {
  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}
      onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
      onMouseLeave={e => e.currentTarget.style.background = ''}>
      <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500 }}>{a.customer?.name || <span style={{ color: '#9CA3AF' }}>Walk-in</span>}</td>
      <td style={{ padding: '12px 16px', fontSize: 14 }}>{a.service?.name || '—'}</td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B7280' }}>{fmtDate(a.startTime || a.scheduledAt)}</td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B7280' }}>{fmtTime(a.startTime || a.scheduledAt)}</td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B7280' }}>{a.staff?.name || a.staffName || '—'}</td>
      <td style={{ padding: '12px 16px' }}><StatusBadge status={a.status} /></td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {a.status === 'SCHEDULED' && (
            <>
              <button onClick={() => onChangeStatus(a.id, 'CONFIRMED')} style={{ fontSize: 12, color: '#16A34A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Confirm</button>
              <button onClick={() => onMarkComplete(a)} style={{ fontSize: 12, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Complete</button>
              <button onClick={() => onChangeStatus(a.id, 'CANCELLED')} style={{ fontSize: 12, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
            </>
          )}
          {a.status === 'CONFIRMED' && (
            <>
              <button onClick={() => onMarkComplete(a)} style={{ fontSize: 12, color: '#16A34A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Complete</button>
              <button onClick={() => onChangeStatus(a.id, 'NO_SHOW')} style={{ fontSize: 12, color: '#D97706', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>No-show</button>
            </>
          )}
          {['SCHEDULED','CONFIRMED'].includes(a.status) && (
            <button onClick={() => onReschedule(a)} style={{ fontSize: 12, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
              <RefreshCw size={11} /> Reschedule
            </button>
          )}
          {isClinic && (
            <button onClick={() => onVitals(a)} title="Record Vitals" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0891B2', padding: 2, display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600 }}>
              <Activity size={13} /> Vitals
            </button>
          )}
          {isClinic && (
            <button onClick={() => onEMR(a.id)} title="Open EMR" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7C3AED', padding: 2, display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600 }}>
              <Stethoscope size={13} /> EMR
            </button>
          )}
          {a.customer?.phone && ['SCHEDULED','CONFIRMED'].includes(a.status) && (
            <button onClick={async () => { try { await sendWAAppointmentReminder(a.id); toast.success('Reminder sent'); } catch { toast.error('Failed'); } }}
              title="WhatsApp Reminder" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#25D366', padding: 2 }}>
              <MessageCircle size={14} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Appointments() {
  const { isMobile }   = useBreakpoint();
  const navigate        = useNavigate();
  const { tenant }      = useAuth();
  const isGym           = GYM_TYPES.includes(tenant?.businessType);
  const isClinic        = tenant?.businessType === 'CLINIC';
  const apptLabel       = isGym ? 'Session' : 'Appointment';

  const [appointments, setAppointments] = useState([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);

  // View: 'list' | 'week'
  const [view, setView] = useState('list');

  // Week navigation
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay()); // start on Sunday
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Filters
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [staffList, setStaffList]       = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [trainerFilter, setTrainerFilter]   = useState('');
  const [serviceFilter, setServiceFilter]   = useState('');
  const [noMemberOnly, setNoMemberOnly]     = useState(false);

  const [showBook, setShowBook]         = useState(false);
  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [vitalsAppt, setVitalsAppt]     = useState(null);

  useEffect(() => {
    if (!isGym) return;
    getStaff().then(r => setStaffList(r.data.data || [])).catch(() => {});
    getServices().then(r => setServicesList(r.data.data || [])).catch(() => {});
  }, [isGym]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)         params.search    = search;
      if (statusFilter)   params.status    = statusFilter;
      if (trainerFilter)  params.staffId   = trainerFilter;
      if (serviceFilter)  params.serviceId = serviceFilter;
      if (noMemberOnly)   params.noCustomer = 'true';

      // Week view: fetch exactly that week
      if (view === 'week') {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        params.from  = weekStart.toISOString();
        params.to    = weekEnd.toISOString();
        params.limit = 200;
      }

      const r = await getAppointments(params);
      const d = r.data.data;
      const list = Array.isArray(d) ? d : (d?.appointments || []);
      setAppointments(list);
      setTotal(d?.total ?? list.length);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, trainerFilter, serviceFilter, noMemberOnly, view, weekStart]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (id, status) => {
    try { await updateAppointmentStatus(id, status); toast.success('Status updated'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const markComplete = async (a) => {
    try {
      await updateAppointmentStatus(a.id, 'COMPLETED');
      toast.success('Marked complete — bill created in Clinic Billing');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  // Derived stats
  const todayAppts     = appointments.filter(a => isToday(a.startTime || a.scheduledAt));
  const upcomingAppts  = appointments.filter(a => { const dt = new Date(a.startTime || a.scheduledAt); return dt > new Date() && !isToday(a.startTime || a.scheduledAt); });
  const completedAppts = appointments.filter(a => a.status === 'COMPLETED');
  const activeTrainers = [...new Set(appointments.filter(a => isToday(a.startTime || a.scheduledAt) && (a.staff?.name || a.staffName)).map(a => a.staff?.name || a.staffName))];
  const hasActiveFilters = trainerFilter || serviceFilter || noMemberOnly || statusFilter;

  const weekLabel = (() => {
    const end = new Date(weekStart); end.setDate(end.getDate() + 6);
    return `${weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  })();

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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          {/* View toggle */}
          <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 9, padding: 3, gap: 2 }}>
            <button onClick={() => setView('list')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: view === 'list' ? '#fff' : 'transparent', color: view === 'list' ? 'var(--navy)' : '#6B7280', boxShadow: view === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.12s' }}>
              <LayoutList size={13} /> List
            </button>
            <button onClick={() => setView('week')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: view === 'week' ? '#fff' : 'transparent', color: view === 'week' ? 'var(--navy)' : '#6B7280', boxShadow: view === 'week' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.12s' }}>
              <CalendarDays size={13} /> Week
            </button>
          </div>
          <Button onClick={() => setShowBook(true)}>
            <Plus size={16} style={{ marginRight: 6 }} />Book {apptLabel}
          </Button>
        </div>
      </div>

      <KpiBar stats={[
        { label: isGym ? "Today's Sessions" : "Today's Bookings", value: todayAppts.length,    color: 'var(--cyan)', icon: Calendar    },
        { label: 'Upcoming',                                       value: upcomingAppts.length,  color: '#3B82F6',    icon: Clock       },
        { label: 'Completed',                                      value: completedAppts.length, color: '#16A34A',    icon: CheckCircle },
        ...(isGym ? [{ label: 'Active Trainers', value: activeTrainers.length, color: '#8B5CF6', icon: Dumbbell }] : []),
      ]} />

      {/* ── Week navigation ────────────────────────────────────────────────── */}
      {view === 'week' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 16px' }}>
          <button onClick={() => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', flex: 1, textAlign: 'center' }}>{weekLabel}</span>
          <button onClick={() => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }}>
            <ChevronRight size={18} />
          </button>
          <button onClick={() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); setWeekStart(d); }}
            style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', background: 'none', border: '1px solid var(--cyan)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
            Today
          </button>
        </div>
      )}

      {/* ── Filter bar (list view) ──────────────────────────────────────────── */}
      {view === 'list' && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 0 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={isGym ? 'Search member or class…' : 'Search patient or service…'}
              style={{ width: '100%', padding: '8px 10px 8px 32px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#FAFAFA', boxSizing: 'border-box' }} />
          </div>

          {isGym && (
            <select value={trainerFilter} onChange={e => setTrainerFilter(e.target.value)}
              style={{ padding: '8px 12px', border: trainerFilter ? '1.5px solid var(--cyan)' : '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: trainerFilter ? '#F0FDFE' : '#fff', minWidth: 130 }}>
              <option value="">All trainers</option>
              {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          {isGym && (
            <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)}
              style={{ padding: '8px 12px', border: serviceFilter ? '1.5px solid var(--cyan)' : '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: serviceFilter ? '#F0FDFE' : '#fff', minWidth: 130 }}>
              <option value="">All classes</option>
              {servicesList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', border: statusFilter ? '1.5px solid var(--cyan)' : '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: statusFilter ? '#F0FDFE' : '#fff', minWidth: 120 }}>
            <option value="">All status</option>
            {Object.keys(STATUS_STYLES).map(s => <option key={s} value={s}>{STATUS_STYLES[s].label}</option>)}
          </select>

          {isGym && (
            <button onClick={() => setNoMemberOnly(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: noMemberOnly ? '1.5px solid #3B82F6' : '1px solid var(--border)', background: noMemberOnly ? '#EFF6FF' : '#fff', color: noMemberOnly ? '#1D4ED8' : '#6B7280', fontSize: 13, fontWeight: noMemberOnly ? 700 : 500, cursor: 'pointer' }}>
              <User size={13} /> Walk-ins only
            </button>
          )}

          {hasActiveFilters && (
            <button onClick={() => { setTrainerFilter(''); setServiceFilter(''); setNoMemberOnly(false); setStatusFilter(''); }}
              style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: '#FEF2F2', color: '#DC2626', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <X size={12} /> Clear
            </button>
          )}
        </div>
      )}

      {/* ── Week View ────────────────────────────────────────────────────────── */}
      {view === 'week' && (
        loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8 }}>
            {[...Array(7)].map((_,i) => <div key={i} style={{ height: 200, background: '#F3F4F6', borderRadius: 12, animation: 'pulse 1.4s ease-in-out infinite' }} />)}
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
          </div>
        ) : (
          <WeekCalendar
            appointments={appointments}
            weekStart={weekStart}
            onChangeStatus={changeStatus}
            onReschedule={setRescheduleAppt}
            onVitals={setVitalsAppt}
            onEMR={(id) => navigate(`/emr/${id}`)}
            isClinic={isClinic}
            isGym={isGym}
          />
        )
      )}

      {/* ── List View ────────────────────────────────────────────────────────── */}
      {view === 'list' && (isGym ? (
        loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {[...Array(6)].map((_,i) => <div key={i} style={{ height: 200, background: '#F3F4F6', borderRadius: 14, animation: 'pulse 1.4s ease-in-out infinite' }} />)}
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
          </div>
        ) : appointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16, border: '1px solid var(--border)' }}>
            <Calendar size={32} style={{ margin: '0 auto 12px', color: '#D1D5DB' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--navy)', marginBottom: 6 }}>No sessions found</h3>
            <p style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 20 }}>{hasActiveFilters ? 'Try adjusting your filters' : 'Book your first training session'}</p>
            {!hasActiveFilters && <Button onClick={() => setShowBook(true)}><Plus size={14} style={{ marginRight: 6 }} />Book Session</Button>}
          </div>
        ) : (
          <div>
            {todayAppts.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <SectionHeader title="Today's Sessions" count={todayAppts.length} color="var(--cyan)" />
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                  {todayAppts.map(a => <SessionCard key={a.id} a={a} onChangeStatus={changeStatus} onMarkComplete={markComplete} onReschedule={setRescheduleAppt} />)}
                </div>
              </div>
            )}
            {upcomingAppts.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <SectionHeader title="Upcoming" count={upcomingAppts.length} color="#3B82F6" />
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                  {upcomingAppts.map(a => <SessionCard key={a.id} a={a} onChangeStatus={changeStatus} onMarkComplete={markComplete} onReschedule={setRescheduleAppt} />)}
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        /* Clinic / non-gym table */
        <div style={P.tableWrap}>
          <div style={P.tableScroll}>
            <table style={{ ...P.table, minWidth: isMobile ? 'auto' : 700 }}>
              <thead style={P.thead}>
                <tr>
                  {['Patient','Service','Date','Time','Staff/Doctor','Status','Actions'].map(h => (
                    <th key={h} style={P.th()}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={P.empty}>Loading…</td></tr>
                ) : appointments.length === 0 ? (
                  <tr><td colSpan={7} style={P.empty}>
                    <Calendar size={32} style={{ marginBottom: 8, opacity: 0.4, display: 'block', margin: '0 auto 8px' }} />
                    No appointments found
                  </td></tr>
                ) : appointments.map(a => (
                  <TableRow key={a.id} a={a}
                    onChangeStatus={changeStatus}
                    onMarkComplete={markComplete}
                    isClinic={isClinic}
                    onVitals={setVitalsAppt}
                    onEMR={(id) => navigate(`/emr/${id}`)}
                    onReschedule={setRescheduleAppt}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      {showBook && (
        <BookModal
          onClose={() => setShowBook(false)}
          onBooked={() => { setShowBook(false); load(); }}
          isGym={isGym}
        />
      )}

      {rescheduleAppt && (
        <RescheduleModal
          appointment={rescheduleAppt}
          onClose={() => setRescheduleAppt(null)}
          onSaved={() => { setRescheduleAppt(null); load(); }}
        />
      )}

      {vitalsAppt && (
        <VitalsModal
          appointmentId={vitalsAppt.id}
          customerId={vitalsAppt.customerId}
          patientName={vitalsAppt.customer?.name || 'Patient'}
          onClose={() => setVitalsAppt(null)}
          onSaved={() => setVitalsAppt(null)}
        />
      )}
    </div>
  );
}
