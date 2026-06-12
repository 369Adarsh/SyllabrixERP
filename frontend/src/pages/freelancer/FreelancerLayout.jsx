import { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, Users, Receipt, TrendingDown,
  UserCheck, Package, Wrench, FileCheck, LogOut, Menu, X,
  BarChart3, Settings,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getSettings } from '../../api/freelancer';

const OR = '#f97316';
const DARK = '#0a0a0a';
const SIDEBAR_BG = '#111';
const BORDER = '#1a1a1a';
const TEXT = '#f1f5f9';
const MUTED = '#64748b';
const ACTIVE_BG = 'rgba(249,115,22,0.1)';

const MODULE_META = {
  jobs:      { icon: Briefcase,       defaultLabel: 'Jobs',          path: '/freelancer/jobs'      },
  clients:   { icon: Users,           defaultLabel: 'Clients',       path: '/freelancer/clients'   },
  finance:   { icon: BarChart3,       defaultLabel: 'Finance',       path: '/freelancer/finance'   },
  expenses:  { icon: TrendingDown,    defaultLabel: 'Expenses',      path: '/freelancer/expenses'  },
  bills:     { icon: Receipt,         defaultLabel: 'Bills',         path: '/freelancer/bills'     },
  team:      { icon: UserCheck,       defaultLabel: 'My Team',       path: '/freelancer/team'      },
  suppliers: { icon: Package,         defaultLabel: 'Suppliers',     path: '/freelancer/suppliers' },
  tools:     { icon: Wrench,          defaultLabel: 'My Tools',      path: '/freelancer/tools'     },
  amc:       { icon: FileCheck,       defaultLabel: 'AMC Contracts', path: '/freelancer/amc'       },
};

const DEFAULT_MODULES = ['jobs','clients','finance','expenses','bills','team','suppliers','tools','amc'];

export default function FreelancerLayout() {
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [activeModules, setActiveModules] = useState(DEFAULT_MODULES);
  const [moduleLabels, setModuleLabels] = useState({});

  const loadSettings = useCallback(() => {
    getSettings()
      .then(r => {
        setActiveModules(r.data.activeModules || DEFAULT_MODULES);
        setModuleLabels(r.data.moduleLabels || {});
      })
      .catch(() => {}); // fail silently — use defaults
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleLogout = async () => {
    await logout();
    navigate('/freelancer/login');
  };

  const navItems = activeModules
    .filter(key => MODULE_META[key])
    .map(key => ({
      to: MODULE_META[key].path,
      icon: MODULE_META[key].icon,
      label: moduleLabels[key] || MODULE_META[key].defaultLabel,
    }));

  const sidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand */}
      <div style={{ padding: '22px 18px 18px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, background: OR, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Wrench size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {tenant?.name || 'My Work'}
            </div>
            <div style={{ fontSize: 10, color: OR, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Freelancer</div>
          </div>
        </div>
      </div>

      {/* Dashboard (always first) */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        <NavLink
          to="/freelancer/dashboard"
          onClick={() => setOpen(false)}
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px',
            borderRadius: 9, marginBottom: 1, textDecoration: 'none', transition: 'all 0.12s',
            background: isActive ? ACTIVE_BG : 'transparent',
            color: isActive ? OR : MUTED, fontWeight: isActive ? 600 : 400, fontSize: 14,
            borderLeft: isActive ? `2px solid ${OR}` : '2px solid transparent',
          })}
        >
          <LayoutDashboard size={16} />
          Dashboard
        </NavLink>

        {/* Dynamic modules */}
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px',
              borderRadius: 9, marginBottom: 1, textDecoration: 'none', transition: 'all 0.12s',
              background: isActive ? ACTIVE_BG : 'transparent',
              color: isActive ? OR : MUTED, fontWeight: isActive ? 600 : 400, fontSize: 14,
              borderLeft: isActive ? `2px solid ${OR}` : '2px solid transparent',
            })}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}

        {/* Settings — always shown */}
        <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 8, paddingTop: 8 }}>
          <NavLink
            to="/freelancer/settings"
            onClick={() => setOpen(false)}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px',
              borderRadius: 9, marginBottom: 1, textDecoration: 'none', transition: 'all 0.12s',
              background: isActive ? ACTIVE_BG : 'transparent',
              color: isActive ? OR : MUTED, fontWeight: isActive ? 600 : 400, fontSize: 14,
              borderLeft: isActive ? `2px solid ${OR}` : '2px solid transparent',
            })}
          >
            <Settings size={16} />
            Settings
          </NavLink>
        </div>
      </nav>

      {/* User + logout */}
      <div style={{ padding: '12px 8px', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 11px', marginBottom: 2 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${OR}22`, border: `1.5px solid ${OR}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: OR, flexShrink: 0 }}>
            {(user?.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
            <div style={{ fontSize: 10, color: MUTED, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 11px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: MUTED, fontSize: 13, borderRadius: 8, transition: 'all 0.12s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = MUTED; e.currentTarget.style.background = 'none'; }}
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: DARK }}>
      {/* Desktop sidebar */}
      <aside className="fl-sidebar" style={{ width: 216, background: SIDEBAR_BG, borderRight: `1px solid ${BORDER}`, flexShrink: 0, position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }} onClick={() => setOpen(false)} />
          <aside style={{ position: 'relative', width: 230, background: SIDEBAR_BG, zIndex: 51, display: 'flex', flexDirection: 'column' }}>
            <button onClick={() => setOpen(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: MUTED }}>
              <X size={18} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ display: 'none', padding: '11px 16px', background: SIDEBAR_BG, borderBottom: `1px solid ${BORDER}`, alignItems: 'center', gap: 12 }} className="fl-mobile-header">
          <button onClick={() => setOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT }}>
            <Menu size={20} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{tenant?.name || 'Syllabrix Freelancer'}</span>
        </header>

        <main style={{ flex: 1, padding: '28px 28px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .fl-mobile-header { display: flex !important; }
          .fl-sidebar { display: none !important; }
        }
      `}</style>
    </div>
  );
}
