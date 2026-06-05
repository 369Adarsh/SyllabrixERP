import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClinicBills, deleteClinicBill, getClinicDayEnd, getClinicOutstanding } from '../../api';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { P } from '../../styles/page';
import toast from 'react-hot-toast';
import {
  Receipt, Plus, Search, Eye, Trash2, Printer,
  TrendingUp, Clock, CheckCircle, AlertCircle,
  Wallet, Smartphone, CreditCard, IndianRupee,
} from 'lucide-react';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_META = {
  DRAFT:     { label: 'Draft',     bg: '#F9FAFB', color: '#6B7280' },
  PENDING:   { label: 'Pending',   bg: '#FEF3C7', color: '#D97706' },
  PARTIAL:   { label: 'Partial',   bg: '#EFF6FF', color: '#2563EB' },
  PAID:      { label: 'Paid',      bg: '#ECFDF5', color: '#059669' },
  CANCELLED: { label: 'Cancelled', bg: '#FEF2F2', color: '#DC2626' },
};

const CAT_COLORS = {
  CONSULTATION: '#1D4ED8', PROCEDURE: '#6D28D9',
  MEDICINE: '#065F46', DIAGNOSTIC: '#C2410C', OTHER: '#374151',
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.PENDING;
  return (
    <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: m.bg, color: m.color }}>
      {m.label}
    </span>
  );
}

