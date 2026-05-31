import { useState, useCallback, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, HelpCircle } from 'lucide-react';
import Sidebar from './Sidebar';
import BranchIdentityBar from './BranchIdentityBar';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import ReportIssue from '../shared/ReportIssue';
import { getActiveMaintenance, getAnnouncements } from '../../api/index';
import HelpDrawer from '../HelpDrawer';

// Route prefix → { moduleKey, moduleName }
const MODULE_HELP_MAP = {
  '/invoices':          { moduleKey: 'invoicing',      moduleName: 'Invoices' },
  '/inventory':         { moduleKey: 'inventory',      moduleName: 'Inventory' },
  '/pos':               { moduleKey: 'pos',            moduleName: 'Point of Sale' },
  '/expenses':          { moduleKey: 'expenses',       moduleName: 'Expenses' },
  '/customers':         { moduleKey: 'customers',      moduleName: 'Customers' },
  '/appointments':      { moduleKey: 'appointments',   moduleName: 'Appointments' },
  '/fees':              { moduleKey: 'fees',           moduleName: 'Fees' },
  '/progress':          { moduleKey: 'progress',       moduleName: 'Students' },
  '/lease':             { moduleKey: 'lease',          moduleName: 'Lease' },
  '/reports':           { moduleKey: 'reports',        moduleName: 'Reports' },
  '/ai':                { moduleKey: 'ai',             moduleName: 'AI Copilot' },
  '/vendors':           { moduleKey: 'vendors',        moduleName: 'Vendors & Bills' },
  '/whatsapp':          { moduleKey: 'whatsapp',       moduleName: 'WhatsApp' },
  '/assets':            { moduleKey: 'assets',         moduleName: 'Assets' },
  '/staff':             { moduleKey: 'staff',          moduleName: 'Staff & Payroll' },
  '/campaigns':         { moduleKey: 'campaigns',      moduleName: 'Campaigns' },
  '/accounts':          { moduleKey: 'accounts',       moduleName: 'Accounts' },
  '/credit-notes':      { moduleKey: 'invoicing',      moduleName: 'Credit Notes' },
  '/quotations':        { moduleKey: 'quotations',     moduleName: 'Quotations' },
  '/recurring-invoices':{ moduleKey: 'invoicing',      moduleName: 'Recurring Invoices' },
  '/marketplace':       { moduleKey: 'b2b',            moduleName: 'B2B Marketplace' },
  '/membership-plans':  { moduleKey: 'membershipplans',moduleName: 'Memberships' },
  '/returns':           { moduleKey: 'invoicing',      moduleName: 'Returns' },
  '/training-plans':    { moduleKey: 'training',       moduleName: 'Training Plans' },
  '/automation':        { moduleKey: 'automation',     moduleName: 'Automation' },
};

