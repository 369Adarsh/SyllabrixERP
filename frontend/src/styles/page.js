/**
 * Shared page-level design tokens extracted from StockNetwork.jsx.
 * Every page imports from here to stay visually consistent.
 */

export const P = {
  // ── Outermost wrapper ──────────────────────────────────────────────────────
  wrap: (isMobile) => ({ padding: isMobile ? '16px' : '24px 32px' }),

  // ── Page header row (title + action buttons) ───────────────────────────────
  head: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 20, flexWrap: 'wrap', gap: 10,
  },

  // ── Titles ─────────────────────────────────────────────────────────────────
  h1: (isMobile) => ({
    fontFamily: 'var(--font-display)', fontWeight: 700,
    fontSize: isMobile ? 20 : 24, color: 'var(--navy)',
    letterSpacing: '-0.02em', marginBottom: 3,
  }),
  sub: { color: '#6B7280', fontSize: 14 },

  // ── Filter / toolbar row ───────────────────────────────────────────────────
  bar: { display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' },

  // ── Generic content card ───────────────────────────────────────────────────
  card: {
    background: '#fff', borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)', padding: '14px 16px',
  },

  // ── Stat card (clickable) ──────────────────────────────────────────────────
  stat: (active, activeBg, activeColor) => ({
    background: active ? activeBg : '#fff',
    border: `1.5px solid ${active ? activeColor : 'var(--border)'}`,
    borderRadius: 'var(--radius-lg)', padding: '14px 16px',
    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
  }),

  // ── Table ──────────────────────────────────────────────────────────────────
  tableWrap: {
    background: '#fff', borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border)', overflow: 'hidden',
  },
  tableScroll: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  thead: { background: '#F9FAFB', borderBottom: '1px solid var(--border)' },
  th: (align = 'left') => ({
    padding: '11px 16px', textAlign: align,
    fontWeight: 700, color: '#374151', whiteSpace: 'nowrap',
  }),
  td: (align = 'left') => ({ padding: '10px 16px', textAlign: align }),
  tr: (i, total) => ({ borderBottom: i < total - 1 ? '1px solid #F3F4F6' : 'none' }),
  tfoot: {
    padding: '10px 16px', background: '#F9FAFB',
    borderTop: '1px solid var(--border)', fontSize: 12, color: '#6B7280',
  },
  empty: { textAlign: 'center', padding: 48, color: '#9CA3AF' },

  // ── Input / search ─────────────────────────────────────────────────────────
  input: {
    padding: '9px 12px', borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--border)', fontSize: 13, outline: 'none',
    background: '#fff', fontFamily: 'var(--font-body)', boxSizing: 'border-box',
  },
  searchInput: {
    paddingLeft: 34, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
    borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border)',
    fontSize: 13, outline: 'none', background: '#fff',
    fontFamily: 'var(--font-body)', boxSizing: 'border-box', width: '100%',
  },

  // ── Buttons ────────────────────────────────────────────────────────────────
  btn: (variant = 'primary') => ({
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '9px 16px', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 600,
    cursor: 'pointer',
    ...(variant === 'primary' && { background: 'var(--navy)', color: '#fff', border: 'none' }),
    ...(variant === 'secondary' && { background: '#fff', color: 'var(--navy)', border: '1.5px solid var(--border)' }),
    ...(variant === 'danger' && { background: '#FEE2E2', color: '#DC2626', border: '1.5px solid #FECACA' }),
    ...(variant === 'ghost' && { background: 'none', color: '#6B7280', border: 'none' }),
  }),

  // ── Section heading inside a page (not the page title) ────────────────────
  sectionTitle: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
    color: 'var(--navy)', letterSpacing: '-0.01em', marginBottom: 12,
  },
};
