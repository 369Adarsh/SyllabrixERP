// MobileShell.jsx
function MobileShell() {
  const [tab, setTab] = React.useState('home');
  React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

  return (
    <div className="m-app">
      <div className="m-top">
        <div className="m-top-l">
          <div className="m-top-mark"><img src="../../assets/logo-mark.svg" alt=""/></div>
          <div>
            <div className="m-top-name">Sharma Kirana</div>
            <div className="m-top-sub">Andheri W · Branch 2</div>
          </div>
        </div>
        <div className="m-top-r">
          <button className="m-top-btn"><i data-lucide="search"></i></button>
          <button className="m-top-btn"><i data-lucide="bell"></i></button>
        </div>
      </div>
      <div className="m-scroll">
        {tab === 'home' && <HomeScreen />}
        {tab === 'pos' && <PosScreen />}
        {tab === 'studio' && <AiStudioScreen />}
        {tab === 'reports' && <HomeScreen />}
        {tab === 'menu' && <HomeScreen />}
      </div>
      <nav className="m-tabs">
        <button className="m-tab" data-active={tab==='home'} onClick={() => setTab('home')}><i data-lucide="home"></i><span>Home</span></button>
        <button className="m-tab" data-active={tab==='pos'} onClick={() => setTab('pos')}><i data-lucide="store"></i><span>POS</span></button>
        <button className="m-tab m-tab-fab" onClick={() => setTab('studio')}><i data-lucide="sparkles"></i><span>AI</span></button>
        <button className="m-tab" data-active={tab==='reports'} onClick={() => setTab('reports')}><i data-lucide="bar-chart-3"></i><span>Reports</span></button>
        <button className="m-tab" data-active={tab==='menu'} onClick={() => setTab('menu')}><i data-lucide="menu"></i><span>More</span></button>
      </nav>
    </div>
  );
}
window.MobileShell = MobileShell;