export default function AppLayout() {
  const { isMobile } = useBreakpoint();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [maintenance, setMaintenance] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]'); } catch { return []; }
  });

  // Detect current module from route
  const currentModule = Object.entries(MODULE_HELP_MAP).find(([prefix]) =>
    location.pathname === prefix || location.pathname.startsWith(prefix + '/')
  )?.[1] || null;

  // Close help drawer when navigating to a different module
  useEffect(() => { setHelpOpen(false); }, [location.pathname]);

  useEffect(() => {
    getActiveMaintenance().then(r => setMaintenance(r.data?.data || null)).catch(() => {});
    getAnnouncements().then(r => setAnnouncements(r.data?.data || [])).catch(() => {});
  }, []);

  const dismissAnnouncement = (id) => {
    const updated = [...dismissedAnnouncements, id];
    setDismissedAnnouncements(updated);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(updated));
  };

  const visibleAnnouncements = announcements.filter(a => !dismissedAnnouncements.includes(a.id));

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>
      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <button
          onClick={() => setSidebarOpen(o => !o)}
          style={{ background: 'none', border: 'none', color: '#fff', padding: 4, display: 'flex', alignItems: 'center', flexShrink: 0 }}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <div
          onClick={() => navigate('/dashboard')}
          style={{ background: 'rgba(255,255,255,0.93)', borderRadius: 8, padding: '3px 10px 3px 8px', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
        >
          <img src="/logo.png" alt="Syllabrix" style={{ height: 28, objectFit: 'contain', display: 'block' }} />
        </div>
        {currentModule && (
          <button
            onClick={() => setHelpOpen(o => !o)}
            style={{ background: 'none', border: 'none', color: '#fff', padding: 4, display: 'flex', alignItems: 'center', flexShrink: 0 }}
            aria-label="How to use"
            title={`How to use ${currentModule.moduleName}`}
          >
            <HelpCircle size={22} />
          </button>
        )}
      </div>

      {/* Sidebar backdrop (mobile only) */}
      {isMobile && sidebarOpen && (
        <div className="sidebar-backdrop" onClick={closeSidebar} />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} isMobile={isMobile} onOpenReport={() => setReportOpen(true)} />

      <main style={{
        marginLeft: isMobile ? 0 : 'var(--sidebar-w)',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        paddingTop: isMobile ? 56 : 0,
        minWidth: 0,
      }}>
        {/* Maintenance Mode banner — shown when Syllabrix has activated platform maintenance */}
        {maintenance && (
          <div style={{
            background: '#7F1D1D', borderBottom: '1px solid #991B1B',
            padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>🔧</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#FCA5A5' }}>{maintenance.title} — </span>
              <span style={{ fontSize: 13, color: '#FECACA' }}>{maintenance.message}</span>
              {maintenance.endAt && (
                <span style={{ fontSize: 12, color: '#FCA5A580', marginLeft: 8 }}>
                  Expected end: {new Date(maintenance.endAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Syllabrix Announcements — published system-wide messages */}
        {visibleAnnouncements.map(ann => (
          <div key={ann.id} style={{
            background: '#1E3A5F', borderBottom: '1px solid #1E40AF',
            padding: '9px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
          }}>
            <span style={{ fontSize: 15, flexShrink: 0 }}>📣</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#93C5FD' }}>{ann.title} — </span>
              <span style={{ fontSize: 13, color: '#BFDBFE' }}>{ann.body}</span>
            </div>
            <button
              onClick={() => dismissAnnouncement(ann.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60A5FA', fontSize: 16, padding: '2px 6px', lineHeight: 1, flexShrink: 0 }}
              title="Dismiss"
            >×</button>
          </div>
        ))}

        {/* Sticky identity bar — shows branch + manager when branch is in context */}
        <BranchIdentityBar />

        {/* Scrollable page content */}
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--cream)', position: 'relative' }}>
          <Outlet />

          {/* Syllabrix watermark — fixed bottom-right of content area */}
          <div style={{
            position: 'fixed',
            bottom: 10,
            right: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            pointerEvents: 'none',
            zIndex: 10,
            opacity: 0.28,
          }}>
            <img src="/logo.png" alt="Syllabrix" style={{ height: 22, objectFit: 'contain' }} />
          </div>

          <ReportIssue open={reportOpen} onClose={() => setReportOpen(false)} />

          {/* Floating "How to use" button — desktop only; mobile uses topbar icon */}
          {currentModule && !helpOpen && !isMobile && (
            <button
              onClick={() => setHelpOpen(true)}
              title={`How to use ${currentModule.moduleName}`}
              style={{
                position: 'fixed',
                bottom: 20,
                left: isMobile ? 16 : 'calc(var(--sidebar-w) + 16px)',
                zIndex: 200,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                borderRadius: 20,
                background: 'var(--navy)',
                color: '#fff',
                border: 'none',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(15,41,66,0.3)',
                letterSpacing: '0.02em',
                opacity: 0.75,
              }}
            >
              <span style={{ fontSize: 13 }}>📖</span>
              How to use
            </button>
          )}
        </div>
      </main>

      {/* Help Drawer — rendered outside main so it overlays everything */}
      {helpOpen && currentModule && (
        <HelpDrawer
          moduleKey={currentModule.moduleKey}
          moduleName={currentModule.moduleName}
          onClose={() => setHelpOpen(false)}
        />
      )}
    </div>
  );
}
