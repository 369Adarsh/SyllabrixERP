import { useBreakpoint } from '../../hooks/useBreakpoint';

/**
 * Compact single-line stat strip — same fixed height (52px desktop, auto mobile)
 * on every page. Content is always clipped to card boundaries.
 *
 * Usage:
 *   <KpiBar stats={[
 *     { icon: TrendingDown, label: 'Total Expenses', value: '₹32,62,699', sub: '150 tx', color: '#EF4444' },
 *     { icon: ReceiptText,  label: 'Largest Category', value: 'SALARIES', sub: '₹19,80,000', color: '#F59E0B' },
 *   ]} />
 */
export default function KpiBar({ stats = [], style = {} }) {
  const { isMobile } = useBreakpoint();

  if (isMobile) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 8,
        marginBottom: 12,
        ...style,
      }}>
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} style={{
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '9px 11px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              overflow: 'hidden',
            }}>
              {Icon && (
                <div style={{
                  width: 26, height: 26, borderRadius: 'var(--radius-md)',
                  background: (s.color || 'var(--cyan)') + '18',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={12} color={s.color || 'var(--cyan)'} />
                </div>
              )}
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.01em', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 10, color: '#6B7280', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.label}{s.sub ? ` · ${s.sub}` : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      height: 52,
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      marginBottom: 16,
      ...style,
    }}>
      {stats.map((s, i) => {
        const Icon = s.icon;
        return (
          <div key={i} style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            padding: '0 16px',
            borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
            minWidth: 0,
            overflow: 'hidden',
          }}>
            {Icon && (
              <div style={{
                width: 28, height: 28, borderRadius: 'var(--radius-md)',
                background: (s.color || 'var(--cyan)') + '18',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={13} color={s.color || 'var(--cyan)'} />
              </div>
            )}
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.01em', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {s.value}
              </div>
              <div style={{ fontSize: 10, color: '#6B7280', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {s.label}{s.sub ? ` · ${s.sub}` : ''}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
