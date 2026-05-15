// Sidebar.jsx — Syllabrix web app left navigation
function Sidebar({ profile, active, onSelect }) {
  const Item = ({ id, icon, label, badge }) => {
    const isActive = active === id;
    return (
      <button
        onClick={() => onSelect(id)}
        className="sb-item"
        data-active={isActive}
        title={label}
      >
        <i data-lucide={icon}></i>
        <span>{label}</span>
        {badge ? <span className="sb-badge">{badge}</span> : null}
      </button>
    );
  };

  return (
    <aside className="sb">
      <div className="sb-brand">
        <img src="../../assets/logo-mark.svg" alt="" width="32" height="32" />
        <span className="sb-brand-name">Syllabrix</span>
      </div>

      <button className="sb-branch">
        <div className="sb-branch-mark">{profile.branchInitial}</div>
        <div className="sb-branch-meta">
          <div className="sb-branch-name">{profile.branchName}</div>
          <div className="sb-branch-sub">{profile.branchSub}</div>
        </div>
        <i data-lucide="chevrons-up-down"></i>
      </button>

      <nav className="sb-nav">
        <div className="sb-section-label">Workspace</div>
        <Item id="home" icon="layout-dashboard" label="Home" />
        {profile.modules.map((m) => (
          <Item key={m.id} id={m.id} icon={m.icon} label={m.label} badge={m.badge} />
        ))}
        <div className="sb-section-label" style={{ marginTop: 16 }}>Grow</div>
        <Item id="marketing" icon="megaphone" label="Marketing" />
        <Item id="ai-studio" icon="sparkles" label="AI Studio" badge="New" />
        <Item id="reports" icon="bar-chart-3" label="Reports" />
        <div className="sb-section-label" style={{ marginTop: 16 }}>Account</div>
        <Item id="settings" icon="settings" label="Settings" />
        <Item id="help" icon="life-buoy" label="Help" />
      </nav>

      <div className="sb-foot">
        <div className="sb-avatar">RS</div>
        <div className="sb-foot-meta">
          <div className="sb-foot-name">Riya Sharma</div>
          <div className="sb-foot-sub">Owner</div>
        </div>
        <i data-lucide="more-horizontal"></i>
      </div>
    </aside>
  );
}

window.Sidebar = Sidebar;