export default function ClinicBillingPage() {
  const isMobile = useBreakpoint();
  const navigate = useNavigate();

  const [bills, setBills] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [activeTab, setActiveTab] = useState('bills'); // bills | dayend | outstanding
  const [dayEnd, setDayEnd] = useState(null);
  const [outstanding, setOutstanding] = useState(null);
  const [summaryDate, setSummaryDate] = useState(new Date().toISOString().slice(0, 10));

  const load = async () => {
    setLoading(true);
    try {
      const res = await getClinicBills({
        status: filterStatus || undefined,
        date: filterDate || undefined,
        limit: 100,
      });
      setBills(res.data.bills || []);
      setTotal(res.data.total || 0);
    } catch {
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  const loadDayEnd = async (date) => {
    try {
      const res = await getClinicDayEnd(date || summaryDate);
      setDayEnd(res.data);
    } catch { toast.error('Failed to load day-end summary'); }
  };

  const loadOutstanding = async () => {
    try {
      const res = await getClinicOutstanding();
      setOutstanding(res.data);
    } catch { toast.error('Failed to load outstanding'); }
  };

  useEffect(() => { load(); }, [filterStatus, filterDate]);
  useEffect(() => {
    if (activeTab === 'dayend') loadDayEnd();
    if (activeTab === 'outstanding') loadOutstanding();
  }, [activeTab]);

  const handleDelete = async (bill) => {
    if (!window.confirm(`Delete bill ${bill.billNumber}?`)) return;
    try {
      await deleteClinicBill(bill.id);
      toast.success('Bill deleted');
      load();
    } catch { toast.error('Failed to delete bill'); }
  };

  const filtered = bills.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return b.billNumber?.toLowerCase().includes(q) || b.patientName?.toLowerCase().includes(q) || b.doctorName?.toLowerCase().includes(q);
  });

  const counts = bills.reduce((acc, b) => { acc[b.status] = (acc[b.status] || 0) + 1; return acc; }, {});
  const totalCollected = bills.filter((b) => ['PAID', 'PARTIAL'].includes(b.status)).reduce((s, b) => s + b.paidAmount, 0);
  const totalDue = bills.filter((b) => ['PENDING', 'PARTIAL'].includes(b.status)).reduce((s, b) => s + b.dueAmount, 0);

  return (
    <div style={P.wrap(isMobile)}>
      {/* Header */}
      <div style={P.head}>
        <div>
          <h1 style={P.h1(isMobile)}>Clinic Billing</h1>
          <p style={P.sub}>Module 7 — Healthcare bills with GST-correct treatment</p>
        </div>
        <button style={P.btn('primary')} onClick={() => navigate('/clinic-billing/new')}>
          <Plus size={15} /> New Bill
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Bills',  value: total,            display: String(total),    color: 'var(--navy)', bg: '#EFF6FF', filter: '' },
          { label: 'Collected',    value: totalCollected,   display: fmt(totalCollected), color: '#059669', bg: '#ECFDF5', filter: '' },
          { label: 'Outstanding',  value: totalDue,         display: fmt(totalDue),    color: '#D97706',  bg: '#FEF3C7', filter: 'PENDING' },
          { label: 'Paid Bills',   value: counts.PAID || 0, display: String(counts.PAID || 0), color: '#2563EB', bg: '#EFF6FF', filter: 'PAID' },
        ].map((s) => (
          <button key={s.label} style={P.stat(filterStatus === s.filter && s.filter, s.bg, s.color)}
            onClick={() => s.filter && setFilterStatus(filterStatus === s.filter ? '' : s.filter)}>
            <div style={{ fontSize: 20, fontFamily: 'var(--font-mono)', fontWeight: 700, color: s.color }}>{s.display}</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid var(--border)' }}>
        {[
          { key: 'bills',       label: 'All Bills' },
          { key: 'dayend',      label: 'Day-End Summary' },
          { key: 'outstanding', label: `Outstanding (${counts.PENDING || 0 + counts.PARTIAL || 0})` },
        ].map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 13, borderBottom: activeTab === t.key ? '2px solid var(--cyan)' : '2px solid transparent',
            color: activeTab === t.key ? 'var(--cyan)' : '#6B7280', marginBottom: -2,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Bills ──────────────────────────────────────────────────────────── */}
      {activeTab === 'bills' && (
        <>
          <div style={{ ...P.bar, marginBottom: 16 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
              <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input style={{ ...P.searchInput, paddingLeft: 34 }} placeholder="Patient, bill#, doctor…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <input type="date" style={P.input} value={filterDate} onChange={(e) => setFilterDate(e.target.value)} title="Filter by date" />
            {['PENDING', 'PARTIAL', 'PAID'].map((s) => (
              <button key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)} style={{
                ...P.btn(filterStatus === s ? 'primary' : 'secondary'), padding: '6px 12px', fontSize: 12,
                ...(filterStatus === s && { background: STATUS_META[s].bg, color: STATUS_META[s].color, border: `1.5px solid ${STATUS_META[s].color}` }),
              }}>
                {STATUS_META[s].label}
              </button>
            ))}
          </div>

          <div style={P.tableWrap}>
            <div style={P.tableScroll}>
              <table style={P.table}>
                <thead style={P.thead}>
                  <tr>
                    <th style={P.th()}>Bill #</th>
                    <th style={P.th()}>Patient</th>
                    <th style={P.th()}>Doctor</th>
                    <th style={P.th()}>Services</th>
                    <th style={P.th('right')}>Total</th>
                    <th style={P.th('right')}>Paid</th>
                    <th style={P.th('right')}>Due</th>
                    <th style={P.th()}>Date</th>
                    <th style={P.th('center')}>Status</th>
                    <th style={P.th('center')}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={10} style={P.empty}>Loading…</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={10} style={P.empty}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <Receipt size={36} color="#D1D5DB" />
                        <span>No bills found</span>
                        <button style={P.btn('secondary')} onClick={() => navigate('/clinic-billing/new')}><Plus size={13} /> Create first bill</button>
                      </div>
                    </td></tr>
                  ) : (
                    filtered.map((bill, i) => (
                      <tr key={bill.id} style={P.tr(i, filtered.length)}>
                        <td style={P.td()}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--cyan)', fontWeight: 600 }}>{bill.billNumber}</span>
                        </td>
                        <td style={P.td()}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{bill.patientName}</div>
                          {bill.patientPhone && <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-mono)' }}>{bill.patientPhone}</div>}
                        </td>
                        <td style={P.td()}><div style={{ fontSize: 13 }}>{bill.doctorName || '—'}</div></td>
                        <td style={P.td()}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            {[...new Set(bill.items?.map((it) => it.category))].map((cat) => (
                              <span key={cat} style={{ fontSize: 10, background: '#F3F4F6', color: CAT_COLORS[cat] || '#374151', borderRadius: 4, padding: '1px 5px', fontWeight: 600 }}>{cat}</span>
                            ))}
                          </div>
                        </td>
                        <td style={{ ...P.td('right'), fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{fmt(bill.totalAmount)}</td>
                        <td style={{ ...P.td('right'), fontFamily: 'var(--font-mono)', color: '#059669' }}>{fmt(bill.paidAmount)}</td>
                        <td style={{ ...P.td('right'), fontFamily: 'var(--font-mono)', color: bill.dueAmount > 0 ? '#D97706' : '#9CA3AF' }}>
                          {bill.dueAmount > 0 ? fmt(bill.dueAmount) : '—'}
                        </td>
                        <td style={P.td()}><span style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{fmtDate(bill.billDate)}</span></td>
                        <td style={P.td('center')}><StatusBadge status={bill.status} /></td>
                        <td style={P.td('center')}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                            <button style={{ ...P.btn('secondary'), padding: '5px 8px' }} onClick={() => navigate(`/clinic-billing/${bill.id}`)}><Eye size={13} /></button>
                            <button style={{ ...P.btn('secondary'), padding: '5px 8px' }} onClick={() => navigate(`/clinic-billing/${bill.id}?print=1`)}><Printer size={13} /></button>
                            <button style={{ ...P.btn('danger'), padding: '5px 8px' }} onClick={() => handleDelete(bill)}><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filtered.length > 0 && <div style={P.tfoot}>Showing {filtered.length} of {total} bills</div>}
          </div>
        </>
      )}

      {/* ── Tab: Day-End Summary ────────────────────────────────────────────────── */}
      {activeTab === 'dayend' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
            <input type="date" style={P.input} value={summaryDate} onChange={(e) => setSummaryDate(e.target.value)} />
            <button style={P.btn('primary')} onClick={() => loadDayEnd(summaryDate)}>Load Summary</button>
          </div>

          {!dayEnd ? (
            <div style={{ ...P.card, textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Select a date and click Load Summary</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
              {/* Collections */}
              <div style={P.card}>
                <div style={{ ...P.sectionTitle, marginBottom: 16 }}>
                  <TrendingUp size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  Collections — {dayEnd.date}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: '#ECFDF5', borderRadius: 10 }}>
                    <span style={{ fontWeight: 700, color: '#065F46' }}>Total Collection</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 18, color: '#059669' }}>{fmt(dayEnd.totalCollection)}</span>
                  </div>
                  {[
                    { label: 'Cash', icon: Wallet, value: dayEnd.cashTotal, color: '#059669' },
                    { label: 'UPI',  icon: Smartphone, value: dayEnd.upiTotal, color: '#2563EB' },
                    { label: 'Card', icon: CreditCard, value: dayEnd.cardTotal, color: '#7C3AED' },
                  ].map(({ label, icon: Icon, value, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#374151' }}>
                        <Icon size={14} color={color} />
                        <span style={{ fontSize: 13 }}>{label}</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color }}>{fmt(value)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#6B7280' }}>Bills today: <strong>{dayEnd.totalBills}</strong></span>
                    <span style={{ fontSize: 13, color: '#D97706' }}>Outstanding: {fmt(dayEnd.outstanding)}</span>
                  </div>
                </div>
              </div>

              {/* By category */}
              <div style={P.card}>
                <div style={{ ...P.sectionTitle, marginBottom: 16 }}>
                  <IndianRupee size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  Revenue by Category
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {Object.entries(dayEnd.byCategory).map(([cat, val]) => (
                    val > 0 && (
                      <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: CAT_COLORS[cat] || '#374151' }}>{cat}</span>
                        <div style={{ flex: 1, margin: '0 16px' }}>
                          <div style={{
                            height: 6, borderRadius: 3, background: 'var(--surface-2)',
                            position: 'relative', overflow: 'hidden',
                          }}>
                            <div style={{
                              position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 3,
                              width: `${Math.min(100, (val / dayEnd.totalCollection) * 100)}%`,
                              background: CAT_COLORS[cat] || '#374151',
                            }} />
                          </div>
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: CAT_COLORS[cat] || '#374151' }}>{fmt(val)}</span>
                      </div>
                    )
                  ))}
                  {dayEnd.totalCollection === 0 && (
                    <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 20 }}>No bills collected on this date</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Outstanding ───────────────────────────────────────────────────── */}
      {activeTab === 'outstanding' && (
        <div>
          {!outstanding ? (
            <div style={{ ...P.card, textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading…</div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ ...P.card, flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#6B7280' }}>Total Outstanding</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 800, color: '#D97706' }}>{fmt(outstanding.total)}</span>
                </div>
                <div style={{ ...P.card, flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#6B7280' }}>Pending Bills</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 800, color: 'var(--navy)' }}>{outstanding.bills.length}</span>
                </div>
              </div>

              <div style={P.tableWrap}>
                <table style={P.table}>
                  <thead style={P.thead}>
                    <tr>
                      <th style={P.th()}>Bill #</th>
                      <th style={P.th()}>Patient</th>
                      <th style={P.th('right')}>Total</th>
                      <th style={P.th('right')}>Paid</th>
                      <th style={P.th('right')}>Due</th>
                      <th style={P.th()}>Date</th>
                      <th style={P.th('center')}>Status</th>
                      <th style={P.th('center')}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outstanding.bills.length === 0 ? (
                      <tr><td colSpan={8} style={{ ...P.empty, color: '#059669' }}>✓ No outstanding dues!</td></tr>
                    ) : (
                      outstanding.bills.map((bill, i) => (
                        <tr key={bill.id} style={P.tr(i, outstanding.bills.length)}>
                          <td style={P.td()}><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--cyan)', fontWeight: 600 }}>{bill.billNumber}</span></td>
                          <td style={P.td()}><span style={{ fontWeight: 600, fontSize: 13 }}>{bill.patientName}</span></td>
                          <td style={{ ...P.td('right'), fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{fmt(bill.totalAmount)}</td>
                          <td style={{ ...P.td('right'), fontFamily: 'var(--font-mono)', color: '#059669' }}>{fmt(bill.paidAmount)}</td>
                          <td style={{ ...P.td('right'), fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#D97706' }}>{fmt(bill.dueAmount)}</td>
                          <td style={P.td()}><span style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{fmtDate(bill.billDate)}</span></td>
                          <td style={P.td('center')}><StatusBadge status={bill.status} /></td>
                          <td style={P.td('center')}>
                            <button style={{ ...P.btn('primary'), padding: '5px 12px', fontSize: 11 }} onClick={() => navigate(`/clinic-billing/${bill.id}`)}>
                              Collect Payment
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
