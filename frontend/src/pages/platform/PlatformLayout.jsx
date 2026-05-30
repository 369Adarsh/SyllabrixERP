import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { usePlatformAuth } from '../../context/PlatformAuthContext';

const NAV = [
  { section: 'Command' },
  { to: '/platform/dashboard',        icon: '▦',  label: 'Dashboard' },
  { to: '/platform/activity',         icon: '📡', label: 'Activity Monitor' },
  { to: '/platform/health',           icon: '❤️', label: 'Platform Health' },

  { section: 'Growth' },
  { to: '/platform/revenue',          icon: '💰', label: 'Revenue' },
  { to: '/platform/plans',            icon: '📋', label: 'Plans & Billing' },
  { to: '/platform/plan-builder',     icon: '🏗', label: 'Plan Creator' },
  { to: '/platform/onboarding',       icon: '🚀', label: 'Onboarding Pipeline' },

  { section: 'Tenants' },
  { to: '/platform/tenants',          icon: '🏢', label: 'All Tenants' },
  { to: '/platform/compliance',       icon: '🛡', label: 'Compliance & KYC' },
  { to: '/platform/subscriptions',    icon: '💳', label: 'Subscriptions' },

  { section: 'Platform Control' },
  { to: '/platform/business-builder',  icon: '🏗', label: 'Business Builder' },
  { to: '/platform/business-catalog',  icon: '🗂', label: 'Business Catalog' },
  { to: '/platform/roles-matrix',     icon: '⚡', label: 'Roles & Modules' },
  { to: '/platform/feature-catalog',  icon: '🎛', label: 'Feature Catalog' },
  { to: '/platform/feature-flags',    icon: '🚦', label: 'Feature Flags' },
  { to: '/platform/module-usage',     icon: '📊', label: 'Module Usage' },

  { section: 'Operations' },
  { to: '/platform/support-console',  icon: '🐛', label: 'Bug Reports' },
  { to: '/platform/dev-queue',        icon: '⚙️', label: 'Dev Queue' },
  { to: '/platform/announcements',    icon: '📣', label: 'Announcements' },
  { to: '/platform/maintenance',      icon: '🔧', label: 'Maintenance Mode' },

  { section: 'Intelligence' },
  { to: '/platform/analytics',        icon: '📈', label: 'Platform Analytics' },
  { to: '/platform/errors',           icon: '🔴', label: 'Error Tracker' },
  { to: '/platform/audit-logs',       icon: '📒', label: 'Audit Logs' },

  { section: 'Team' },
  { to: '/platform/admins',           icon: '👤', label: 'Admins' },

  { section: 'Configuration' },
  { to: '/platform/nerve-roles',      icon: '🛡', label: 'Roles & Access' },
  { to: '/platform/api-keys',         icon: '🔑', label: 'API Keys' },
  { to: '/platform/landing-media',    icon: '🖼', label: 'Landing Media' },
];

const ROLE_COLOR = { SUPER: '#27DCFF', ADMIN: '#A78BFA', SUPPORT: '#34D399' };

