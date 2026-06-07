import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createCR } from '../../api/platform';
import toast from 'react-hot-toast';

const PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export default function ChangeNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultType = searchParams.get('type') === 'CR' ? 'CR' : 'ENHANCEMENT';

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type:             defaultType,
    title:            '',
    description:      '',
    businessTypeCode: '',
    modulesAffected:  '',
    priority:         'MEDIUM',
    problem:          '',
    solution:         '',
    inScope:          '',
    outOfScope:       '',
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim())            return toast.error('Title is required');
    if (!form.businessTypeCode.trim()) return toast.error('Business type code is required');
    if (!form.problem.trim())          return toast.error('Problem statement is required');
    if (!form.solution.trim())         return toast.error('Proposed solution is required');
    if (!form.inScope.trim())          return toast.error('In Scope is required');

    setSaving(true);
    try {
      const { data } = await createCR({
        type:             form.type,
        title:            form.title.trim(),
        description:      form.description.trim()      || null,
        businessTypeCode: form.businessTypeCode.trim().toUpperCase(),
        modulesAffected:  form.modulesAffected.split(',').map((s) => s.trim()).filter(Boolean),
        priority:         form.priority,
        problem:          form.problem.trim(),
        solution:         form.solution.trim(),
        inScope:          form.inScope.trim(),
        outOfScope:       form.outOfScope.trim()        || null,
      });
      toast.success(`${data.data.crCode} created`);
      navigate(`/platform/changes/${data.data.id}`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create change request');
    } finally {
      setSaving(false);
    }
  };

  const isENH = form.type === 'ENHANCEMENT';

  return (
    <div style={{ padding: 28, maxWidth: 780, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <button onClick={() => navigate('/platform/changes')} style={backBtn}>← Back</button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#F1F5F9' }}>
            New {isENH ? 'Enhancement' : 'Change Request'}
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
            Document must be approved before development begins
          </p>
        </div>
      </div>

      {/* Type Toggle */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: '#192533', border: '1px solid #1E2D3D', borderRadius: 8, padding: 4, width: 'fit-content' }}>
        {[{ val: 'CR', label: 'Change Request' }, { val: 'ENHANCEMENT', label: 'Enhancement' }].map(({ val, label }) => (
          <button key={val} onClick={() => set('type', val)}
            style={{
              padding: '7px 20px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
              background: form.type === val ? (val === 'CR' ? 'rgba(167,139,250,0.2)' : 'rgba(31,184,214,0.2)') : 'transparent',
              color: form.type === val ? (val === 'CR' ? '#A78BFA' : '#1FB8D6') : '#64748B',
            }}>
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: '#192533', border: '1px solid #1E2D3D', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Title */}
          <div>
            <label style={labelStyle}>Title <span style={{ color: '#EF4444' }}>*</span></label>
            <input value={form.title} onChange={(e) => set('title', e.target.value)}
              placeholder={isENH ? 'e.g. Add bulk invoice export feature' : 'e.g. Fix GST calculation rounding error'}
              style={inputStyle} />
          </div>

          {/* BT + Priority */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Business Type Code <span style={{ color: '#EF4444' }}>*</span></label>
              <input value={form.businessTypeCode} onChange={(e) => set('businessTypeCode', e.target.value)}
                placeholder="e.g. SYL-BC-ALL or SYL-BC-GYM-001"
                style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: 12 }} />
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <select value={form.priority} onChange={(e) => set('priority', e.target.value)} style={inputStyle}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Modules */}
          <div>
            <label style={labelStyle}>Modules Affected</label>
            <input value={form.modulesAffected} onChange={(e) => set('modulesAffected', e.target.value)}
              placeholder="Transport, Billing, Dashboard (comma-separated)"
              style={inputStyle} />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Brief Description</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
              placeholder="One-line summary of this change…"
              rows={2} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid #1E2D3D', paddingTop: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1FB8D6', letterSpacing: '0.08em' }}>
              CHANGE DOCUMENT — REQUIRED
            </div>
          </div>

          {/* Problem */}
          <div>
            <label style={labelStyle}>Problem Statement <span style={{ color: '#EF4444' }}>*</span></label>
            <textarea value={form.problem} onChange={(e) => set('problem', e.target.value)}
              placeholder="What is broken or missing? Why does it matter?"
              rows={4} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
          </div>

          {/* Solution */}
          <div>
            <label style={labelStyle}>Proposed Solution <span style={{ color: '#EF4444' }}>*</span></label>
            <textarea value={form.solution} onChange={(e) => set('solution', e.target.value)}
              placeholder="What exactly will be built to solve this?"
              rows={4} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
          </div>

          {/* In Scope / Out of Scope */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>In Scope <span style={{ color: '#EF4444' }}>*</span></label>
              <textarea value={form.inScope} onChange={(e) => set('inScope', e.target.value)}
                placeholder={"- Feature A\n- Page X\n- API endpoint Y"}
                rows={5} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }} />
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>One item per line</div>
            </div>
            <div>
              <label style={labelStyle}>Out of Scope</label>
              <textarea value={form.outOfScope} onChange={(e) => set('outOfScope', e.target.value)}
                placeholder={"- Not touching module X\n- No DB changes to Y"}
                rows={5} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }} />
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>One item per line</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => navigate('/platform/changes')} style={cancelBtn}>Cancel</button>
          <button type="submit" disabled={saving}
            style={{ padding: '10px 28px', background: saving ? '#1E2D3D' : 'linear-gradient(135deg,#1FB8D6,#27DCFF)', border: 'none', borderRadius: 8, color: saving ? '#64748B' : '#0B131C', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Creating…' : `Create ${isENH ? 'Enhancement' : 'CR'}`}
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
