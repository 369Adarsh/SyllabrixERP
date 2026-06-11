import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BranchProvider } from './context/BranchContext';
import { PlatformAuthProvider } from './context/PlatformAuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Platform (Syllabrix Admin)
import PlatformLogin from './pages/platform/PlatformLogin';
import PlatformLayout from './pages/platform/PlatformLayout';
import PlatformDashboard from './pages/platform/PlatformDashboard';
import Tenants from './pages/platform/Tenants';
import Compliance from './pages/platform/Compliance';
import DevQueue from './pages/platform/DevQueue';
import ActivityMonitor from './pages/platform/ActivityMonitor';
import RoleRequests from './pages/platform/RoleRequests';
import Announcements from './pages/platform/Announcements';
import AuditLogs from './pages/platform/AuditLogs';
import Admins from './pages/platform/Admins';
import BusinessCatalog from './pages/platform/BusinessCatalog';
import RolesMatrix from './pages/platform/RolesMatrix';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import GetStarted from './pages/auth/GetStarted';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import Dashboard from './pages/dashboard/Dashboard';
import Inventory from './pages/inventory/Inventory';
import POS from './pages/pos/POS';
import Invoices from './pages/invoicing/Invoices';
import Customers from './pages/customers/Customers';
import Appointments from './pages/appointments/Appointments';
import Fees from './pages/fees/Fees';
import Reports from './pages/reports/Reports';
import Lease from './pages/lease/Lease';
import Settings from './pages/settings/Settings';
import AICopilot from './pages/ai/AICopilot';
import Vendors from './pages/vendors/Vendors';
import Expenses from './pages/expenses/Expenses';
import WhatsApp from './pages/whatsapp/WhatsApp';
import Assets from './pages/assets/Assets';
import StaffAttendance from './pages/staff/StaffAttendance';
import AttendancePage from './pages/attendance/AttendancePage';
import TrainingPlans from './pages/staff/TrainingPlans';
import CampaignManager from './pages/campaigns/CampaignManager';
import Accounts from './pages/accounts/Accounts';
import CreditNotes from './pages/creditnotes/CreditNotes';
import Quotations from './pages/quotations/Quotations';
import RecurringInvoices from './pages/invoicing/RecurringInvoices';
import Progress from './pages/progress/Progress';
import Marketplace from './pages/marketplace/Marketplace';
import MembershipPlans from './pages/membership-plans/MembershipPlans';
import Receipts from './pages/receipts/Receipts';
import PaymentRedirect from './pages/pay/PaymentRedirect';
import Returns from './pages/returns/Returns';
import StockNetwork from './pages/inventory/StockNetwork';
import StockTransfers from './pages/inventory/StockTransfers';
import Automation from './pages/automation/Automation';
import CodeAuditor from './pages/admin/CodeAuditor';
import OpdQueue from './pages/opd-queue/OpdQueue';
import OpdQueueBoard from './pages/opd-queue/OpdQueueBoard';
import VitalsPage from './pages/vitals/VitalsPage';
import ClinicalNotesPage from './pages/clinical-notes/ClinicalNotesPage';
import EMRPage from './pages/clinical-notes/EMRPage';
import PrescriptionsPage from './pages/prescriptions/PrescriptionsPage';
import PrescriptionEditor from './pages/prescriptions/PrescriptionEditor';
import LabOrdersPage from './pages/lab-orders/LabOrdersPage';
import LabOrderEditor from './pages/lab-orders/LabOrderEditor';
import ClinicBillingPage from './pages/clinic-billing/ClinicBillingPage';
import ClinicBillEditor from './pages/clinic-billing/ClinicBillEditor';
import MedicineInventoryPage from './pages/clinic-medicines/MedicineInventoryPage';
import ClinicDoctorsPage from './pages/clinic-doctors/ClinicDoctorsPage';
import ClinicPnLPage from './pages/clinic-pnl/ClinicPnLPage';
import ClinicReportsPage from './pages/clinic-reports/ClinicReportsPage';
import ABDMPage from './pages/abdm/ABDMPage';
import WardBedsPage from './pages/ipd-wards/WardBedsPage';
import IPDAdmissionsPage from './pages/ipd-admissions/IPDAdmissionsPage';
import DischargeSummaryPage from './pages/discharge-summary/DischargeSummaryPage';
import OTSessionsPage from './pages/ot-sessions/OTSessionsPage';
import LIMSPage from './pages/lims/LIMSPage';
import RadiologyPage from './pages/radiology/RadiologyPage';
import InsuranceClaimsPage from './pages/insurance-claims/InsuranceClaimsPage';
import VerifyRxPage from './pages/verify-rx/VerifyRxPage';
import SupportConsole from './pages/platform/SupportConsole';
import Revenue from './pages/platform/Revenue';
import Plans from './pages/platform/Plans';
import Onboarding from './pages/platform/Onboarding';
import FeatureFlags from './pages/platform/FeatureFlags';
import FeatureCatalog from './pages/platform/FeatureCatalog';
import ModuleUsage from './pages/platform/ModuleUsage';
import PlatformAnalytics from './pages/platform/PlatformAnalytics';
import ErrorTracker from './pages/platform/ErrorTracker';
import PlatformHealth from './pages/platform/PlatformHealth';
import Maintenance from './pages/platform/Maintenance';
import Subscriptions from './pages/platform/Subscriptions';
import PlanBuilder from './pages/platform/PlanBuilder';
import BusinessBuilder from './pages/platform/BusinessBuilder';
import ApiKeys from './pages/platform/ApiKeys';
import NerveRoles from './pages/platform/NerveRoles';
import LandingMedia from './pages/platform/LandingMedia';
import TransportManager from './pages/platform/TransportManager';
import TransportNew from './pages/platform/TransportNew';
import TransportDetail from './pages/platform/TransportDetail';
import TransportEnvironments from './pages/platform/TransportEnvironments';
import ChangeList from './pages/platform/ChangeList';
import ChangeNew from './pages/platform/ChangeNew';
import ChangeDetail from './pages/platform/ChangeDetail';

