import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, Users, Receipt, TrendingDown,
  UserCheck, Package, Wrench, FileCheck, LogOut, Menu, X, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const OR = '#F97316';
const DARK = '#0a0a0a';
const SIDEBAR_BG = '#111111';
const BORDER = '#1f1f1f';
const TEXT = '#F3F4F6';
const MUTED = '#6B7280';
const ACTIVE_BG = 'rgba(249,115,22,0.12)';

const NAV = [
  { to: '/freelancer/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/freelancer/jobs',       icon: Briefcase,        label: 'Jobs' },
  { to: '/freelancer/clients',    icon: Users,            label: 'Clients' },
  { to: '/freelancer/expenses',   icon: TrendingDown,     label: 'Expenses' },
  { to: '/freelancer/team',       icon: UserCheck,        label: 'My Team' },
  { to: '/freelancer/suppliers',  icon: Package,          label: 'Suppliers' },
  { to: '/freelancer/tools',      icon: Wrench,           label: 'My Tools' },
  { to: '/freelancer/amc',        icon: FileCheck,        label: 'AMC Contracts' },
  { to: '/freelancer/bills',      icon: Receipt,          label: 'Bills & Invoices' },
];

export default function FreelancerLayout() {
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/freelancer/login');
  };

  const sidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand */}
      <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: OR, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Wrench size={18} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, lineHeight: 1.2 }}>
              {tenant?.name || 'My Work'}
            </div>
            <div style={{ fontSize: 11, color: OR, fontWeight: 600 }}>Freelancer</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
              borderRadius: 10, marginBottom: 2, textDecoration: 'none', transition: 'all 0.15s',
              background: isActive ? ACTIVE_BG : 'transparent',
              color: isActive ? OR : MUTED,
              fontWeight: isActive ? 600 : 400,
              fontSize: 14,
            })}
          >
            <Icon size={16} strokeWidth={isActive => isActive ? 2.5 : 1.8} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div style={{ padding: '14px 10px', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 4 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(249,115,22,0.2)', border: `1.5px solid rgba(249,115,22,0.4)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: OR }}>
            {(user?.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'Freelancer'}</div>
            <div style={{ fontSize: 11, color: MUTED, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: MUTED, fontSize: 13, borderRadius: 8 }}
          onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = MUTED; e.currentTarget.style.background = 'none'; }}
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: DARK }}>
      {/* Desktop sidebar */}
      <aside className="fl-sidebar" style={{ width: 220, background: SIDEBAR_BG, borderRight: `1px solid ${BORDER}`, flexShrink: 0, display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }} onClick={() => setOpen(false)} />
          <aside style={{ position: 'relative', width: 240, background: SIDEBAR_BG, zIndex: 51, display: 'flex', flexDirection: 'column' }}>
            <button onClick={() => setOpen(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: MUTED }}>
              <X size={20} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile header */}
        <header style={{ display: 'none', padding: '12px 16px', background: SIDEBAR_BG, borderBottom: `1px solid ${BORDER}`, alignItems: 'center', gap: 12 }} className="fl-mobile-header">
          <button onClick={() => setOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT, display: 'flex', alignItems: 'center' }}>
            <Menu size={22} />
          </button>
          <span style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>Syllabrix Freelancer</span>
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
