import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTR, approveTR, promoteTR, rollbackTR, toggleTRScopeLock, addTRComment, addTRTestScenario, updateTRTestResult } from '../../api/platform';
import toast from 'react-hot-toast';

const STATUS_META = {
  DRAFT:         { label: 'Draft',         color: '#94A3B8' },
  APPROVED:      { label: 'Approved',      color: '#1FB8D6' },
  DEVELOPMENT:   { label: 'Development',   color: '#64748B' },
  TESTING:       { label: 'Testing',       color: '#EAB308' },
  IN_QUALITY:    { label: 'In Quality',    color: '#A78BFA' },
  IN_PRODUCTION: { label: 'In Production', color: '#34D399' },
  ROLLED_BACK:   { label: 'Rolled Back',   color: '#F87171' },
};

const CATEGORY_COLOR = {
  FEATURE: '#1FB8D6', BUGFIX: '#F87171', ENHANCEMENT: '#A78BFA', CONFIG: '#94A3B8', HOTFIX: '#EF4444',
};

const PRIORITY_COLOR = { CRITICAL: '#EF4444', HIGH: '#F97316', MEDIUM: '#EAB308', LOW: '#64748B' };

const LOG_ICON = {
  CREATED:                '✦',
  APPROVED:               '✔',
  STATUS_CHANGED:         '→',
  PROMOTED_TO_QUALITY:    '↑',
  PROMOTED_TO_PRODUCTION: '▲',
  ROLLED_BACK:            '↩',
  COMMENT_ADDED:          '·',
  SCOPE_LOCKED:           '⊘',
  SCOPE_UNLOCKED:         '○',
  TEST_RESULT_RECORDED:   '✓',
};

const NEXT_LABEL = { APPROVED: 'Development', DEVELOPMENT: 'Testing', TESTING: 'Quality', IN_QUALITY: 'Production' };