// Freelancer module
import FreelancerLogin from './pages/freelancer/FreelancerLogin';
import FreelancerRegister from './pages/freelancer/FreelancerRegister';
import FreelancerLayout from './pages/freelancer/FreelancerLayout';
import FreelancerProtectedRoute from './pages/freelancer/FreelancerProtectedRoute';
import FreelancerDashboard from './pages/freelancer/FreelancerDashboard';
import FreelancerJobs from './pages/freelancer/FreelancerJobs';
import FreelancerNewJob from './pages/freelancer/FreelancerNewJob';
import FreelancerJobDetail from './pages/freelancer/FreelancerJobDetail';
import FreelancerClients from './pages/freelancer/FreelancerClients';
import FreelancerExpenses from './pages/freelancer/FreelancerExpenses';
import FreelancerTeam from './pages/freelancer/FreelancerTeam';
import FreelancerSuppliers from './pages/freelancer/FreelancerSuppliers';
import FreelancerTools from './pages/freelancer/FreelancerTools';
import FreelancerAMC from './pages/freelancer/FreelancerAMC';
import FreelancerBills from './pages/freelancer/FreelancerBills';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  const isTrial = window.location.hostname === 'trial.syllabrix.com';
  return (
    <iframe
      src={isTrial ? '/trial-landing.html' : '/landing.html'}
      title="Syllabrix"
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', border: 'none', margin: 0, padding: 0 }}
    />
  );
}

const Placeholder = ({ name }) => (
  <div style={{ padding: 32 }}>
    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>{name}</h2>
    <p style={{ color: '#6B7280' }}>Coming up next — being built right now.</p>
  </div>
);

