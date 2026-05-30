import { useBreakpoint } from '../../hooks/useBreakpoint';

export default function Card({ children, style = {}, padding }) {
  const { isMobile } = useBreakpoint();
  const defaultPadding = isMobile ? 14 : 20;
  return (
    <div style={{
      background: '#fff',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border)',
      padding: padding ?? defaultPadding,
      ...style,
    }}>
      {children}
    </div>
  );
}
