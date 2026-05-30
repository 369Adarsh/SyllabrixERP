import { useState, useEffect, useCallback } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useAuth } from '../../context/AuthContext';
import { P } from '../../styles/page';
import toast from 'react-hot-toast';
import {
  Plus, X, ChevronDown, ChevronUp, Dumbbell, Users, BarChart3,
  BookOpen, Edit2, Trash2, Check, Clock, Target, Zap, Shield,
  ChevronRight, Search, RefreshCw, Activity, Star, Calendar,
  AlertTriangle, Flame, TrendingUp, User, LayoutGrid,
} from 'lucide-react';
import {
  getTrainingStats, getTrainingActivity,
  getExercises, seedExercises, createExercise, updateExercise, deleteExercise,
  getTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate,
  addTemplateDay, updateTemplateDay, deleteTemplateDay,
  addExerciseToDay, updateDayExercise, removeDayExercise,
  getMemberPlans, assignMemberPlan, updateMemberPlan, deleteMemberPlan,
  getCustomers, getStaff,
  getTrainerBoard, getTrainerPerformance,
} from '../../api';
import MemberExerciseCard from './MemberExerciseCard';

// ── Constants ─────────────────────────────────────────────────────────────────

const GOALS   = ['Fat Loss', 'Muscle Gain', 'Endurance', 'Flexibility', 'General Fitness', 'Strength', 'Rehabilitation'];
const LEVELS  = ['Beginner', 'Intermediate', 'Advanced'];
const CATS    = ['Strength', 'Cardio', 'HIIT', 'Core', 'Flexibility'];
const MUSCLES = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body'];
const EQUIP   = ['Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight', 'Bands', 'Kettlebell'];

const GOAL_COLORS = {
  'Fat Loss':       { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' },
  'Muscle Gain':    { bg: '#EDE9FE', color: '#7C3AED', border: '#DDD6FE' },
  'Endurance':      { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
  'Flexibility':    { bg: '#FDF2F8', color: '#9D174D', border: '#FBCFE8' },
  'General Fitness':{ bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  'Strength':       { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
  'Rehabilitation': { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
};
const LEVEL_COLORS = {
  Beginner:     { bg: '#ECFDF5', color: '#059669' },
  Intermediate: { bg: '#FEF3C7', color: '#D97706' },
  Advanced:     { bg: '#FEF2F2', color: '#DC2626' },
};
const STATUS_COLORS = {
  ACTIVE:    { bg: '#ECFDF5', color: '#059669', label: 'Active' },
  PAUSED:    { bg: '#FEF3C7', color: '#D97706', label: 'Paused' },
  COMPLETED: { bg: '#EFF6FF', color: '#1D4ED8', label: 'Completed' },
};

const CAT_ICONS = { Strength:'💪', Cardio:'🏃', HIIT:'⚡', Core:'🎯', Flexibility:'🧘' };
const MUSCLE_ICONS = { Chest:'🫁', Back:'🦴', Legs:'🦵', Shoulders:'💪', Arms:'💪', Core:'🎯', 'Full Body':'🏋️' };

// ── Helpers ───────────────────────────────────────────────────────────────────

const Pill = ({ label, bg, color, border }) => (
  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 20,
    background: bg, color, border: `1px solid ${border || bg}` }}>{label}</span>
);

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: '1px solid #E5E7EB',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 14 }}>
    <div style={{ width: 46, height: 46, borderRadius: 13, background: color + '18', display: 'flex',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={20} color={color} />
    </div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--navy)', lineHeight: 1,
        fontFamily: 'var(--font-mono)' }}>{value}</div>
      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2, fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>{sub}</div>}
    </div>
  </div>
);

// ── Exercise Library Modal ────────────────────────────────────────────────────

