// KpiCard.jsx
function KpiCard({ label, value, delta, deltaTone = 'pos', sub, variant = 'default', icon }) {
  const toneClass = { pos: 'kpi-delta-pos', neg: 'kpi-delta-neg', flat: 'kpi-delta-flat' }[deltaTone];
  return (
    <div className={`kpi kpi-${variant}`}>
      <div className="kpi-row">
        <div className="kpi-label">{label}</div>
        {icon ? <i data-lucide={icon}></i> : null}
      </div>
      <div className="kpi-value numeric">{value}</div>
      <div className="kpi-foot">
        {delta ? <span className={`kpi-delta ${toneClass}`}>{delta}</span> : null}
        {sub ? <span className="kpi-sub">{sub}</span> : null}
      </div>
      <Sparkline variant={variant} />
    </div>
  );
}

function Sparkline({ variant }) {
  const stroke = variant === 'gradient' ? '#F8B547' : (variant === 'saffron' ? '#0F1020' : '#2D2BB8');
  const fill   = variant === 'gradient' ? 'rgba(248,181,71,0.18)' : (variant === 'saffron' ? 'rgba(15,16,32,0.10)' : 'rgba(45,43,184,0.10)');
  return (
    <svg className="kpi-spark" viewBox="0 0 120 32" preserveAspectRatio="none">
      <path d="M0 24 L12 20 L24 22 L36 14 L48 16 L60 10 L72 12 L84 6 L96 8 L108 4 L120 6 L120 32 L0 32 Z" fill={fill}/>
      <path d="M0 24 L12 20 L24 22 L36 14 L48 16 L60 10 L72 12 L84 6 L96 8 L108 4 L120 6" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

window.KpiCard = KpiCard;