export default function App() {
  useEffect(() => {
    if (window.location.hostname === 'trial.syllabrix.com') {
      const link = document.querySelector("link[rel='icon']");
      if (link) link.href = '/trial-favicon.svg';
    }
  }, []);

  return (
    <BrowserRouter>
      <PlatformAuthProvider>
        <AuthProvider>
        <Toaster position="top-right" toastOptions={{ style: { fontFamily: 'var(--font-body)', fontSize: 14 } }} />
        <Routes>
          {/* ── Syllabrix Nerve Center ── */}
          <Route path="/platform/login" element={<PlatformLogin />} />
          <Route path="/platform" element={<PlatformLayout />}>
            <Route index element={<Navigate to="/platform/dashboard" replace />} />
            <Route path="dashboard" element={<PlatformDashboard />} />
            <Route path="tenants" element={<Tenants />} />
            <Route path="compliance" element={<Compliance />} />
            <Route path="role-requests" element={<RoleRequests />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="admins" element={<Admins />} />
            <Route path="business-catalog"  element={<BusinessCatalog />} />
            <Route path="roles-matrix"      element={<RolesMatrix />} />
            <Route path="support-console"   element={<SupportConsole />} />
            <Route path="dev-queue"         element={<DevQueue />} />
            <Route path="activity"          element={<ActivityMonitor />} />
            <Route path="revenue"           element={<Revenue />} />
            <Route path="plans"             element={<Plans />} />
            <Route path="onboarding"        element={<Onboarding />} />
            <Route path="feature-catalog"    element={<FeatureCatalog />} />
            <Route path="feature-flags"     element={<FeatureFlags />} />
            <Route path="module-usage"      element={<ModuleUsage />} />
            <Route path="analytics"         element={<PlatformAnalytics />} />
            <Route path="errors"            element={<ErrorTracker />} />
            <Route path="health"            element={<PlatformHealth />} />
            <Route path="maintenance"       element={<Maintenance />} />
            <Route path="subscriptions"     element={<Subscriptions />} />
            <Route path="plan-builder"      element={<PlanBuilder />} />
            <Route path="business-builder"  element={<BusinessBuilder />} />
            <Route path="api-keys"          element={<ApiKeys />} />
            <Route path="nerve-roles"       element={<NerveRoles />} />
            <Route path="landing-media"         element={<LandingMedia />} />
            <Route path="changes"               element={<ChangeList />} />
            <Route path="changes/new"           element={<ChangeNew />} />
            <Route path="changes/:id"           element={<ChangeDetail />} />
            <Route path="transport"             element={<TransportManager />} />
            <Route path="transport/new"         element={<TransportNew />} />
            <Route path="transport/environments" element={<TransportEnvironments />} />
            <Route path="transport/:id"         element={<TransportDetail />} />
          </Route>

          {/* ── Freelancer Module ── */}
          <Route path="/freelancer/login" element={<FreelancerLogin />} />
          <Route path="/freelancer/register" element={<FreelancerRegister />} />
          <Route path="/freelancer" element={<FreelancerProtectedRoute><FreelancerLayout /></FreelancerProtectedRoute>}>
            <Route index element={<Navigate to="/freelancer/dashboard" replace />} />
            <Route path="dashboard"  element={<FreelancerDashboard />} />
            <Route path="jobs"       element={<FreelancerJobs />} />
            <Route path="jobs/new"   element={<FreelancerNewJob />} />
            <Route path="jobs/:id"   element={<FreelancerJobDetail />} />
            <Route path="clients"    element={<FreelancerClients />} />
            <Route path="expenses"   element={<FreelancerExpenses />} />
            <Route path="team"       element={<FreelancerTeam />} />
            <Route path="suppliers"  element={<FreelancerSuppliers />} />
            <Route path="tools"      element={<FreelancerTools />} />
            <Route path="amc"        element={<FreelancerAMC />} />
            <Route path="bills"      element={<FreelancerBills />} />
          </Route>

          {/* ── Tenant App ── */}
          <Route path="/pay" element={<PaymentRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/get-started" element={<GetStarted />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/" element={<RootRedirect />} />

          <Route element={<ProtectedRoute><BranchProvider><AppLayout /></BranchProvider></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/invoices/*" element={<Invoices />} />
            <Route path="/customers/*" element={<Customers />} />
            <Route path="/appointments/*" element={<Appointments />} />
            <Route path="/fees/*" element={<Fees />} />
            <Route path="/progress/*" element={<Progress />} />
            <Route path="/lease/*" element={<Lease />} />
            <Route path="/reports/*" element={<Reports />} />
            <Route path="/ai/*" element={<AICopilot />} />
            <Route path="/vendors/*" element={<Vendors />} />
            <Route path="/expenses/*" element={<Expenses />} />
            <Route path="/whatsapp/*" element={<WhatsApp />} />
            <Route path="/assets/*" element={<Assets />} />
            <Route path="/staff/*" element={<StaffAttendance />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/campaigns/*" element={<CampaignManager />} />
            <Route path="/bills/*" element={<Navigate to="/vendors" replace />} />
            <Route path="/accounts/*" element={<Accounts />} />
            <Route path="/credit-notes/*" element={<CreditNotes />} />
            <Route path="/quotations/*" element={<Quotations />} />
            <Route path="/payroll/*" element={<Navigate to="/staff" replace />} />
            <Route path="/finance/*" element={<Navigate to="/reports" replace />} />
            <Route path="/recurring-invoices/*" element={<RecurringInvoices />} />
            <Route path="/marketplace/*" element={<Marketplace />} />
            <Route path="/membership-plans/*" element={<MembershipPlans />} />
            <Route path="/receipts/*" element={<Receipts />} />
            <Route path="/returns/*" element={<Returns />} />
            <Route path="/settings/*" element={<Settings />} />
            <Route path="/stock-network" element={<StockNetwork />} />
            <Route path="/stock-transfers" element={<StockTransfers />} />
            <Route path="/training-plans/*" element={<TrainingPlans />} />
            <Route path="/automation/*" element={<Automation />} />
            <Route path="/code-audit" element={<CodeAuditor />} />
            <Route path="/opd-queue" element={<OpdQueue />} />
            <Route path="/opd-queue/board" element={<OpdQueueBoard />} />
            <Route path="/vitals" element={<VitalsPage />} />
            <Route path="/clinical-notes" element={<ClinicalNotesPage />} />
            <Route path="/emr/:appointmentId" element={<EMRPage />} />
            <Route path="/prescriptions" element={<PrescriptionsPage />} />
            <Route path="/prescriptions/:id" element={<PrescriptionEditor />} />
            <Route path="/lab-orders" element={<LabOrdersPage />} />
            <Route path="/lab-orders/:id" element={<LabOrderEditor />} />
            <Route path="/clinic-billing" element={<ClinicBillingPage />} />
            <Route path="/clinic-billing/:id" element={<ClinicBillEditor />} />
            <Route path="/clinic-medicines" element={<MedicineInventoryPage />} />
            <Route path="/clinic-doctors" element={<ClinicDoctorsPage />} />
            <Route path="/clinic-pnl" element={<ClinicPnLPage />} />
            <Route path="/clinic-reports" element={<ClinicReportsPage />} />
            <Route path="/abdm" element={<ABDMPage />} />
            <Route path="/ipd-wards" element={<WardBedsPage />} />
            <Route path="/ipd-admissions" element={<IPDAdmissionsPage />} />
            <Route path="/discharge-summary" element={<DischargeSummaryPage />} />
            <Route path="/ot-sessions" element={<OTSessionsPage />} />
            <Route path="/lims" element={<LIMSPage />} />
            <Route path="/radiology" element={<RadiologyPage />} />
            <Route path="/insurance-claims" element={<InsuranceClaimsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        {/* Public routes (no auth) */}
        <Routes>
          <Route path="/verify-rx/:token" element={<VerifyRxPage />} />
        </Routes>
        </AuthProvider>
      </PlatformAuthProvider>
    </BrowserRouter>
  );
}