export default function TransportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tr, setTr]           = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('overview'); // overview | tests | comments | audit
  const [working, setWorking] = useState(false);

  // Comment form
  const [comment, setComment] = useState('');
  // Test scenario form
  const [newScenario, setNewScenario] = useState({ title: '', steps: '', expectedResult: '' });
  const [addingScenario, setAddingScenario] = useState(false);
  // Rollback reason modal
  const [rollbackModal, setRollbackModal] = useState(false);
  const [rollbackReason, setRollbackReason] = useState('');

  const load = async () => {
    try {
      const { data } = await getTR(id);
      setTr(data.data);
    } catch { toast.error('Failed to load TR'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handlePromote = async () => {
    if (!window.confirm(`Promote to ${NEXT_LABEL[tr.status]}?`)) return;
    setWorking(true);
    try {
      await promoteTR(id);
      toast.success(`Promoted to ${NEXT_LABEL[tr.status]}`);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Promotion failed'); }
    finally    { setWorking(false); }
  };

  const handleRollback = async () => {
    if (!rollbackReason.trim()) return toast.error('Please enter a reason for rollback');
    setWorking(true);
    try {
      await rollbackTR(id, rollbackReason);
      toast.success('Rollback complete');
      setRollbackModal(false);
      setRollbackReason('');
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Rollback failed'); }
    finally    { setWorking(false); }
  };

  const handleScopeLock = async () => {
    setWorking(true);
    try {
      await toggleTRScopeLock(id);
      toast.success(tr.scopeLocked ? 'Scope lock removed' : 'Scope lock applied');
      load();
    } catch (e) { toast.error('Failed to toggle scope lock'); }
    finally    { setWorking(false); }
  };

  const handleApprove = async () => {
    if (!window.confirm(`Approve "${tr.trCode}: ${tr.title}"? This will allow development to begin.`)) return;
    setWorking(true);
    try {
      await approveTR(id);
      toast.success(`${tr.trCode} approved — ready for development`);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Approval failed'); }
    finally    { setWorking(false); }
  };

  const copyWorkOrder = () => {
    const lines = [
      '╔══════════════════════════════════════════════════════╗',
      '║              SYLLABRIX WORK ORDER                    ║',
      '╠══════════════════════════════════════════════════════╣',
      `║ TR Code      : ${tr.trCode}`,
      `║ Type         : ${tr.category}`,
      `║ Title        : ${tr.title}`,
      `║ Business Type: ${tr.businessTypeCode}`,
      `║ Modules      : ${(tr.modulesAffected || []).join(', ') || '—'}`,
      `║ Priority     : ${tr.priority}`,
      '╠══════════════════════════════════════════════════════╣',
      '║ PROBLEM',
      tr.problem || '(not specified)',
      '╠══════════════════════════════════════════════════════╣',
      '║ SOLUTION',
      tr.solution || '(not specified)',
      '╠══════════════════════════════════════════════════════╣',
      '║ IN SCOPE',
      tr.inScope || '(not specified)',
      '╠══════════════════════════════════════════════════════╣',
      '║ OUT OF SCOPE',
      tr.outOfScope || '(not specified)',
      '╠══════════════════════════════════════════════════════╣',
      '║ TEST SCENARIOS',
      ...(tr.testScenarios?.length
        ? tr.testScenarios.map((s, i) => `${i + 1}. ${s.title}`)
        : ['(no test scenarios added yet)']),
      '╚══════════════════════════════════════════════════════╝',
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Work Order copied to clipboard');
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    try {
      await addTRComment(id, comment.trim());
      setComment('');
      load();
    } catch { toast.error('Failed to add comment'); }
  };

  const handleAddScenario = async () => {
    if (!newScenario.title.trim()) return toast.error('Scenario title required');
    try {
      await addTRTestScenario(id, newScenario);
      setNewScenario({ title: '', steps: '', expectedResult: '' });
      setAddingScenario(false);
      load();
    } catch { toast.error('Failed to add test scenario'); }
  };

  const handleTestResult = async (scenarioId, result) => {
    try {
      await updateTRTestResult(id, scenarioId, { result });
      load();
    } catch { toast.error('Failed to update test result'); }
  };

  if (loading) return <div style={{ padding: 40, color: '#64748B', fontSize: 14 }}>Loading…</div>;
  if (!tr)     return <div style={{ padding: 40, color: '#F87171', fontSize: 14 }}>TR not found</div>;

  const statusMeta = STATUS_META[tr.status] || STATUS_META.DEVELOPMENT;
  const canApprove  = tr.status === 'DRAFT';
  const canPromote  = !!NEXT_LABEL[tr.status] && !tr.scopeLocked;
  const canRollback = ['IN_QUALITY', 'IN_PRODUCTION'].includes(tr.status);

  return (
    <div style={{ padding: 28, maxWidth: 900, margin: '0 auto' }}>
      {/* Back + breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={() => navigate('/platform/transport')} style={backBtn}>← All TRs</button>
        <span style={{ color: '#334155', fontSize: 13 }}>/</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#1FB8D6' }}>{tr.trCode}</span>
      </div>

      {/* Title + status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#64748B' }}>{tr.trCode}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: statusMeta.color, background: `${statusMeta.color}18`, padding: '3px 10px', borderRadius: 99 }}>
              {statusMeta.label}
            </span>
            {tr.scopeLocked && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#F97316', background: 'rgba(249,115,22,0.12)', padding: '3px 10px', borderRadius: 99 }}>
                SCOPE LOCKED
              </span>
            )}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#F1F5F9', lineHeight: 1.3 }}>
            {tr.title}
          </h1>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button onClick={copyWorkOrder}
            style={{ ...ghostBtn, color: '#1FB8D6', borderColor: 'rgba(31,184,214,0.3)' }}>
            Copy Work Order
          </button>
          <button onClick={handleScopeLock} disabled={working}
            style={{ ...ghostBtn, color: tr.scopeLocked ? '#F97316' : '#64748B', borderColor: tr.scopeLocked ? 'rgba(249,115,22,0.4)' : '#1E2D3D' }}>
            {tr.scopeLocked ? 'Unlock' : 'Lock'}
          </button>
          {canRollback && (
            <button onClick={() => setRollbackModal(true)} disabled={working}
              style={{ ...ghostBtn, color: '#F87171', borderColor: 'rgba(248,113,113,0.3)' }}>
              Rollback
            </button>
          )}
          {canApprove && (
            <button onClick={handleApprove} disabled={working}
              style={{ padding: '8px 20px', background: 'linear-gradient(135deg,#34D399,#10B981)', border: 'none', borderRadius: 8, color: '#0B131C', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              {working ? '…' : 'Approve TR'}
            </button>
          )}
          {canPromote && (
            <button onClick={handlePromote} disabled={working}
              style={{ padding: '8px 20px', background: 'linear-gradient(135deg,#1FB8D6,#27DCFF)', border: 'none', borderRadius: 8, color: '#0B131C', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              {working ? '…' : tr.status === 'APPROVED' ? 'Begin Development' : `Promote → ${NEXT_LABEL[tr.status]}`}
            </button>
          )}
        </div>
      </div>

      {/* Meta chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <Chip color={CATEGORY_COLOR[tr.category]} label={tr.category} />
        <Chip color={PRIORITY_COLOR[tr.priority]} label={`${tr.priority} PRIORITY`} />
        <Chip color="#64748B" label={tr.businessTypeCode} mono />
        {tr.modulesAffected?.map((m) => <Chip key={m} color="#334155" label={m} />)}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #1E2D3D', marginBottom: 24 }}>
        {[['overview', 'Overview'], ['tests', `Tests (${tr.testScenarios?.length || 0})`], ['comments', `Comments (${tr.comments?.length || 0})`], ['audit', 'Audit Log']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding: '9px 16px', background: 'none', border: 'none', borderBottom: `2px solid ${tab === key ? '#1FB8D6' : 'transparent'}`, color: tab === key ? '#1FB8D6' : '#64748B', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: -1 }}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {tr.description && (
            <Section title="Description">
              <p style={{ color: '#94A3B8', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{tr.description}</p>
            </Section>
          )}
          {(tr.problem || tr.solution) && (
            <Section title="Change Document">
              {tr.problem && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Problem</div>
                  <p style={{ color: '#94A3B8', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{tr.problem}</p>
                </div>
              )}
              {tr.solution && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Solution</div>
                  <p style={{ color: '#94A3B8', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{tr.solution}</p>
                </div>
              )}
              {(tr.inScope || tr.outOfScope) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {tr.inScope && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#34D399', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>In Scope</div>
                      <p style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{tr.inScope}</p>
                    </div>
                  )}
                  {tr.outOfScope && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#F87171', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Out of Scope</div>
                      <p style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{tr.outOfScope}</p>
                    </div>
                  )}
                </div>
              )}
            </Section>
          )}
          {tr.testPlanNotes && (
            <Section title="Test Plan Notes">
              <p style={{ color: '#94A3B8', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{tr.testPlanNotes}</p>
            </Section>
          )}
          <Section title="Details">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Detail label="Created By" value={tr.createdBy} />
              <Detail label="Created At" value={new Date(tr.createdAt).toLocaleString('en-IN')} />
              {tr.assignedReviewer && <Detail label="Reviewer" value={tr.assignedReviewer} />}
              {tr.approvedBy && <Detail label="Approved By" value={tr.approvedBy} />}
              {tr.approvedAt && <Detail label="Approved At" value={new Date(tr.approvedAt).toLocaleString('en-IN')} />}
              {tr.promotedToQualityAt && <Detail label="Quality At" value={new Date(tr.promotedToQualityAt).toLocaleString('en-IN')} />}
              {tr.promotedToProdAt && <Detail label="Production At" value={new Date(tr.promotedToProdAt).toLocaleString('en-IN')} />}
              {tr.rolledBackAt && <Detail label="Rolled Back At" value={new Date(tr.rolledBackAt).toLocaleString('en-IN')} />}
              {tr.rolledBackReason && <Detail label="Rollback Reason" value={tr.rolledBackReason} />}
            </div>
          </Section>
          {tr.gitCommits?.length > 0 && (
            <Section title="Git Commits">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {tr.gitCommits.map((sha) => (
                  <span key={sha} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#1FB8D6', background: 'rgba(31,184,214,0.08)', padding: '4px 10px', borderRadius: 6 }}>{sha}</span>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      {/* Tab: Tests */}
      {tab === 'tests' && (
        <div>
          {tr.testScenarios?.map((s) => (
            <div key={s.id} style={{ background: '#192533', border: '1px solid #1E2D3D', borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0' }}>{s.title}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['PASSED', 'FAILED'].map((r) => (
                    <button key={r} onClick={() => handleTestResult(s.id, r)}
                      style={{ padding: '3px 12px', fontSize: 11, fontWeight: 700, borderRadius: 6, cursor: 'pointer', border: 'none',
                        background: s.result === r ? (r === 'PASSED' ? '#34D399' : '#F87171') : '#1E2D3D',
                        color:      s.result === r ? '#0B131C' : '#64748B',
                      }}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              {s.steps && <p style={{ fontSize: 12, color: '#64748B', marginBottom: 4, whiteSpace: 'pre-wrap' }}><strong style={{ color: '#94A3B8' }}>Steps:</strong> {s.steps}</p>}
              {s.expectedResult && <p style={{ fontSize: 12, color: '#64748B', whiteSpace: 'pre-wrap' }}><strong style={{ color: '#94A3B8' }}>Expected:</strong> {s.expectedResult}</p>}
              {s.testedBy && <p style={{ fontSize: 11, color: '#334155', marginTop: 6 }}>Tested by {s.testedBy} · {s.testedAt ? new Date(s.testedAt).toLocaleDateString('en-IN') : ''}</p>}
            </div>
          ))}

          {!addingScenario ? (
            <button onClick={() => setAddingScenario(true)}
              style={{ padding: '8px 16px', background: 'rgba(31,184,214,0.08)', border: '1px dashed #1FB8D6', borderRadius: 8, color: '#1FB8D6', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%', marginTop: 8 }}>
              + Add Test Scenario
            </button>
          ) : (
            <div style={{ background: '#192533', border: '1px solid #1E2D3D', borderRadius: 10, padding: 16, marginTop: 8 }}>
              <input value={newScenario.title} onChange={(e) => setNewScenario((s) => ({ ...s, title: e.target.value }))}
                placeholder="Scenario title *" style={{ ...miniInput, marginBottom: 8 }} />
              <textarea value={newScenario.steps} onChange={(e) => setNewScenario((s) => ({ ...s, steps: e.target.value }))}
                placeholder="Steps to reproduce / test…" rows={2} style={{ ...miniInput, resize: 'vertical', marginBottom: 8 }} />
              <textarea value={newScenario.expectedResult} onChange={(e) => setNewScenario((s) => ({ ...s, expectedResult: e.target.value }))}
                placeholder="Expected result…" rows={2} style={{ ...miniInput, resize: 'vertical', marginBottom: 12 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleAddScenario}
                  style={{ padding: '7px 16px', background: 'linear-gradient(135deg,#1FB8D6,#27DCFF)', border: 'none', borderRadius: 7, color: '#0B131C', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                  Add
                </button>
                <button onClick={() => setAddingScenario(false)}
                  style={{ padding: '7px 14px', background: 'transparent', border: '1px solid #1E2D3D', borderRadius: 7, color: '#64748B', fontSize: 12, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Comments */}
      {tab === 'comments' && (
        <div>
          {tr.comments?.map((c) => (
            <div key={c.id} style={{ background: '#192533', border: '1px solid #1E2D3D', borderRadius: 10, padding: '12px 16px', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#1FB8D6' }}>{c.author}</span>
                <span style={{ fontSize: 11, color: '#64748B' }}>{new Date(c.createdAt).toLocaleString('en-IN')}</span>
              </div>
              <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{c.body}</p>
            </div>
          ))}
          <div style={{ background: '#192533', border: '1px solid #1E2D3D', borderRadius: 10, padding: 14, marginTop: 8 }}>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment…" rows={3}
              style={{ ...miniInput, resize: 'vertical', marginBottom: 10 }} />
            <button onClick={handleComment} disabled={!comment.trim()}
              style={{ padding: '7px 18px', background: comment.trim() ? 'linear-gradient(135deg,#1FB8D6,#27DCFF)' : '#1E2D3D', border: 'none', borderRadius: 7, color: comment.trim() ? '#0B131C' : '#64748B', fontWeight: 700, fontSize: 12, cursor: comment.trim() ? 'pointer' : 'not-allowed' }}>
              Post Comment
            </button>
          </div>
        </div>
      )}

      {/* Tab: Audit Log */}
      {tab === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {tr.logs?.map((log, i) => (
            <div key={log.id} style={{ display: 'flex', gap: 14, paddingBottom: 16, position: 'relative' }}>
              {i < tr.logs.length - 1 && (
                <div style={{ position: 'absolute', left: 16, top: 28, bottom: 0, width: 1, background: '#1E2D3D' }} />
              )}
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1E2D3D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, zIndex: 1 }}>
                {LOG_ICON[log.action] || '·'}
              </div>
              <div style={{ flex: 1, paddingTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0' }}>{log.action.replace(/_/g, ' ')}</span>
                  <span style={{ fontSize: 11, color: '#64748B', fontFamily: 'var(--font-mono)' }}>{new Date(log.createdAt).toLocaleString('en-IN')}</span>
                </div>
                <span style={{ fontSize: 12, color: '#64748B' }}>by {log.performedBy}</span>
                {log.notes && <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>{log.notes}</p>}
                {log.fromStatus && log.toStatus && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <StatusPill status={log.fromStatus} />
                    <span style={{ color: '#64748B', fontSize: 12 }}>→</span>
                    <StatusPill status={log.toStatus} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rollback Modal */}
      {rollbackModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#192533', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 12, padding: 28, width: 460, maxWidth: '90vw' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#F87171', marginBottom: 8 }}>Rollback {tr.trCode}</h3>
            <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 16, lineHeight: 1.6 }}>
              This will revert the {tr.status === 'IN_PRODUCTION' ? 'production' : 'quality'} branch to its pre-promotion state. This action cannot be undone from the UI.
            </p>
            <textarea value={rollbackReason} onChange={(e) => setRollbackReason(e.target.value)}
              placeholder="Reason for rollback (required)…" rows={3}
              style={{ ...miniInput, resize: 'vertical', marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setRollbackModal(false); setRollbackReason(''); }}
                style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #1E2D3D', borderRadius: 8, color: '#64748B', fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleRollback} disabled={working || !rollbackReason.trim()}
                style={{ padding: '8px 20px', background: rollbackReason.trim() ? 'rgba(248,113,113,0.15)' : '#1E2D3D', border: '1px solid rgba(248,113,113,0.4)', borderRadius: 8, color: rollbackReason.trim() ? '#F87171' : '#64748B', fontWeight: 700, fontSize: 13, cursor: rollbackReason.trim() ? 'pointer' : 'not-allowed' }}>
                {working ? 'Rolling back…' : '↩ Confirm Rollback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const Chip = ({ color, label, mono }) => (
  <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}18`, padding: '3px 10px', borderRadius: 99, fontFamily: mono ? 'var(--font-mono)' : undefined }}>
    {label}
  </span>
);

const Section = ({ title, children }) => (
  <div style={{ background: '#192533', border: '1px solid #1E2D3D', borderRadius: 10, padding: '16px 18px' }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>{title}</div>
    {children}
  </div>
);

const Detail = ({ label, value }) => (
  <div>
    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
    <div style={{ fontSize: 13, color: '#94A3B8' }}>{value}</div>
  </div>
);

const StatusPill = ({ status }) => {
  const m = { DRAFT: '#94A3B8', APPROVED: '#1FB8D6', DEVELOPMENT: '#64748B', TESTING: '#EAB308', IN_QUALITY: '#A78BFA', IN_PRODUCTION: '#34D399', ROLLED_BACK: '#F87171' };
  const c = m[status] || '#64748B';
  return <span style={{ fontSize: 11, color: c, background: `${c}18`, padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>{status.replace(/_/g, ' ')}</span>;
};

const backBtn   = { padding: '7px 14px', background: 'transparent', border: '1px solid #1E2D3D', borderRadius: 7, color: '#64748B', fontSize: 12, fontWeight: 600, cursor: 'pointer' };
const ghostBtn  = { padding: '8px 14px', background: 'transparent', border: '1px solid #1E2D3D', borderRadius: 8, color: '#64748B', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const miniInput = { width: '100%', padding: '8px 12px', background: '#0F1923', border: '1px solid #1E2D3D', borderRadius: 7, color: '#F1F5F9', fontSize: 13, outline: 'none', boxSizing: 'border-box' };