function ExerciseLibraryModal({ exercises, onClose, onRefresh }) {
  const [form, setForm]   = useState({ name: '', category: 'Strength', muscleGroup: 'Chest', equipment: 'Barbell', description: '' });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('ALL');

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleCreate = async () => {
    if (!form.name.trim()) return toast.error('Exercise name is required');
    setSaving(true);
    try {
      await createExercise(form);
      toast.success('Exercise added');
      setForm({ name: '', category: 'Strength', muscleGroup: 'Chest', equipment: 'Barbell', description: '' });
      onRefresh();
    } catch { toast.error('Failed to add exercise'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await deleteExercise(id); toast.success('Deleted'); onRefresh(); }
    catch { toast.error('Cannot delete — exercise may be in use'); }
  };

  const filtered = exercises.filter(e => {
    const q = search.toLowerCase();
    return (filterCat === 'ALL' || e.category === filterCat) &&
      (!q || e.name.toLowerCase().includes(q) || e.muscleGroup.toLowerCase().includes(q));
  });

  const grouped = CATS.reduce((acc, cat) => {
    const items = filtered.filter(e => e.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 500,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 820,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--navy)' }}>Exercise Library</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{exercises.length} exercises · Click + to add your own</div>
          </div>
          <button onClick={onClose} style={{ background: '#F3F4F6', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer' }}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Add form — left */}
          <div style={{ width: 260, flexShrink: 0, borderRight: '1px solid #F3F4F6', padding: 20, overflowY: 'auto', background: '#FAFAFA' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 14 }}>Add Exercise</div>
            {[
              { label: 'Name', key: 'name', type: 'text', placeholder: 'e.g. Incline Press' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{f.label}</div>
                <input value={form[f.key]} onChange={set(f.key)} placeholder={f.placeholder}
                  style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
              </div>
            ))}
            {[
              { label: 'Category',     key: 'category',    opts: CATS },
              { label: 'Muscle Group', key: 'muscleGroup', opts: MUSCLES },
              { label: 'Equipment',    key: 'equipment',   opts: EQUIP },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{f.label}</div>
                <select value={form[f.key]} onChange={set(f.key)}
                  style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }}>
                  {f.opts.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <button onClick={handleCreate} disabled={saving}
              style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: 'var(--navy)',
                color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginTop: 4 }}>
              {saving ? 'Adding…' : '+ Add Exercise'}
            </button>
          </div>

          {/* List — right */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                style={{ flex: 1, minWidth: 140, padding: '7px 12px', border: '1.5px solid #E5E7EB', borderRadius: 9, fontSize: 13, outline: 'none' }} />
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                style={{ padding: '7px 12px', border: '1.5px solid #E5E7EB', borderRadius: 9, fontSize: 12, outline: 'none', background: '#fff' }}>
                <option value="ALL">All Categories</option>
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase',
                  letterSpacing: '0.07em', marginBottom: 8 }}>{cat} ({items.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {items.map(ex => (
                    <div key={ex.id} style={{ padding: '10px 12px', borderRadius: 10, background: '#F9FAFB', border: '1px solid #F3F4F6' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* Muscle group color dot */}
                        <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                          background: { Chest:'#FCA5A5', Back:'#93C5FD', Legs:'#6EE7B7', Shoulders:'#C4B5FD', Arms:'#FCD34D', Core:'#FDA4AF', 'Full Body':'#86EFAC' }[ex.muscleGroup] || '#D1D5DB' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{ex.name}</span>
                            {ex.difficulty && (
                              <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                                background: ex.difficulty === 'Beginner' ? '#D1FAE5' : ex.difficulty === 'Advanced' ? '#FEE2E2' : '#FEF3C7',
                                color:      ex.difficulty === 'Beginner' ? '#065F46' : ex.difficulty === 'Advanced' ? '#991B1B' : '#92400E' }}>
                                {ex.difficulty}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                            {ex.muscleGroup} · {ex.equipment || 'Any'}
                            {ex.defaultSets && ` · ${ex.defaultSets} sets × ${ex.defaultReps}`}
                          </div>
                        </div>
                        {!ex.isDefault && (
                          <button onClick={() => handleDelete(ex.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FCA5A5', padding: 4 }}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                      {ex.description && (
                        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 5, paddingLeft: 46, lineHeight: 1.4 }}>{ex.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Template Builder Modal ────────────────────────────────────────────────────

function TemplateBuilderModal({ template, exercises, staffList, tenantStaffId, onClose, onSaved }) {
  const isEdit = !!template;
  const [meta, setMeta] = useState({
    name: template?.name || '',
    description: template?.description || '',
    goal: template?.goal || 'General Fitness',
    level: template?.level || 'Beginner',
    durationWeeks: template?.durationWeeks || 4,
    daysPerWeek: template?.daysPerWeek || 3,
    isPublic: template?.isPublic || false,
    trainerId: template?.trainerId || tenantStaffId || '',
  });
  const [days, setDays]     = useState(template?.days || []);
  const [saving, setSaving] = useState(false);
  const [activeDay, setActiveDay] = useState(null);
  const [showExPicker, setShowExPicker] = useState(false);
  const [exSearch, setExSearch] = useState('');
  const [exCatFilter, setExCatFilter] = useState('ALL');
  const [savingDay, setSavingDay] = useState(false);

  const setMf = (k) => (e) => setMeta(m => ({
    ...m, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
  }));

  const handleSaveMeta = async () => {
    if (!meta.name.trim())     return toast.error('Template name required');
    if (!meta.trainerId)       return toast.error('Assign a trainer');
    setSaving(true);
    try {
      let saved;
      if (isEdit) {
        saved = await updateTemplate(template.id, meta);
      } else {
        saved = await createTemplate(meta);
      }
      const id = saved.data.data.id;
      toast.success(isEdit ? 'Template updated' : 'Template created — now add workout days below');
      if (!isEdit) {
        const full = await getTemplate(id);
        setDays(full.data.data.days || []);
        onSaved(full.data.data);
      } else {
        onSaved(saved.data.data);
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleAddDay = async () => {
    if (!template?.id && !isEdit) return toast.error('Save the template first');
    const tId = template?.id;
    if (!tId) return toast.error('Save template first');
    setSavingDay(true);
    try {
      const dayNum = (days.length || 0) + 1;
      const r = await addTemplateDay(tId, { dayNumber: dayNum, label: `Day ${dayNum}`, isRestDay: false });
      const newDay = r.data.data;
      setDays(d => [...d, { ...newDay, exercises: [] }]);
      setActiveDay(newDay.id);
    } catch { toast.error('Failed to add day'); }
    finally { setSavingDay(false); }
  };

  const handleDeleteDay = async (dayId) => {
    try {
      await deleteTemplateDay(template?.id, dayId);
      setDays(d => d.filter(x => x.id !== dayId));
      if (activeDay === dayId) setActiveDay(null);
    } catch { toast.error('Failed to delete day'); }
  };

  const handleToggleRestDay = async (day) => {
    try {
      const r = await updateTemplateDay(template?.id, day.id, { isRestDay: !day.isRestDay });
      setDays(d => d.map(x => x.id === day.id ? { ...x, isRestDay: r.data.data.isRestDay } : x));
    } catch { toast.error('Failed'); }
  };

  const handleUpdateDayLabel = async (day, label) => {
    try {
      await updateTemplateDay(template?.id, day.id, { label });
      setDays(d => d.map(x => x.id === day.id ? { ...x, label } : x));
    } catch {}
  };

  const handleAddExercise = async (day, exercise) => {
    try {
      const r = await addExerciseToDay(template?.id, day.id, {
        exerciseId: exercise.id,
        sets: 3, reps: '10-12', restSeconds: 60, order: (day.exercises || []).length,
      });
      setDays(d => d.map(x => x.id === day.id
        ? { ...x, exercises: [...(x.exercises || []), r.data.data] }
        : x));
    } catch { toast.error('Failed to add exercise'); }
  };

  const handleRemoveExercise = async (day, exId) => {
    try {
      await removeDayExercise(template?.id, day.id, exId);
      setDays(d => d.map(x => x.id === day.id
        ? { ...x, exercises: (x.exercises || []).filter(e => e.id !== exId) }
        : x));
    } catch { toast.error('Failed'); }
  };

  const handleUpdateExField = async (day, ex, field, value) => {
    try {
      await updateDayExercise(template?.id, day.id, ex.id, { [field]: isNaN(value) ? value : Number(value) || value });
      setDays(d => d.map(x => x.id === day.id
        ? { ...x, exercises: (x.exercises || []).map(e => e.id === ex.id ? { ...e, [field]: value } : e) }
        : x));
    } catch {}
  };

  const filteredExercises = exercises.filter(ex => {
    const q = exSearch.toLowerCase();
    return (exCatFilter === 'ALL' || ex.category === exCatFilter) &&
      (!q || ex.name.toLowerCase().includes(q) || ex.muscleGroup.toLowerCase().includes(q));
  });

  const activeDayObj = days.find(d => d.id === activeDay);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 500,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 980,
        maxHeight: '95vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 32px 100px rgba(0,0,0,0.35)' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#0F2349,#1B3A6B)', padding: '18px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, color: '#fff' }}>
              {isEdit ? 'Edit Workout Program' : 'Create Workout Program'}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              {days.length} days configured · {days.reduce((s, d) => s + (d.exercises?.length || 0), 0)} exercises total
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.12)', border: 'none',
            borderRadius: 10, padding: 8, cursor: 'pointer', color: '#fff' }}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Left: Meta + Days list */}
          <div style={{ width: 300, flexShrink: 0, borderRight: '1px solid #F3F4F6', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Meta form */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', overflowY: 'auto', maxHeight: 360 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 12 }}>Program Details</div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Program Name *</div>
                <input value={meta.name} onChange={setMf('name')} placeholder="e.g. 8-Week Fat Loss"
                  style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Trainer *</div>
                {tenantStaffId ? (
                  <div style={{ padding: '8px 10px', border: '1.5px solid #D1FAE5', borderRadius: 8,
                    background: '#F0FDF4', fontSize: 13, color: '#065F46', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 7 }}>
                    <User size={13} />
                    {staffList.find(s => s.id === tenantStaffId)?.name || 'You'}
                  </div>
                ) : (
                  <select value={meta.trainerId} onChange={setMf('trainerId')}
                    style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }}>
                    <option value="">Select trainer</option>
                    {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Goal</div>
                  <select value={meta.goal} onChange={setMf('goal')}
                    style={{ width: '100%', padding: '7px 8px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff' }}>
                    {GOALS.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Level</div>
                  <select value={meta.level} onChange={setMf('level')}
                    style={{ width: '100%', padding: '7px 8px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff' }}>
                    {LEVELS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Duration (weeks)</div>
                  <input type="number" min={1} max={52} value={meta.durationWeeks} onChange={setMf('durationWeeks')}
                    style={{ width: '100%', padding: '7px 8px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Days/Week</div>
                  <input type="number" min={1} max={7} value={meta.daysPerWeek} onChange={setMf('daysPerWeek')}
                    style={{ width: '100%', padding: '7px 8px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: '#374151', marginBottom: 12 }}>
                <input type="checkbox" checked={meta.isPublic} onChange={setMf('isPublic')} />
                Share with all trainers
              </label>
              <textarea value={meta.description} onChange={setMf('description')} placeholder="Program description (optional)"
                rows={2} style={{ width: '100%', padding: '7px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8,
                  fontSize: 12, outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
              <button onClick={handleSaveMeta} disabled={saving}
                style={{ width: '100%', marginTop: 10, padding: '9px', borderRadius: 10, border: 'none',
                  background: 'var(--navy)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                {saving ? 'Saving…' : isEdit ? '✓ Update Details' : '✓ Save & Continue'}
              </button>
            </div>

            {/* Days list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>Workout Days</div>
                {template?.id && (
                  <button onClick={handleAddDay} disabled={savingDay}
                    style={{ fontSize: 11, fontWeight: 700, color: 'var(--navy)', background: '#EFF6FF',
                      border: 'none', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Plus size={11} /> Day
                  </button>
                )}
              </div>
              {!template?.id && (
                <div style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', padding: '20px 0' }}>
                  Save program details first to add workout days
                </div>
              )}
              {days.map(day => (
                <div key={day.id} onClick={() => setActiveDay(day.id === activeDay ? null : day.id)}
                  style={{ padding: '10px 12px', borderRadius: 11, marginBottom: 6, cursor: 'pointer', transition: 'all 0.12s',
                    background: activeDay === day.id ? '#EFF6FF' : '#F9FAFB',
                    border: `1.5px solid ${activeDay === day.id ? 'var(--navy)' : '#F3F4F6'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>{day.label}</div>
                      <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>
                        {day.isRestDay ? '😴 Rest Day' : `${day.exercises?.length || 0} exercises`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={e => { e.stopPropagation(); handleToggleRestDay(day); }}
                        style={{ fontSize: 9, padding: '2px 6px', borderRadius: 6, border: `1px solid ${day.isRestDay ? '#FDE68A' : '#E5E7EB'}`,
                          background: day.isRestDay ? '#FEF3C7' : '#fff', color: day.isRestDay ? '#B45309' : '#9CA3AF', cursor: 'pointer', fontWeight: 700 }}>
                        {day.isRestDay ? 'REST' : 'Work'}
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleDeleteDay(day.id); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FCA5A5', padding: 2 }}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Day editor */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: '#FAFAFA' }}>
            {!activeDayObj ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
                <Dumbbell size={40} color="#E5E7EB" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>Select a day to add exercises</div>
                <div style={{ fontSize: 12, marginTop: 6 }}>Click any day on the left to build its workout</div>
              </div>
            ) : activeDayObj.isRestDay ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>😴</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Rest Day</div>
                <div style={{ fontSize: 12, marginTop: 6 }}>Toggle to a workout day to add exercises</div>
              </div>
            ) : (
              <>
                {/* Day label editor */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
                  <input defaultValue={activeDayObj.label}
                    onBlur={e => handleUpdateDayLabel(activeDayObj, e.target.value)}
                    style={{ flex: 1, padding: '9px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10,
                      fontSize: 14, fontWeight: 700, color: 'var(--navy)', outline: 'none', background: '#fff' }} />
                  <button onClick={() => setShowExPicker(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10,
                      border: 'none', background: 'var(--navy)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    <Plus size={14} /> Add Exercise
                  </button>
                </div>

                {/* Exercise rows */}
                {(activeDayObj.exercises || []).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF', fontSize: 13 }}>
                    No exercises yet. Click "Add Exercise" to get started.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {activeDayObj.exercises.map((ex, idx) => (
                      <div key={ex.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB',
                        padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EFF6FF', display: 'flex',
                              alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'var(--navy)', flexShrink: 0 }}>
                              {idx + 1}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{ex.exercise?.name}</div>
                              <div style={{ fontSize: 11, color: '#9CA3AF' }}>{ex.exercise?.muscleGroup} · {ex.exercise?.equipment}</div>
                            </div>
                          </div>
                          <button onClick={() => handleRemoveExercise(activeDayObj, ex.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FCA5A5', padding: 4 }}>
                            <X size={14} />
                          </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                          {[
                            { label: 'Sets',   field: 'sets',        value: ex.sets,        placeholder: '3',    type: 'number' },
                            { label: 'Reps',   field: 'reps',        value: ex.reps,        placeholder: '10-12',type: 'text' },
                            { label: 'Rest(s)', field: 'restSeconds', value: ex.restSeconds, placeholder: '60',   type: 'number' },
                            { label: 'Weight', field: 'weight',      value: ex.weight,      placeholder: 'BW',   type: 'text' },
                          ].map(f => (
                            <div key={f.field}>
                              <div style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', marginBottom: 3 }}>{f.label}</div>
                              <input type={f.type} defaultValue={f.value || ''} placeholder={f.placeholder}
                                onBlur={e => handleUpdateExField(activeDayObj, ex, f.field, e.target.value)}
                                style={{ width: '100%', padding: '6px 8px', border: '1.5px solid #E5E7EB', borderRadius: 7,
                                  fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                          ))}
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <input defaultValue={ex.notes || ''} placeholder="Notes (optional)"
                            onBlur={e => handleUpdateExField(activeDayObj, ex, 'notes', e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', border: '1.5px solid #E5E7EB', borderRadius: 7,
                              fontSize: 12, outline: 'none', color: '#6B7280', boxSizing: 'border-box' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Exercise Picker overlay */}
                {showExPicker && (
                  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                    <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 560,
                      maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 16px 60px rgba(0,0,0,0.25)' }}>
                      <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>Pick Exercise</div>
                        <button onClick={() => { setShowExPicker(false); setExSearch(''); setExCatFilter('ALL'); }}
                          style={{ background: '#F3F4F6', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer' }}><X size={14} /></button>
                      </div>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6', flexShrink: 0, display: 'flex', gap: 8 }}>
                        <input value={exSearch} onChange={e => setExSearch(e.target.value)} placeholder="Search exercises…"
                          style={{ flex: 1, padding: '7px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none' }} />
                        <select value={exCatFilter} onChange={e => setExCatFilter(e.target.value)}
                          style={{ padding: '7px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff' }}>
                          <option value="ALL">All</option>
                          {CATS.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div style={{ overflowY: 'auto', flex: 1, padding: '8px 16px' }}>
                        {filteredExercises.map(ex => {
                          const alreadyAdded = (activeDayObj.exercises || []).some(e => e.exerciseId === ex.id);
                          return (
                            <div key={ex.id} onClick={() => { if (!alreadyAdded) { handleAddExercise(activeDayObj, ex); setShowExPicker(false); } }}
                              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, marginBottom: 4,
                                background: alreadyAdded ? '#F9FAFB' : '#fff', border: `1px solid ${alreadyAdded ? '#E5E7EB' : '#F3F4F6'}`,
                                cursor: alreadyAdded ? 'default' : 'pointer', opacity: alreadyAdded ? 0.6 : 1, transition: 'all 0.1s' }}
                              onMouseEnter={e => { if (!alreadyAdded) e.currentTarget.style.background = '#F0F4FF'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = alreadyAdded ? '#F9FAFB' : '#fff'; }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                                background: { Chest:'#FCA5A5', Back:'#93C5FD', Legs:'#6EE7B7', Shoulders:'#C4B5FD', Arms:'#FCD34D', Core:'#FDA4AF', 'Full Body':'#86EFAC' }[ex.muscleGroup] || '#D1D5DB' }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{ex.name}</div>
                                <div style={{ fontSize: 11, color: '#9CA3AF' }}>{ex.category} · {ex.muscleGroup} · {ex.equipment || 'Any'}</div>
                              </div>
                              {alreadyAdded
                                ? <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700 }}>Added</span>
                                : <Plus size={14} color="var(--navy)" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'flex-end',
          gap: 10, background: '#FAFAFA', flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 10, border: '1.5px solid #E5E7EB',
            background: '#fff', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Assign Plan Modal ─────────────────────────────────────────────────────────

function AssignPlanModal({ templates, members, staffList, myStaffId, isTrainer, onClose, onSaved }) {
  const [form, setForm] = useState({
    memberId: '', templateId: '', trainerId: isTrainer && myStaffId ? myStaffId : '', startDate: new Date().toISOString().slice(0, 10), notes: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const selectedTemplate = templates.find(t => t.id === form.templateId);

  const handleSave = async () => {
    if (!form.memberId)   return toast.error('Select a member');
    if (!form.templateId) return toast.error('Select a workout program');
    if (!form.trainerId)  return toast.error('Select a trainer');
    setSaving(true);
    try {
      await assignMemberPlan({ ...form, startDate: new Date(form.startDate).toISOString() });
      toast.success('Plan assigned successfully!');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to assign plan'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 500,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520,
        boxShadow: '0 24px 80px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg,#065F46,#059669)', padding: '20px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: '#fff' }}>
            Assign Workout Plan
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none',
            borderRadius: 9, padding: 7, cursor: 'pointer', color: '#fff' }}><X size={16} /></button>
        </div>
        <div style={{ padding: '24px' }}>
          {/* Member select */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Member *</div>
            <select value={form.memberId} onChange={set('memberId')}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10,
                fontSize: 13, outline: 'none', background: '#fff' }}>
              <option value="">Select member…</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}{m.phone ? ` · ${m.phone}` : ''}</option>)}
            </select>
          </div>

          {/* Trainer field — locked to self when trainer is logged in */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Trainer *</div>
            {isTrainer && myStaffId ? (
              <div style={{ padding: '10px 12px', border: '1.5px solid #D1FAE5', borderRadius: 10,
                background: '#F0FDF4', fontSize: 13, color: '#065F46', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={14} />
                {staffList.find(s => s.id === myStaffId)?.name || 'You (Trainer)'}
                <span style={{ fontSize: 11, color: '#059669', marginLeft: 'auto' }}>Assigned to you</span>
              </div>
            ) : (
              <select value={form.trainerId} onChange={set('trainerId')}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10,
                  fontSize: 13, outline: 'none', background: '#fff' }}>
                <option value="">Select trainer…</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Workout Program *</div>
            <select value={form.templateId} onChange={set('templateId')}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10,
                fontSize: 13, outline: 'none', background: '#fff' }}>
              <option value="">Select program…</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.goal} · {t.level})</option>)}
            </select>
            {selectedTemplate && (
              <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 10, background: '#F0FDF4', border: '1px solid #A7F3D0' }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Pill label={selectedTemplate.goal} {...(GOAL_COLORS[selectedTemplate.goal] || {})} />
                  <Pill label={selectedTemplate.level} {...(LEVEL_COLORS[selectedTemplate.level] || {})} />
                  <Pill label={`${selectedTemplate.daysPerWeek}x/week`} bg="#EFF6FF" color="#1D4ED8" />
                  <Pill label={`${selectedTemplate.durationWeeks} weeks`} bg="#F5F3FF" color="#7C3AED" />
                </div>
                <div style={{ fontSize: 11, color: '#059669', marginTop: 6, fontWeight: 600 }}>
                  By {selectedTemplate.trainer?.name || 'Unknown'} · {selectedTemplate._count?.days || 0} days configured
                </div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Start Date</div>
            <input type="date" value={form.startDate} onChange={set('startDate')}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10,
                fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Notes</div>
            <textarea value={form.notes} onChange={set('notes')} placeholder="Any specific instructions for this member…"
              rows={2} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10,
                fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #E5E7EB',
              background: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', color: '#374151' }}>Cancel</button>
            <button onClick={handleSave} disabled={saving}
              style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg,#065F46,#059669)', color: '#fff',
                fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              {saving ? 'Assigning…' : '✓ Assign Plan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main TrainingPlans Component ──────────────────────────────────────────────

export default function TrainingPlans() {
  const { isMobile } = useBreakpoint();
  const { user: currentUser } = useAuth();
  const [subTab, setSubTab]         = useState('overview');
  const [stats, setStats]           = useState({});
  const [activity, setActivity]     = useState({ plans: [], sessions: [], templates: [] });
  const [exercises, setExercises]   = useState([]);
  const [templates, setTemplates]   = useState([]);
  const [memberPlans, setMemberPlans] = useState([]);
  const [members, setMembers]       = useState([]);
  const [staffList, setStaffList]   = useState([]);
  const [loading, setLoading]       = useState(true);

  const [showLibrary, setShowLibrary]       = useState(false);
  const [showBuilder, setShowBuilder]       = useState(false);
  const [editTemplate, setEditTemplate]     = useState(null);
  const [liveTemplate, setLiveTemplate]     = useState(null);
  const [showAssign, setShowAssign]         = useState(false);
  const [planSearch, setPlanSearch]         = useState('');
  const [tplSearch, setTplSearch]           = useState('');
  const [planStatusFilter, setPlanStatusFilter] = useState('ALL');

  // Client Cards + Trainer Board state
  const [boardData, setBoardData]           = useState([]);
  const [boardLoading, setBoardLoading]     = useState(false);
  const [boardTrainerId, setBoardTrainerId] = useState('');
  const [performance, setPerformance]       = useState([]);
  const [clientSearch, setClientSearch]     = useState('');
  const [clientTrainerFilter, setClientTrainerFilter] = useState('ALL');
  const [selectedMember, setSelectedMember] = useState(null);

  const canManage = ['OWNER', 'ADMIN', 'MANAGER'].includes(currentUser?.role);
  const isTrainer = currentUser?.role === 'STAFF';
  // Staff record ID — links User → Staff by email match (returned from /auth/me)
  const myStaffId = currentUser?.staffProfile?.id || null;

  const loadBoard = useCallback(async (tId) => {
    setBoardLoading(true);
    try {
      const [boardR, perfR] = await Promise.all([
        getTrainerBoard(tId ? { trainerId: tId } : {}),
        canManage ? getTrainerPerformance() : Promise.resolve({ data: { data: [] } }),
      ]);
      setBoardData(boardR.data.data || []);
      setPerformance(perfR.data.data || []);
    } catch { toast.error('Failed to load board'); }
    finally { setBoardLoading(false); }
  }, [canManage]);

  const loadAll = useCallback(async (trainerScopeId) => {
    setLoading(true);
    const tid = trainerScopeId || null;
    try {
      const [exR, tplR, plansR, membersR, staffR, statsR, actR] = await Promise.all([
        getExercises(),
        getTemplates(),
        getMemberPlans(tid ? { trainerId: tid } : {}),
        getCustomers({ limit: 500 }),
        getStaff({ limit: 200 }),
        getTrainingStats(tid ? { trainerId: tid } : {}),
        getTrainingActivity(tid ? { trainerId: tid } : {}),
      ]);
      setExercises(exR.data.data || []);
      setTemplates(tplR.data.data || []);
      setMemberPlans(plansR.data.data || []);
      setMembers(membersR.data.data || membersR.data || []);
      setStaffList(staffR.data.data || staffR.data || []);
      setStats(statsR.data.data || {});
      setActivity(actR.data.data || { plans: [], sessions: [], templates: [] });
    } catch (err) {
      toast.error('Failed to load training data');
      console.error(err);
    } finally { setLoading(false); }
  }, []);

  // Load data once currentUser (and staffProfile) is resolved
  useEffect(() => {
    if (currentUser !== null) {
      loadAll(isTrainer ? myStaffId : null);
    }
  }, [currentUser, isTrainer, myStaffId, loadAll]);

  useEffect(() => {
    if (subTab === 'clients' || subTab === 'board') {
      // Trainer always sees their own board; admin can switch via dropdown
      const tId = isTrainer ? myStaffId : boardTrainerId;
      loadBoard(tId || '');
    }
  }, [subTab, boardTrainerId, isTrainer, myStaffId, loadBoard]);

  const handleSeedExercises = async () => {
    try {
      const r = await seedExercises();
      toast.success(`Seeded ${r.data.data.seeded || 0} exercises`);
      const ex = await getExercises();
      setExercises(ex.data.data || []);
    } catch { toast.error('Failed'); }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Delete this program? Member plans using it will also be removed.')) return;
    try { await deleteTemplate(id); toast.success('Deleted'); setTemplates(t => t.filter(x => x.id !== id)); }
    catch { toast.error('Cannot delete — may have active member plans'); }
  };

  const handleUpdatePlanStatus = async (plan, status) => {
    try {
      await updateMemberPlan(plan.id, { status });
      setMemberPlans(p => p.map(x => x.id === plan.id ? { ...x, status } : x));
      toast.success(`Plan marked as ${status.toLowerCase()}`);
    } catch { toast.error('Failed'); }
  };

  const handleDeletePlan = async (id) => {
    try { await deleteMemberPlan(id); setMemberPlans(p => p.filter(x => x.id !== id)); toast.success('Plan removed'); }
    catch { toast.error('Failed'); }
  };

  // Filtered data
  // Trainers see only their own templates; admins/managers see all
  const trainerScopedTemplates = isTrainer && myStaffId
    ? templates.filter(t => t.trainerId === myStaffId || t.trainer?.id === myStaffId)
    : templates;

  const filteredTemplates = trainerScopedTemplates.filter(t => {
    const q = tplSearch.toLowerCase();
    return !q || t.name.toLowerCase().includes(q) || t.goal.toLowerCase().includes(q) || t.trainer?.name?.toLowerCase().includes(q);
  });

  const filteredPlans = memberPlans.filter(p => {
    const q = planSearch.toLowerCase();
    const matchSearch = !q || p.member?.name?.toLowerCase().includes(q) || p.template?.name?.toLowerCase().includes(q) || p.trainer?.name?.toLowerCase().includes(q);
    const matchStatus = planStatusFilter === 'ALL' || p.status === planStatusFilter;
    return matchSearch && matchStatus;
  });

  const SUB_TABS = [
    { key: 'overview',   label: 'Overview',      icon: BarChart3 },
    { key: 'clients',    label: 'Client Cards',  icon: LayoutGrid },
    { key: 'board',      label: 'Trainer Board', icon: Target },
    { key: 'templates',  label: 'Programs',      icon: BookOpen },
    { key: 'plans',      label: 'Member Plans',  icon: Users },
    { key: 'library',    label: 'Exercises',     icon: Dumbbell },
  ];

  // ── Helpers for board/clients ────────────────────────────────────────────────
  const avatarG = (name = '') => {
    const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
    return `linear-gradient(135deg,hsl(${h},60%,38%),hsl(${(h+40)%360},70%,50%))`;
  };

  const trainerNames = [...new Set(boardData.map(c => c.trainer?.name).filter(Boolean))];

  const filteredClients = boardData.filter(c => {
    const q = clientSearch.toLowerCase();
    const matchSearch = !q || c.member?.name?.toLowerCase().includes(q) || c.template?.name?.toLowerCase().includes(q);
    const matchTrainer = clientTrainerFilter === 'ALL' || c.trainer?.name === clientTrainerFilter;
    return matchSearch && matchTrainer;
  });

  const todaysClients = boardData.filter(c => !c.isRestDay);
  const needsAttention = boardData.filter(c => c.daysSinceLastSession !== null && c.daysSinceLastSession >= 7);

  if (loading) return (
    <div style={{ ...P.wrap(isMobile), maxWidth: 1200, margin: '0 auto', textAlign: 'center', paddingTop: 80, paddingBottom: 80, color: '#9CA3AF', fontSize: 14 }}>
      Loading training data…
    </div>
  );

  return (
    <div style={{ ...P.wrap(isMobile), maxWidth: 1200, margin: '0 auto' }}>
      {/* Trainer not linked warning */}
      {isTrainer && !myStaffId && (
        <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 12,
          padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={16} color="#D97706" />
          <div style={{ fontSize: 13, color: '#92400E' }}>
            <strong>Staff profile not linked.</strong> Your login email doesn't match any Staff record in the system.
            Ask your manager to ensure the email on your staff profile matches your login email.
          </div>
        </div>
      )}

      {/* Page header */}
      <div style={{ ...P.head, marginBottom: 24 }}>
        <div>
          <h1 style={P.h1(isMobile)}>Training Plans</h1>
          <p style={P.sub}>
            {isTrainer && currentUser?.staffProfile
              ? `${currentUser.staffProfile.name} · ${stats.activePlans || 0} active plans · ${stats.membersWithPlans || 0} members`
              : `${stats.totalTemplates || 0} programs · ${stats.activePlans || 0} active plans · ${stats.membersWithPlans || 0} members covered`
            }
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {/* All staff can view exercise library */}
          <button onClick={() => setShowLibrary(true)}
            style={{ ...P.btn('secondary'), gap: 6 }}>
            <BookOpen size={14} /> Exercise Library
          </button>
          {/* Trainers and managers can assign plans */}
          {(canManage || isTrainer) && (
            <button onClick={() => setShowAssign(true)}
              style={{ ...P.btn('secondary'), gap: 6, color: '#059669', borderColor: '#A7F3D0' }}>
              <Users size={14} /> Assign Plan
            </button>
          )}
          {/* Trainers and managers can create programs */}
          {(canManage || isTrainer) && (
            <button onClick={() => { setLiveTemplate(null); setEditTemplate(null); setShowBuilder(true); }}
              style={{ ...P.btn('primary'), gap: 6 }}>
              <Plus size={14} /> Create Program
            </button>
          )}
        </div>
      </div>

      {/* Sub-tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#F3F4F6', borderRadius: 14, padding: 4, width: 'fit-content', flexWrap: 'wrap' }}>
        {SUB_TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setSubTab(key)} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px',
            borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: subTab === key ? '#fff' : 'transparent',
            color: subTab === key ? 'var(--navy)' : '#6B7280',
            boxShadow: subTab === key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s',
          }}>
            <Icon size={14} />
            {!isMobile && label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
      {subTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16, marginBottom: 28 }}>
            <StatCard icon={BookOpen}  label="Programs"           value={stats.totalTemplates || 0}    color="#7C3AED" sub="Workout programs" />
            <StatCard icon={Activity}  label="Active Plans"       value={stats.activePlans || 0}        color="#059669" sub="Members currently training" />
            <StatCard icon={Users}     label="Members Covered"    value={stats.membersWithPlans || 0}   color="#2563EB" sub="Have a training plan" />
            <StatCard icon={Zap}       label="Sessions This Week" value={stats.sessionsThisWeek || 0}   color="#D97706" sub="Logged workouts" />
          </div>

          {/* Activity Feed */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
            {/* Recent Plans */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #F3F4F6', fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>
                Recent Plan Assignments
              </div>
              <div style={{ padding: '8px 0' }}>
                {(activity.plans || []).slice(0, 6).map(p => (
                  <div key={p.id} style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 12,
                    borderBottom: '1px solid #F9FAFB' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EFF6FF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'var(--navy)', flexShrink: 0 }}>
                      {p.member?.name?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.member?.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{p.template?.name} · by {p.trainer?.name}</div>
                    </div>
                    <Pill label={STATUS_COLORS[p.status]?.label || p.status}
                      bg={STATUS_COLORS[p.status]?.bg} color={STATUS_COLORS[p.status]?.color} />
                  </div>
                ))}
                {(activity.plans || []).length === 0 && (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No plans assigned yet</div>
                )}
              </div>
            </div>

            {/* Recent Sessions */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #F3F4F6', fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>
                Recent Sessions Logged
              </div>
              <div style={{ padding: '8px 0' }}>
                {(activity.sessions || []).slice(0, 6).map(s => (
                  <div key={s.id} style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 12,
                    borderBottom: '1px solid #F9FAFB' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: s.completed ? '#ECFDF5' : '#FEF3C7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={15} color={s.completed ? '#059669' : '#D97706'} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>
                        {s.plan?.member?.name} — Day {s.dayNumber}
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                        Trainer: {s.plan?.trainer?.name} · {s.duration ? `${s.duration} min` : '—'}
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: '#9CA3AF' }}>
                      {new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                ))}
                {(activity.sessions || []).length === 0 && (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No sessions logged yet</div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── CLIENT CARDS ─────────────────────────────────────────────────── */}
      {subTab === 'clients' && (
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input value={clientSearch} onChange={e => setClientSearch(e.target.value)}
                placeholder="Search members or programs…"
                style={{ width: '100%', padding: '9px 12px 9px 30px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            {canManage && trainerNames.length > 0 && (
              <select value={clientTrainerFilter} onChange={e => setClientTrainerFilter(e.target.value)}
                style={{ padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, outline: 'none', background: '#fff' }}>
                <option value="ALL">All Trainers</option>
                {trainerNames.map(n => <option key={n}>{n}</option>)}
              </select>
            )}
            <button onClick={() => loadBoard(isTrainer ? myStaffId : boardTrainerId)}
              style={{ padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, background: '#fff', cursor: 'pointer', color: '#6B7280', display: 'flex', alignItems: 'center' }}>
              <RefreshCw size={14} />
            </button>
          </div>

          {boardLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
              {[...Array(6)].map((_, i) => <div key={i} style={{ height: 200, background: '#F3F4F6', borderRadius: 16, animation: 'pulse 1.4s ease-in-out infinite' }} />)}
              <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
            </div>
          ) : filteredClients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
              <LayoutGrid size={36} color="#E5E7EB" style={{ display: 'block', margin: '0 auto 12px' }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>No clients found</div>
              <div style={{ fontSize: 13 }}>Assign workout plans to members to see them here</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
              {filteredClients.map(client => {
                const gc = GOAL_COLORS[client.template?.goal] || {};
                const daysSince = client.daysSinceLastSession;
                const alert = daysSince !== null && daysSince >= 7;
                return (
                  <div key={client.plan.id} style={{ background: '#fff', borderRadius: 18,
                    border: `1.5px solid ${alert ? '#FCA5A5' : gc.border || '#E5E7EB'}`,
                    overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                    transition: 'box-shadow 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.05)'}>
                    {/* Goal band */}
                    <div style={{ height: 4, background: gc.border || '#E5E7EB' }} />
                    <div style={{ padding: '14px 16px' }}>
                      {/* Avatar + name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                          background: avatarG(client.member?.name || ''),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 17, fontWeight: 900, color: '#fff' }}>
                          {client.member?.name?.[0]?.toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.member?.name}</span>
                            {client.member?.gymMembershipId && (
                              <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: '#0F2942', color: '#27DCFF', letterSpacing: '0.06em', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                {client.member.gymMembershipId}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {client.template?.name}
                          </div>
                        </div>
                        {alert && <AlertTriangle size={14} color="#EF4444" />}
                      </div>

                      {/* Pills */}
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                        {client.template?.goal && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: gc.bg, color: gc.color, border: `1px solid ${gc.border || gc.bg}` }}>{client.template.goal}</span>}
                        {client.trainer?.name && (
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                            background: client.member?.personalTrainerId === client.trainer?.id ? '#ECFDF5' : '#F3F4F6',
                            color:      client.member?.personalTrainerId === client.trainer?.id ? '#065F46' : '#374151',
                            border: `1px solid ${client.member?.personalTrainerId === client.trainer?.id ? '#A7F3D0' : '#E5E7EB'}` }}>
                            {client.member?.personalTrainerId === client.trainer?.id ? '⭐ PT' : '🏋️'} {client.trainer.name}
                          </span>
                        )}
                      </div>

                      {/* Compliance bar */}
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#6B7280' }}>Compliance</span>
                          <span style={{ fontSize: 11, fontWeight: 800, color: client.completionRate >= 70 ? '#059669' : client.completionRate >= 40 ? '#D97706' : '#DC2626' }}>
                            {client.completionRate}%
                          </span>
                        </div>
                        <div style={{ background: '#E5E7EB', borderRadius: 4, height: 5, overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 4,
                            background: client.completionRate >= 70 ? '#10B981' : client.completionRate >= 40 ? '#F59E0B' : '#EF4444',
                            width: `${client.completionRate}%`, transition: 'width 0.4s' }} />
                        </div>
                      </div>

                      {/* Stats row */}
                      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                        <div style={{ fontSize: 10, color: '#6B7280' }}>
                          🏆 {client.sessionCount} sessions
                        </div>
                        {client.streak > 0 && (
                          <div style={{ fontSize: 10, color: '#D97706', fontWeight: 700 }}>
                            🔥 {client.streak}d streak
                          </div>
                        )}
                        {daysSince !== null && (
                          <div style={{ fontSize: 10, color: alert ? '#EF4444' : '#9CA3AF' }}>
                            Last: {daysSince === 0 ? 'Today' : daysSince === 1 ? 'Yesterday' : `${daysSince}d ago`}
                          </div>
                        )}
                      </div>

                      {/* Today's workout badge */}
                      <div style={{ marginBottom: 12, padding: '7px 10px', borderRadius: 9,
                        background: client.isRestDay ? '#F9FAFB' : '#EFF6FF',
                        border: `1px solid ${client.isRestDay ? '#E5E7EB' : '#BFDBFE'}` }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: client.isRestDay ? '#9CA3AF' : '#1D4ED8' }}>
                          {client.isRestDay ? '😴 Rest Day' : `🏋️ ${client.todaysDay?.label || `Day ${client.todaysDay?.dayNumber}`} — ${client.todaysDay?.exercises?.length || 0} exercises`}
                        </div>
                      </div>

                      <button onClick={() => setSelectedMember({ id: client.member.id, name: client.member.name })}
                        style={{ width: '100%', padding: '9px', borderRadius: 10, border: 'none',
                          background: 'var(--navy)', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                        View Exercise Card →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TRAINER BOARD ─────────────────────────────────────────────────── */}
      {subTab === 'board' && (
        <div>
          {/* Trainer scope header */}
          {isTrainer ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
              background: '#EFF6FF', borderRadius: 12, padding: '10px 16px', border: '1px solid #BFDBFE' }}>
              <User size={15} color="#2563EB" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1D4ED8' }}>
                {currentUser?.staffProfile?.name || currentUser?.name}'s Board
              </span>
              <span style={{ fontSize: 12, color: '#6B7280', marginLeft: 4 }}>— showing your assigned members only</span>
              <button onClick={() => loadBoard(myStaffId)}
                style={{ marginLeft: 'auto', padding: '5px 10px', borderRadius: 8, border: '1px solid #BFDBFE',
                  background: '#fff', cursor: 'pointer', color: '#2563EB', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
          ) : canManage && staffList?.length > 0 ? (
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>View board for:</div>
              <select value={boardTrainerId} onChange={e => setBoardTrainerId(e.target.value)}
                style={{ padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, outline: 'none', background: '#fff' }}>
                <option value="">All Trainers</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button onClick={() => loadBoard(boardTrainerId)}
                style={{ padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, background: '#fff', cursor: 'pointer', color: '#6B7280', display: 'flex', alignItems: 'center' }}>
                <RefreshCw size={14} />
              </button>
            </div>
          ) : null}

          {/* Admin Trainer Performance */}
          {canManage && performance.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>Trainer Performance This Week</div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
                {performance.map(p => (
                  <div key={p.trainer?.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', padding: '16px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: avatarG(p.trainer?.name || ''),
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                        {p.trainer?.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>{p.trainer?.name}</div>
                        <div style={{ fontSize: 10, color: '#9CA3AF' }}>{p.clients} active clients</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                      <div style={{ background: '#EFF6FF', borderRadius: 8, padding: '7px 10px' }}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: '#1D4ED8', fontFamily: 'var(--font-mono)' }}>{p.completedThisWeek}</div>
                        <div style={{ fontSize: 9, color: '#6B7280', fontWeight: 700, textTransform: 'uppercase' }}>Sessions done</div>
                      </div>
                      <div style={{ background: p.complianceRate >= 70 ? '#ECFDF5' : '#FEF3C7', borderRadius: 8, padding: '7px 10px' }}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: p.complianceRate >= 70 ? '#059669' : '#D97706', fontFamily: 'var(--font-mono)' }}>{p.complianceRate}%</div>
                        <div style={{ fontSize: 9, color: '#6B7280', fontWeight: 700, textTransform: 'uppercase' }}>Compliance</div>
                      </div>
                    </div>
                    <div style={{ background: '#E5E7EB', borderRadius: 4, height: 5, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 4, width: `${p.complianceRate}%`,
                        background: p.complianceRate >= 70 ? '#10B981' : p.complianceRate >= 40 ? '#F59E0B' : '#EF4444',
                        transition: 'width 0.4s' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {boardLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF', fontSize: 13 }}>Loading board…</div>
          ) : (
            <>
              {/* Needs Attention */}
              {needsAttention.length > 0 && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 14, padding: '14px 18px', marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <AlertTriangle size={16} color="#EF4444" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#991B1B' }}>Needs Attention ({needsAttention.length})</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {needsAttention.map(c => (
                      <div key={c.plan.id} onClick={() => setSelectedMember({ id: c.member.id, name: c.member.name })}
                        style={{ background: '#fff', border: '1px solid #FCA5A5', borderRadius: 10, padding: '8px 12px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: avatarG(c.member?.name || ''),
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#fff' }}>
                          {c.member?.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>{c.member?.name}</div>
                          <div style={{ fontSize: 10, color: '#EF4444' }}>No session in {c.daysSinceLastSession}d</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Today's Workouts */}
              {todaysClients.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 12,
                    display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Activity size={15} color="#059669" /> Today's Workouts ({todaysClients.length} clients)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {todaysClients.map(c => (
                      <div key={c.plan.id} style={{ background: '#fff', borderRadius: 14,
                        border: '1px solid #BFDBFE', padding: '12px 16px',
                        display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: avatarG(c.member?.name || ''),
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                          {c.member?.name?.[0]?.toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>{c.member?.name}</div>
                          <div style={{ fontSize: 11, color: '#1D4ED8', fontWeight: 600 }}>
                            🏋️ {c.todaysDay?.label || `Day ${c.todaysDay?.dayNumber}`}
                            {c.todaysDay?.exercises?.length > 0 && ` — ${c.todaysDay.exercises.length} exercises`}
                          </div>
                          {c.todaysDay?.exercises?.slice(0, 3).map(ex => (
                            <span key={ex.id} style={{ fontSize: 10, color: '#6B7280', marginRight: 6 }}>
                              {ex.exercise?.name}{ex.sets && ex.reps ? ` ${ex.sets}×${ex.reps}` : ''}
                            </span>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                            background: c.completionRate >= 70 ? '#ECFDF5' : '#FEF3C7',
                            color: c.completionRate >= 70 ? '#059669' : '#D97706' }}>
                            {c.completionRate}%
                          </span>
                          <button onClick={() => setSelectedMember({ id: c.member.id, name: c.member.name })}
                            style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: 'var(--navy)',
                              color: '#fff', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                            View Card
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Clients */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>
                  All Active Clients ({boardData.length})
                </div>
                {boardData.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF', fontSize: 13 }}>No active client plans found</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {boardData.map(c => {
                      const gc = GOAL_COLORS[c.template?.goal] || {};
                      const alert = c.daysSinceLastSession !== null && c.daysSinceLastSession >= 7;
                      return (
                        <div key={c.plan.id} style={{ background: '#fff', borderRadius: 14,
                          border: `1.5px solid ${alert ? '#FCA5A5' : '#E5E7EB'}`, padding: '14px 16px',
                          display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: avatarG(c.member?.name || ''),
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                            {c.member?.name?.[0]?.toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 180 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                              <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--navy)' }}>{c.member?.name}</span>
                              {c.template?.goal && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: gc.bg, color: gc.color }}>{c.template.goal}</span>}
                              {alert && <AlertTriangle size={12} color="#EF4444" />}
                            </div>
                            <div style={{ fontSize: 11, color: '#6B7280' }}>{c.template?.name} · {c.trainer?.name}</div>
                            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, background: '#E5E7EB', borderRadius: 3, height: 5, overflow: 'hidden', maxWidth: 120 }}>
                                <div style={{ height: '100%', borderRadius: 3, width: `${c.completionRate}%`,
                                  background: c.completionRate >= 70 ? '#10B981' : c.completionRate >= 40 ? '#F59E0B' : '#EF4444' }} />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, color: c.completionRate >= 70 ? '#059669' : '#D97706' }}>
                                {c.completionRate}%
                              </span>
                              {c.streak > 0 && <span style={{ fontSize: 10, color: '#D97706' }}>🔥 {c.streak}d</span>}
                              {c.daysSinceLastSession !== null && (
                                <span style={{ fontSize: 10, color: alert ? '#EF4444' : '#9CA3AF' }}>
                                  {c.daysSinceLastSession === 0 ? 'Active today' : `${c.daysSinceLastSession}d ago`}
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--navy)', fontFamily: 'var(--font-mono)' }}>{c.sessionCount}</div>
                              <div style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase' }}>Sessions</div>
                            </div>
                            <button onClick={() => setSelectedMember({ id: c.member.id, name: c.member.name })}
                              style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: 'var(--navy)',
                                color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                              View Card
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── PROGRAMS (Templates) ──────────────────────────────────────────── */}
      {subTab === 'templates' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10, flex: 1, minWidth: 200 }}>
              <input value={tplSearch} onChange={e => setTplSearch(e.target.value)}
                placeholder={isTrainer ? 'Search my programs…' : 'Search programs…'}
                style={{ flex: 1, padding: '9px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, outline: 'none' }} />
            </div>
            {(canManage || isTrainer) && (
              <button onClick={() => { setLiveTemplate(null); setEditTemplate(null); setShowBuilder(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10,
                  border: 'none', background: 'var(--navy)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                <Plus size={15} /> New Program
              </button>
            )}
          </div>

          {filteredTemplates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
              <BookOpen size={40} color="#E5E7EB" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 14, fontWeight: 600 }}>No programs yet</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Create your first workout program to get started</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(340px,1fr))', gap: 16 }}>
              {filteredTemplates.map(t => {
                const gc = GOAL_COLORS[t.goal] || {};
                const lc = LEVEL_COLORS[t.level] || {};
                return (
                  <div key={t.id} style={{ background: '#fff', borderRadius: 18, border: '1px solid #E5E7EB',
                    overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'box-shadow 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'}>
                    {/* Top color band */}
                    <div style={{ height: 5, background: `linear-gradient(90deg,${gc.border || '#E5E7EB'},${lc.bg || '#fff'})` }} />
                    <div style={{ padding: '16px 18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--navy)', marginBottom: 6 }}>{t.name}</div>
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            <Pill label={t.goal}  bg={gc.bg}  color={gc.color}  border={gc.border} />
                            <Pill label={t.level} bg={lc.bg}  color={lc.color} />
                            {t.isPublic && <Pill label="Shared" bg="#F0FDF4" color="#059669" border="#A7F3D0" />}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                          <button onClick={() => { setLiveTemplate(t); setEditTemplate(t); setShowBuilder(true); }}
                            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff',
                              cursor: 'pointer', color: '#6B7280', display: 'flex', alignItems: 'center' }}>
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleDeleteTemplate(t.id)}
                            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #FCA5A5', background: '#FFF5F5',
                              cursor: 'pointer', color: '#DC2626', display: 'flex', alignItems: 'center' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
                        {[
                          { icon: Calendar, val: `${t.durationWeeks}w`, label: 'Duration' },
                          { icon: Zap,      val: `${t.daysPerWeek}x`,   label: 'Per week' },
                          { icon: Dumbbell, val: `${t._count?.days || 0}`, label: 'Days' },
                        ].map(s => (
                          <div key={s.label} style={{ textAlign: 'center', padding: '8px 6px', background: '#F9FAFB', borderRadius: 10 }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)' }}>{s.val}</div>
                            <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600 }}>{s.label}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>
                          <span style={{ fontWeight: 600 }}>{t.trainer?.name}</span>
                          <span style={{ color: '#9CA3AF' }}> · {t._count?.memberPlans || 0} member{t._count?.memberPlans !== 1 ? 's' : ''}</span>
                        </div>
                        <button onClick={() => setShowAssign(true)}
                          style={{ fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 8,
                            border: 'none', background: '#EFF6FF', color: 'var(--navy)', cursor: 'pointer' }}>
                          Assign →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MEMBER PLANS ─────────────────────────────────────────────────── */}
      {subTab === 'plans' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap' }}>
              <input value={planSearch} onChange={e => setPlanSearch(e.target.value)} placeholder="Search members, programs…"
                style={{ flex: 1, minWidth: 180, padding: '9px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, outline: 'none' }} />
              <select value={planStatusFilter} onChange={e => setPlanStatusFilter(e.target.value)}
                style={{ padding: '9px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, outline: 'none', background: '#fff' }}>
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <button onClick={() => setShowAssign(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10,
                border: 'none', background: '#059669', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              <Plus size={15} /> Assign Plan
            </button>
          </div>

          {filteredPlans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
              <Users size={40} color="#E5E7EB" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 14, fontWeight: 600 }}>No plans assigned yet</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Assign a workout program to a member to start tracking</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredPlans.map(plan => {
                const sc = STATUS_COLORS[plan.status] || {};
                const gc = GOAL_COLORS[plan.template?.goal] || {};
                return (
                  <div key={plan.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB',
                    padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      {/* Member avatar */}
                      <div style={{ width: 46, height: 46, borderRadius: 13, background: '#EFF6FF',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                        fontWeight: 800, color: 'var(--navy)', flexShrink: 0 }}>
                        {plan.member?.name?.[0]?.toUpperCase()}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--navy)' }}>{plan.member?.name}</span>
                          <Pill label={sc.label || plan.status} bg={sc.bg} color={sc.color} />
                        </div>
                        <div style={{ fontSize: 13, color: '#374151', fontWeight: 600, marginBottom: 3 }}>{plan.template?.name}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                          <Pill label={plan.template?.goal}  bg={gc.bg} color={gc.color} border={gc.border} />
                          <Pill label={plan.template?.level} bg={LEVEL_COLORS[plan.template?.level]?.bg} color={LEVEL_COLORS[plan.template?.level]?.color} />
                          <span style={{ fontSize: 11, color: '#9CA3AF' }}>Trainer: {plan.trainer?.name}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy)', fontFamily: 'var(--font-mono)' }}>{plan._count?.sessions || 0}</div>
                          <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600 }}>Sessions</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280' }}>
                            {new Date(plan.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </div>
                          <div style={{ fontSize: 10, color: '#9CA3AF' }}>Start date</div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        {plan.status === 'ACTIVE' && (
                          <button onClick={() => handleUpdatePlanStatus(plan, 'PAUSED')}
                            style={{ fontSize: 11, padding: '6px 10px', borderRadius: 8, border: '1px solid #FDE68A',
                              background: '#FEF3C7', color: '#B45309', cursor: 'pointer', fontWeight: 700 }}>Pause</button>
                        )}
                        {plan.status === 'PAUSED' && (
                          <button onClick={() => handleUpdatePlanStatus(plan, 'ACTIVE')}
                            style={{ fontSize: 11, padding: '6px 10px', borderRadius: 8, border: '1px solid #A7F3D0',
                              background: '#ECFDF5', color: '#059669', cursor: 'pointer', fontWeight: 700 }}>Resume</button>
                        )}
                        {plan.status !== 'COMPLETED' && (
                          <button onClick={() => handleUpdatePlanStatus(plan, 'COMPLETED')}
                            style={{ fontSize: 11, padding: '6px 10px', borderRadius: 8, border: '1px solid #BFDBFE',
                              background: '#EFF6FF', color: '#1D4ED8', cursor: 'pointer', fontWeight: 700 }}>Complete</button>
                        )}
                        <button onClick={() => handleDeletePlan(plan.id)}
                          style={{ padding: '6px 9px', borderRadius: 8, border: '1px solid #FCA5A5',
                            background: '#FFF5F5', cursor: 'pointer', color: '#DC2626', display: 'flex', alignItems: 'center' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    {plan.notes && (
                      <div style={{ marginTop: 10, padding: '8px 12px', background: '#F9FAFB', borderRadius: 8,
                        fontSize: 12, color: '#6B7280', fontStyle: 'italic' }}>"{plan.notes}"</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── EXERCISE LIBRARY ─────────────────────────────────────────────── */}
      {subTab === 'library' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>Exercise Library</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                {exercises.length} exercises across {CATS.length} categories
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {exercises.length === 0 && (
                <button onClick={handleSeedExercises}
                  style={{ padding: '9px 16px', borderRadius: 10, border: '1px solid #A7F3D0', background: '#ECFDF5',
                    color: '#059669', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  ✨ Load Default Exercises
                </button>
              )}
              <button onClick={() => setShowLibrary(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10,
                  border: 'none', background: 'var(--navy)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                <Plus size={15} /> Add Exercise
              </button>
            </div>
          </div>

          {CATS.map(cat => {
            const items = exercises.filter(e => e.category === cat);
            if (!items.length) return null;
            return (
              <div key={cat} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{cat}</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF', background: '#F3F4F6', padding: '1px 8px', borderRadius: 20, fontWeight: 600 }}>{items.length}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
                  {items.map(ex => {
                    const muscleColor = { Chest:'#FEE2E2', Back:'#DBEAFE', Legs:'#D1FAE5', Shoulders:'#EDE9FE', Arms:'#FEF3C7', Core:'#FFE4E6', 'Full Body':'#F0FDF4' }[ex.muscleGroup] || '#F3F4F6';
                    const diffColor   = ex.difficulty === 'Beginner' ? { bg:'#D1FAE5',text:'#065F46' } : ex.difficulty === 'Advanced' ? { bg:'#FEE2E2',text:'#991B1B' } : { bg:'#FEF3C7',text:'#92400E' };
                    return (
                      <div key={ex.id} style={{ borderRadius: 14, background: '#fff', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                        {/* Muscle group header */}
                        <div style={{ background: muscleColor, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</div>
                            <div style={{ fontSize: 10, color: '#6B7280' }}>{ex.muscleGroup} · {ex.equipment || 'Any'}</div>
                          </div>
                        </div>
                        {/* Details */}
                        <div style={{ padding: '8px 14px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                          {ex.difficulty && (
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: diffColor.bg, color: diffColor.text }}>
                              {ex.difficulty}
                            </span>
                          )}
                          {ex.defaultSets && (
                            <span style={{ fontSize: 10, color: '#6B7280', fontWeight: 600 }}>
                              {ex.defaultSets} × {ex.defaultReps}
                            </span>
                          )}
                          {ex.description && (
                            <span style={{ fontSize: 10, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                              {ex.description}
                            </span>
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
      )}

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {showLibrary && (
        <ExerciseLibraryModal exercises={exercises} onClose={() => setShowLibrary(false)}
          onRefresh={async () => { const r = await getExercises(); setExercises(r.data.data || []); }} />
      )}

      {showBuilder && (
        <TemplateBuilderModal
          template={liveTemplate || editTemplate}
          exercises={exercises}
          staffList={staffList}
          tenantStaffId={myStaffId}
          onClose={() => { setShowBuilder(false); setLiveTemplate(null); setEditTemplate(null); loadAll(isTrainer ? myStaffId : null); }}
          onSaved={(saved) => {
            setLiveTemplate(saved);
            if (editTemplate) {
              setTemplates(t => t.map(x => x.id === saved.id ? { ...x, ...saved } : x));
            } else {
              setTemplates(t => [...t, saved]);
            }
          }}
        />
      )}

      {showAssign && (
        <AssignPlanModal
          templates={templates} members={members} staffList={staffList}
          myStaffId={myStaffId} isTrainer={isTrainer}
          onClose={() => setShowAssign(false)}
          onSaved={() => { setShowAssign(false); loadAll(isTrainer ? myStaffId : null); }} />
      )}

      {selectedMember && (
        <MemberExerciseCard
          memberId={selectedMember.id}
          memberName={selectedMember.name}
          currentUser={currentUser}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
}
