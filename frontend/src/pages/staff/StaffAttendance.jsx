import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Users, Clock, CheckCircle, XCircle, Plus, Edit2, Trash2,
  LogIn, LogOut, RefreshCw, BarChart2, Fingerprint, Link2,
  Shield, ChevronDown, ChevronUp, Search,
} from 'lucide-react';
import {
  getStaff, createStaff, updateStaff, deleteStaff,
  getTodayAttendance, punchIn, punchOut, getAttendanceSummary,
} from '../../api';

const TABS = ['staff', 'attendance', 'report'];

const fmtTime = (dt) => dt ? new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate = (dt) => dt ? new Date(dt).toLocaleDateString('en-IN') : '—';

const KPI = ({ icon: Icon, label, value, color = 'var(--navy)' }) => (
  <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
    <div style={{ width: 44, height: 44, borderRadius: 12, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={20} color="#fff" />
    </div>
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{label}</div>
    </div>
  </div>
);

const EMPTY_FORM = { name: '', phone: '', email: '', role: '', department: '', salary: '', joinedAt: '', biometricId: '' };

export default function StaffAttendance() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('attendance');
  const [staffList, setStaffList] = useState([]);
  const [todayData, setTodayData] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [punching, setPunching] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showDevice, setShowDevice] = useState(false);
  const [reportFrom, setReportFrom] = useState(new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));
  const [reportTo, setReportTo] = useState(new Date().toISOString().slice(0, 10));
  const [reportStaff, setReportStaff] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sl, td] = await Promise.all([getStaff(), getTodayAttendance()]);
      setStaffList(sl.data.data);
      setTodayData(td.data.data);
    } catch { toast.error('Failed to load staff data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const loadReport = async () => {
    try {
      const r = await getAttendanceSummary({ from: reportFrom, to: reportTo });
      setSummaryData(r.data.data);
    } catch { toast.error('Failed to load report'); }
  };

  useEffect(() => { if (tab === 'report') loadReport(); }, [tab, reportFrom, reportTo]);

  // Stats
  const present = todayData.filter(s => s.isCurrentlyIn).length;
  const absent = todayData.filter(s => !s.currentStatus || s.currentStatus === 'ABSENT').length;
  const totalHours = todayData.reduce((s, x) => s + (x.hoursWorked || 0), 0).toFixed(1);

  const handlePunch = async (staffId, type) => {
    setPunching(p => ({ ...p, [staffId]: true }));
    try {
      if (type === 'IN') await punchIn({ staffId });
      else await punchOut({ staffId });
      const td = await getTodayAttendance();
      setTodayData(td.data.data);
      toast.success(`Punch ${type} recorded`);
    } catch (err) {
      toast.error(err.response?.data?.message || `Punch ${type} failed`);
    } finally { setPunching(p => ({ ...p, [staffId]: false })); }
  };

  const openAdd = () => { setEditStaff(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (s) => {
    setEditStaff(s);
    setForm({
      name: s.name, phone: s.phone || '', email: s.email || '',
      role: s.role, department: s.department || '',
      salary: s.salary ?? '', joinedAt: s.joinedAt ? s.joinedAt.slice(0, 10) : '',
      biometricId: s.biometricId || '',
    });
    setShowForm(true);
  };

  const saveStaff = async () => {
    if (!form.name.trim() || !form.role.trim()) return toast.error('Name and role are required');
    setSaving(true);
    try {
      const payload = {
        ...form,
        salary: form.salary ? parseFloat(form.salary) : null,
        joinedAt: form.joinedAt || null,
        biometricId: form.biometricId || null,
        department: form.department || null,
      };
      if (editStaff) await updateStaff(editStaff.id, payload);
      else await createStaff(payload);
      toast.success(editStaff ? 'Staff updated' : 'Staff added');
      setShowForm(false);
      loadAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const removeStaff = async (s) => {
    if (!confirm(`Delete ${s.name}? This cannot be undone.`)) return;
    try { await deleteStaff(s.id); toast.success('Deleted'); loadAll(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const deviceWebhookUrl = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/api/v1/attendance/device-punch`;
  const filteredStaff = staffList.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.role.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: 28, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>{t('staff.title')}</h1>
          <p style={{ color: '#6B7280', fontSize: 13, margin: '4px 0 0' }}>Manage your team and track daily attendance</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowDevice(!showDevice)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#374151' }}>
            <Fingerprint size={15} /> {t('staff.connectDevice')}
          </button>
          <button onClick={loadAll} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: '#fff', cursor: 'pointer', color: '#6B7280' }}>
            <RefreshCw size={15} />
          </button>
          <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 'var(--radius-md)', background: 'var(--navy)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            <Plus size={15} /> {t('staff.addStaff')}
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <KPI icon={Users}        label={t('staff.totalStaff')}  value={staffList.length}   color="var(--navy)" />
        <KPI icon={CheckCircle}  label={t('staff.presentToday')} value={present}            color="#10B981" />
        <KPI icon={XCircle}      label={t('staff.absentToday')}  value={absent}             color="#EF4444" />
        <KPI icon={Clock}        label={t('staff.hoursToday')}   value={`${totalHours}h`}   color="var(--cyan)" />
      </div>

      {/* Biometric Device Panel */}
      {showDevice && (
        <div style={{ background: 'linear-gradient(135deg, #0F2349 0%, #1B3A6B 100%)', borderRadius: 14, padding: 24, marginBottom: 24, color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Fingerprint size={20} color="var(--cyan)" />
            <span style={{ fontWeight: 700, fontSize: 16 }}>{t('staff.connectDevice')}</span>
            <Shield size={14} color="#9CA3AF" style={{ marginLeft: 4 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Device Webhook URL (ZKTeco / FingerJet)</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <code style={{ background: 'rgba(255,255,255,0.08)', padding: '8px 12px', borderRadius: 8, fontSize: 12, flex: 1, wordBreak: 'break-all', color: 'var(--cyan)', fontFamily: 'monospace' }}>
                  POST /api/v1/attendance/device-punch
                </code>
                <button onClick={() => { navigator.clipboard.writeText('/api/v1/attendance/device-punch'); toast.success('Copied'); }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', color: '#fff', flexShrink: 0 }}>
                  <Link2 size={14} />
                </button>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Request Body Fields</div>
              <code style={{ background: 'rgba(255,255,255,0.08)', padding: '10px 14px', borderRadius: 8, fontSize: 12, display: 'block', color: '#86EFAC', fontFamily: 'monospace', lineHeight: 1.8 }}>
                {`{ tenantId, biometricId,\n  punchType: "IN"|"OUT",\n  punchTime, deviceId }`}
              </code>
            </div>
          </div>
          <p style={{ margin: '14px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
            In ZKTeco ADMS: set the server address to your deployed backend. The device uses the biometric enrollment ID stored in each staff member's profile. Supported: ZKTeco push SDK, FingerJet, SecuGen, Mantra MFS100 (via middleware).
          </p>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, background: 'var(--surface-1)', borderRadius: 10, padding: 4, marginBottom: 24, width: 'fit-content' }}>
        {[['attendance', t('staff.attendanceTab')], ['staff', t('staff.staffTab')], ['report', t('staff.reportTab')]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: tab === key ? '#fff' : 'transparent',
            color: tab === key ? 'var(--navy)' : '#9CA3AF',
            boxShadow: tab === key ? 'var(--shadow-sm)' : 'none',
            transition: 'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {/* ── ATTENDANCE TAB ── */}
      {tab === 'attendance' && (
        <div>
          <div style={{ display: 'grid', gap: 10 }}>
            {loading ? (
              <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 40 }}>{t('common.loading')}</p>
            ) : todayData.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center', border: '1px solid var(--border)' }}>
                <Users size={32} color="#D1D5DB" style={{ marginBottom: 12 }} />
                <p style={{ color: '#9CA3AF', margin: 0 }}>No staff members yet. Add staff to start tracking attendance.</p>
              </div>
            ) : todayData.map(s => (
              <div key={s.id} style={{
                background: '#fff', borderRadius: 12, padding: '16px 20px',
                border: `1px solid ${s.isCurrentlyIn ? '#D1FAE5' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', gap: 16,
                boxShadow: s.isCurrentlyIn ? '0 0 0 2px rgba(16,185,129,0.15)' : 'var(--shadow-sm)',
              }}>
                {/* Avatar */}
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: s.isCurrentlyIn ? '#10B981' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: s.isCurrentlyIn ? '#fff' : '#6B7280', flexShrink: 0 }}>
                  {s.name[0].toUpperCase()}
                </div>
                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>{s.role}{s.department ? ` · ${s.department}` : ''}</div>
                </div>
                {/* Today's data */}
                <div style={{ textAlign: 'center', minWidth: 80 }}>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>{t('staff.firstIn')}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{fmtTime(s.firstIn)}</div>
                </div>
                <div style={{ textAlign: 'center', minWidth: 80 }}>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>{t('staff.hoursWorked')}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>{s.hoursWorked}h</div>
                </div>
                {/* Status badge */}
                <div style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, minWidth: 80, textAlign: 'center',
                  background: s.isCurrentlyIn ? '#D1FAE5' : s.currentStatus === 'OUT' ? '#FEF3C7' : '#F3F4F6',
                  color: s.isCurrentlyIn ? '#065F46' : s.currentStatus === 'OUT' ? '#92400E' : '#6B7280',
                }}>
                  {s.isCurrentlyIn ? '● ' + t('staff.currentlyIn') : s.currentStatus === 'OUT' ? 'Checked Out' : t('staff.absent')}
                </div>
                {/* Punch buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {!s.isCurrentlyIn ? (
                    <button onClick={() => handlePunch(s.id, 'IN')} disabled={punching[s.id]}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#10B981', color: '#fff', cursor: punching[s.id] ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, opacity: punching[s.id] ? 0.6 : 1 }}>
                      <LogIn size={13} /> {t('staff.punchIn')}
                    </button>
                  ) : (
                    <button onClick={() => handlePunch(s.id, 'OUT')} disabled={punching[s.id]}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#EF4444', color: '#fff', cursor: punching[s.id] ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, opacity: punching[s.id] ? 0.6 : 1 }}>
                      <LogOut size={13} /> {t('staff.punchOut')}
                    </button>
                  )}
                </div>
                {/* Today's punch log */}
                {s.todayLogs?.length > 0 && (
                  <div style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 160 }}>
                    {s.todayLogs.map((l, i) => (
                      <span key={i} style={{ background: l.punchType === 'IN' ? '#D1FAE5' : '#FEE2E2', color: l.punchType === 'IN' ? '#065F46' : '#991B1B', padding: '2px 7px', borderRadius: 10, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                        {l.punchType === 'IN' ? '↓' : '↑'} {fmtTime(l.punchTime)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STAFF TAB ── */}
      {tab === 'staff' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff…"
                style={{ width: '100%', padding: '9px 12px 9px 32px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 13 }} />
            </div>
          </div>

          {loading ? <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 40 }}>{t('common.loading')}</p> : (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
                    {['Name', 'Role / Dept', 'Phone', 'Salary', 'Biometric ID', 'Status', 'Joined', ''].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((s, i) => (
                    <tr key={s.id} style={{ borderBottom: i < filteredStaff.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>{s.name[0]}</div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13 }}>
                        <div style={{ fontWeight: 500 }}>{s.role}</div>
                        {s.department && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{s.department}</div>}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13, color: '#6B7280', fontFamily: 'var(--font-mono)' }}>{s.phone || '—'}</td>
                      <td style={{ padding: '12px 14px', fontSize: 13, fontFamily: 'var(--font-mono)' }}>{s.salary ? `₹${Number(s.salary).toLocaleString('en-IN')}` : '—'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        {s.biometricId ? (
                          <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '3px 10px', borderRadius: 10, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                            <Fingerprint size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />{s.biometricId}
                          </span>
                        ) : <span style={{ color: '#D1D5DB', fontSize: 13 }}>Not enrolled</span>}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: s.isActive ? '#D1FAE5' : '#F3F4F6', color: s.isActive ? '#065F46' : '#6B7280', padding: '3px 10px', borderRadius: 10, fontSize: 12, fontWeight: 600 }}>
                          {s.isActive ? t('common.active') : t('common.inactive')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: '#9CA3AF' }}>{fmtDate(s.joinedAt)}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => openEdit(s)} style={{ padding: '5px 10px', border: '1px solid var(--border)', borderRadius: 6, background: '#fff', cursor: 'pointer' }}><Edit2 size={13} /></button>
                          <button onClick={() => removeStaff(s)} style={{ padding: '5px 10px', border: '1px solid #FECACA', borderRadius: 6, background: '#fff', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredStaff.length === 0 && (
                    <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>{t('common.noData')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── REPORT TAB ── */}
      {tab === 'report' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-end' }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>{t('common.from')}</label>
              <input type="date" value={reportFrom} onChange={e => setReportFrom(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>{t('common.to')}</label>
              <input type="date" value={reportTo} onChange={e => setReportTo(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 13 }} />
            </div>
            <button onClick={loadReport} style={{ padding: '9px 18px', borderRadius: 'var(--radius-md)', background: 'var(--navy)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              Generate Report
            </button>
          </div>

          {summaryData.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center', border: '1px solid var(--border)', color: '#9CA3AF' }}>
              <BarChart2 size={32} color="#D1D5DB" style={{ marginBottom: 12 }} />
              <p>Select a date range and click Generate Report</p>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
                    {[t('attendance.staffMember'), 'Role', t('attendance.presentDays'), t('attendance.totalHours'), 'Avg Hrs/Day'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summaryData.map((row, i) => (
                    <tr key={row.staff.id} style={{ borderBottom: i < summaryData.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>{row.staff.name[0]}</div>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{row.staff.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13, color: '#6B7280' }}>{row.staff.role}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>{row.presentDays}</span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 14, fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--font-mono)' }}>{row.totalHours}h</td>
                      <td style={{ padding: '12px 14px', fontSize: 13, color: '#6B7280', fontFamily: 'var(--font-mono)' }}>
                        {row.presentDays > 0 ? (row.totalHours / row.presentDays).toFixed(1) + 'h' : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── STAFF FORM MODAL ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--font-display)' }}>
                {editStaff ? t('staff.editStaff') : t('staff.addStaff')}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9CA3AF' }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: t('common.name') + ' *', key: 'name', type: 'text' },
                { label: 'Role *', key: 'role', type: 'text', placeholder: 'e.g. Cashier, Manager' },
                { label: t('common.phone'), key: 'phone', type: 'tel' },
                { label: t('common.email'), key: 'email', type: 'email' },
                { label: t('staff.department'), key: 'department', type: 'text' },
                { label: t('staff.salary'), key: 'salary', type: 'number' },
                { label: t('staff.joinDate'), key: 'joinedAt', type: 'date' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder || ''}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
              ))}

              {/* Biometric ID - full width with explanation */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                  <Fingerprint size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  {t('staff.biometricId')}
                </label>
                <input type="text" value={form.biometricId} onChange={e => setForm(f => ({ ...f, biometricId: e.target.value }))}
                  placeholder="e.g. 00001 (enrollment ID from your biometric device)"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 13, boxSizing: 'border-box', fontFamily: 'var(--font-mono)' }} />
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9CA3AF' }}>{t('staff.biometricHint')}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '9px 20px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: '#fff', cursor: 'pointer', fontSize: 13 }}>{t('common.cancel')}</button>
              <button onClick={saveStaff} disabled={saving} style={{ padding: '9px 24px', borderRadius: 'var(--radius-md)', background: 'var(--navy)', color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                {saving ? t('common.loading') : editStaff ? t('common.update') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
