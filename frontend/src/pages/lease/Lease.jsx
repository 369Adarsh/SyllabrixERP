import { useState, useEffect, useCallback } from 'react';
import { getLeaseUnits, createLeaseUnit, getLeases, createLease, terminateLease, getRentDue, sendWARentReminder } from '../../api';
import { Plus, Building2, X, Users, IndianRupee, CheckCircle, AlertTriangle, MessageCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_STYLES = {
  ACTIVE:     { bg: '#F0FDF4', color: '#16A34A', label: 'Active' },
  EXPIRED:    { bg: '#FFFBEB', color: '#D97706', label: 'Expired' },
  TERMINATED: { bg: '#FEF2F2', color: '#DC2626', label: 'Terminated' },
  PENDING:    { bg: '#EFF6FF', color: '#3B82F6', label: 'Pending' },
};

function Badge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.PENDING;
  return <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{s.label}</span>;
}

function AddUnitModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ unitNumber: '', floor: '', area: '', description: '', monthlyRent: '' });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.unitNumber.trim()) return toast.error('Unit number is required');
    setLoading(true);
    try {
      await createLeaseUnit({
        unitNumber: form.unitNumber,
        floor: form.floor || undefined,
        area: form.area ? Number(form.area) : undefined,
        description: form.description || undefined,
        monthlyRent: form.monthlyRent ? Number(form.monthlyRent) : undefined,
      });
      toast.success('Unit added');
      onAdded();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>Add Unit / Shop</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input label="Unit / Shop number *" placeholder="e.g. A-101" value={form.unitNumber} onChange={set('unitNumber')} />
            <Input label="Floor" placeholder="e.g. Ground, 1st" value={form.floor} onChange={set('floor')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input label="Area (sq ft)" type="number" min="0" placeholder="450" value={form.area} onChange={set('area')} />
            <Input label="Monthly rent (₹)" type="number" min="0" placeholder="15000" value={form.monthlyRent} onChange={set('monthlyRent')} />
          </div>
          <Input label="Description" placeholder="Any remarks about the unit" value={form.description} onChange={set('description')} />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Add unit</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateLeaseModal({ units, onClose, onCreated }) {
  const [form, setForm] = useState({ unitId: '', businessName: '', tenantName: '', tenantPhone: '', rentAmount: '', startDate: '', endDate: '', deposit: '' });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const availableUnits = units.filter(u => !u.isOccupied);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.unitId || !form.tenantName || !form.rentAmount || !form.startDate) {
      return toast.error('Unit, tenant name, rent and start date are required');
    }
    setLoading(true);
    try {
      await createLease({
        unitId: form.unitId,
        businessName: form.businessName || undefined,
        tenantName: form.tenantName,
        tenantPhone: form.tenantPhone || undefined,
        rentAmount: Number(form.rentAmount),
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        deposit: form.deposit ? Number(form.deposit) : undefined,
      });
      toast.success('Lease created');
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>New Lease Agreement</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        {availableUnits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF' }}>
            <p>No vacant units available. Add units first.</p>
            <Button variant="ghost" onClick={onClose} style={{ marginTop: 12 }}>Close</Button>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Unit / Shop *</label>
              <select value={form.unitId} onChange={set('unitId')} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
                <option value="">Select unit</option>
                {availableUnits.map(u => <option key={u.id} value={u.id}>{u.unitNumber}{u.floor ? ` (${u.floor})` : ''}</option>)}
              </select>
            </div>
            <Input label="Tenant / Shopkeeper name *" placeholder="Ramesh Agarwal" value={form.tenantName} onChange={set('tenantName')} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Input label="Business name" placeholder="Agarwal Electronics" value={form.businessName} onChange={set('businessName')} />
              <Input label="Phone" type="tel" placeholder="9876543210" value={form.tenantPhone} onChange={set('tenantPhone')} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Input label="Monthly rent (₹) *" type="number" min="1" placeholder="15000" value={form.rentAmount} onChange={set('rentAmount')} />
              <Input label="Security deposit (₹)" type="number" min="0" placeholder="30000" value={form.deposit} onChange={set('deposit')} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Input label="Start date *" type="date" value={form.startDate} onChange={set('startDate')} />
              <Input label="End date (optional)" type="date" value={form.endDate} onChange={set('endDate')} />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit" loading={loading}>Create lease</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function Lease() {
  const [tab, setTab] = useState('leases'); // 'leases' | 'units' | 'rentdue'
  const [units, setUnits] = useState([]);
  const [leases, setLeases] = useState([]);
  const [rentDue, setRentDue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null); // null | 'unit' | 'lease'

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const [ur, lr, rr] = await Promise.all([getLeaseUnits(), getLeases(params), getRentDue()]);
      setUnits(ur.data.data || []);
      setLeases(lr.data.data || []);
      setRentDue(rr.data.data || []);
    } catch {
      toast.error('Failed to load lease data');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleTerminate = async (lease) => {
    if (!window.confirm(`Terminate lease for ${lease.tenantName} (${lease.unit?.unitNumber})? This cannot be undone.`)) return;
    try {
      await terminateLease(lease.id);
      toast.success('Lease terminated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const occupied = units.filter(u => u.isOccupied).length;
  const vacant = units.filter(u => !u.isOccupied).length;
  const activeLeases = leases.filter(l => l.status === 'ACTIVE');
  const monthlyRentTotal = activeLeases.reduce((s, l) => s + (l.rentAmount || 0), 0);

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Lease Management</h1>
          <p style={{ color: '#6B7280', fontSize: 14, marginTop: 2 }}>{units.length} units, {leases.length} lease records</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" onClick={() => setModal('unit')}><Plus size={15} style={{ marginRight: 5 }} />Add Unit</Button>
          <Button onClick={() => setModal('lease')}><Plus size={15} style={{ marginRight: 5 }} />New Lease</Button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Units', value: units.length, color: 'var(--navy)', icon: Building2 },
          { label: 'Occupied', value: occupied, color: '#D97706', icon: Users },
          { label: 'Vacant', value: vacant, color: '#16A34A', icon: CheckCircle },
          { label: 'Monthly Rent', value: fmt(monthlyRentTotal), color: 'var(--cyan)', icon: IndianRupee },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, background: color + '18', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em' }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#F3F4F6', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[{ id: 'leases', label: 'Lease Agreements' }, { id: 'units', label: 'Units / Shops' }, { id: 'rentdue', label: 'Rent Due' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '7px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
            background: tab === t.id ? '#fff' : 'transparent',
            color: tab === t.id ? 'var(--navy)' : '#6B7280',
            boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Leases Tab */}
      {tab === 'leases' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '9px 14px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
              <option value="">All status</option>
              {Object.keys(STATUS_STYLES).map(s => <option key={s} value={s}>{STATUS_STYLES[s].label}</option>)}
            </select>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border)' }}>
                  {['Unit', 'Tenant / Business', 'Phone', 'Monthly Rent', 'Start', 'End', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center', color: '#9CA3AF' }}>Loading...</td></tr>
                ) : leases.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center', color: '#9CA3AF' }}>
                    <Building2 size={32} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
                    No leases yet
                  </td></tr>
                ) : leases.map(l => (
                  <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>{l.unit?.unitNumber || '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14 }}>
                      <div style={{ fontWeight: 500 }}>{l.tenantName}</div>
                      {l.businessName && <div style={{ fontSize: 12, color: '#6B7280' }}>{l.businessName}</div>}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#6B7280' }}>{l.tenantPhone || '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700 }}>{fmt(l.rentAmount)}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#6B7280' }}>{fmtDate(l.startDate)}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#6B7280' }}>{fmtDate(l.endDate)}</td>
                    <td style={{ padding: '14px 16px' }}><Badge status={l.status} /></td>
                    <td style={{ padding: '14px 16px' }}>
                      {l.status === 'ACTIVE' && (
                        <button onClick={() => handleTerminate(l)} style={{ fontSize: 13, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Terminate</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Units Tab */}
      {tab === 'units' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {loading ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 48, color: '#9CA3AF' }}>Loading...</div>
          ) : units.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 64, color: '#9CA3AF' }}>
              <Building2 size={40} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.3 }} />
              <div style={{ fontSize: 16, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>No units added yet</div>
              <div style={{ fontSize: 14 }}>Add your first shop or unit</div>
            </div>
          ) : units.map(u => (
            <div key={u.id} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${u.isOccupied ? 'var(--border)' : '#BBF7D0'}`, padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>{u.unitNumber}</div>
                  {u.floor && <div style={{ fontSize: 12, color: '#6B7280' }}>{u.floor} floor</div>}
                </div>
                <span style={{
                  background: u.isOccupied ? '#FEF9C3' : '#DCFCE7',
                  color: u.isOccupied ? '#A16207' : '#16A34A',
                  padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                }}>
                  {u.isOccupied ? 'Occupied' : 'Vacant'}
                </span>
              </div>
              {u.area && <div style={{ fontSize: 13, color: '#6B7280' }}>{u.area} sq ft</div>}
              {u.monthlyRent && <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', marginTop: 6 }}>{fmt(u.monthlyRent)}<span style={{ fontSize: 11, fontWeight: 400, color: '#9CA3AF' }}>/mo</span></div>}
              {u.leases?.[0] && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 12, color: '#6B7280' }}>
                  {u.leases[0].tenantName}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Rent Due Tab */}
      {tab === 'rentdue' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border)' }}>
                {['Unit', 'Tenant', 'Business', 'Monthly Rent', 'Lease Since', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: 48, textAlign: 'center', color: '#9CA3AF' }}>Loading...</td></tr>
              ) : rentDue.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 48, textAlign: 'center', color: '#9CA3AF' }}>No active leases</td></tr>
              ) : rentDue.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>{l.unit?.unitNumber}</td>
                  <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 500 }}>{l.tenantName || l.contactName}</td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#6B7280' }}>{l.businessName || '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: 'var(--cyan)' }}>{fmt(l.rentAmount || l.monthlyRent)}</td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#6B7280' }}>{fmtDate(l.startDate)}</td>
                  <td style={{ padding: '14px 16px' }}>
                    {l.phone && (
                      <button
                        onClick={async () => { try { await sendWARentReminder(l.id); toast.success('Rent reminder sent via WhatsApp'); } catch { toast.error('Failed to send'); } }}
                        title="Send Rent Reminder via WhatsApp"
                        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#25D366', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                      >
                        <MessageCircle size={14} /> Remind
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal === 'unit' && <AddUnitModal onClose={() => setModal(null)} onAdded={() => { setModal(null); load(); }} />}
      {modal === 'lease' && <CreateLeaseModal units={units} onClose={() => setModal(null)} onCreated={() => { setModal(null); load(); }} />}
    </div>
  );
}