export default function PlatformLayout() {
  const { admin, loading, logout } = usePlatformAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { document.title = 'Nerve Center — Syllabrix'; }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Close sidebar on resize to desktop
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 768) setSidebarOpen(false); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  if (loading) return null;
  if (!admin) return <Navigate to="/platform/login" replace />;

  const handleLogout = () => {
    logout();
    navigate('/platform/login', { replace: true });
  };

  const sidebar = (
    <aside style={{
      width: 240, flexShrink: 0,
      background: '#0B131C',
      borderRight: '1px solid #1E2D3D',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', height: '100%',
    }}>
      {/* Logo */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #1E2D3D', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <img src="/logo-wordmark.svg" alt="Syllabrix" style={{ height: 30, objectFit: 'contain', display: 'block', marginBottom: 6 }} />
          <div style={{ fontSize: 9, color: '#1FB8D6', letterSpacing: '0.14em', fontWeight: 700, textTransform: 'uppercase' }}>
            Nerve Center
          </div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={() => setSidebarOpen(false)}
          style={{ background: 'none', border: 'none', color: '#64748B', fontSize: 20, cursor: 'pointer', display: 'none', padding: 4 }}
          className="nc-close-btn"
        >✕</button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 10px', overflowY: 'auto' }}>
        {NAV.map((item, i) => {
          if (item.section) {
            return (
              <div key={`section-${i}`} style={{
                fontSize: 9, fontWeight: 700, color: '#334155',
                letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '10px 12px 4px', marginTop: i === 0 ? 0 : 4,
              }}>
                {item.section}
              </div>
            );
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '7px 12px', borderRadius: 7, marginBottom: 1,
                color: isActive ? '#27DCFF' : '#64748B',
                background: isActive ? 'rgba(31,184,214,0.1)' : 'transparent',
                fontSize: 13, fontWeight: isActive ? 600 : 500,
                textDecoration: 'none', transition: 'all 0.15s',
              })}
            >
              <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Admin Info */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid #1E2D3D' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #1FB8D6, #27DCFF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#0B131C', flexShrink: 0,
          }}>
            {admin?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {admin?.name || 'Admin'}
            </div>
            <div style={{ fontSize: 11, color: ROLE_COLOR[admin?.role] || '#64748B', fontWeight: 600 }}>
              {admin?.role}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '7px',
            background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)',
            borderRadius: 6, color: '#F87171', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          .nc-desktop-sidebar { display: none !important; }
          .nc-mobile-topbar { display: flex !important; }
          .nc-mobile-drawer {
            position: fixed; top: 0; left: 0; height: 100vh; width: 240px;
            z-index: 1000; transform: translateX(-100%);
            transition: transform 0.25s ease;
          }
          .nc-mobile-drawer.open { transform: translateX(0); }
          .nc-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,0.6);
            z-index: 999; display: none;
          }
          .nc-overlay.open { display: block; }
          .nc-close-btn { display: block !important; }

          /* Content page responsive overrides */
          main > div { padding: 16px !important; }
          main h1 { font-size: 18px !important; }
          main h2 { font-size: 16px !important; }
          main table { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }
          main > div > div[style*="display: flex"] { flex-wrap: wrap !important; }
          main > div > div[style*="gap"] { gap: 12px !important; }
        }
        @media (min-width: 768px) {
          .nc-mobile-topbar { display: none !important; }
          .nc-mobile-drawer { display: none !important; }
          .nc-overlay { display: none !important; }
        }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', background: '#0F1923', overflow: 'hidden' }}>

        {/* Desktop Sidebar */}
        <div className="nc-desktop-sidebar" style={{ display: 'flex', height: '100%' }}>
          {sidebar}
        </div>

        {/* Mobile Overlay */}
        <div className={`nc-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

        {/* Mobile Drawer */}
        <div className={`nc-mobile-drawer ${sidebarOpen ? 'open' : ''}`}>
          {sidebar}
        </div>

        {/* Right side */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Mobile Top Bar */}
          <div className="nc-mobile-topbar" style={{
            display: 'none', alignItems: 'center', gap: 12,
            padding: '10px 16px', background: '#0B131C',
            borderBottom: '1px solid #1E2D3D', flexShrink: 0,
          }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: 'none', color: '#27DCFF', fontSize: 22, cursor: 'pointer', padding: 0, lineHeight: 1 }}
            >
              ☰
            </button>
            <div style={{ background: '#fff', borderRadius: 8, padding: '4px 10px' }}>
              <img src="/logo.png" alt="Syllabrix" style={{ height: 22, objectFit: 'contain', display: 'block' }} />
            </div>
            <div style={{ fontSize: 9, color: '#1FB8D6', letterSpacing: '0.14em', fontWeight: 700, textTransform: 'uppercase' }}>
              Nerve Center
            </div>
          </div>

          {/* Main Content */}
          <main style={{ flex: 1, minHeight: 0, overflow: 'auto', background: '#111C27', fontFamily: 'var(--font-body)' }}>
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
