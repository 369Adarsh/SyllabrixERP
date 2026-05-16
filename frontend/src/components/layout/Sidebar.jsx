import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/index.js';
import {
  LayoutDashboard, Package, ShoppingCart, FileText, Users,
  Calendar, GraduationCap, Building2, BarChart3, Settings, LogOut, Sparkles,
  Truck, Receipt, MessageCircle, Briefcase, UserCheck, Globe, Megaphone,
  Landmark, CreditCard, FileX, ClipboardList, Users2, TrendingUp,
} from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'हि' },
  { code: 'ta', label: 'த' },
  { code: 'te', label: 'తె' },
  { code: 'mr', label: 'म' },
];

const ALL_LINKS = [
  { to: '/dashboard',   icon: LayoutDashboard, tKey: 'nav.dashboard',   module: null },
  { to: '/inventory',   icon: Package,         tKey: 'nav.inventory',   module: 'inventory' },
  { to: '/pos',         icon: ShoppingCart,    tKey: 'nav.pos',         module: 'pos' },
  { to: '/invoices',    icon: FileText,        tKey: 'nav.invoices',    module: 'invoicing' },
  { to: '/customers',   icon: Users,           tKey: 'nav.customers',   module: 'customers' },
  { to: '/appointments',icon: Calendar,        tKey: 'nav.appointments',module: 'appointments' },
  { to: '/fees',        icon: GraduationCap,   tKey: 'nav.fees',        module: 'fees' },
  { to: '/lease',       icon: Building2,       tKey: 'nav.lease',       module: 'lease' },
  { to: '/vendors',     icon: Truck,           tKey: 'nav.vendors',     module: 'inventory' },
  { to: '/expenses',    icon: Receipt,         tKey: 'nav.expenses',    module: null },
  { to: '/assets',      icon: Briefcase,       tKey: 'nav.assets',      module: null },
  { to: '/staff',       icon: UserCheck,       tKey: 'nav.staff',       module: null },
  { to: '/campaigns',   icon: Megaphone,       tKey: 'nav.campaigns',   module: 'customers' },
  { to: '/bills',       icon: Landmark,        tKey: 'nav.bills',       module: null },
  { to: '/accounts',    icon: CreditCard,      tKey: 'nav.accounts',    module: null },
  { to: '/quotations',  icon: ClipboardList,   tKey: 'nav.quotations',  module: null },
  { to: '/credit-notes',icon: FileX,           tKey: 'nav.creditNotes', module: null },
  { to: '/payroll',     icon: Users2,          tKey: 'nav.payroll',     module: null },
  { to: '/finance',     icon: TrendingUp,      tKey: 'nav.finance',     module: null },
  { to: '/reports',     icon: BarChart3,       tKey: 'nav.reports',     module: 'reports' },
  { to: '/whatsapp',    icon: MessageCircle,   tKey: 'nav.whatsapp',    module: null },
];

export default function Sidebar() {
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const modules = Array.isArray(tenant?.modules) ? tenant.modules : [];
  const currentLang = i18n.language?.slice(0, 2) || 'en';

  const links = ALL_LINKS.filter((l) => !l.module || modules.includes(l.module));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const switchLang = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('syllabrix_lang', code);
  };

  return (
    <aside style={{
      width: 'var(--sidebar-w)', background: 'var(--navy)', color: '#fff',
      height: '100vh', position: 'fixed', left: 0, top: 0,
      display: 'flex', flexDirection: 'column', zIndex: 100,
    }}>
      {/* Brand */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <img src="/logo.png" alt="Syllabrix" style={{ height: 28, objectFit: 'contain', marginBottom: 10, filter: 'brightness(0) invert(1)' }} />
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#fff', letterSpacing: '-0.01em' }}>
          {tenant?.name || 'Syllabrix'}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {tenant?.businessType?.toLowerCase()}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {links.map(({ to, icon: Icon, tKey }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
            borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 500,
            color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
            background: isActive ? 'rgba(31,184,214,0.15)' : 'transparent',
            borderLeft: isActive ? '2px solid var(--cyan)' : '2px solid transparent',
            transition: 'all 0.15s',
            textDecoration: 'none',
          })}>
            <Icon size={16} />
            {t(tKey)}
          </NavLink>
        ))}

        {/* AI Copilot */}
        <NavLink to="/ai" style={({ isActive }) => ({
          display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
          borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 500, marginTop: 8,
          color: isActive ? 'var(--electric)' : 'rgba(39,220,255,0.7)',
          background: isActive ? 'rgba(39,220,255,0.1)' : 'transparent',
          border: '1px solid rgba(39,220,255,0.2)',
          textDecoration: 'none',
        })}>
          <Sparkles size={16} />
          {t('nav.aiCopilot')}
        </NavLink>
      </nav>

      {/* Language Switcher */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Globe size={12} color="rgba(255,255,255,0.4)" />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('language.label')}</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {LANGUAGES.map(({ code, label }) => (
            <button key={code} onClick={() => switchLang(code)} style={{
              padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: currentLang === code ? 'var(--cyan)' : 'rgba(255,255,255,0.08)',
              color: currentLang === code ? '#fff' : 'rgba(255,255,255,0.45)',
              transition: 'all 0.15s',
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 10px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <NavLink to="/settings" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 'var(--radius-md)', color: 'rgba(255,255,255,0.55)', fontSize: 14, textDecoration: 'none' }}>
          <Settings size={16} />{t('nav.settings')}
        </NavLink>
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 'var(--radius-md)', color: 'rgba(255,255,255,0.45)', fontSize: 14, background: 'none', border: 'none', width: '100%' }}>
          <LogOut size={16} />{t('nav.signOut')}
        </button>
        <div style={{ padding: '8px 12px', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: 'var(--cyan)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{user?.role?.toLowerCase()}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
