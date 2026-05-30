import { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createTicket } from '../../api/index';
import { getModuleForPath, ISSUE_TYPE_OPTIONS, SEVERITY_OPTIONS } from '../../config/routeModuleMap';
import toast from 'react-hot-toast';

// Derive the business fingerprint shown in every ticket for precise admin drill-down.
// Format: SYL-[CAT]-[TYPECODE]-[SHORTID]  e.g. SYL-GEN-KR02-HK2P9
function buildFingerprint(tenant) {
  if (!tenant) return null;
  const bt = (tenant.businessType || '').replace(/_/g, '-').replace(/-(\d)/, (_, d) => d); // GEN_KR02 → GEN-KR02
  const parts = (tenant.businessType || '').split('_');
  const cat = parts[0] || 'SYL';
  const code = parts.slice(1).join('-') || '00';
  const uid = (tenant.syllabrixId || tenant.id || '').slice(0, 5).toUpperCase();
  return `SYL-${cat}-${code}-${uid}`;
}

const PRIORITY_MAP = { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH', CRITICAL: 'HIGH' };

export default function ReportIssue({ open, onClose }) {
  const { user, tenant } = useAuth();
  const { pathname } = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const moduleCtx = getModuleForPath(pathname);
  const fingerprint = buildFingerprint(tenant);

  const [form, setForm] = useState({
    featureKey: '',
    issueType: 'TECHNICAL',
    severity: 'MEDIUM',
    description: '',
  });

  const reset = useCallback(() => {
    setForm({ featureKey: '', issueType: 'TECHNICAL', severity: 'MEDIUM', description: '' });
    setDone(false);
  }, []);

  const closeDrawer = () => { onClose(); setTimeout(reset, 300); };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) { toast.error('Please describe the issue'); return; }

    const moduleLabel = moduleCtx?.label || 'General';
    const featureLabel = form.featureKey || 'General';
    const issueLabel = ISSUE_TYPE_OPTIONS.find(o => o.value === form.issueType)?.label || form.issueType;

    const title = `[${moduleLabel}${form.featureKey ? ` › ${featureLabel}` : ''}] ${issueLabel}`;
    const contextBlock = [
      `Business: ${tenant?.name || 'Unknown'}`,
      fingerprint && `Fingerprint: ${fingerprint}`,
      `Module: ${moduleLabel}`,
      form.featureKey && `Feature: ${featureLabel}`,
      `Page: ${pathname}`,
      `Reported by: ${user?.name || 'User'} (${user?.email || ''})`,
    ].filter(Boolean).join('\n');

    const message = `${form.description.trim()}\n\n---\n${contextBlock}`;

    setSubmitting(true);
    try {
      await createTicket({
        title,
        category: form.issueType,
        priority: PRIORITY_MAP[form.severity] || 'MEDIUM',
        message,
        moduleKey: moduleCtx?.module || null,
        featureKey: form.featureKey || null,
        reporterRole: user?.assignedRole?.templateKey || user?.role || null,
      });
      setDone(true);
      toast.success('Issue reported — our team will look into it.');
    } catch {
      toast.error('Could not submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          onClick={closeDrawer}
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(0,0,0,0.35)',
            animation: 'fadeIn 0.18s ease',
          }}
        />
      )}

      {/* Drawer */}
      <div style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0,
        width: 420,
        zIndex: 301,
        background: '#fff',
        boxShadow: '-4px 0 32px rgba(0,0,0,0.18)',
        display: 'flex',
        flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
        fontFamily: 'var(--font-body)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 20px 14px',
          borderBottom: '1px solid #E5E7EB',
          background: '#FAFAFA',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.01em' }}>
                Report an Issue
              </div>
              {moduleCtx && (
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                  <span style={{
                    display: 'inline-block',
                    background: '#EEF2FF',
                    color: '#6366F1',
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '1px 7px',
                    borderRadius: 10,
                    marginRight: 5,
                  }}>
                    {moduleCtx.label}
                  </span>
                  detected from current page
                </div>
              )}
            </div>
            <button
              onClick={closeDrawer}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 18, padding: 2, lineHeight: 1, marginTop: 2 }}
            >
              ✕
            </button>
          </div>

          {fingerprint && (
            <div style={{
              marginTop: 10,
              padding: '6px 10px',
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <span style={{ fontSize: 11, color: '#6B7280' }}>Business ID</span>
              <code style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', letterSpacing: '0.06em', background: 'none', border: 'none' }}>
                {fingerprint}
              </code>
              <span style={{ fontSize: 10, color: '#9CA3AF', marginLeft: 'auto' }}>auto-attached</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {done ? (
            <SuccessState fingerprint={fingerprint} onClose={closeDrawer} onAnother={() => { reset(); }} />
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Feature picker — shown only when there's a module context */}
              {moduleCtx && (
                <Field label="Which feature is affected?">
                  <select
                    value={form.featureKey}
                    onChange={e => set('featureKey', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">— General / Not sure</option>
                    {moduleCtx.features.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </Field>
              )}

              {/* Issue type */}
              <Field label="What type of issue is this?">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {ISSUE_TYPE_OPTIONS.map(opt => (
                    <label key={opt.value} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px',
                      borderRadius: 7,
                      border: `1.5px solid ${form.issueType === opt.value ? '#6366F1' : '#E5E7EB'}`,
                      background: form.issueType === opt.value ? '#EEF2FF' : '#fff',
                      cursor: 'pointer',
                      fontSize: 13,
                      color: form.issueType === opt.value ? '#4F46E5' : '#374151',
                      fontWeight: form.issueType === opt.value ? 600 : 400,
                      transition: 'all 0.12s',
                    }}>
                      <input
                        type="radio"
                        name="issueType"
                        value={opt.value}
                        checked={form.issueType === opt.value}
                        onChange={() => set('issueType', opt.value)}
                        style={{ accentColor: '#6366F1', flexShrink: 0 }}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </Field>

              {/* Severity */}
              <Field label="Severity">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {SEVERITY_OPTIONS.map(opt => {
                    const colors = {
                      LOW:      { bg: '#F0FDF4', border: '#86EFAC', active: '#16A34A', text: '#15803D' },
                      MEDIUM:   { bg: '#FFFBEB', border: '#FCD34D', active: '#D97706', text: '#B45309' },
                      HIGH:     { bg: '#FFF7ED', border: '#FDBA74', active: '#EA580C', text: '#C2410C' },
                      CRITICAL: { bg: '#FEF2F2', border: '#FCA5A5', active: '#DC2626', text: '#B91C1C' },
                    }[opt.value];
                    const sel = form.severity === opt.value;
                    return (
                      <label key={opt.value} style={{
                        display: 'flex', flexDirection: 'column',
                        padding: '8px 10px',
                        borderRadius: 7,
                        border: `1.5px solid ${sel ? colors.active : colors.border}`,
                        background: sel ? colors.bg : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.12s',
                      }}>
                        <input
                          type="radio"
                          name="severity"
                          value={opt.value}
                          checked={sel}
                          onChange={() => set('severity', opt.value)}
                          style={{ display: 'none' }}
                        />
                        <span style={{ fontSize: 12, fontWeight: 700, color: sel ? colors.active : '#374151' }}>
                          {opt.value}
                        </span>
                        <span style={{ fontSize: 11, color: sel ? colors.text : '#9CA3AF', marginTop: 1, lineHeight: 1.3 }}>
                          {opt.label.split('—')[1]?.trim()}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </Field>

              {/* Description */}
              <Field label="Describe the issue *">
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="What happened? What did you expect to happen? Steps to reproduce..."
                  rows={4}
                  required
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 90 }}
                />
              </Field>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || !form.description.trim()}
                style={{
                  padding: '10px 0',
                  background: submitting ? '#A5B4FC' : '#4F46E5',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                  letterSpacing: '0.01em',
                }}
              >
                {submitting ? 'Submitting…' : 'Submit Issue Report'}
              </button>

              <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: -6 }}>
                Our team usually responds within 24 hours.
              </p>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', letterSpacing: '0.02em' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function SuccessState({ fingerprint, onClose, onAnother }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '32px 16px', gap: 14 }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: '#F0FDF4',
        border: '2px solid #86EFAC',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26,
      }}>
        ✓
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Issue Reported</div>
        <div style={{ fontSize: 13, color: '#6B7280', marginTop: 6, lineHeight: 1.5 }}>
          Your ticket has been submitted. The Syllabrix team will investigate and respond to your account.
        </div>
      </div>
      {fingerprint && (
        <div style={{
          padding: '8px 16px',
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: 8,
          fontSize: 12,
        }}>
          <span style={{ color: '#6B7280' }}>Reference: </span>
          <code style={{ fontWeight: 700, color: '#4F46E5' }}>{fingerprint}</code>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          onClick={onAnother}
          style={{ padding: '7px 16px', borderRadius: 7, border: '1.5px solid #E5E7EB', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#374151', fontWeight: 500 }}
        >
          Report another
        </button>
        <button
          onClick={onClose}
          style={{ padding: '7px 16px', borderRadius: 7, border: 'none', background: '#4F46E5', fontSize: 13, cursor: 'pointer', color: '#fff', fontWeight: 600 }}
        >
          Done
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  border: '1.5px solid #E5E7EB',
  borderRadius: 7,
  fontSize: 13,
  color: '#111827',
  background: '#fff',
  outline: 'none',
  fontFamily: 'var(--font-body)',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};
