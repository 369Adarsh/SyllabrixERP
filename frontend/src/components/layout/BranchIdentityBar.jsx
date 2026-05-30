import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';

export default function BranchIdentityBar() {
  const { user } = useAuth();
  const { currentBranch, hasBranches } = useBranch();

  // Show only when a branch is in context
  if (!hasBranches) return null;
  if (!currentBranch) return null;

  const isManager = user?.role === 'MANAGER';

  // For MANAGER: their own name + their own staff ID
  // For OWNER viewing a branch: that branch's manager name + manager's staff ID
  const managerName = isManager
    ? user?.name
    : (currentBranch.manager?.name || null);
  const managerId = isManager
    ? user?.syllabrixId
    : (currentBranch.manager?.syllabrixId || null);

  return (
    <div style={{
      background: '#fff',
      borderBottom: '1px solid #E9ECF0',
      padding: '0 28px',
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      height: 52,
      flexShrink: 0,
      position: 'relative',
      zIndex: 10,
    }}>

      {/* Left accent */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'linear-gradient(180deg, var(--cyan) 0%, #0E7490 100%)' }} />

      {/* ── Store / Branch ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20, lineHeight: 1 }}>{currentBranch.isHQ ? '🏢' : '🏪'}</span>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', lineHeight: 1.2 }}>{currentBranch.name}</span>
            {currentBranch.isHQ && (
              <span style={{ fontSize: 9, background: '#FEF3C7', color: '#B45309', padding: '1px 6px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>HQ</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
            <span style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Store ID</span>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'rgba(31,184,214,0.9)', letterSpacing: '0.05em' }}>
              {currentBranch.syllabrixId}
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      {managerName && (
        <div style={{ width: 1, height: 30, background: '#E9ECF0', margin: '0 20px', flexShrink: 0 }} />
      )}

      {/* ── Manager ── */}
      {managerName && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Avatar */}
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0,
          }}>
            {managerName[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', lineHeight: 1.2 }}>{managerName}</span>
              <span style={{ fontSize: 9, background: '#EDE9FE', color: '#7C3AED', padding: '1px 6px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Manager</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
              <span style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Staff ID</span>
              {managerId ? (
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'rgba(31,184,214,0.9)', letterSpacing: '0.05em' }}>
                  {managerId}
                </span>
              ) : (
                <span style={{ fontSize: 10, color: '#D1D5DB' }}>—</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Right: subtle branch code badge */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        {currentBranch.code && (
          <span style={{
            fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 800,
            color: 'rgba(255,255,255,0.9)',
            background: 'var(--navy)',
            padding: '4px 10px', borderRadius: 7, letterSpacing: '0.08em',
          }}>
            {currentBranch.code}
          </span>
        )}
      </div>
    </div>
  );
}
