// TopBar.jsx — search, business-type switcher, notifications, user
function TopBar({ profile, onProfileChange, theme, onTheme }) {
  const profiles = [
    { id: 'retail',   label: 'Retail · Kirana' },
    { id: 'coaching', label: 'Coaching institute' },
    { id: 'salon',    label: 'Salon' },
    { id: 'clinic',   label: 'Clinic' },
  ];
  return (
    <header className="tb">
      <div className="tb-search">
        <i data-lucide="search"></i>
        <input placeholder={`Search ${profile.searchHint}…`} />
        <kbd>⌘K</kbd>
      </div>
      <div className="tb-actions">
        <div className="tb-switcher">
          <i data-lucide="building"></i>
          <select value={profile.id} onChange={(e) => onProfileChange(e.target.value)}>
            {profiles.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <i data-lucide="chevron-down"></i>
        </div>
        <button className="tb-icon" onClick={onTheme} title="Toggle theme">
          <i data-lucide={theme === 'dark' ? 'sun' : 'moon'}></i>
        </button>
        <button className="tb-icon" title="Notifications">
          <i data-lucide="bell"></i>
          <span className="tb-dot"></span>
        </button>
        <button className="tb-cta">
          <i data-lucide="plus"></i>
          <span>{profile.primaryAction}</span>
        </button>
      </div>
    </header>
  );
}
window.TopBar = TopBar;
