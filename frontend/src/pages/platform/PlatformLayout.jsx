import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Navigate } from 'react-router-dom';
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

  useEffect(() => { document.title = 'Nerve Center — Syllabrix'; }, []);

  if (loading) return null;
  if (!admin) return <Navigate to="/platform/login" replace />;

  const handleLogout = () => {
    logout();
    navigate('/platform/login', { replace: true });
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0F1923', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: '#0B131C',
        borderRight: '1px solid #1E2D3D',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #1E2D3D' }}>
          <div style={{
            background: '#fff',
            borderRadius: 10,
            padding: '7px 12px',
            display: 'inline-block',
            marginBottom: 6,
          }}>
            <img
              src="/logo.png"
              alt="Syllabrix"
              style={{ height: 28, objectFit: 'contain', display: 'block' }}
            />
          </div>
          <div style={{ fontSize: 9, color: '#1FB8D6', letterSpacing: '0.14em', fontWeight: 700, textTransform: 'uppercase' }}>
            Nerve Center
          </div>
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

      {/* Main Content */}
      <main style={{
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
        background: '#111C27',
        fontFamily: 'var(--font-body)',
      }}>
        <Outlet />
      </main>
    </div>
  );
}
