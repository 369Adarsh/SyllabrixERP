const colors = {
  green: { background: '#D1FAE5', color: '#065F46' },
  red: { background: '#FEE2E2', color: '#991B1B' },
  amber: { background: '#FEF3C7', color: '#92400E' },
  blue: { background: '#DBEAFE', color: '#1E40AF' },
  cyan: { background: '#CFFAFE', color: '#164E63' },
  gray: { background: 'var(--surface-2)', color: '#6B7280' },
};

export default function Badge({ children, color = 'gray' }) {
  return (
    <span style={{
      ...colors[color],
      padding: '2px 8px',
      borderRadius: 'var(--radius-pill)',
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      display: 'inline-block',
    }}>
      {children}
    </span>
  );
}
