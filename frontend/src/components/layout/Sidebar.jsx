import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/index.js';
import { resolvePermissions, MODULE_PATHS } from '../../constants/permissions';
import {
  LayoutDashboard, Package, ShoppingCart, FileText, Users,
  Calendar, GraduationCap, Building2, BarChart3, Settings, LogOut, Sparkles,
  Truck, Receipt, MessageCircle, Briefcase, UserCheck, Globe, Megaphone,
  CreditCard, FileX, ClipboardList, TrendingUp, BookOpen, Store, Award, RotateCcw,
  GitBranch, ChevronDown, Network, ArrowLeftRight, Flag, Code2, Dumbbell, Zap,
} from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'हि' },
  { code: 'ta', label: 'த' },
  { code: 'te', label: 'తె' },
  { code: 'mr', label: 'म' },
];

// Which roles can see each route. OWNER always sees everything.
const ALL = ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'STAFF', 'CASHIER'];
const OPS  = ['OWNER', 'ADMIN', 'MANAGER'];                          // operational staff
const FIN  = ['OWNER', 'ADMIN', 'ACCOUNTANT'];                       // finance-only
const OPS_FIN = ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT'];         // ops + accountant
const SALES = ['OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'CASHIER'];     // POS / customer-facing

const ALL_LINKS = [
  { to: '/dashboard',    icon: LayoutDashboard, tKey: 'nav.dashboard',   module: null,          roles: ALL },
  { to: '/inventory',    icon: Package,         tKey: 'nav.inventory',   module: 'inventory',   roles: OPS },
  { to: '/stock-network',   icon: Network,        label: 'Stock Network',   module: 'inventory', roles: ['OWNER'], branchesOnly: true },
  { to: '/stock-transfers', icon: ArrowLeftRight, label: 'Stock Transfers', module: 'inventory', roles: OPS,        branchesOnly: true },
  { to: '/pos',          icon: ShoppingCart,    tKey: 'nav.pos',         module: 'pos',         roles: SALES },
  { to: '/invoices',     icon: FileText,        tKey: 'nav.invoices',    module: 'invoicing',   roles: OPS_FIN },
  { to: '/customers',    icon: Users,           tKey: 'nav.customers',   module: 'customers',   roles: OPS_FIN },
  { to: '/appointments',       icon: Calendar,       tKey: 'nav.appointments',    module: 'appointments', roles: OPS },
  { to: '/membership-plans',  icon: Award,          tKey: 'nav.membershipPlans', module: 'membershipplans', roles: OPS, gymOnly: true },
  { to: '/receipts',          icon: CreditCard,     label: 'Receipts',           module: 'membershipplans', roles: OPS_FIN, gymOnly: true },
  { to: '/training-plans',    icon: Dumbbell,       label: 'Training Plans',     module: 'training',        roles: [...OPS, 'STAFF'], gymOnly: true },
  { to: '/fees',               icon: GraduationCap,  tKey: 'nav.fees',            module: 'fees',         roles: OPS },
  { to: '/progress',     icon: BookOpen,        tKey: 'nav.progress',    module: 'progress',    roles: OPS, educationOnly: true },
  { to: '/lease',        icon: Building2,       tKey: 'nav.lease',       module: 'lease',       roles: OPS_FIN },
  { to: '/vendors',      icon: Truck,           tKey: 'nav.vendors',     module: 'inventory',   roles: OPS },
  { to: '/marketplace',  icon: Store,           tKey: 'nav.marketplace', module: null,          roles: OPS },
  { to: '/expenses',     icon: Receipt,         tKey: 'nav.expenses',    module: null,          roles: OPS_FIN },
  { to: '/assets',       icon: Briefcase,       tKey: 'nav.assets',      module: null,          roles: OPS },
  { to: '/staff',        icon: UserCheck,       tKey: 'nav.staff',       module: null,          roles: OPS },
  { to: '/campaigns',    icon: Megaphone,       tKey: 'nav.campaigns',   module: 'campaigns',   roles: OPS },
  { to: '/whatsapp',     icon: MessageCircle,   tKey: 'nav.whatsapp',    module: 'whatsapp',    roles: OPS },
  { to: '/automation',   icon: Zap,             label: 'Automation',     module: 'automation',  roles: OPS },
  { to: '/accounts',     icon: CreditCard,      tKey: 'nav.accounts',    module: null,          roles: FIN },
  { to: '/quotations',   icon: ClipboardList,   tKey: 'nav.quotations',  module: null,          roles: OPS_FIN },
  { to: '/returns',      icon: RotateCcw,        tKey: 'nav.returns',     module: null,          roles: OPS_FIN },
  { to: '/credit-notes', icon: FileX,           tKey: 'nav.creditNotes', module: null,          roles: FIN },
  { to: '/reports',      icon: BarChart3,       tKey: 'nav.reports',     module: 'reports',     roles: OPS_FIN },
];

export default function Sidebar({ isOpen, onClose, isMobile, onOpenReport }) {
  const { user, tenant, logout } = useAuth();
  const { branches, currentBranch, setCurrentBranch, hasBranches, canSwitchBranch } = useBranch();
  const [branchOpen, setBranchOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const modules = Array.isArray(tenant?.modules) ? tenant.modules : [];
  const currentLang = i18n.language?.slice(0, 2) || 'en';
  const isGym = modules.includes('membershipplans');
  const isEducation = modules.includes('progress');
  const role = user?.role || 'STAFF';

  // Close branch dropdown on outside click
  useEffect(() => {
    if (!branchOpen) return;
    const close = () => setBranchOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [branchOpen]);

  const EDUCATION_HIDDEN = ['/invoices', '/assets', '/bills', '/accounts', '/quotations', '/credit-notes', '/payroll'];
  const GYM_HIDDEN = ['/lease', '/marketplace', '/quotations', '/credit-notes'];

  // Resolve effective permissions (role defaults + customPermissions overrides)
  const effectivePerms = resolvePermissions(user);

  // Check if a sidebar path is allowed by customPermissions
  const isPathAllowed = (path) => {
    if (role === 'OWNER') return true;
    // Only apply customPermissions check when user has them set
    if (!user?.customPermissions && !user?.permissionProfile) return null; // fallback to role-based
    for (const [modKey, paths] of Object.entries(MODULE_PATHS)) {
      if (paths.includes(path)) {
        const level = effectivePerms[modKey] || 'none';
        return level !== 'none';
      }
    }
    return true; // unknown path — allow
  };

  const links = ALL_LINKS.filter((l) => {
    if (l.gymOnly && !isGym) return false;
    if (isGym && GYM_HIDDEN.includes(l.to)) return false;
    if (isEducation && EDUCATION_HIDDEN.includes(l.to)) return false;
    if (l.educationOnly && !isEducation) return false;
    if (l.branchesOnly && !hasBranches) return false;

    // Custom permission check (overrides role-based if set)
    const customCheck = isPathAllowed(l.to);
    if (customCheck === false) return false;
    if (customCheck === true) return !l.module || modules.includes(l.module);

    // Fallback: original role-based filtering
    if (l.roles && !l.roles.includes(role)) return false;
    return !l.module || modules.includes(l.module);
  });

  const canAccessSettings = role === 'OWNER' || role === 'ADMIN' ||
    (effectivePerms.settings && effectivePerms.settings !== 'none');
  const canAccessAI = role === 'OWNER' || ['ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(role) ||
    (effectivePerms.ai && effectivePerms.ai !== 'none');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const switchLang = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('syllabrix_lang', code);
  };

  const handleNavClick = () => {
    if (isMobile) onClose();
  };

  const sidebarStyle = {
    width: 'var(--sidebar-w)',
    background: 'var(--navy)',
    color: '#fff',
    height: '100dvh',
    position: isMobile ? 'fixed' : 'fixed',
    left: 0,
    top: 0,
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
    transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isMobile && !isOpen ? 'translateX(-100%)' : 'translateX(0)',
    overflowX: 'hidden',
  };

  return (
    <aside style={sidebarStyle}>
      {/* Brand + Identity */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>

        {/* Syllabrix platform logo */}
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '5px 14px 5px 10px', display: 'inline-flex', alignItems: 'center', marginBottom: 12 }}>
          <img
            src="/logo.png"
            alt="Syllabrix"
            style={{ height: 32, objectFit: 'contain', display: 'block' }}
          />
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 10 }} />

        {/* Business logo + name + type */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          {tenant?.logoUrl ? (
            <img src={tenant.logoUrl} alt="logo" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 7, flexShrink: 0 }} />
          ) : (
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, var(--cyan) 0%, #0E5F72 100%)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {(tenant?.name || 'S')[0].toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {tenant?.name || 'Syllabrix'}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {tenant?.businessType?.replace(/_/g, ' ').toLowerCase()}
            </div>
          </div>
        </div>

        {/* Business identity row: ID badge + responsible person */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          {tenant?.syllabrixId && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(23,185,208,0.12)', border: '1px solid rgba(23,185,208,0.2)', borderRadius: 6, padding: '3px 8px', flexShrink: 0 }}>
              <div style={{ width: 5, height: 5, background: 'var(--cyan)', borderRadius: '50%', flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--cyan)', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
                {tenant.syllabrixId}
              </span>
            </div>
          )}
          {/* Responsible person — owner's name for business-level */}
          {(role === 'OWNER' || role === 'ADMIN') && user?.name && (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
              {user.name}
            </div>
          )}
        </div>
      </div>

      {/* Branch switcher — owners only, compact single line */}
      {hasBranches && canSwitchBranch && (
        <div style={{ padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, position: 'relative' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setBranchOpen(o => !o); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 7,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 7, padding: '6px 10px', cursor: 'pointer',
            }}
          >
            <GitBranch size={11} color="var(--cyan)" style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentBranch?.name || 'All Branches'}
            </span>
            <ChevronDown size={11} color="rgba(255,255,255,0.4)" style={{ transform: branchOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }} />
          </button>
          {branchOpen && (
            <div
              onClick={e => e.stopPropagation()}
              style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 10, right: 10,
                background: '#101D2C', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8, overflow: 'hidden', zIndex: 300, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}
            >
              <button
                onClick={() => { setCurrentBranch(null); setBranchOpen(false); }}
                style={{
                  width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none', cursor: 'pointer',
                  background: !currentBranch ? 'rgba(23,185,208,0.12)' : 'transparent',
                  color: !currentBranch ? 'var(--cyan)' : 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: 700,
                }}
              >
                All Branches
              </button>
              {branches.map(b => (
                <button
                  key={b.id}
                  onClick={() => { setCurrentBranch(b); setBranchOpen(false); }}
                  style={{
                    width: '100%', padding: '7px 12px', textAlign: 'left', border: 'none', cursor: 'pointer',
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                    background: currentBranch?.id === b.id ? 'rgba(23,185,208,0.12)' : 'transparent',
                    color: currentBranch?.id === b.id ? 'var(--cyan)' : 'rgba(255,255,255,0.65)',
                    fontSize: 12, fontWeight: currentBranch?.id === b.id ? 700 : 500,
                  }}
                >
                  {b.name}{b.isHQ ? <span style={{ fontSize: 9, color: 'rgba(31,184,214,0.5)', marginLeft: 5 }}>HQ</span> : null}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {links.map(({ to, icon: Icon, tKey, label: staticLabel }) => {
          let label = staticLabel || t(tKey);
          if (to === '/customers' && isEducation) label = 'Students';
          if (to === '/customers' && isGym) label = 'Members';
          if (to === '/appointments' && isGym) label = 'Sessions';
          if (to === '/membership-plans' && isGym) label = 'Plan Catalog';
          if (to === '/fees' && isGym) label = 'Fee Collection';
          if (to === '/assets' && isGym) label = 'Equipment';
          if (to === '/staff' && isGym) label = 'Trainers';
          return (
            <NavLink key={to} to={to} onClick={handleNavClick} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
              borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 500,
              color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
              background: isActive ? 'rgba(23,185,208,0.15)' : 'transparent',
              borderLeft: isActive ? '2px solid var(--cyan)' : '2px solid transparent',
              transition: 'all 0.15s',
              textDecoration: 'none',
            })}>
              <Icon size={16} />
              {label}
            </NavLink>
          );
        })}

        {/* AI Copilot */}
        {canAccessAI && (
          <NavLink to="/ai" onClick={handleNavClick} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
            borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 500, marginTop: 8,
            color: isActive ? 'var(--cyan)' : 'rgba(23,185,208,0.75)',
            background: isActive ? 'rgba(23,185,208,0.1)' : 'transparent',
            border: '1px solid rgba(23,185,208,0.25)',
            textDecoration: 'none',
          })}>
            <Sparkles size={16} />
            {t('nav.aiCopilot')}
          </NavLink>
        )}

        {/* Code Auditor — OWNER only */}
        {role === 'OWNER' && (
          <NavLink to="/code-audit" onClick={handleNavClick} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
            borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 500, marginTop: 4,
            color: isActive ? '#fff' : 'rgba(167,139,250,0.85)',
            background: isActive ? 'rgba(167,139,250,0.15)' : 'transparent',
            border: '1px solid rgba(167,139,250,0.25)',
            textDecoration: 'none',
          })}>
            <Code2 size={16} />
            Code Auditor
          </NavLink>
        )}

      </nav>

      {/* Bottom section — compact: language + user + branding */}
      <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.08)' }}>

        {/* Language row — no heading, just icon + pills */}
        <div style={{ padding: '7px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Globe size={11} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
          {LANGUAGES.map(({ code, label }) => (
            <button key={code} onClick={() => switchLang(code)} style={{
              padding: '3px 7px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
              background: currentLang === code ? 'var(--cyan)' : 'rgba(255,255,255,0.07)',
              color: currentLang === code ? '#fff' : 'rgba(255,255,255,0.35)',
              transition: 'all 0.12s',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Report Issue row */}
        <button
          onClick={onOpenReport}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 14px',
            background: 'none', border: 'none',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.3)',
            fontSize: 11, fontWeight: 500, letterSpacing: '0.02em',
            textAlign: 'left',
            transition: 'color 0.15s',
            fontFamily: 'var(--font-body)',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
        >
          <Flag size={11} style={{ flexShrink: 0 }} />
          Report an Issue
        </button>

        {/* User row — avatar + name/role/SYL-ID + settings + logout icons */}
        <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, background: 'var(--cyan)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#fff' }}>{user?.name}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ textTransform: 'capitalize' }}>{user?.role?.toLowerCase()}</span>
              {user?.syllabrixId && (
                <span style={{ color: 'rgba(23,185,208,0.8)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>· {user.syllabrixId}</span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            {canAccessSettings && (
              <NavLink to="/settings" onClick={handleNavClick} title="Settings"
                style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 7, padding: 6, cursor: 'pointer', color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                <Settings size={13} />
              </NavLink>
            )}
            <button onClick={handleLogout} title="Sign out"
              style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 7, padding: 6, cursor: 'pointer', color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center' }}>
              <LogOut size={13} />
            </button>
          </div>
        </div>

      </div>
    </aside>
  );
}
