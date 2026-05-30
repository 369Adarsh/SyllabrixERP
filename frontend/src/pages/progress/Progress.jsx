import { useState, useEffect, useCallback } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen, ClipboardList, TrendingUp, Plus, Trash2, CheckCircle2, Clock,
  MessageCircle, Flame, ChevronDown, ChevronUp, CalendarDays, BookMarked,
  Circle, BarChart2, Users, PenLine, Check, X, GraduationCap, Target,
  AlertTriangle, Send, Star, ListChecks, Award,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getHomework, createHomework, deleteHomework, bulkUpdateSubmissions,
  updateHomeworkSubmission,
  getTeachingLogs, createTeachingLog, deleteTeachingLog, getStudentProgress,
  getStudents,
  getExams, createExam, updateExam, deleteExam, upsertStudentPrep,
} from '../../api';

const TODAY = new Date().toISOString().slice(0, 10);

function pct(done, total) {
  if (!total) return null;
  return Math.round((done / total) * 100);
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Assign Homework Modal ─────────────────────────────────────────────────────
const ASSIGN_MODES = [
  { key: 'all',    label: 'All Students',     desc: 'Assign to every active student' },
  { key: 'batch',  label: 'By Batch / Class', desc: 'Select one or more batches' },
  { key: 'custom', label: 'Pick Students',    desc: 'Choose individuals from the list' },
];

function AssignModal({ subjects, batches, students, onClose, onSave }) {
  const { isMobile } = useBreakpoint();
  const [subject, setSubject]       = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate]       = useState(TODAY);
  const [mode, setMode]             = useState('all');
  const [selBatches, setSelBatches] = useState([]);
  const [selIds, setSelIds]         = useState([]);
  const [search, setSearch]         = useState('');
  const [saving, setSaving]         = useState(false);

  const activeSubject = subject === '__custom__' ? customSubject : subject;

  // Derive the final student list based on mode
  const targetStudents = (() => {
    if (mode === 'all')    return students;
    if (mode === 'batch')  return selBatches.length
      ? students.filter(s => selBatches.includes(s.batch))
      : [];
    if (mode === 'custom') return students.filter(s => selIds.includes(s.id));
    return [];
  })();

  // Students visible in the picker (filtered by search + batch chips)
  const pickerList = students.filter(s => {
    const q = search.toLowerCase();
    const matchName  = s.name?.toLowerCase().includes(q);
    const matchBatch = s.batch?.toLowerCase().includes(q);
    return !q || matchName || matchBatch;
  });

  const toggleBatch = (b) =>
    setSelBatches(p => p.includes(b) ? p.filter(x => x !== b) : [...p, b]);

  const toggleStudent = (id) =>
    setSelIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const toggleAll = () =>
    setSelIds(pickerList.length === selIds.length ? [] : pickerList.map(s => s.id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeSubject) return toast.error('Select a subject');
    if (!description.trim()) return toast.error('Add a description');
    if (!dueDate) return toast.error('Set a due date');
    if (targetStudents.length === 0) return toast.error('Select at least one student');
    setSaving(true);
    try {
      const classGroup = mode === 'batch' && selBatches.length === 1 ? selBatches[0] : '';
      await onSave({
        subject: activeSubject,
        description: description.trim(),
        classGroup,
        dueDate,
        studentIds: targetStudents.map(s => s.id),
      });
      onClose();
    } catch { /* parent handles */ } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? 0 : 16 }}>
      <div style={{ background: '#fff', borderRadius: isMobile ? '20px 20px 0 0' : 18, width: isMobile ? '100%' : 560, maxWidth: '100%', maxHeight: isMobile ? '95dvh' : '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F3F4F6' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>Assign Homework</div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Fill details, then choose who gets this homework</div>
        </div>

        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Subject + Due Date */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Subject *</label>
              <select value={subject} onChange={e => setSubject(e.target.value)} style={inp} required>
                <option value="">Select subject</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                <option value="General">General</option>
                <option value="__custom__">+ Type custom…</option>
              </select>
              {subject === '__custom__' && (
                <input value={customSubject} onChange={e => setCustomSubject(e.target.value)}
                  style={{ ...inp, marginTop: 6 }} placeholder="Enter subject name" autoFocus />
              )}
            </div>
            <div>
              <label style={lbl}>Due Date *</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inp} required />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={lbl}>Homework Description *</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              style={{ ...inp, minHeight: 72, resize: 'vertical' }}
              placeholder="e.g. Complete exercises 5.1 to 5.4 from chapter 5" required />
          </div>

          {/* Assignment Mode */}
          <div>
            <label style={lbl}>Assign To</label>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 8 }}>
              {ASSIGN_MODES.map(m => (
                <button key={m.key} type="button" onClick={() => { setMode(m.key); setSelBatches([]); setSelIds([]); }} style={{
                  padding: '10px 8px', borderRadius: 10, border: `2px solid ${mode === m.key ? 'var(--cyan)' : '#E5E7EB'}`,
                  background: mode === m.key ? 'rgba(31,184,214,0.06)' : '#FAFAFA',
                  cursor: 'pointer', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: mode === m.key ? 'var(--cyan)' : 'var(--navy)' }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Batch selector */}
          {mode === 'batch' && (
            <div>
              <label style={lbl}>Select Batches</label>
              {batches.length === 0 ? (
                <div style={{ fontSize: 13, color: '#9CA3AF' }}>No batches found. Add batch info to students first.</div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {batches.map(b => {
                    const count = students.filter(s => s.batch === b).length;
                    const active = selBatches.includes(b);
                    return (
                      <button key={b} type="button" onClick={() => toggleBatch(b)} style={{
                        padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${active ? 'var(--cyan)' : '#E5E7EB'}`,
                        background: active ? 'rgba(31,184,214,0.1)' : '#fff', cursor: 'pointer',
                        fontSize: 13, fontWeight: 600, color: active ? 'var(--cyan)' : '#374151',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        {active && <span style={{ fontSize: 11 }}>✓</span>}
                        {b}
                        <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400 }}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Individual student picker */}
          {mode === 'custom' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={lbl}>Select Students</label>
                <button type="button" onClick={toggleAll} style={{ fontSize: 12, color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  {selIds.length === pickerList.length && pickerList.length > 0 ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <input value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp, marginBottom: 8 }}
                placeholder="Search by name or batch…" />
              <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, maxHeight: 200, overflowY: 'auto' }}>
                {pickerList.length === 0 ? (
                  <div style={{ padding: 16, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No students found</div>
                ) : pickerList.map((s, i) => {
                  const checked = selIds.includes(s.id);
                  return (
                    <label key={s.id} onClick={() => toggleStudent(s.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer',
                      background: checked ? 'rgba(31,184,214,0.05)' : i % 2 === 0 ? '#fff' : '#FAFAFA',
                      borderBottom: i < pickerList.length - 1 ? '1px solid #F3F4F6' : 'none',
                    }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 5, border: `2px solid ${checked ? 'var(--cyan)' : '#D1D5DB'}`,
                        background: checked ? 'var(--cyan)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {checked && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                          {[s.batch, s.course].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary */}
          <div style={{
            background: targetStudents.length > 0 ? '#F0FDF4' : '#FFF7ED',
            border: `1px solid ${targetStudents.length > 0 ? '#BBF7D0' : '#FED7AA'}`,
            borderRadius: 8, padding: '10px 14px', fontSize: 13,
            color: targetStudents.length > 0 ? '#16A34A' : '#D97706',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 16 }}>{targetStudents.length > 0 ? '✓' : '⚠'}</span>
            {targetStudents.length > 0
              ? <>Will assign to <strong style={{ margin: '0 4px' }}>{targetStudents.length}</strong> student{targetStudents.length !== 1 ? 's' : ''}
                  {mode === 'batch' && selBatches.length > 0 && <span style={{ color: '#6B7280' }}> — {selBatches.join(', ')}</span>}
                </>
              : 'No students selected yet'
            }
          </div>
        </form>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={btnSecondary}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving || targetStudents.length === 0} style={{
            ...btnPrimary,
            opacity: saving || targetStudents.length === 0 ? 0.5 : 1,
            cursor: saving || targetStudents.length === 0 ? 'not-allowed' : 'pointer',
          }}>
            {saving ? 'Assigning…' : `Assign to ${targetStudents.length} Student${targetStudents.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Student Row with inline remark ───────────────────────────────────────────
function StudentRemarkRow({ sub, hwId, onToggle, saving }) {
  const sid = sub.studentId || sub.student?.id;
  const [editingRemark, setEditingRemark] = useState(false);
  const [remark, setRemark]               = useState(sub.notes || '');
  const [remarkSaving, setRemarkSaving]   = useState(false);

  const saveRemark = async () => {
    if (remark === (sub.notes || '')) { setEditingRemark(false); return; }
    setRemarkSaving(true);
    try {
      await updateHomeworkSubmission(hwId, sid, { status: sub.status, notes: remark });
      sub.notes = remark;
      toast.success('Remark saved');
    } catch { toast.error('Failed to save remark'); }
    finally { setRemarkSaving(false); setEditingRemark(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveRemark(); }
    if (e.key === 'Escape') { setRemark(sub.notes || ''); setEditingRemark(false); }
  };

  return (
    <div style={{ borderBottom: '1px solid #F9FAFB' }}>
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px' }}>
        <button
          onClick={() => !saving && onToggle(sid, sub.status)}
          style={{ background: 'none', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', padding: 0, flexShrink: 0,
            color: sub.status === 'DONE' ? '#16A34A' : '#D1D5DB' }}
        >
          {sub.status === 'DONE' ? <CheckCircle2 size={18} /> : <Circle size={18} />}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{sub.student?.name}</div>
          {sub.student?.batch && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{sub.student.batch}</div>}
          {/* Remark preview */}
          {!editingRemark && sub.notes && (
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 3, fontStyle: 'italic',
              background: '#FFFBEB', borderRadius: 5, padding: '2px 6px', display: 'inline-block' }}>
              📝 {sub.notes}
            </div>
          )}
        </div>

        {/* Status chip */}
        <span style={{
          fontSize: 11, fontWeight: 600, borderRadius: 6, padding: '2px 8px', flexShrink: 0,
          background: sub.status === 'DONE' ? '#F0FDF4' : sub.status === 'PARTIAL' ? '#FFFBEB' : '#F9FAFB',
          color: sub.status === 'DONE' ? '#16A34A' : sub.status === 'PARTIAL' ? '#D97706' : '#9CA3AF',
        }}>
          {sub.status === 'DONE' ? 'Done' : sub.status === 'PARTIAL' ? 'Partial' : 'Pending'}
        </span>

        {/* Remark toggle button */}
        <button
          onClick={() => setEditingRemark(e => !e)}
          title={sub.notes ? 'Edit remark' : 'Add remark'}
          style={{
            background: editingRemark ? 'rgba(6,182,212,0.1)' : sub.notes ? '#FFFBEB' : 'none',
            border: 'none', cursor: 'pointer', borderRadius: 6, padding: '4px 6px', flexShrink: 0,
            color: editingRemark ? 'var(--cyan)' : sub.notes ? '#D97706' : '#D1D5DB',
          }}
        >
          <PenLine size={14} />
        </button>
      </div>

      {/* Inline remark editor */}
      {editingRemark && (
        <div style={{ padding: '0 16px 10px 44px', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
          <textarea
            autoFocus
            value={remark}
            onChange={e => setRemark(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add teacher remark… (e.g. needs to revise chapter 3, good effort)"
            style={{
              flex: 1, fontSize: 12, padding: '7px 10px', borderRadius: 8, resize: 'none',
              border: '1.5px solid var(--cyan)', outline: 'none', lineHeight: 1.5,
              color: '#374151', background: '#F0FDFF', minHeight: 60, fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button onClick={saveRemark} disabled={remarkSaving} title="Save (Enter)"
              style={{ background: 'var(--cyan)', border: 'none', borderRadius: 7, padding: '6px 8px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}>
              {remarkSaving ? <span style={{ fontSize: 10 }}>…</span> : <Check size={13} />}
            </button>
            <button onClick={() => { setRemark(sub.notes || ''); setEditingRemark(false); }} title="Cancel (Esc)"
              style={{ background: '#F3F4F6', border: 'none', borderRadius: 7, padding: '6px 8px', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>
              <X size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Homework Card ─────────────────────────────────────────────────────────────
function HomeworkCard({ hw, onDelete, onToggle }) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  const total = hw.submissions?.length || 0;
  const done = hw.submissions?.filter(s => s.status === 'DONE').length || 0;
  const pending = hw.submissions?.filter(s => s.status === 'PENDING').length || 0;
  const completion = pct(done, total);
  const isPast = new Date(hw.dueDate) < new Date(new Date().toDateString());

  const handleToggle = async (studentId, currentStatus) => {
    const newStatus = currentStatus === 'DONE' ? 'PENDING' : 'DONE';
    setSaving(true);
    try {
      await onToggle(hw.id, studentId, newStatus);
    } finally { setSaving(false); }
  };

  const sendWhatsApp = () => {
    const pending = hw.submissions?.filter(s => s.status === 'PENDING') || [];
    if (!pending.length) return toast('All students have completed this homework!');
    let i = 0;
    const fire = () => {
      if (i >= pending.length) return;
      const s = pending[i++];
      const phone = s.student?.parentPhone || s.student?.phone;
      if (!phone) { fire(); return; }
      const msg = encodeURIComponent(
        `Hi ${s.student?.parentName || 'Parent'},\n\n*${hw.subject} Homework Reminder*\n${hw.description}\nDue: ${fmtDate(hw.dueDate)}\n\nPlease ensure it is completed. Thank you!`
      );
      window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
      setTimeout(fire, 800);
    };
    fire();
    toast.success(`Opening WhatsApp for ${pending.length} parent(s)`);
  };

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', marginBottom: 12, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ background: 'var(--cyan)', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '2px 8px' }}>
              {hw.subject}
            </span>
            {hw.classGroup && (
              <span style={{ background: '#F3F4F6', color: '#6B7280', fontSize: 11, borderRadius: 6, padding: '2px 8px' }}>
                {hw.classGroup}
              </span>
            )}
            {isPast && (
              <span style={{ background: '#FEF2F2', color: '#EF4444', fontSize: 11, borderRadius: 6, padding: '2px 8px' }}>
                Past Due
              </span>
            )}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)', marginBottom: 4 }}>{hw.description}</div>
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>Due: {fmtDate(hw.dueDate)}</div>
        </div>

        <div style={{ textAlign: 'right', minWidth: 90 }}>
          {total > 0 && (
            <>
              <div style={{ fontSize: 20, fontWeight: 800, color: completion >= 80 ? '#16A34A' : completion >= 50 ? '#D97706' : '#EF4444' }}>
                {completion}%
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>{done}/{total} done</div>
            </>
          )}
        </div>
      </div>

      {total > 0 && (
        <div style={{ height: 4, background: '#F3F4F6', margin: '0 16px' }}>
          <div style={{ height: 4, background: completion >= 80 ? '#16A34A' : completion >= 50 ? '#F59E0B' : '#EF4444', borderRadius: 4, width: `${completion}%`, transition: 'width 0.3s' }} />
        </div>
      )}

      <div style={{ padding: '10px 16px', display: 'flex', gap: 8, alignItems: 'center', borderTop: '1px solid #F3F4F6', marginTop: 4 }}>
        <button onClick={() => setExpanded(p => !p)} style={{ ...btnOutline, fontSize: 12, gap: 4 }}>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {expanded ? 'Hide' : 'View'} Students ({total})
        </button>
        <button onClick={sendWhatsApp} style={{ ...btnOutline, fontSize: 12, color: '#16A34A', borderColor: '#16A34A', gap: 4 }}>
          <MessageCircle size={13} /> Remind Pending ({pending})
        </button>
        <button onClick={() => onDelete(hw.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '4px 8px' }}>
          <Trash2 size={14} />
        </button>
      </div>

      {expanded && hw.submissions?.length > 0 && (
        <div style={{ borderTop: '1px solid #F3F4F6', maxHeight: 360, overflowY: 'auto' }}>
          {hw.submissions.map(sub => (
            <StudentRemarkRow
              key={sub.id || sub.studentId}
              sub={sub}
              hwId={hw.id}
              onToggle={(sid, status) => !saving && handleToggle(sid, status)}
              saving={saving}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Student Progress Card ─────────────────────────────────────────────────────
function ProgressCard({ s }) {
  const [expanded, setExpanded] = useState(false);
  const subjects = Object.entries(s.subjectMap || {});

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, background: 'var(--navy)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
          {s.name?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)', marginBottom: 2 }}>{s.name}</div>
          {s.batch && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{s.batch}</div>}
          {s.course && <div style={{ fontSize: 11, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.course}</div>}
        </div>
        {s.streak > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, padding: '4px 8px' }}>
            <Flame size={14} color="#EA580C" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#EA580C' }}>{s.streak}</span>
          </div>
        )}
      </div>

      {s.completionPct !== null ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: '#6B7280' }}>Completion</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: s.completionPct >= 80 ? '#16A34A' : s.completionPct >= 50 ? '#D97706' : '#EF4444' }}>
              {s.completionPct}%
            </span>
          </div>
          <div style={{ height: 6, background: '#F3F4F6', borderRadius: 4, marginBottom: 12 }}>
            <div style={{ height: 6, borderRadius: 4, background: s.completionPct >= 80 ? '#16A34A' : s.completionPct >= 50 ? '#F59E0B' : '#EF4444', width: `${s.completionPct}%`, transition: 'width 0.3s' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, fontSize: 12, color: '#6B7280', marginBottom: 10 }}>
            <span style={{ color: '#16A34A' }}>✓ {s.done} done</span>
            <span>·</span>
            <span style={{ color: '#6B7280' }}>⏳ {s.total - s.done - (s.partial || 0)} pending</span>
            {s.partial > 0 && <><span>·</span><span style={{ color: '#D97706' }}>~ {s.partial} partial</span></>}
          </div>
        </>
      ) : (
        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12 }}>No homework assigned yet</div>
      )}

      {subjects.length > 0 && (
        <button onClick={() => setExpanded(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--cyan)', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          Subject breakdown
        </button>
      )}

      {expanded && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {subjects.map(([subj, data]) => {
            const p = pct(data.done, data.total);
            return (
              <div key={subj}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
                  <span style={{ color: '#374151', fontWeight: 500 }}>{subj}</span>
                  <span style={{ color: '#6B7280' }}>{data.done}/{data.total}</span>
                </div>
                <div style={{ height: 4, background: '#F3F4F6', borderRadius: 4 }}>
                  <div style={{ height: 4, borderRadius: 4, background: 'var(--cyan)', width: `${p || 0}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Teaching Log Tab ──────────────────────────────────────────────────────────
function TeachingLogTab({ subjects, batches }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ subject: '', topic: '', classGroup: '', notes: '', taughtDate: TODAY });

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try { const r = await getTeachingLogs(); setLogs(r.data?.data || []); }
    catch { toast.error('Failed to load teaching log'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.topic) return toast.error('Subject and topic are required');
    try {
      await createTeachingLog(form);
      toast.success('Teaching log added');
      setForm({ subject: '', topic: '', classGroup: '', notes: '', taughtDate: TODAY });
      loadLogs();
    } catch { toast.error('Failed to save log'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this log entry?')) return;
    try { await deleteTeachingLog(id); setLogs(p => p.filter(l => l.id !== id)); }
    catch { toast.error('Failed to delete'); }
  };

  // Group logs by date
  const grouped = logs.reduce((acc, log) => {
    const d = new Date(log.taughtDate).toDateString();
    if (!acc[d]) acc[d] = [];
    acc[d].push(log);
    return acc;
  }, {});

  return (
    <div>
      {/* Log form */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 20, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookMarked size={16} color="var(--cyan)" /> Log Today's Topic
        </div>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Subject *</label>
              <select value={form.subject} onChange={e => set('subject', e.target.value)} style={inp} required>
                <option value="">Select</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                <option value="General">General</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Batch / Class</label>
              <select value={form.classGroup} onChange={e => set('classGroup', e.target.value)} style={inp}>
                <option value="">All</option>
                {batches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Date</label>
              <input type="date" value={form.taughtDate} onChange={e => set('taughtDate', e.target.value)} style={inp} />
            </div>
          </div>
          <div>
            <label style={lbl}>Topic Taught *</label>
            <input value={form.topic} onChange={e => set('topic', e.target.value)} style={inp} placeholder="e.g. Quadratic Equations — Chapter 4" required />
          </div>
          <div>
            <label style={lbl}>Notes (optional)</label>
            <input value={form.notes} onChange={e => set('notes', e.target.value)} style={inp} placeholder="e.g. Covered examples 1-6, students struggled with factoring" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" style={btnPrimary}>+ Add to Log</button>
          </div>
        </form>
      </div>

      {/* Timeline */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 32 }}>Loading…</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 48, background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB' }}>
          No teaching logs yet. Start logging your daily topics above.
        </div>
      ) : (
        Object.entries(grouped).map(([dateStr, dayLogs]) => (
          <div key={dateStr} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              {dateStr === new Date().toDateString() ? 'Today' : dateStr === new Date(Date.now() - 86400000).toDateString() ? 'Yesterday' : fmtDate(dayLogs[0].taughtDate)}
            </div>
            {dayLogs.map(log => (
              <div key={log.id} style={{ background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB', padding: '12px 16px', marginBottom: 8, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cyan)', marginTop: 6, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ background: 'var(--cyan)', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 5, padding: '1px 7px' }}>{log.subject}</span>
                    {log.classGroup && <span style={{ background: '#F3F4F6', color: '#6B7280', fontSize: 11, borderRadius: 5, padding: '1px 7px' }}>{log.classGroup}</span>}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)', marginBottom: log.notes ? 4 : 0 }}>{log.topic}</div>
                  {log.notes && <div style={{ fontSize: 12, color: '#6B7280' }}>{log.notes}</div>}
                </div>
                <button onClick={() => handleDelete(log.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 4 }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}

// ── Homework Tracker View ─────────────────────────────────────────────────────
const SUBJECT_COLORS = [
  '#06B6D4','#8B5CF6','#F59E0B','#10B981','#EF4444','#3B82F6','#EC4899','#14B8A6',
];
function subjectColor(subject, subjects) {
  const idx = subjects.indexOf(subject);
  return SUBJECT_COLORS[idx >= 0 ? idx % SUBJECT_COLORS.length : (subject?.charCodeAt(0) || 0) % SUBJECT_COLORS.length];
}

function HomeworkTrackerView({ homework, subjects, onDelete, onToggle }) {
  const [expandedId, setExpandedId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Group by dueDate day (YYYY-MM-DD)
  const grouped = {};
  [...homework].sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate)).forEach(hw => {
    const key = new Date(hw.dueDate).toISOString().slice(0, 10);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(hw);
  });

  const dateEntries = Object.entries(grouped);

  if (dateEntries.length === 0) return null;

  const handleToggle = async (hwId, studentId, currentStatus) => {
    setSaving(true);
    try { await onToggle(hwId, studentId, currentStatus === 'DONE' ? 'PENDING' : 'DONE'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'relative', paddingLeft: 28 }}>
      {/* vertical timeline line */}
      <div style={{ position: 'absolute', left: 10, top: 8, bottom: 8, width: 2, background: '#E5E7EB', borderRadius: 2 }} />

      {dateEntries.map(([dateKey, dayHw]) => {
        const date = new Date(dateKey);
        const isToday = dateKey === TODAY;
        const isYesterday = dateKey === new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const dayLabel = isToday ? 'Today' : isYesterday ? 'Yesterday'
          : date.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });
        const totalInDay = dayHw.reduce((a, hw) => a + (hw.submissions?.length || 0), 0);
        const doneInDay  = dayHw.reduce((a, hw) => a + (hw.submissions?.filter(s => s.status === 'DONE').length || 0), 0);
        const dayPct = totalInDay > 0 ? Math.round((doneInDay / totalInDay) * 100) : null;

        return (
          <div key={dateKey} style={{ marginBottom: 24 }}>
            {/* Date marker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{
                position: 'absolute', left: 4, width: 14, height: 14, borderRadius: '50%',
                background: isToday ? 'var(--cyan)' : '#fff', border: `2px solid ${isToday ? 'var(--cyan)' : '#D1D5DB'}`,
                zIndex: 1,
              }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: isToday ? 'var(--cyan)' : 'var(--navy)' }}>
                  {dayLabel}
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                  {dayHw.length} homework{dayHw.length !== 1 ? 's' : ''}
                </div>
                {dayPct !== null && (
                  <div style={{
                    fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 10,
                    background: dayPct >= 80 ? '#F0FDF4' : dayPct >= 50 ? '#FFFBEB' : '#FEF2F2',
                    color: dayPct >= 80 ? '#16A34A' : dayPct >= 50 ? '#D97706' : '#EF4444',
                  }}>
                    {dayPct}% done
                  </div>
                )}
              </div>
            </div>

            {/* Homework cards for this day */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dayHw.map(hw => {
                const total = hw.submissions?.length || 0;
                const done  = hw.submissions?.filter(s => s.status === 'DONE').length || 0;
                const p = total > 0 ? Math.round((done / total) * 100) : null;
                const isExpanded = expandedId === hw.id;
                const color = subjectColor(hw.subject, subjects);

                return (
                  <div key={hw.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                    {/* Card header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                      {/* Subject color bar */}
                      <div style={{ width: 4, height: 36, borderRadius: 4, background: color, flexShrink: 0 }} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <span style={{ background: color + '20', color, fontSize: 11, fontWeight: 700, borderRadius: 5, padding: '1px 8px' }}>
                            {hw.subject}
                          </span>
                          {hw.classGroup && (
                            <span style={{ background: '#F3F4F6', color: '#6B7280', fontSize: 11, borderRadius: 5, padding: '1px 7px' }}>
                              {hw.classGroup}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {hw.description}
                        </div>
                      </div>

                      {/* Completion ring */}
                      {p !== null && (
                        <div style={{ textAlign: 'center', minWidth: 48 }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: p >= 80 ? '#16A34A' : p >= 50 ? '#D97706' : '#EF4444', lineHeight: 1 }}>
                            {p}%
                          </div>
                          <div style={{ fontSize: 10, color: '#9CA3AF' }}>{done}/{total}</div>
                        </div>
                      )}

                      <button onClick={() => setExpandedId(isExpanded ? null : hw.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '4px 6px' }}>
                        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                      <button onClick={() => onDelete(hw.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: '4px 6px' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Completion bar */}
                    {p !== null && (
                      <div style={{ height: 3, background: '#F3F4F6', margin: '0 16px' }}>
                        <div style={{ height: 3, background: color, borderRadius: 3, width: `${p}%`, transition: 'width 0.3s' }} />
                      </div>
                    )}

                    {/* Expanded student list */}
                    {isExpanded && hw.submissions?.length > 0 && (
                      <div style={{ borderTop: '1px solid #F3F4F6', marginTop: 2, maxHeight: 320, overflowY: 'auto' }}>
                        {hw.submissions.map(sub => (
                          <StudentRemarkRow
                            key={sub.id || sub.studentId}
                            sub={sub}
                            hwId={hw.id}
                            onToggle={(sid, status) => !saving && handleToggle(hw.id, sid, status)}
                            saving={saving}
                          />
                        ))}
                      </div>
                    )}
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

// ── Exam Prep Tab ─────────────────────────────────────────────────────────────

const EXAM_TYPES = ['UNIT_TEST', 'CHAPTER_TEST', 'HALF_YEARLY', 'FINAL', 'MOCK', 'PRACTICAL'];
const EXAM_TYPE_LABELS = { UNIT_TEST: 'Unit Test', CHAPTER_TEST: 'Chapter Test', HALF_YEARLY: 'Half Yearly', FINAL: 'Final Exam', MOCK: 'Mock Test', PRACTICAL: 'Practical' };
const PRIORITY_COLORS = { HIGH: '#EF4444', MEDIUM: '#F59E0B', LOW: '#10B981' };
const READINESS_COLOR = (r) => r >= 80 ? '#16A34A' : r >= 50 ? '#D97706' : '#EF4444';

function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date(new Date().toDateString());
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function urgencyStyle(days) {
  if (days < 0) return { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', label: 'Past' };
  if (days === 0) return { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', label: 'Today!' };
  if (days <= 3) return { bg: '#FFF7ED', border: '#FED7AA', text: '#EA580C', label: `${days}d left` };
  if (days <= 7) return { bg: '#FFFBEB', border: '#FDE68A', text: '#D97706', label: `${days}d left` };
  return { bg: '#F0FDF4', border: '#BBF7D0', text: '#16A34A', label: `${days}d left` };
}

// Create / Edit Exam Modal
function ExamModal({ subjects, batches, students, exam, onClose, onSave }) {
  const { isMobile } = useBreakpoint();
  const isEdit = !!exam;
  const [form, setForm] = useState({
    title: exam?.title || '',
    subject: exam?.subject || '',
    examType: exam?.examType || 'UNIT_TEST',
    classGroup: exam?.classGroup || '',
    examDate: exam?.examDate ? new Date(exam.examDate).toISOString().slice(0, 10) : '',
    totalMarks: exam?.totalMarks || '',
  });
  const [topics, setTopics] = useState(
    Array.isArray(exam?.topics) ? exam.topics : []
  );
  const [newTopic, setNewTopic] = useState('');
  const [newTopicPriority, setNewTopicPriority] = useState('MEDIUM');
  const [mode, setMode] = useState('all');
  const [selBatches, setSelBatches] = useState(
    exam?.classGroup ? [exam.classGroup] : []
  );
  const [selIds, setSelIds] = useState([]);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const targetStudents = (() => {
    if (isEdit) return [];
    if (mode === 'all') return students;
    if (mode === 'batch') return selBatches.length ? students.filter(s => selBatches.includes(s.batch)) : [];
    if (mode === 'custom') return students.filter(s => selIds.includes(s.id));
    return [];
  })();

  const addTopic = () => {
    const name = newTopic.trim();
    if (!name) return;
    setTopics(p => [...p, { id: Date.now().toString(), name, priority: newTopicPriority, covered: false }]);
    setNewTopic('');
  };

  const toggleTopic = (id) =>
    setTopics(p => p.map(t => t.id === id ? { ...t, covered: !t.covered } : t));

  const removeTopic = (id) =>
    setTopics(p => p.filter(t => t.id !== id));

  const setPriority = (id, priority) =>
    setTopics(p => p.map(t => t.id === id ? { ...t, priority } : t));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Add an exam title');
    if (!form.subject) return toast.error('Select a subject');
    if (!form.examDate) return toast.error('Set exam date');
    if (!isEdit && targetStudents.length === 0) return toast.error('Select at least one student');
    setSaving(true);
    try {
      await onSave({
        ...form,
        totalMarks: form.totalMarks ? Number(form.totalMarks) : null,
        topics,
        studentIds: isEdit ? undefined : targetStudents.map(s => s.id),
      });
      onClose();
    } catch { /* parent handles */ } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? 0 : 16 }}>
      <div style={{ background: '#fff', borderRadius: isMobile ? '20px 20px 0 0' : 18, width: isMobile ? '100%' : 640, maxWidth: '100%', maxHeight: isMobile ? '95dvh' : '94vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>

        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F3F4F6' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>
            {isEdit ? 'Edit Exam' : 'Create Exam'}
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
            {isEdit ? 'Update topics and exam details' : 'Set up exam, add topics to cover, and select students'}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Basic info */}
          <div>
            <label style={lbl}>Exam Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} style={inp}
              placeholder="e.g. Maths Unit Test — Chapter 5 & 6" required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Subject *</label>
              <select value={form.subject} onChange={e => set('subject', e.target.value)} style={inp} required>
                <option value="">Select</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                <option value="General">General</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Type</label>
              <select value={form.examType} onChange={e => set('examType', e.target.value)} style={inp}>
                {EXAM_TYPES.map(t => <option key={t} value={t}>{EXAM_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Exam Date *</label>
              <input type="date" value={form.examDate} onChange={e => set('examDate', e.target.value)} style={inp} required />
            </div>
            <div>
              <label style={lbl}>Total Marks</label>
              <input type="number" value={form.totalMarks} onChange={e => set('totalMarks', e.target.value)} style={inp} placeholder="100" />
            </div>
            <div>
              <label style={lbl}>Batch / Class</label>
              <input value={form.classGroup} onChange={e => set('classGroup', e.target.value)} style={inp} placeholder="e.g. Grade 10" />
            </div>
          </div>

          {/* Topics checklist */}
          <div>
            <label style={{ ...lbl, marginBottom: 8 }}>Topics to Cover</label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input value={newTopic} onChange={e => setNewTopic(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTopic(); } }}
                style={{ ...inp, flex: 1 }} placeholder="Add a topic or chapter (e.g. Quadratic Equations)" />
              <select value={newTopicPriority} onChange={e => setNewTopicPriority(e.target.value)}
                style={{ ...inp, width: 100, flexShrink: 0 }}>
                <option value="HIGH">🔴 High</option>
                <option value="MEDIUM">🟡 Medium</option>
                <option value="LOW">🟢 Low</option>
              </select>
              <button type="button" onClick={addTopic} style={{ ...btnPrimary, padding: '8px 14px', flexShrink: 0 }}>
                <Plus size={14} />
              </button>
            </div>
            {topics.length === 0 ? (
              <div style={{ fontSize: 12, color: '#9CA3AF', padding: '10px 0' }}>No topics added yet. Add chapters and topics that will be covered in this exam.</div>
            ) : (
              <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                {topics.map((t, i) => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                    background: i % 2 === 0 ? '#fff' : '#FAFAFA',
                    borderBottom: i < topics.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                    <button type="button" onClick={() => toggleTopic(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
                      color: t.covered ? '#16A34A' : '#D1D5DB' }}>
                      {t.covered ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                    </button>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLORS[t.priority], flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, color: t.covered ? '#9CA3AF' : 'var(--navy)', textDecoration: t.covered ? 'line-through' : 'none' }}>
                      {t.name}
                    </span>
                    <select value={t.priority} onChange={e => setPriority(t.id, e.target.value)}
                      style={{ fontSize: 11, border: '1px solid #E5E7EB', borderRadius: 5, padding: '2px 4px', color: PRIORITY_COLORS[t.priority], background: '#fff', cursor: 'pointer' }}>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                    <button type="button" onClick={() => removeTopic(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: '2px 4px' }}>
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Student assignment (create only) */}
          {!isEdit && (
            <div>
              <label style={lbl}>Assign To</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 10 }}>
                {[
                  { key: 'all', label: 'All Students' },
                  { key: 'batch', label: 'By Batch' },
                  { key: 'custom', label: 'Pick Students' },
                ].map(m => (
                  <button key={m.key} type="button" onClick={() => { setMode(m.key); setSelBatches([]); setSelIds([]); }} style={{
                    padding: '8px', borderRadius: 9, border: `2px solid ${mode === m.key ? 'var(--cyan)' : '#E5E7EB'}`,
                    background: mode === m.key ? 'rgba(31,184,214,0.06)' : '#FAFAFA',
                    cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    color: mode === m.key ? 'var(--cyan)' : 'var(--navy)',
                  }}>{m.label}</button>
                ))}
              </div>
              {mode === 'batch' && batches.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {batches.map(b => {
                    const active = selBatches.includes(b);
                    return (
                      <button key={b} type="button" onClick={() => setSelBatches(p => active ? p.filter(x => x !== b) : [...p, b])}
                        style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${active ? 'var(--cyan)' : '#E5E7EB'}`,
                          background: active ? 'rgba(31,184,214,0.1)' : '#fff', cursor: 'pointer',
                          fontSize: 12, fontWeight: 600, color: active ? 'var(--cyan)' : '#374151' }}>
                        {active && '✓ '}{b}
                      </button>
                    );
                  })}
                </div>
              )}
              {mode === 'custom' && (
                <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, maxHeight: 180, overflowY: 'auto' }}>
                  {students.map((s, i) => {
                    const checked = selIds.includes(s.id);
                    return (
                      <label key={s.id} onClick={() => setSelIds(p => checked ? p.filter(x => x !== s.id) : [...p, s.id])}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer',
                          background: checked ? 'rgba(31,184,214,0.05)' : i % 2 === 0 ? '#fff' : '#FAFAFA',
                          borderBottom: i < students.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                        <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${checked ? 'var(--cyan)' : '#D1D5DB'}`,
                          background: checked ? 'var(--cyan)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {checked && <span style={{ color: '#fff', fontSize: 10 }}>✓</span>}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--navy)' }}>{s.name}</span>
                        {s.batch && <span style={{ fontSize: 11, color: '#9CA3AF' }}>{s.batch}</span>}
                      </label>
                    );
                  })}
                </div>
              )}
              <div style={{ marginTop: 8, fontSize: 12,
                color: targetStudents.length > 0 ? '#16A34A' : '#D97706',
                background: targetStudents.length > 0 ? '#F0FDF4' : '#FFF7ED',
                border: `1px solid ${targetStudents.length > 0 ? '#BBF7D0' : '#FED7AA'}`,
                borderRadius: 7, padding: '7px 12px' }}>
                {targetStudents.length > 0 ? `✓ ${targetStudents.length} student${targetStudents.length !== 1 ? 's' : ''} will be tracked for this exam` : '⚠ No students selected'}
              </div>
            </div>
          )}
        </form>

        <div style={{ padding: '14px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={btnSecondary}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.5 : 1 }}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : `Create Exam${targetStudents.length > 0 ? ` (${targetStudents.length} students)` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// Exam Detail / Prep View
function ExamDetailView({ exam, subjects, onClose, onUpdate }) {
  const [activePanel, setActivePanel] = useState('topics'); // 'topics' | 'students' | 'results'
  const [topics, setTopics] = useState(Array.isArray(exam.topics) ? [...exam.topics] : []);
  const [newTopic, setNewTopic] = useState('');
  const [newTopicPriority, setNewTopicPriority] = useState('MEDIUM');
  const [saving, setSaving] = useState(false);
  const [prepSaving, setPrepSaving] = useState({});

  const days = daysUntil(exam.examDate);
  const urgency = urgencyStyle(days);
  const coveredTopics = topics.filter(t => t.covered).length;
  const topicPct = topics.length > 0 ? Math.round((coveredTopics / topics.length) * 100) : 0;
  const avgReadiness = exam.studentPreps?.length > 0
    ? Math.round(exam.studentPreps.reduce((a, p) => a + (p.readiness || 0), 0) / exam.studentPreps.length)
    : 0;

  const saveTopics = async (updatedTopics) => {
    setSaving(true);
    try {
      const updated = await updateExam(exam.id, { topics: updatedTopics });
      onUpdate(updated.data?.data || updated.data);
    } catch { toast.error('Failed to save topics'); }
    finally { setSaving(false); }
  };

  const toggleTopic = async (id) => {
    const updated = topics.map(t => t.id === id ? { ...t, covered: !t.covered, coveredAt: !t.covered ? new Date().toISOString() : null } : t);
    setTopics(updated);
    await saveTopics(updated);
  };

  const addTopic = async () => {
    const name = newTopic.trim();
    if (!name) return;
    const updated = [...topics, { id: Date.now().toString(), name, priority: newTopicPriority, covered: false }];
    setTopics(updated);
    setNewTopic('');
    await saveTopics(updated);
  };

  const removeTopic = async (id) => {
    const updated = topics.filter(t => t.id !== id);
    setTopics(updated);
    await saveTopics(updated);
  };

  const updatePrep = async (studentId, field, value) => {
    setPrepSaving(p => ({ ...p, [studentId]: true }));
    try {
      const existing = exam.studentPreps?.find(p => p.studentId === studentId) || {};
      const payload = {
        readiness: existing.readiness ?? 0,
        weakTopics: existing.weakTopics ?? [],
        notes: existing.notes ?? null,
        [field]: value,
      };
      const r = await upsertStudentPrep(exam.id, studentId, payload);
      onUpdate({ ...exam, studentPreps: exam.studentPreps?.map(p => p.studentId === studentId ? { ...p, ...r.data?.data } : p) });
    } catch { toast.error('Failed to save'); }
    finally { setPrepSaving(p => ({ ...p, [studentId]: false })); }
  };

  const sendWhatsAppReport = (prep) => {
    const phone = prep.student?.parentPhone || prep.student?.phone;
    if (!phone) return toast.error(`No phone number for ${prep.student?.name}`);
    const uncovered = topics.filter(t => !t.covered);
    const highPriority = uncovered.filter(t => t.priority === 'HIGH');
    const msg = [
      `📚 *Exam Preparation Report*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `Hi ${prep.student?.parentName || 'Parent'},`,
      ``,
      `This is a preparation report for *${prep.student?.name}*'s upcoming exam:`,
      ``,
      `📖 *${exam.subject} — ${EXAM_TYPE_LABELS[exam.examType] || exam.examType}*`,
      `📅 Date: ${fmtDate(exam.examDate)} ${days >= 0 ? `(${days === 0 ? 'Today!' : `${days} day${days !== 1 ? 's' : ''} remaining`})` : '(Past)'}`,
      exam.totalMarks ? `📊 Total Marks: ${exam.totalMarks}` : '',
      ``,
      `*Readiness Level: ${prep.readiness || 0}%*`,
      topicPct > 0 ? `✅ Topics Covered: ${coveredTopics}/${topics.length}` : '',
      uncovered.length > 0 ? `⚠️ Topics Remaining: ${uncovered.length}` : '✅ All topics covered!',
      highPriority.length > 0 ? `🔴 High Priority: ${highPriority.map(t => t.name).join(', ')}` : '',
      prep.weakTopics?.length > 0 ? `📝 Weak Areas: ${prep.weakTopics.join(', ')}` : '',
      prep.notes ? `\n💬 Teacher's Note: ${prep.notes}` : '',
      ``,
      `Please ensure *${prep.student?.name}* revises the pending topics daily.`,
      ``,
      `Thank you,`,
      `${exam.classGroup ? `${exam.classGroup} — ` : ''}Syllabrix ERP`,
    ].filter(Boolean).join('\n');

    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const sendAllReports = () => {
    const preps = exam.studentPreps || [];
    if (!preps.length) return toast('No students assigned to this exam');
    let i = 0;
    const fire = () => {
      if (i >= preps.length) { toast.success(`Sent to ${preps.length} parent${preps.length !== 1 ? 's' : ''}`); return; }
      sendWhatsAppReport(preps[i++]);
      setTimeout(fire, 900);
    };
    fire();
  };

  // Group topics by priority
  const topicsByPriority = {
    HIGH: topics.filter(t => t.priority === 'HIGH'),
    MEDIUM: topics.filter(t => t.priority === 'MEDIUM'),
    LOW: topics.filter(t => t.priority === 'LOW'),
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 18, width: 700, maxWidth: '100%', maxHeight: '95vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F3F4F6', background: 'var(--navy)', color: '#fff', borderRadius: '18px 18px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ background: 'rgba(255,255,255,0.15)', fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '2px 8px' }}>
                  {EXAM_TYPE_LABELS[exam.examType] || exam.examType}
                </span>
                <span style={{ background: urgency.bg, color: urgency.text, fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '2px 8px' }}>
                  {urgency.label}
                </span>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800 }}>{exam.title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
                {exam.subject} · {fmtDate(exam.examDate)}{exam.classGroup ? ` · ${exam.classGroup}` : ''}
                {exam.totalMarks ? ` · ${exam.totalMarks} marks` : ''}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: '#fff' }}>
              <X size={16} />
            </button>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 20, marginTop: 14 }}>
            {[
              { label: 'Topics Covered', value: `${coveredTopics}/${topics.length}`, sub: `${topicPct}%`, color: topicPct >= 80 ? '#4ADE80' : topicPct >= 50 ? '#FCD34D' : '#F87171' },
              { label: 'Avg. Readiness', value: `${avgReadiness}%`, sub: `${exam.studentPreps?.length || 0} students`, color: READINESS_COLOR(avgReadiness).replace('#', '') === READINESS_COLOR(avgReadiness) ? READINESS_COLOR(avgReadiness) : READINESS_COLOR(avgReadiness) },
              { label: 'High Priority', value: topicsByPriority.HIGH.length, sub: 'topics remaining', color: topicsByPriority.HIGH.filter(t => !t.covered).length > 0 ? '#F87171' : '#4ADE80' },
            ].map(({ label, value, sub, color }) => (
              <div key={label}>
                <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{label} · {sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #F3F4F6', padding: '0 24px' }}>
          {[
            { key: 'topics', label: 'Topic Tracker', icon: ListChecks },
            { key: 'students', label: `Students (${exam.studentPreps?.length || 0})`, icon: Users },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActivePanel(key)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
              color: activePanel === key ? 'var(--cyan)' : '#9CA3AF',
              borderBottom: `2px solid ${activePanel === key ? 'var(--cyan)' : 'transparent'}`,
              marginBottom: -1,
            }}>
              <Icon size={14} />{label}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
            <button onClick={sendAllReports} style={{ ...btnPrimary, fontSize: 12, padding: '6px 12px', background: '#25D366' }}>
              <Send size={13} /> Send Report to All Parents
            </button>
          </div>
        </div>

        {/* Panel content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* Topics Panel */}
          {activePanel === 'topics' && (
            <div>
              {/* Add topic */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                <input value={newTopic} onChange={e => setNewTopic(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTopic(); } }}
                  style={{ ...inp, flex: 1 }} placeholder="Add a topic / chapter to cover…" />
                <select value={newTopicPriority} onChange={e => setNewTopicPriority(e.target.value)}
                  style={{ ...inp, width: 100, flexShrink: 0 }}>
                  <option value="HIGH">🔴 High</option>
                  <option value="MEDIUM">🟡 Medium</option>
                  <option value="LOW">🟢 Low</option>
                </select>
                <button type="button" onClick={addTopic} disabled={saving} style={{ ...btnPrimary, padding: '8px 14px', flexShrink: 0, opacity: saving ? 0.6 : 1 }}>
                  {saving ? '…' : <Plus size={14} />}
                </button>
              </div>

              {topics.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>
                  <ListChecks size={36} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.3 }} />
                  <p style={{ fontSize: 14, margin: 0 }}>No topics added yet</p>
                  <p style={{ fontSize: 12, margin: '4px 0 0' }}>Add chapters and concepts to track coverage before the exam</p>
                </div>
              ) : (
                <>
                  {/* Progress summary */}
                  <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: '#6B7280', fontWeight: 500 }}>Coverage Progress</span>
                        <span style={{ fontWeight: 700, color: topicPct >= 80 ? '#16A34A' : topicPct >= 50 ? '#D97706' : '#EF4444' }}>{topicPct}%</span>
                      </div>
                      <div style={{ height: 8, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 4, transition: 'width 0.4s',
                          background: topicPct >= 80 ? '#16A34A' : topicPct >= 50 ? '#F59E0B' : '#EF4444',
                          width: `${topicPct}%` }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: topicPct >= 80 ? '#16A34A' : topicPct >= 50 ? '#D97706' : '#EF4444' }}>
                        {coveredTopics}/{topics.length}
                      </div>
                      <div style={{ fontSize: 10, color: '#9CA3AF' }}>done</div>
                    </div>
                  </div>

                  {/* Topics by priority group */}
                  {['HIGH', 'MEDIUM', 'LOW'].map(pri => {
                    const group = topicsByPriority[pri];
                    if (!group.length) return null;
                    const donePri = group.filter(t => t.covered).length;
                    return (
                      <div key={pri} style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLORS[pri] }} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {pri === 'HIGH' ? 'High Priority' : pri === 'MEDIUM' ? 'Medium Priority' : 'Low Priority'}
                          </span>
                          <span style={{ fontSize: 11, color: '#9CA3AF' }}>{donePri}/{group.length} done</span>
                        </div>
                        {group.map((t, i) => (
                          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                            background: t.covered ? '#F0FDF4' : '#fff',
                            border: `1px solid ${t.covered ? '#BBF7D0' : '#E5E7EB'}`,
                            borderRadius: 9, marginBottom: 6, transition: 'all 0.15s' }}>
                            <button onClick={() => toggleTopic(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
                              color: t.covered ? '#16A34A' : '#D1D5DB' }}>
                              {t.covered ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                            </button>
                            <span style={{ flex: 1, fontSize: 13, fontWeight: 500,
                              color: t.covered ? '#6B7280' : 'var(--navy)',
                              textDecoration: t.covered ? 'line-through' : 'none' }}>
                              {t.name}
                            </span>
                            {t.covered && t.coveredAt && (
                              <span style={{ fontSize: 10, color: '#9CA3AF' }}>
                                ✓ {new Date(t.coveredAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                              </span>
                            )}
                            <button onClick={() => removeTopic(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: '2px 4px' }}>
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {/* Students Readiness Panel */}
          {activePanel === 'students' && (
            <div>
              {!exam.studentPreps?.length ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>
                  <Users size={36} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.3 }} />
                  <p style={{ fontSize: 14, margin: 0 }}>No students assigned to this exam</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {exam.studentPreps.map(prep => {
                    const sid = prep.studentId;
                    const isSaving = prepSaving[sid];
                    const r = prep.readiness || 0;
                    return (
                      <div key={sid} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                          {/* Avatar */}
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                            {prep.student?.name?.[0]?.toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>{prep.student?.name}</div>
                            {prep.student?.batch && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{prep.student.batch}</div>}
                          </div>
                          {/* Readiness badge */}
                          <div style={{ background: `${READINESS_COLOR(r)}15`, border: `1.5px solid ${READINESS_COLOR(r)}40`, borderRadius: 10, padding: '4px 10px', textAlign: 'center' }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: READINESS_COLOR(r), lineHeight: 1 }}>{r}%</div>
                            <div style={{ fontSize: 9, color: '#9CA3AF' }}>Ready</div>
                          </div>
                          {/* WhatsApp */}
                          <button onClick={() => sendWhatsAppReport(prep)}
                            title="Send report to parent"
                            style={{ background: '#25D36615', border: '1px solid #25D36640', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#25D366' }}>
                            <Send size={13} />
                          </button>
                        </div>

                        {/* Readiness slider */}
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6B7280', marginBottom: 4 }}>
                            <span>Readiness Level</span>
                            <span style={{ fontWeight: 600, color: READINESS_COLOR(r) }}>{r}% — {r >= 80 ? 'Well Prepared' : r >= 60 ? 'Getting There' : r >= 40 ? 'Needs Work' : 'Needs Attention'}</span>
                          </div>
                          <input type="range" min="0" max="100" step="5" value={r}
                            onChange={e => {
                              const val = Number(e.target.value);
                              onUpdate({ ...exam, studentPreps: exam.studentPreps.map(p => p.studentId === sid ? { ...p, readiness: val } : p) });
                            }}
                            onMouseUp={e => updatePrep(sid, 'readiness', Number(e.target.value))}
                            onTouchEnd={e => updatePrep(sid, 'readiness', r)}
                            style={{ width: '100%', accentColor: READINESS_COLOR(r) }}
                          />
                        </div>

                        {/* Weak topics (comma-separated tags) */}
                        <div style={{ marginBottom: 10 }}>
                          <label style={{ ...lbl, marginBottom: 4 }}>Weak Topics / Areas</label>
                          <input
                            defaultValue={(prep.weakTopics || []).join(', ')}
                            onBlur={e => {
                              const val = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                              updatePrep(sid, 'weakTopics', val);
                            }}
                            style={{ ...inp, fontSize: 12 }}
                            placeholder="e.g. Trigonometry, Quadratic Equations (comma separated)"
                          />
                        </div>

                        {/* Teacher notes */}
                        <div>
                          <label style={{ ...lbl, marginBottom: 4 }}>Teacher Notes</label>
                          <textarea
                            defaultValue={prep.notes || ''}
                            onBlur={e => updatePrep(sid, 'notes', e.target.value || null)}
                            style={{ ...inp, fontSize: 12, minHeight: 56, resize: 'vertical', lineHeight: 1.5 }}
                            placeholder="e.g. Struggling with geometry proofs, needs extra practice on fractions…"
                          />
                        </div>

                        {isSaving && <div style={{ fontSize: 11, color: 'var(--cyan)', marginTop: 6 }}>Saving…</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Exam Card (list view)
function ExamCard({ exam, onDelete, onOpen }) {
  const days = daysUntil(exam.examDate);
  const urgency = urgencyStyle(days);
  const topics = Array.isArray(exam.topics) ? exam.topics : [];
  const coveredTopics = topics.filter(t => t.covered).length;
  const topicPct = topics.length > 0 ? Math.round((coveredTopics / topics.length) * 100) : null;
  const avgReadiness = exam.studentPreps?.length > 0
    ? Math.round(exam.studentPreps.reduce((a, p) => a + (p.readiness || 0), 0) / exam.studentPreps.length)
    : null;
  const unreadyCount = exam.studentPreps?.filter(p => (p.readiness || 0) < 50).length || 0;

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
      onClick={() => onOpen(exam)}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.09)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>

      {/* Urgency bar */}
      <div style={{ height: 4, background: urgency.text, opacity: 0.8 }} />

      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{ background: 'var(--navy)', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 5, padding: '2px 7px' }}>
                {exam.subject}
              </span>
              <span style={{ background: '#F3F4F6', color: '#6B7280', fontSize: 10, borderRadius: 5, padding: '2px 7px' }}>
                {EXAM_TYPE_LABELS[exam.examType] || exam.examType}
              </span>
              {exam.classGroup && (
                <span style={{ background: '#F3F4F6', color: '#6B7280', fontSize: 10, borderRadius: 5, padding: '2px 7px' }}>
                  {exam.classGroup}
                </span>
              )}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {exam.title}
            </div>
            <div style={{ fontSize: 12, color: '#9CA3AF' }}>
              {fmtDate(exam.examDate)}
            </div>
          </div>

          {/* Urgency badge */}
          <div style={{ background: urgency.bg, border: `1px solid ${urgency.border}`, borderRadius: 8, padding: '5px 10px', textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: urgency.text, lineHeight: 1 }}>
              {days < 0 ? 'Past' : days === 0 ? 'Today' : days}
            </div>
            {days > 0 && <div style={{ fontSize: 9, color: urgency.text, opacity: 0.7 }}>days left</div>}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Topic coverage */}
          {topics.length > 0 ? (
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                <span style={{ color: '#9CA3AF' }}>Topics</span>
                <span style={{ fontWeight: 600, color: topicPct >= 80 ? '#16A34A' : topicPct >= 50 ? '#D97706' : '#EF4444' }}>
                  {coveredTopics}/{topics.length}
                </span>
              </div>
              <div style={{ height: 5, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: topicPct >= 80 ? '#16A34A' : topicPct >= 50 ? '#F59E0B' : '#EF4444',
                  borderRadius: 4, width: `${topicPct || 0}%`, transition: 'width 0.3s' }} />
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, fontSize: 11, color: '#D1D5DB' }}>No topics added</div>
          )}

          {/* Student readiness */}
          {avgReadiness !== null && (
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: READINESS_COLOR(avgReadiness), lineHeight: 1 }}>{avgReadiness}%</div>
              <div style={{ fontSize: 9, color: '#9CA3AF' }}>avg ready</div>
            </div>
          )}

          {/* Needs attention */}
          {unreadyCount > 0 && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 7, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <AlertTriangle size={11} color="#DC2626" />
              <span style={{ fontSize: 11, color: '#DC2626', fontWeight: 600 }}>{unreadyCount} need help</span>
            </div>
          )}

          <button onClick={e => { e.stopPropagation(); onDelete(exam.id); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: '4px 6px', flexShrink: 0 }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Full Exam Prep Tab
function ExamPrepTab({ subjects, batches, students }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [activeExam, setActiveExam] = useState(null);
  const [filter, setFilter] = useState('upcoming'); // 'upcoming' | 'past' | 'all'

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getExams();
      setExams(r.data?.data || []);
    } catch { toast.error('Failed to load exams'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data) => {
    try {
      const r = await createExam(data);
      const exam = r.data?.data;
      if (exam) setExams(p => [...p, exam].sort((a, b) => new Date(a.examDate) - new Date(b.examDate)));
      toast.success('Exam created!');
    } catch { toast.error('Failed to create exam'); throw new Error(); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this exam and all student prep data?')) return;
    try {
      await deleteExam(id);
      setExams(p => p.filter(e => e.id !== id));
      if (activeExam?.id === id) setActiveExam(null);
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleUpdate = (updated) => {
    if (!updated) return;
    setExams(p => p.map(e => e.id === updated.id ? updated : e));
    if (activeExam?.id === updated.id) setActiveExam(updated);
  };

  const today = new Date().toDateString();
  const filtered = exams.filter(e => {
    const isPast = new Date(e.examDate) < new Date(today);
    if (filter === 'upcoming') return !isPast;
    if (filter === 'past') return isPast;
    return true;
  });

  const upcomingCount = exams.filter(e => new Date(e.examDate) >= new Date(today)).length;
  const pastCount = exams.length - upcomingCount;

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 8, padding: 3, gap: 2 }}>
          {[
            { key: 'upcoming', label: `Upcoming (${upcomingCount})` },
            { key: 'past', label: `Past (${pastCount})` },
            { key: 'all', label: 'All' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600,
              background: filter === f.key ? '#fff' : 'transparent',
              color: filter === f.key ? 'var(--navy)' : '#9CA3AF',
              boxShadow: filter === f.key ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
            }}>{f.label}</button>
          ))}
        </div>
        <button onClick={() => setShowCreate(true)} style={{ ...btnPrimary, marginLeft: 'auto' }}>
          <Plus size={15} /> Schedule Exam
        </button>
      </div>

      {/* Summary cards */}
      {exams.length > 0 && (() => {
        const withTopics = exams.filter(e => Array.isArray(e.topics) && e.topics.length > 0);
        const avgTopicPct = withTopics.length > 0
          ? Math.round(withTopics.reduce((a, e) => {
              const c = e.topics.filter(t => t.covered).length;
              return a + (e.topics.length > 0 ? (c / e.topics.length) * 100 : 0);
            }, 0) / withTopics.length)
          : null;
        const allPreps = exams.flatMap(e => e.studentPreps || []);
        const avgR = allPreps.length > 0 ? Math.round(allPreps.reduce((a, p) => a + (p.readiness || 0), 0) / allPreps.length) : null;
        const needsAttention = allPreps.filter(p => (p.readiness || 0) < 50).length;

        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Upcoming Exams', value: upcomingCount, color: 'var(--cyan)', icon: GraduationCap },
              { label: 'Avg. Topic Coverage', value: avgTopicPct !== null ? `${avgTopicPct}%` : '—', color: avgTopicPct >= 70 ? '#16A34A' : '#D97706', icon: ListChecks },
              { label: 'Need Attention', value: needsAttention, color: needsAttention > 0 ? '#EF4444' : '#16A34A', icon: AlertTriangle },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} style={{ background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB', padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 36, height: 36, background: `${color}15`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color={color} />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)' }}>{value}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Exam list */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 48 }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB' }}>
          <GraduationCap size={40} color="#E5E7EB" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            {filter === 'past' ? 'No past exams' : 'No exams scheduled'}
          </div>
          <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>
            {filter !== 'past' && 'Schedule an exam to start tracking topics and student readiness.'}
          </div>
          {filter !== 'past' && (
            <button onClick={() => setShowCreate(true)} style={btnPrimary}>
              <Plus size={14} /> Schedule First Exam
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(exam => (
            <ExamCard key={exam.id} exam={exam} onDelete={handleDelete} onOpen={setActiveExam} />
          ))}
        </div>
      )}

      {showCreate && (
        <ExamModal
          subjects={subjects}
          batches={batches}
          students={students}
          onClose={() => setShowCreate(false)}
          onSave={handleCreate}
        />
      )}

      {activeExam && (
        <ExamDetailView
          exam={activeExam}
          subjects={subjects}
          onClose={() => setActiveExam(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };
const inp = {
  width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #E5E7EB',
  fontSize: 14, color: '#111827', background: '#fff', boxSizing: 'border-box', outline: 'none',
};
const btnPrimary = {
  background: 'var(--cyan)', color: '#fff', border: 'none', borderRadius: 8,
  padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
};
const btnSecondary = {
  background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 8,
  padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
};
const btnOutline = {
  background: 'none', border: '1px solid #E5E7EB', borderRadius: 7,
  padding: '5px 12px', fontSize: 13, cursor: 'pointer', color: '#6B7280',
  display: 'flex', alignItems: 'center', gap: 4,
};

// ── Main Progress Hub ─────────────────────────────────────────────────────────
export default function Progress() {
  const { tenant } = useAuth();
  const { isMobile } = useBreakpoint();
  const [tab, setTab] = useState('homework');

  // Shared state
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const subjects = tenant?.receiptConfig?.subjects || [];

  // Homework tab state
  const [homework, setHomework] = useState([]);
  const [hwLoading, setHwLoading] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [hwView, setHwView] = useState('board'); // 'board' | 'tracker'
  const [hwFilter, setHwFilter] = useState({ from: TODAY, to: '' });
  const [trackerFilter, setTrackerFilter] = useState({ from: '', to: '' });
  const [trackerHw, setTrackerHw] = useState([]);
  const [trackerLoading, setTrackerLoading] = useState(false);

  // Student progress tab state
  const [progressData, setProgressData] = useState([]);
  const [progLoading, setProgLoading] = useState(false);
  const [progSearch, setProgSearch] = useState('');

  useEffect(() => {
    // Load students once for assignment modal + batches
    getStudents({ limit: 500 }).then(r => {
      const list = r.data?.data || r.data || [];
      setStudents(list);
      const uniqueBatches = [...new Set(list.map(s => s.batch).filter(Boolean))].sort();
      setBatches(uniqueBatches);
    }).catch(() => {});
  }, []);

  const loadHomework = useCallback(async () => {
    setHwLoading(true);
    try {
      const params = {};
      if (hwFilter.from) params.from = hwFilter.from;
      if (hwFilter.to) params.to = hwFilter.to;
      const r = await getHomework(params);
      setHomework(r.data?.data || []);
    } catch { toast.error('Failed to load homework'); }
    finally { setHwLoading(false); }
  }, [hwFilter]);

  const loadTracker = useCallback(async () => {
    setTrackerLoading(true);
    try {
      const params = {};
      if (trackerFilter.from) params.from = trackerFilter.from;
      if (trackerFilter.to)   params.to   = trackerFilter.to;
      const r = await getHomework(params);
      setTrackerHw(r.data?.data || []);
    } catch { toast.error('Failed to load tracker'); }
    finally { setTrackerLoading(false); }
  }, [trackerFilter]);

  const loadProgress = useCallback(async () => {
    setProgLoading(true);
    try {
      const r = await getStudentProgress();
      setProgressData(r.data?.data || []);
    } catch { toast.error('Failed to load progress'); }
    finally { setProgLoading(false); }
  }, []);

  useEffect(() => { if (tab === 'homework' && hwView === 'board')   loadHomework(); }, [tab, hwView, loadHomework]);
  useEffect(() => { if (tab === 'homework' && hwView === 'tracker') loadTracker();  }, [tab, hwView, loadTracker]);
  useEffect(() => { if (tab === 'progress') loadProgress(); }, [tab, loadProgress]);

  const handleAssign = async (data) => {
    try {
      const r = await createHomework(data);
      toast.success('Homework assigned!');
      setHomework(p => {
        const hw = r.data?.data;
        if (!hw) return p;
        const existing = p.findIndex(h => h.id === hw.id);
        if (existing >= 0) return p;
        return [...p, hw].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      });
      loadHomework();
    } catch { toast.error('Failed to assign homework'); throw new Error(); }
  };

  const handleDeleteHw = async (id) => {
    if (!window.confirm('Delete this homework?')) return;
    try {
      await deleteHomework(id);
      setHomework(p => p.filter(h => h.id !== id));
      setTrackerHw(p => p.filter(h => h.id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleToggleSubmission = async (hwId, studentId, newStatus) => {
    const updateList = list => list.map(hw => {
      if (hw.id !== hwId) return hw;
      return {
        ...hw,
        submissions: hw.submissions.map(s =>
          (s.studentId === studentId || s.student?.id === studentId)
            ? { ...s, status: newStatus } : s
        ),
      };
    });
    try {
      await bulkUpdateSubmissions(hwId, [{ studentId, status: newStatus }]);
      setHomework(updateList);
      setTrackerHw(updateList);
    } catch { toast.error('Failed to update'); }
  };

  const filteredProgress = progressData.filter(s =>
    !progSearch || s.name?.toLowerCase().includes(progSearch.toLowerCase()) || s.batch?.toLowerCase().includes(progSearch.toLowerCase())
  );

  const TABS = [
    { key: 'homework', label: 'Homework Board', icon: ClipboardList },
    { key: 'progress', label: 'Student Progress', icon: TrendingUp },
    { key: 'exams',    label: 'Exam Prep',       icon: GraduationCap },
    { key: 'log',      label: 'Teaching Log',    icon: BookOpen },
  ];

  return (
    <div style={{ padding: isMobile ? '16px' : '28px 32px', maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 20 : 26, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
          Progress Hub
        </h1>
        <p style={{ fontSize: 13, color: '#9CA3AF', margin: '4px 0 0' }}>
          Track homework, student progress and daily teaching activity
        </p>
      </div>

      {/* Tabs */}
      <div className="tabs-row" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', borderRadius: 10, padding: 4, width: 'fit-content', minWidth: 'max-content' }}>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: isMobile ? '7px 12px' : '8px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontSize: isMobile ? 12 : 13, fontWeight: 600, transition: 'all 0.15s', whiteSpace: 'nowrap',
              background: tab === key ? '#fff' : 'transparent',
              color: tab === key ? 'var(--navy)' : '#9CA3AF',
              boxShadow: tab === key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}>
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Homework Board ── */}
      {tab === 'homework' && (
        <div>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>

            {/* Board / Tracker toggle */}
            <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 8, padding: 3, gap: 2 }}>
              {[{ key: 'board', label: 'Board', icon: ClipboardList }, { key: 'tracker', label: 'Tracker', icon: CalendarDays }].map(v => (
                <button key={v.key} onClick={() => setHwView(v.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600,
                  background: hwView === v.key ? '#fff' : 'transparent',
                  color: hwView === v.key ? 'var(--navy)' : '#9CA3AF',
                  boxShadow: hwView === v.key ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                }}>
                  <v.icon size={13} /> {v.label}
                </button>
              ))}
            </div>

            <button onClick={() => setShowAssign(true)} style={{ ...btnPrimary, marginLeft: 'auto' }}>
              <Plus size={15} /> {isMobile ? 'Assign' : 'Assign Homework'}
            </button>

            {/* Date filter — different for each view */}
            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
                <CalendarDays size={13} color="#9CA3AF" />
                {hwView === 'board' ? (
                  <>
                    <label style={{ fontSize: 12, color: '#6B7280' }}>From</label>
                    <input type="date" value={hwFilter.from} onChange={e => setHwFilter(p => ({ ...p, from: e.target.value }))}
                      style={{ ...inp, width: 140 }} />
                    <label style={{ fontSize: 12, color: '#6B7280' }}>To</label>
                    <input type="date" value={hwFilter.to} onChange={e => setHwFilter(p => ({ ...p, to: e.target.value }))}
                      style={{ ...inp, width: 140 }} />
                  </>
                ) : (
                  <>
                    <label style={{ fontSize: 12, color: '#6B7280' }}>From</label>
                    <input type="date" value={trackerFilter.from} onChange={e => setTrackerFilter(p => ({ ...p, from: e.target.value }))}
                      style={{ ...inp, width: 140 }} />
                    <label style={{ fontSize: 12, color: '#6B7280' }}>To</label>
                    <input type="date" value={trackerFilter.to} onChange={e => setTrackerFilter(p => ({ ...p, to: e.target.value }))}
                      style={{ ...inp, width: 140 }} />
                  </>
                )}
              </div>
            )}
            {isMobile && (
              <div style={{ display: 'flex', gap: 6, width: '100%' }}>
                <input type="date" value={hwView === 'board' ? hwFilter.from : trackerFilter.from}
                  onChange={e => hwView === 'board' ? setHwFilter(p => ({ ...p, from: e.target.value })) : setTrackerFilter(p => ({ ...p, from: e.target.value }))}
                  style={{ ...inp, flex: 1, fontSize: 12 }} />
                <input type="date" value={hwView === 'board' ? hwFilter.to : trackerFilter.to}
                  onChange={e => hwView === 'board' ? setHwFilter(p => ({ ...p, to: e.target.value })) : setTrackerFilter(p => ({ ...p, to: e.target.value }))}
                  style={{ ...inp, flex: 1, fontSize: 12 }} />
              </div>
            )}
          </div>

          {/* Board view */}
          {hwView === 'board' && (
            hwLoading ? (
              <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 48 }}>Loading…</div>
            ) : homework.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB' }}>
                <ClipboardList size={40} color="#E5E7EB" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 6 }}>No homework for this period</div>
                <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>Assign homework to start tracking student completion.</div>
                <button onClick={() => setShowAssign(true)} style={btnPrimary}>
                  <Plus size={14} /> Assign First Homework
                </button>
              </div>
            ) : (
              homework.map(hw => (
                <HomeworkCard key={hw.id} hw={hw} onDelete={handleDeleteHw} onToggle={handleToggleSubmission} />
              ))
            )
          )}

          {/* Tracker view */}
          {hwView === 'tracker' && (
            trackerLoading ? (
              <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 48 }}>Loading…</div>
            ) : trackerHw.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB' }}>
                <CalendarDays size={40} color="#E5E7EB" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 6 }}>No homework history yet</div>
                <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>Homework you assign will appear here grouped by date.</div>
                <button onClick={() => setShowAssign(true)} style={btnPrimary}>
                  <Plus size={14} /> Assign First Homework
                </button>
              </div>
            ) : (
              <HomeworkTrackerView
                homework={trackerHw}
                subjects={subjects}
                onDelete={handleDeleteHw}
                onToggle={handleToggleSubmission}
              />
            )
          )}
        </div>
      )}

      {/* ── Student Progress ── */}
      {tab === 'progress' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
            <input
              value={progSearch} onChange={e => setProgSearch(e.target.value)}
              placeholder="Search student or batch…"
              style={{ ...inp, width: 280 }}
            />
            <span style={{ fontSize: 13, color: '#9CA3AF', marginLeft: 'auto' }}>
              {filteredProgress.length} student{filteredProgress.length !== 1 ? 's' : ''}
            </span>
          </div>

          {progLoading ? (
            <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 48 }}>Loading…</div>
          ) : filteredProgress.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB' }}>
              <Users size={40} color="#E5E7EB" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>No active students found</div>
              <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 6 }}>Add students in the Fees section to start tracking progress.</div>
            </div>
          ) : (
            <>
              {/* Summary stats */}
              {progressData.length > 0 && (() => {
                const withData = progressData.filter(s => s.completionPct !== null);
                const avgCompletion = withData.length
                  ? Math.round(withData.reduce((a, s) => a + s.completionPct, 0) / withData.length)
                  : null;
                const topStreakers = progressData.filter(s => s.streak >= 3).length;
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
                    {[
                      { label: 'Active Students', value: progressData.length, color: 'var(--cyan)', icon: Users },
                      { label: 'Avg. Completion', value: avgCompletion !== null ? `${avgCompletion}%` : '—', color: avgCompletion >= 70 ? '#16A34A' : '#D97706', icon: BarChart2 },
                      { label: '3+ Day Streaks', value: topStreakers, color: '#EA580C', icon: Flame },
                    ].map(({ label, value, color, icon: Icon }) => (
                      <div key={label} style={{ background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB', padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 36, height: 36, background: `${color}15`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={18} color={color} />
                        </div>
                        <div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)' }}>{value}</div>
                          <div style={{ fontSize: 12, color: '#9CA3AF' }}>{label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                {filteredProgress.map(s => <ProgressCard key={s.id} s={s} />)}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Exam Prep ── */}
      {tab === 'exams' && <ExamPrepTab subjects={subjects} batches={batches} students={students} />}

      {/* ── Teaching Log ── */}
      {tab === 'log' && <TeachingLogTab subjects={subjects} batches={batches} />}

      {/* Assign Modal */}
      {showAssign && (
        <AssignModal
          subjects={subjects}
          batches={batches}
          students={students}
          onClose={() => setShowAssign(false)}
          onSave={handleAssign}
        />
      )}
    </div>
  );
}
