import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  getLabOrderById, createLabOrder, updateLabOrder,
  searchLabTests, getLabTestCatalog,
  getLabCenters, saveLabCenter,
  addLabReport, deleteLabReport, markLabReportViewed,
} from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { P } from '../../styles/page';
import toast from 'react-hot-toast';
import {
  ChevronLeft, Save, Printer, Plus, Trash2, Search,
  FlaskConical, User, Stethoscope, Building2, Calendar,
  FileText, Upload, CheckCircle, Clock, AlertTriangle,
  ChevronDown, ChevronRight,
} from 'lucide-react';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const URGENCY_OPTIONS = [
  { value: 'ROUTINE', label: 'Routine', color: '#6B7280' },
  { value: 'URGENT',  label: 'Urgent',  color: '#D97706' },
  { value: 'STAT',    label: 'STAT — Immediate', color: '#DC2626' },
];

const ITEM_STATUSES = ['PENDING', 'SAMPLE_COLLECTED', 'PROCESSING', 'COMPLETED'];

// ── Test search input ─────────────────────────────────────────────────────────
function TestSearchInput({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const debounce = useRef();

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleChange = (v) => {
    setQuery(v);
    clearTimeout(debounce.current);
    if (v.length < 2) { setResults([]); setOpen(false); return; }
    debounce.current = setTimeout(async () => {
      try {
        const res = await searchLabTests(v);
        setResults(res.data || []);
        setOpen(true);
      } catch { /* noop */ }
    }, 200);
  };

  const select = (test) => {
    onSelect(test);
    setQuery('');
    setResults([]);
    setOpen(false);
    toast.success(`${test.name} added`);
  };

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
        <input
          style={{ ...P.searchInput, paddingLeft: 34, width: '100%' }}
          placeholder="Search test by name or code (CBC, LFT, TSH…)"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
      </div>
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: '#fff', border: '1.5px solid var(--border)',
          borderRadius: 'var(--radius-md)', boxShadow: '0 8px 24px rgba(30,43,60,0.12)',
          maxHeight: 280, overflowY: 'auto', marginTop: 4,
        }}>
          {results.map((test, i) => (
            <button
              key={test.code}
              style={{
                display: 'flex', width: '100%', padding: '9px 14px',
                background: 'none', border: 'none', cursor: 'pointer',
                textAlign: 'left', borderBottom: i < results.length - 1 ? '1px solid #F3F4F6' : 'none',
                alignItems: 'flex-start', gap: 10,
              }}
              onClick={() => select(test)}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              <FlaskConical size={13} color="var(--cyan)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{test.name}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)', marginRight: 6 }}>{test.code}</span>
                  {test.category}
                  {test.requiresFasting && <span style={{ marginLeft: 6, color: '#D97706', fontWeight: 600 }}>Fasting</span>}
                  {test.turnaround && <span style={{ marginLeft: 6 }}>· {test.turnaround}h TAT</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Report upload row ─────────────────────────────────────────────────────────
function ReportCard({ report, onDelete, onView }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 14px', background: report.isViewed ? 'var(--surface-1)' : '#F5F3FF',
      borderRadius: 'var(--radius-md)', border: `1px solid ${report.isViewed ? 'var(--border)' : '#C4B5FD'}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <FileText size={15} color={report.isViewed ? '#9CA3AF' : '#7C3AED'} />
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{report.reportName}</div>
          <div style={{ fontSize: 11, color: '#6B7280' }}>
            {fmtDate(report.reportedAt)}
            {report.isAbnormal && <span style={{ marginLeft: 6, color: '#DC2626', fontWeight: 700 }}>⚠ Abnormal values</span>}
          </div>
          {report.notes && <div style={{ fontSize: 11, color: '#374151', marginTop: 2 }}>{report.notes}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {!report.isViewed && (
          <button style={{ ...P.btn('secondary'), padding: '4px 10px', fontSize: 11 }} onClick={() => onView(report.id)}>
            <CheckCircle size={11} /> Mark viewed
          </button>
        )}
        {report.fileUrl && (
          <a href={report.fileUrl} target="_blank" rel="noopener noreferrer" style={{ ...P.btn('secondary'), padding: '4px 10px', fontSize: 11, textDecoration: 'none' }}>
            View file
          </a>
        )}
        <button style={{ ...P.btn('danger'), padding: '4px 8px' }} onClick={() => onDelete(report.id)}>
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}

export default function LabOrderEditor() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, tenant } = useAuth();
  const isMobile = useBreakpoint();
  const isNew = !id || id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [doctorName, setDoctorName] = useState(user?.name || '');
  const [labCenterId, setLabCenterId] = useState('');
  const [labCenterName, setLabCenterName] = useState('');
  const [urgency, setUrgency] = useState('ROUTINE');
  const [clinicalInfo, setClinicalInfo] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);
  const [orderNumber, setOrderNumber] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [reports, setReports] = useState([]);

  // Catalog
  const [catalog, setCatalog] = useState({});
  const [openCategory, setOpenCategory] = useState('');
  const [showCatalog, setShowCatalog] = useState(false);

  // Lab centers
  const [centers, setCenters] = useState([]);
  const [newCenterName, setNewCenterName] = useState('');
  const [addingCenter, setAddingCenter] = useState(false);

  // Report form
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportName, setReportName] = useState('');
  const [reportUrl, setReportUrl] = useState('');
  const [reportNotes, setReportNotes] = useState('');
  const [reportAbnormal, setReportAbnormal] = useState(false);
  const [savingReport, setSavingReport] = useState(false);

  useEffect(() => {
    loadCenters();
    if (!isNew) loadOrder();
    if (searchParams.get('print') === '1') setTimeout(() => window.print(), 800);
  }, [id]);

  const loadCenters = async () => {
    try {
      const res = await getLabCenters();
      setCenters(res.data || []);
    } catch { /* noop */ }
  };

  const loadOrder = async () => {
    try {
      const res = await getLabOrderById(id);
      const o = res.data;
      setPatientName(o.patientName || '');
      setPatientPhone(o.patientPhone || '');
      setDoctorName(o.doctorName || '');
      setLabCenterId(o.labCenterId || '');
      setLabCenterName(o.labCenterName || '');
      setUrgency(o.urgency || 'ROUTINE');
      setClinicalInfo(o.clinicalInfo || '');
      setNotes(o.notes || '');
      setItems(o.items || []);
      setOrderNumber(o.orderNumber);
      setCreatedAt(o.createdAt);
      setStatus(o.status);
      setReports(o.reports || []);
    } catch {
      toast.error('Lab order not found');
      navigate('/lab-orders');
    } finally {
      setLoading(false);
    }
  };

  const loadCatalog = async () => {
    try {
      const res = await getLabTestCatalog();
      const grouped = {};
      (res.data.tests || []).forEach((t) => {
        if (!grouped[t.category]) grouped[t.category] = [];
        grouped[t.category].push(t);
      });
      setCatalog(grouped);
    } catch { /* noop */ }
  };

  const toggleCatalog = () => {
    if (!showCatalog && Object.keys(catalog).length === 0) loadCatalog();
    setShowCatalog((v) => !v);
  };

  const addTest = useCallback((test) => {
    setItems((prev) => {
      if (prev.find((i) => i.testCode === test.code)) {
        toast.error(`${test.name} already added`);
        return prev;
      }
      return [...prev, { testName: test.name, testCode: test.code, category: test.category, status: 'PENDING', isAbnormal: false }];
    });
  }, []);

  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const updateItemStatus = (idx, s) =>
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, status: s } : item));

  const handleSave = async () => {
    if (!patientName.trim()) { toast.error('Patient name is required'); return; }
    if (!doctorName.trim()) { toast.error('Doctor name is required'); return; }
    if (items.length === 0) { toast.error('Add at least one test'); return; }

    setSaving(true);
    try {
      const payload = {
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim() || null,
        doctorName: doctorName.trim(),
        labCenterId: labCenterId || null,
        labCenterName: labCenterName.trim() || null,
        urgency,
        clinicalInfo: clinicalInfo.trim() || null,
        notes: notes.trim() || null,
        items,
      };

      if (isNew) {
        const res = await createLabOrder(payload);
        toast.success(`Lab order ${res.data.orderNumber} created`);
        navigate(`/lab-orders/${res.data.id}`);
      } else {
        await updateLabOrder(id, payload);
        toast.success('Lab order updated');
        loadOrder();
      }
    } catch {
      toast.error('Failed to save lab order');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCenter = async () => {
    if (!newCenterName.trim()) return;
    setAddingCenter(true);
    try {
      const res = await saveLabCenter({ name: newCenterName.trim() });
      setCenters((prev) => [...prev, res.data]);
      setLabCenterId(res.data.id);
      setLabCenterName(res.data.name);
      setNewCenterName('');
      toast.success('Lab center saved');
    } catch {
      toast.error('Failed to save center');
    } finally {
      setAddingCenter(false);
    }
  };

  const handleAddReport = async () => {
    if (!reportName.trim()) { toast.error('Report name is required'); return; }
    setSavingReport(true);
    try {
      const res = await addLabReport({
        orderId: id,
        patientId: null,
        patientName,
        reportName: reportName.trim(),
        fileUrl: reportUrl.trim() || null,
        fileType: reportUrl.trim() ? 'link' : null,
        notes: reportNotes.trim() || null,
        isAbnormal: reportAbnormal,
        reportedAt: new Date().toISOString(),
      });
      setReports((prev) => [res.data, ...prev]);
      setReportName('');
      setReportUrl('');
      setReportNotes('');
      setReportAbnormal(false);
      setShowReportForm(false);
      toast.success('Report added');
    } catch {
      toast.error('Failed to add report');
    } finally {
      setSavingReport(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Delete this report?')) return;
    try {
      await deleteLabReport(reportId);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      toast.success('Report deleted');
    } catch {
      toast.error('Failed to delete report');
    }
  };

  const handleViewReport = async (reportId) => {
    try {
      await markLabReportViewed(reportId);
      setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, isViewed: true } : r));
    } catch { /* noop */ }
  };

  if (loading) {
    return (
      <div style={{ ...P.wrap(isMobile), display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <span style={{ color: '#9CA3AF' }}>Loading…</span>
      </div>
    );
  }

  const requiresFasting = items.some((i) => {
    const known = ['GLUC001', 'GLUC005', 'LIPD001', 'LIPD002', 'LIPD003', 'LIPD004', 'LIPD005', 'LIPD006', 'HORM009', 'USGR001'];
    return known.includes(i.testCode);
  });

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #lab-print-area, #lab-print-area * { visibility: visible !important; }
          #lab-print-area { position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; background: #fff !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div style={P.wrap(isMobile)}>
        {/* Header */}
        <div style={{ ...P.head, marginBottom: 24 }} className="no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button style={P.btn('ghost')} onClick={() => navigate('/lab-orders')}>
              <ChevronLeft size={16} />
            </button>
            <div>
              <h1 style={P.h1(isMobile)}>
                {isNew ? 'New Lab Order' : `Lab Order — ${orderNumber}`}
              </h1>
              {!isNew && <p style={P.sub}>Created {fmtDate(createdAt)} · Status: <strong>{status}</strong></p>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {!isNew && (
              <button style={P.btn('secondary')} onClick={() => window.print()}>
                <Printer size={14} /> Referral Slip
              </button>
            )}
            <button style={P.btn('primary')} onClick={handleSave} disabled={saving}>
              <Save size={14} />
              {saving ? 'Saving…' : isNew ? 'Create Order' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Fasting reminder */}
        {requiresFasting && (
          <div className="no-print" style={{
            display: 'flex', gap: 10, padding: '10px 16px', marginBottom: 16,
            background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 'var(--radius-md)',
            color: '#D97706', fontSize: 13,
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <strong>Fasting required</strong> — one or more tests in this order require the patient to fast 8–12 hours before sample collection.
          </div>
        )}

        {/* STAT reminder */}
        {urgency === 'STAT' && (
          <div className="no-print" style={{
            display: 'flex', gap: 10, padding: '10px 16px', marginBottom: 16,
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)',
            color: '#DC2626', fontSize: 13,
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <strong>STAT order</strong> — process immediately. Notify lab center.
          </div>
        )}

        {/* Patient + Doctor */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }} className="no-print">
          <div style={P.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <User size={14} color="var(--cyan)" />
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>Patient Details</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Patient Name *</label>
                <input style={{ ...P.input, width: '100%', boxSizing: 'border-box' }} placeholder="Full name" value={patientName} onChange={(e) => setPatientName(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Mobile Number</label>
                <input style={{ ...P.input, width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-mono)' }} placeholder="10-digit" value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} />
              </div>
            </div>
          </div>

          <div style={P.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Stethoscope size={14} color="var(--cyan)" />
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>Clinical Details</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Referring Doctor *</label>
                <input style={{ ...P.input, width: '100%', boxSizing: 'border-box' }} placeholder="Dr. Name" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Urgency</label>
                <select style={{ ...P.input, width: '100%' }} value={urgency} onChange={(e) => setUrgency(e.target.value)}>
                  {URGENCY_OPTIONS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Clinical Info (for lab)</label>
                <input style={{ ...P.input, width: '100%', boxSizing: 'border-box' }} placeholder="e.g., Suspected dengue, evaluate liver" value={clinicalInfo} onChange={(e) => setClinicalInfo(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Lab center */}
        <div style={{ ...P.card, marginBottom: 16 }} className="no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Building2 size={14} color="var(--cyan)" />
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>Lab Center</span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select
              style={{ ...P.input, flex: 1, minWidth: 200 }}
              value={labCenterId}
              onChange={(e) => {
                const c = centers.find((c) => c.id === e.target.value);
                setLabCenterId(e.target.value);
                setLabCenterName(c?.name || '');
              }}
            >
              <option value="">— No center selected —</option>
              {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input
              style={{ ...P.input, flex: 1, minWidth: 160 }}
              placeholder="Or type center name manually"
              value={labCenterName}
              onChange={(e) => { setLabCenterName(e.target.value); setLabCenterId(''); }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
            <input
              style={{ ...P.input, width: 200 }}
              placeholder="Add new preferred center…"
              value={newCenterName}
              onChange={(e) => setNewCenterName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCenter()}
            />
            <button style={P.btn('secondary')} onClick={handleAddCenter} disabled={addingCenter || !newCenterName.trim()}>
              <Plus size={13} /> Save center
            </button>
          </div>
        </div>

        {/* Tests */}
        <div style={{ ...P.card, marginBottom: 16 }} className="no-print">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FlaskConical size={14} color="var(--cyan)" />
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>Tests Ordered</span>
              {items.length > 0 && (
                <span style={{ fontSize: 12, background: 'var(--cyan)', color: '#fff', borderRadius: 20, padding: '1px 8px', fontWeight: 700 }}>
                  {items.length}
                </span>
              )}
            </div>
            <button style={{ ...P.btn('secondary'), fontSize: 12, padding: '6px 12px' }} onClick={toggleCatalog}>
              {showCatalog ? 'Hide' : 'Browse'} catalog
            </button>
          </div>

          {/* Search */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <TestSearchInput onSelect={addTest} />
          </div>

          {/* Catalog browser */}
          {showCatalog && (
            <div style={{
              border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
              marginBottom: 14, maxHeight: 320, overflowY: 'auto',
            }}>
              {Object.entries(catalog).map(([cat, tests]) => (
                <div key={cat}>
                  <button
                    style={{
                      width: '100%', padding: '9px 14px', background: 'var(--surface-1)',
                      border: 'none', borderBottom: '1px solid var(--border)',
                      textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                      fontWeight: 700, fontSize: 12, color: 'var(--navy)',
                    }}
                    onClick={() => setOpenCategory(openCategory === cat ? '' : cat)}
                  >
                    {cat} <span style={{ color: '#9CA3AF', fontWeight: 400 }}>({tests.length})</span>
                    {openCategory === cat ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </button>
                  {openCategory === cat && (
                    <div style={{ padding: '8px 14px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {tests.map((test) => {
                        const selected = items.some((i) => i.testCode === test.code);
                        return (
                          <button
                            key={test.code}
                            style={{
                              padding: '4px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
                              background: selected ? 'var(--cyan)' : 'var(--surface-2)',
                              color: selected ? '#fff' : 'var(--ink)',
                              border: `1px solid ${selected ? 'var(--cyan)' : 'var(--border)'}`,
                              fontWeight: 600,
                            }}
                            onClick={() => selected ? removeItem(items.findIndex((i) => i.testCode === test.code)) : addTest(test)}
                          >
                            {selected ? '✓ ' : ''}{test.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Item list */}
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 16px', color: '#9CA3AF' }}>
              <FlaskConical size={28} color="#D1D5DB" />
              <p style={{ marginTop: 8, fontSize: 13 }}>No tests added. Search or browse the catalog above.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {items.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '9px 14px', background: 'var(--surface-1)',
                  borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                      {i + 1}
                    </span>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{item.testName}</span>
                      {item.testCode && <span style={{ marginLeft: 8, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>{item.testCode}</span>}
                      {item.category && <span style={{ marginLeft: 6, fontSize: 11, background: 'var(--surface-2)', color: '#6B7280', borderRadius: 4, padding: '1px 6px' }}>{item.category}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {!isNew && (
                      <select
                        style={{ ...P.input, padding: '4px 8px', fontSize: 11 }}
                        value={item.status}
                        onChange={(e) => updateItemStatus(i, e.target.value)}
                      >
                        {ITEM_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                      </select>
                    )}
                    <button style={{ ...P.btn('danger'), padding: '4px 8px' }} onClick={() => removeItem(i)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div style={{ ...P.card, marginBottom: 16 }} className="no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <FileText size={14} color="var(--cyan)" />
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>Notes for Lab</span>
          </div>
          <textarea
            style={{ ...P.input, width: '100%', boxSizing: 'border-box', height: 70, resize: 'vertical' }}
            placeholder="Special handling instructions, priority notes…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Reports section — only on existing orders */}
        {!isNew && (
          <div style={{ ...P.card, marginBottom: 24 }} className="no-print">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Upload size={14} color="var(--cyan)" />
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>Reports Received</span>
                {reports.filter((r) => !r.isViewed).length > 0 && (
                  <span style={{ fontSize: 11, background: '#7C3AED', color: '#fff', borderRadius: 20, padding: '1px 8px', fontWeight: 700 }}>
                    {reports.filter((r) => !r.isViewed).length} new
                  </span>
                )}
              </div>
              <button style={{ ...P.btn('secondary'), fontSize: 12, padding: '6px 12px' }} onClick={() => setShowReportForm((v) => !v)}>
                <Plus size={13} /> Add Report
              </button>
            </div>

            {/* Report form */}
            {showReportForm && (
              <div style={{ ...P.card, marginBottom: 14, background: 'var(--surface-1)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Report Name *</label>
                    <input style={{ ...P.input, width: '100%', boxSizing: 'border-box' }} placeholder="e.g., CBC Report, LFT Report" value={reportName} onChange={(e) => setReportName(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Report File URL (optional)</label>
                    <input style={{ ...P.input, width: '100%', boxSizing: 'border-box' }} placeholder="Google Drive / Dropbox link…" value={reportUrl} onChange={(e) => setReportUrl(e.target.value)} />
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Summary / Key values</label>
                  <textarea style={{ ...P.input, width: '100%', boxSizing: 'border-box', height: 60, resize: 'vertical' }} placeholder="Key findings, abnormal values…" value={reportNotes} onChange={(e) => setReportNotes(e.target.value)} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: '#DC2626' }}>
                    <input type="checkbox" checked={reportAbnormal} onChange={(e) => setReportAbnormal(e.target.checked)} />
                    Abnormal values present
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={P.btn('secondary')} onClick={() => setShowReportForm(false)}>Cancel</button>
                    <button style={P.btn('primary')} onClick={handleAddReport} disabled={savingReport}>
                      {savingReport ? 'Saving…' : 'Save Report'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Report list */}
            {reports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#9CA3AF', fontSize: 13 }}>
                No reports received yet. Click "Add Report" when results arrive.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {reports.map((r) => (
                  <ReportCard key={r.id} report={r} onDelete={handleDeleteReport} onView={handleViewReport} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mobile save */}
        {isMobile && (
          <div className="no-print" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid var(--border)', padding: '12px 16px', display: 'flex', gap: 10, zIndex: 50 }}>
            {!isNew && <button style={{ ...P.btn('secondary'), flex: 1 }} onClick={() => window.print()}><Printer size={14} /> Slip</button>}
            <button style={{ ...P.btn('primary'), flex: 1 }} onClick={handleSave} disabled={saving}>
              <Save size={14} /> {saving ? 'Saving…' : isNew ? 'Create' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* ── PRINT: REFERRAL SLIP ──────────────────────────────────────────────── */}
      <div id="lab-print-area" style={{
        display: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif",
        padding: '24px 36px', maxWidth: 680, margin: '0 auto',
        fontSize: 13, color: '#1A2535',
      }}>
        {/* Header */}
        <div style={{ borderBottom: '2px solid #1E2B3C', paddingBottom: 14, marginBottom: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 20, fontFamily: "'Bricolage Grotesque', sans-serif", color: '#1E2B3C', letterSpacing: '-0.02em' }}>
            {tenant?.name || 'Clinic Name'}
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
            {doctorName && `Ref. by: Dr. ${doctorName}`}
            {tenant?.address && ` · ${tenant.address}`}
            {tenant?.phone && ` · ${tenant.phone}`}
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.08em', color: '#1E2B3C', textTransform: 'uppercase' }}>
            Laboratory Referral Slip
          </div>
          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2, fontFamily: 'monospace' }}>
            {orderNumber || 'DRAFT'} · {fmtDate(createdAt || new Date())}
            {urgency !== 'ROUTINE' && <span style={{ marginLeft: 8, fontWeight: 700, color: urgency === 'STAT' ? '#DC2626' : '#D97706' }}>⚡ {urgency}</span>}
          </div>
        </div>

        {/* Patient + Lab center */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Patient</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{patientName}</div>
            {patientPhone && <div style={{ fontSize: 12, fontFamily: 'monospace' }}>{patientPhone}</div>}
          </div>
          {(labCenterName || centers.find((c) => c.id === labCenterId)?.name) && (
            <div style={{ flex: 1, textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>To Lab</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{labCenterName || centers.find((c) => c.id === labCenterId)?.name}</div>
            </div>
          )}
        </div>

        {clinicalInfo && (
          <div style={{ marginBottom: 14, padding: '8px 12px', background: '#F4F7FA', borderRadius: 6, fontSize: 12 }}>
            <strong>Clinical Info:</strong> {clinicalInfo}
          </div>
        )}

        {/* Tests table */}
        <div style={{ marginBottom: 14, border: '1px solid #D5DCE8', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ background: '#1E2B3C', padding: '8px 12px', color: '#fff', fontWeight: 700, fontSize: 12 }}>
            Tests Ordered ({items.length})
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#F4F7FA', borderBottom: '1px solid #D5DCE8' }}>
                <th style={{ padding: '6px 12px', textAlign: 'left', fontWeight: 700, color: '#374151' }}>#</th>
                <th style={{ padding: '6px 12px', textAlign: 'left', fontWeight: 700, color: '#374151' }}>Test Name</th>
                <th style={{ padding: '6px 12px', textAlign: 'left', fontWeight: 700, color: '#374151' }}>Code</th>
                <th style={{ padding: '6px 12px', textAlign: 'left', fontWeight: 700, color: '#374151' }}>Category</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} style={{ borderBottom: i < items.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                  <td style={{ padding: '7px 12px', color: '#9CA3AF' }}>{i + 1}</td>
                  <td style={{ padding: '7px 12px', fontWeight: 600 }}>{item.testName}</td>
                  <td style={{ padding: '7px 12px', fontFamily: 'monospace', color: '#17B9D0', fontSize: 11 }}>{item.testCode || '—'}</td>
                  <td style={{ padding: '7px 12px', color: '#6B7280' }}>{item.category || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Fasting note */}
        {requiresFasting && (
          <div style={{ marginBottom: 14, padding: '8px 12px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, fontSize: 12, color: '#D97706' }}>
            ⚠️ <strong>Fasting required</strong> for some tests — patient must fast 8–12 hours before sample collection.
          </div>
        )}

        {notes && (
          <div style={{ marginBottom: 14, padding: '8px 12px', background: '#F4F7FA', borderRadius: 6, fontSize: 12 }}>
            <strong>Notes:</strong> {notes}
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid #D5DCE8', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontSize: 11, color: '#6B7280' }}>
            <div>Generated by Syllabrix HMS</div>
            <div style={{ fontFamily: 'monospace', marginTop: 2 }}>{orderNumber || 'DRAFT'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ borderTop: '1px solid #1E2B3C', paddingTop: 6, minWidth: 140, fontSize: 12 }}>
              {doctorName ? `Dr. ${doctorName}` : 'Doctor Signature'}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
