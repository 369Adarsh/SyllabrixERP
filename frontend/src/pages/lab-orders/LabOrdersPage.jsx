import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLabOrders, deleteLabOrder } from '../../api';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { P } from '../../styles/page';
import toast from 'react-hot-toast';
import {
  FlaskConical, Plus, Search, Eye, Trash2, Printer,
  Clock, CheckCircle, AlertCircle, Layers, FileText,
} from 'lucide-react';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_META = {
  PENDING:   { label: 'Pending',   bg: '#FEF3C7', color: '#D97706', icon: Clock },
  PARTIAL:   { label: 'Partial',   bg: '#EFF6FF', color: '#2563EB', icon: Layers },
  COMPLETED: { label: 'Completed', bg: '#ECFDF5', color: '#059669', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', bg: '#F9FAFB', color: '#6B7280', icon: AlertCircle },
};

const URGENCY_META = {
  ROUTINE: { label: 'Routine', color: '#6B7280' },
  URGENT:  { label: 'Urgent',  color: '#D97706' },
  STAT:    { label: 'STAT',    color: '#DC2626' },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.PENDING;
  const Icon = m.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: m.bg, color: m.color,
    }}>
      <Icon size={10} />
      {m.label}
    </span>
  );
}

export default function LabOrdersPage() {
  const isMobile = useBreakpoint();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getLabOrders({ status: filterStatus || undefined, limit: 100 });
      setOrders(res.data.orders || []);
      setTotal(res.data.total || 0);
    } catch {
      toast.error('Failed to load lab orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterStatus]);

  const handleDelete = async (order) => {
    if (!window.confirm(`Delete order ${order.orderNumber}? This cannot be undone.`)) return;
    try {
      await deleteLabOrder(order.id);
      toast.success('Lab order deleted');
      load();
    } catch {
      toast.error('Failed to delete lab order');
    }
  };

  const filtered = orders.filter((o) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.orderNumber?.toLowerCase().includes(q) ||
      o.patientName?.toLowerCase().includes(q) ||
      o.doctorName?.toLowerCase().includes(q) ||
      o.labCenterName?.toLowerCase().includes(q)
    );
  });

  const counts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const pendingReports = orders.filter((o) => o.reports?.some((r) => !r.isViewed)).length;

  return (
    <div style={P.wrap(isMobile)}>
      {/* Header */}
      <div style={P.head}>
        <div>
          <h1 style={P.h1(isMobile)}>Lab Orders & Reports</h1>
          <p style={P.sub}>Module 6 — Test orders, referral slips, report tracking</p>
        </div>
        <button style={P.btn('primary')} onClick={() => navigate('/lab-orders/new')}>
          <Plus size={15} />
          New Lab Order
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Orders', value: total,                         color: 'var(--navy)', bg: '#EFF6FF', filter: '' },
          { label: 'Pending',      value: counts.PENDING || 0,           color: '#D97706',     bg: '#FEF3C7', filter: 'PENDING' },
          { label: 'Completed',    value: counts.COMPLETED || 0,         color: '#059669',     bg: '#ECFDF5', filter: 'COMPLETED' },
          { label: 'New Reports',  value: pendingReports,                 color: '#7C3AED',     bg: '#F5F3FF', filter: '' },
        ].map((s) => (
          <button
            key={s.label}
            style={P.stat(filterStatus === s.filter && s.filter !== '', s.bg, s.color)}
            onClick={() => s.filter && setFilterStatus(filterStatus === s.filter ? '' : s.filter)}
          >
            <div style={{ fontSize: 22, fontFamily: 'var(--font-mono)', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={P.bar}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            style={{ ...P.searchInput, paddingLeft: 34 }}
            placeholder="Search by patient, order#, doctor, lab center…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {/* Status filter chips */}
        <div style={{ display: 'flex', gap: 6 }}>
          {['PENDING', 'PARTIAL', 'COMPLETED'].map((s) => (
            <button
              key={s}
              style={{
                ...P.btn(filterStatus === s ? 'primary' : 'secondary'),
                padding: '6px 12px', fontSize: 12,
                ...(filterStatus === s && { background: STATUS_META[s].bg, color: STATUS_META[s].color, border: `1.5px solid ${STATUS_META[s].color}` }),
              }}
              onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
            >
              {STATUS_META[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={P.tableWrap}>
        <div style={P.tableScroll}>
          <table style={P.table}>
            <thead style={P.thead}>
              <tr>
                <th style={P.th()}>Order #</th>
                <th style={P.th()}>Patient</th>
                <th style={P.th()}>Doctor</th>
                <th style={P.th()}>Tests</th>
                <th style={P.th()}>Lab Center</th>
                <th style={P.th('center')}>Urgency</th>
                <th style={P.th()}>Date</th>
                <th style={P.th('center')}>Status</th>
                <th style={P.th('center')}>Reports</th>
                <th style={P.th('center')}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} style={P.empty}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} style={P.empty}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <FlaskConical size={36} color="#D1D5DB" />
                      <span>No lab orders yet</span>
                      <button style={P.btn('secondary')} onClick={() => navigate('/lab-orders/new')}>
                        <Plus size={13} /> Create first lab order
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((order, i) => {
                  const unviewedReports = order.reports?.filter((r) => !r.isViewed).length || 0;
                  const urgencyMeta = URGENCY_META[order.urgency] || URGENCY_META.ROUTINE;
                  return (
                    <tr key={order.id} style={P.tr(i, filtered.length)}>
                      <td style={P.td()}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--cyan)', fontWeight: 600 }}>
                          {order.orderNumber}
                        </span>
                      </td>
                      <td style={P.td()}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{order.patientName}</div>
                        {order.patientPhone && <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-mono)' }}>{order.patientPhone}</div>}
                      </td>
                      <td style={P.td()}>
                        <div style={{ fontSize: 13, color: '#374151' }}>{order.doctorName}</div>
                      </td>
                      <td style={P.td()}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {order.items?.slice(0, 3).map((item) => (
                            <span key={item.id} style={{
                              fontSize: 11, background: 'var(--surface-2)', color: '#374151',
                              borderRadius: 4, padding: '1px 6px', whiteSpace: 'nowrap',
                            }}>
                              {item.testName.length > 20 ? item.testName.slice(0, 20) + '…' : item.testName}
                            </span>
                          ))}
                          {(order.items?.length || 0) > 3 && (
                            <span style={{ fontSize: 11, color: '#9CA3AF' }}>+{order.items.length - 3} more</span>
                          )}
                        </div>
                      </td>
                      <td style={P.td()}>
                        <div style={{ fontSize: 12, color: '#374151' }}>
                          {order.labCenterName || order.labCenter?.name || <span style={{ color: '#D1D5DB' }}>—</span>}
                        </div>
                      </td>
                      <td style={P.td('center')}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: urgencyMeta.color }}>{urgencyMeta.label}</span>
                      </td>
                      <td style={P.td()}>
                        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#374151' }}>{fmtDate(order.createdAt)}</span>
                      </td>
                      <td style={P.td('center')}>
                        <StatusBadge status={order.status} />
                      </td>
                      <td style={P.td('center')}>
                        {unviewedReports > 0 ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#F5F3FF', color: '#7C3AED' }}>
                            <FileText size={10} />
                            {unviewedReports} new
                          </span>
                        ) : (order.reports?.length || 0) > 0 ? (
                          <span style={{ fontSize: 11, color: '#6B7280' }}>{order.reports.length} filed</span>
                        ) : (
                          <span style={{ fontSize: 11, color: '#D1D5DB' }}>—</span>
                        )}
                      </td>
                      <td style={P.td('center')}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button style={{ ...P.btn('secondary'), padding: '5px 8px' }} onClick={() => navigate(`/lab-orders/${order.id}`)}>
                            <Eye size={13} />
                          </button>
                          <button style={{ ...P.btn('secondary'), padding: '5px 8px' }} title="Print referral slip" onClick={() => navigate(`/lab-orders/${order.id}?print=1`)}>
                            <Printer size={13} />
                          </button>
                          <button style={{ ...P.btn('danger'), padding: '5px 8px' }} onClick={() => handleDelete(order)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div style={P.tfoot}>Showing {filtered.length} of {total} lab orders</div>
        )}
      </div>
    </div>
  );
}
