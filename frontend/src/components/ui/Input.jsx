export default function Input({ label, error, hint, type = 'text', ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{label}</label>}
      <input
        type={type}
        style={{
          padding: '9px 12px',
          border: `1px solid ${error ? 'var(--vermilion)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-md)',
          background: '#fff',
          fontSize: 14,
          color: 'var(--ink)',
          outline: 'none',
          transition: 'border-color 0.15s',
          width: '100%',
        }}
        onFocus={(e) => e.target.style.borderColor = error ? 'var(--vermilion)' : 'var(--cyan)'}
        onBlur={(e) => e.target.style.borderColor = error ? 'var(--vermilion)' : 'var(--border)'}
        {...props}
      />
      {error && <span style={{ fontSize: 12, color: 'var(--vermilion)' }}>{error}</span>}
      {hint && !error && <span style={{ fontSize: 12, color: '#888' }}>{hint}</span>}
    </div>
  );
}
