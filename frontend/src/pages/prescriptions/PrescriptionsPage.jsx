import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPrescriptions, deletePrescription } from '../../api';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { P } from '../../styles/page';
import toast from 'react-hot-toast';
import {
  Pill, Plus, Search, Eye, Trash2, Printer, ChevronRight,
  ClipboardList, AlertCircle, CheckCircle, Clock,
} from 'lucide-react';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_META = {
  ACTIVE:    { label: 'Active',    bg: '#ECFDF5', color: '#059669', icon: Clock },
  DISPENSED: { label: 'Dispensed', bg: '#EFF6FF', color: '#2563EB', icon: CheckCircle },
  EXPIRED:   { label: 'Expired',   bg: '#F9FAFB', color: '#6B7280', icon: AlertCircle },
  CANCELLED: { label: 'Cancelled', bg: '#FEF2F2', color: '#DC2626', icon: AlertCircle },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.ACTIVE;
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

export default function PrescriptionsPage() {
  const isMobile = useBreakpoint();
  const navigate = useNavigate();

  const [prescriptions, setPrescriptions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getPrescriptions({ status: filterStatus || undefined, limit: 100 });
      setPrescriptions(res.data.prescriptions || []);
      setTotal(res.data.total || 0);
    } catch {
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterStatus]);

  const handleDelete = async (rx) => {
    if (!window.confirm(`Delete Rx ${rx.rxNumber}? This cannot be undone.`)) return;
    try {
      await deletePrescription(rx.id);
      toast.success('Prescription deleted');
      load();
    } catch {
      toast.error('Failed to delete prescription');
    }
  };

  const filtered = prescriptions.filter((rx) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      rx.rxNumber?.toLowerCase().includes(q) ||
      rx.patientName?.toLowerCase().includes(q) ||
      rx.doctorName?.toLowerCase().includes(q) ||
      rx.diagnosis?.toLowerCase().includes(q)
    );
  });

  const statusCounts = prescriptions.reduce((acc, rx) => {
    acc[rx.status] = (acc[rx.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={P.wrap(isMobile)}>
      {/* Header */}
      <div style={P.head}>
        <div>
          <h1 style={P.h1(isMobile)}>Prescriptions</h1>
          <p style={P.sub}>Module 5 — Digital Rx management with drug database</p>
        </div>
        <button
          style={P.btn('primary')}
          onClick={() => navigate('/prescriptions/new')}
        >
          <Plus size={15} />
          New Prescription
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total', value: total, color: 'var(--navy)', bg: '#EFF6FF', filter: '' },
          { label: 'Active', value: statusCounts.ACTIVE || 0, color: '#059669', bg: '#ECFDF5', filter: 'ACTIVE' },
          { label: 'Dispensed', value: statusCounts.DISPENSED || 0, color: '#2563EB', bg: '#EFF6FF', filter: 'DISPENSED' },
          { label: 'Cancelled', value: statusCounts.CANCELLED || 0, color: '#DC2626', bg: '#FEF2F2', filter: 'CANCELLED' },
        ].map((s) => (
          <button
            key={s.label}
            style={P.stat(filterStatus === s.filter, s.bg, s.color)}
            onClick={() => setFilterStatus(filterStatus === s.filter ? '' : s.filter)}
          >
            <div style={{ fontSize: 22, fontFamily: 'var(--font-mono)', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ ...P.bar, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            style={{ ...P.searchInput, paddingLeft: 34 }}
            placeholder="Search by patient, Rx#, doctor, diagnosis…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div style={P.tableWrap}>
        <div style={P.tableScroll}>
          <table style={P.table}>
            <thead style={P.thead}>
              <tr>
                <th style={P.th()}>Rx Number</th>
                <th style={P.th()}>Patient</th>
                <th style={P.th()}>Doctor</th>
                <th style={P.th()}>Diagnosis</th>
                <th style={P.th('center')}>Drugs</th>
                <th style={P.th()}>Date</th>
                <th style={P.th('center')}>Status</th>
                <th style={P.th('center')}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={P.empty}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={P.empty}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <ClipboardList size={36} color="#D1D5DB" />
                      <span>No prescriptions found</span>
                      <button style={P.btn('secondary')} onClick={() => navigate('/prescriptions/new')}>
                        <Plus size={13} /> Write first prescription
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((rx, i) => (
                  <tr key={rx.id} style={P.tr(i, filtered.length)}>
                    <td style={P.td()}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--cyan)', fontWeight: 600 }}>
                        {rx.rxNumber}
                      </span>
                    </td>
                    <td style={P.td()}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{rx.patientName}</div>
                      {rx.patientPhone && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{rx.patientPhone}</div>}
                    </td>
                    <td style={P.td()}>
                      <div style={{ fontSize: 13, color: '#374151' }}>{rx.doctorName}</div>
                    </td>
                    <td style={P.td()}>
                      <div style={{ fontSize: 12, color: '#6B7280', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {rx.diagnosis || <span style={{ color: '#D1D5DB' }}>—</span>}
                      </div>
                    </td>
                    <td style={P.td('center')}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: 'var(--surface-2)', borderRadius: 20,
                        padding: '2px 10px', fontSize: 11, fontWeight: 600, color: 'var(--navy)',
                      }}>
                        <Pill size={10} />
                        {rx.items?.length || 0}
                      </span>
                    </td>
                    <td style={P.td()}>
                      <span style={{ fontSize: 12, color: '#374151', fontFamily: 'var(--font-mono)' }}>
                        {fmtDate(rx.createdAt)}
                      </span>
                    </td>
                    <td style={P.td('center')}>
                      <StatusBadge status={rx.status} />
                    </td>
                    <td style={P.td('center')}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button
                          title="View / Edit"
                          style={{ ...P.btn('secondary'), padding: '5px 8px' }}
                          onClick={() => navigate(`/prescriptions/${rx.id}`)}
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          title="Print"
                          style={{ ...P.btn('secondary'), padding: '5px 8px' }}
                          onClick={() => navigate(`/prescriptions/${rx.id}?print=1`)}
                        >
                          <Printer size={13} />
                        </button>
                        <button
                          title="Delete"
                          style={{ ...P.btn('danger'), padding: '5px 8px' }}
                          onClick={() => handleDelete(rx)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div style={P.tfoot}>
            Showing {filtered.length} of {total} prescriptions
          </div>
        )}
      </div>
    </div>
  );
}
