// ModuleTile.jsx — small action card on the home grid
function ModuleTile({ icon, label, sub, tone = 'indigo', onClick }) {
  return (
    <button className={`mt mt-${tone}`} onClick={onClick}>
      <span className="mt-ico"><i data-lucide={icon}></i></span>
      <span className="mt-meta">
        <span className="mt-label">{label}</span>
        <span className="mt-sub">{sub}</span>
      </span>
      <i data-lucide="arrow-up-right" className="mt-arrow"></i>
    </button>
  );
}
window.ModuleTile = ModuleTile;
