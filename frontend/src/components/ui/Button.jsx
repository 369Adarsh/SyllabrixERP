const variants = {
  primary: { background: 'var(--navy)', color: '#fff', border: 'none' },
  secondary: { background: 'var(--surface-2)', color: 'var(--ink)', border: '1px solid var(--border)' },
  danger: { background: 'var(--vermilion)', color: '#fff', border: 'none' },
  ghost: { background: 'transparent', color: 'var(--navy)', border: '1px solid var(--border)' },
  cyan: { background: 'var(--cyan)', color: '#fff', border: 'none' },
};

const sizes = {
  sm: { padding: '6px 12px', fontSize: '13px', borderRadius: 'var(--radius-md)' },
  md: { padding: '9px 18px', fontSize: '14px', borderRadius: 'var(--radius-md)' },
  lg: { padding: '12px 24px', fontSize: '15px', borderRadius: 'var(--radius-lg)' },
};

export default function Button({
  children, variant = 'primary', size = 'md',
  loading = false, disabled = false, fullWidth = false,
  onClick, type = 'button', style = {},
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...variants[variant],
        ...sizes[size],
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: fullWidth ? '100%' : 'auto',
        opacity: disabled ? 0.5 : 1,
        transition: 'opacity 0.15s, transform 0.08s',
        ...style,
      }}
      onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
      onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      {loading ? <span style={{ width: 16, height: 16, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> : null}
      {children}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}
