import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
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
import CampaignManager from './pages/campaigns/CampaignManager';
import Bills from './pages/bills/Bills';
import Accounts from './pages/accounts/Accounts';
import CreditNotes from './pages/creditnotes/CreditNotes';
import Quotations from './pages/quotations/Quotations';
import Payroll from './pages/payroll/Payroll';
import Finance from './pages/finance/Finance';
import RecurringInvoices from './pages/invoicing/RecurringInvoices';

const Placeholder = ({ name }) => (
  <div style={{ padding: 32 }}>
    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>{name}</h2>
    <p style={{ color: '#6B7280' }}>Coming up next — being built right now.</p>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ style: { fontFamily: 'var(--font-body)', fontSize: 14 } }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/invoices/*" element={<Invoices />} />
            <Route path="/customers/*" element={<Customers />} />
            <Route path="/appointments/*" element={<Appointments />} />
            <Route path="/fees/*" element={<Fees />} />
            <Route path="/lease/*" element={<Lease />} />
            <Route path="/reports/*" element={<Reports />} />
            <Route path="/ai/*" element={<AICopilot />} />
            <Route path="/vendors/*" element={<Vendors />} />
            <Route path="/expenses/*" element={<Expenses />} />
            <Route path="/whatsapp/*" element={<WhatsApp />} />
            <Route path="/assets/*" element={<Assets />} />
            <Route path="/staff/*" element={<StaffAttendance />} />
            <Route path="/campaigns/*" element={<CampaignManager />} />
            <Route path="/bills/*" element={<Bills />} />
            <Route path="/accounts/*" element={<Accounts />} />
            <Route path="/credit-notes/*" element={<CreditNotes />} />
            <Route path="/quotations/*" element={<Quotations />} />
            <Route path="/payroll/*" element={<Payroll />} />
            <Route path="/finance/*" element={<Finance />} />
            <Route path="/recurring-invoices/*" element={<RecurringInvoices />} />
            <Route path="/settings/*" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
