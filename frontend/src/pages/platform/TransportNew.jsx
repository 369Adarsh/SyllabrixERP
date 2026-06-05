import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTR } from '../../api/platform';
import toast from 'react-hot-toast';

const CATEGORIES = ['FEATURE', 'BUGFIX', 'ENHANCEMENT', 'CONFIG', 'HOTFIX'];
const PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const TEMPLATES = [
  { label: 'New Feature',         category: 'FEATURE',     priority: 'HIGH',   description: 'New feature implementation.' },
  { label: 'Bug Fix',             category: 'BUGFIX',      priority: 'HIGH',   description: 'Bug identified and fixed.' },
  { label: 'Enhancement',        category: 'ENHANCEMENT', priority: 'MEDIUM', description: 'Improvement to existing functionality.' },
  { label: 'Config Change',       category: 'CONFIG',      priority: 'LOW',    description: 'Configuration or settings update.' },
  { label: 'Critical Hotfix',     category: 'HOTFIX',      priority: 'CRITICAL', description: 'Critical issue requiring immediate fix.' },
];

export default function TransportNew() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: 'FEATURE', priority: 'MEDIUM',
    businessTypeCode: '', modulesAffected: '', gitCommits: '', testPlanNotes: '',
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const applyTemplate = (t) => {
    setForm((f) => ({ ...f, category: t.category, priority: t.priority, description: f.description || t.description }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.businessTypeCode.trim()) return toast.error('Business type code is required');
    setSaving(true);
    try {
      const payload = {
        title:            form.title.trim(),
        description:      form.description.trim() || null,
        category:         form.category,
        priority:         form.priority,
        businessTypeCode: form.businessTypeCode.trim().toUpperCase(),
        modulesAffected:  form.modulesAffected.split(',').map((s) => s.trim()).filter(Boolean),
        gitCommits:       form.gitCommits.split(',').map((s) => s.trim()).filter(Boolean),
        testPlanNotes:    form.testPlanNotes.trim() || null,
      };
      const { data } = await createTR(payload);
      toast.success(`${data.data.trCode} created`);
      navigate(`/platform/transport/${data.data.id}`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create TR');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 28, maxWidth: 760, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <button onClick={() => navigate('/platform/transport')} style={backBtn}>← Back</button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#F1F5F9' }}>New Transport Request</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Log a new change to track through Dev → Quality → Production</p>
        </div>
      </div>

      {/* Templates */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Quick Templates</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TEMPLATES.map((t) => (
            <button key={t.label} onClick={() => applyTemplate(t)}
              style={{ padding: '6px 14px', background: '#192533', border: '1px solid #1E2D3D', borderRadius: 6, color: '#94A3B8', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ background: '#192533', border: '1px solid #1E2D3D', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Title */}
          <div>
            <label style={labelStyle}>Title <span style={{ color: '#EF4444' }}>*</span></label>
            <input value={form.title} onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Clinic Billing — Add GST exemption field"
              style={inputStyle} />
          </div>

          {/* Category + Priority */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)} style={inputStyle}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <select value={form.priority} onChange={(e) => set('priority', e.target.value)} style={inputStyle}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Business Type Code */}
          <div>
            <label style={labelStyle}>Business Type Code <span style={{ color: '#EF4444' }}>*</span></label>
            <input value={form.businessTypeCode} onChange={(e) => set('businessTypeCode', e.target.value)}
              placeholder="e.g. SYL-BC-HLC-CL07 or SYL-BC-ALL"
              style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: 13 }} />
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Use SYL-BC-ALL for platform-wide changes</div>
          </div>

          {/* Modules Affected */}
          <div>
            <label style={labelStyle}>Modules Affected</label>
            <input value={form.modulesAffected} onChange={(e) => set('modulesAffected', e.target.value)}
              placeholder="Billing, Invoicing, Dashboard (comma-separated)"
              style={inputStyle} />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
              placeholder="Describe what was changed and why…"
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
          </div>

          {/* Git Commits */}
          <div>
            <label style={labelStyle}>Git Commit Hashes</label>
            <input value={form.gitCommits} onChange={(e) => set('gitCommits', e.target.value)}
              placeholder="abc1234, def5678 (comma-separated, optional)"
              style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: 12 }} />
          </div>

          {/* Test Plan Notes */}
          <div>
            <label style={labelStyle}>Test Plan Notes</label>
            <textarea value={form.testPlanNotes} onChange={(e) => set('testPlanNotes', e.target.value)}
              placeholder="What should be tested before promoting to quality? Any edge cases?"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => navigate('/platform/transport')} style={cancelBtn}>Cancel</button>
          <button type="submit" disabled={saving}
            style={{ padding: '10px 28px', background: saving ? '#1E2D3D' : 'linear-gradient(135deg,#1FB8D6,#27DCFF)', border: 'none', borderRadius: 8, color: saving ? '#64748B' : '#0B131C', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Creating…' : 'Create TR'}
          </button>
        </div>
      </form>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: '#94A3B8', marginBottom: 6, letterSpacing: '0.04em' };
const inputStyle  = { width: '100%', padding: '9px 12px', background: '#0F1923', border: '1px solid #1E2D3D', borderRadius: 8, color: '#F1F5F9', fontSize: 13, outline: 'none', boxSizing: 'border-box' };
const backBtn     = { padding: '7px 14px', background: 'transparent', border: '1px solid #1E2D3D', borderRadius: 7, color: '#64748B', fontSize: 12, fontWeight: 600, cursor: 'pointer' };
const cancelBtn   = { padding: '10px 20px', background: 'transparent', border: '1px solid #1E2D3D', borderRadius: 8, color: '#64748B', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
