import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import { P } from '../../styles/page';
import { getDashboard, getPendingActions, getDailySummary, getHomework, bulkUpdateSubmissions, getExams, getCategoryReport, getStaff, getAppointments } from '../../api';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import KpiBar from '../../components/ui/KpiBar';
import {
  TrendingUp, ShoppingCart, FileText, Users, Package, AlertTriangle,
  Calendar, GraduationCap, Building2, DollarSign, UserCheck,
  Clock, Home, AlertCircle, CheckCircle, ArrowRight, Truck, MessageCircle,
  Zap, Send, BookOpen, ChevronDown, ChevronUp, Circle, CheckCircle2,
  Dumbbell, Award, Phone, Mail, Activity, Star,
} from 'lucide-react';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// ── KpiCard — card-style KPI tile (used where KpiBar doesn't fit) ─────────────
function KpiCard({ label, value, sub, icon: Icon, color = 'var(--cyan)', alert = false }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${alert ? '#FECACA' : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        {Icon && <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={14} color={color} /></div>}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: alert ? 'var(--vermilion)' : 'var(--navy)', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#6B7280' }}>{sub}</div>}
    </div>
  );
}

// ── Revenue Trend — 7-day CSS bar chart ───────────────────────────────────────
function RevenueTrendChart({ data, title = '7-day revenue trend' }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.revenue), 1);
  const total = data.reduce((s, d) => s + d.revenue, 0);
  const todayRevenue = data[data.length - 1]?.revenue || 0;

  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{title}</div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>7-day total: {fmt(total)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#9CA3AF' }}>Today</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--cyan)' }}>{fmt(todayRevenue)}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 64 }}>
        {data.map((d, i) => {
          const pct = Math.max((d.revenue / max) * 100, d.revenue > 0 ? 6 : 2);
          const isToday = i === data.length - 1;
          return (
            <div key={d.date} title={`${d.day}: ${fmt(d.revenue)}`}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ width: '100%', height: `${pct}%`, background: isToday ? 'var(--cyan)' : 'var(--navy)', opacity: isToday ? 1 : 0.25, borderRadius: '4px 4px 2px 2px', transition: 'height 0.5s ease', minHeight: 3 }} />
              <div style={{ fontSize: 10, color: isToday ? 'var(--cyan)' : '#9CA3AF', fontWeight: isToday ? 700 : 400 }}>{d.day}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Recent Transactions ────────────────────────────────────────────────────────
function RecentTransactionsPanel({ transactions }) {
  if (!transactions?.length) return null;
  const PM_COLOR = { CASH: 'var(--emerald)', UPI: 'var(--cyan)', CARD: 'var(--navy)', CREDIT: 'var(--amber)', CHEQUE: '#9CA3AF' };
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 18px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Recent transactions</span>
        <a href="/pos" style={{ fontSize: 12, color: 'var(--cyan)', fontWeight: 600, textDecoration: 'none' }}>Open POS →</a>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {transactions.map((t, i) => {
          const time = new Date(t.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
          const isToday = new Date(t.createdAt).toDateString() === new Date().toDateString();
          const pmColor = PM_COLOR[t.paymentMethod] || '#6B7280';
          return (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid #F9FAFB' : 'none' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: pmColor, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.customer?.name || 'Walk-in'}
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>{isToday ? time : new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{fmt(t.total)}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: pmColor }}>{t.paymentMethod}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuickAction({ label, sub, href, color, icon: Icon }) {
  const nav = useNavigate();
  const { isMobile } = useBreakpoint();
  return (
    <div onClick={() => nav(href)} style={{
      background: '#fff', borderRadius: 10, padding: isMobile ? '10px 12px' : '14px 16px', cursor: 'pointer',
      border: `1px solid var(--border)`, borderLeft: `3px solid ${color}`,
      boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12,
      transition: 'box-shadow 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
    >
      {Icon && <div style={{ width: isMobile ? 28 : 34, height: isMobile ? 28 : 34, borderRadius: 8, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={isMobile ? 13 : 16} color={color} />
      </div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: isMobile ? 12 : 13, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
        {sub && !isMobile && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{sub}</div>}
      </div>
      {!isMobile && <ArrowRight size={14} color="#D1D5DB" />}
    </div>
  );
}

// ── Business-type KPI layouts ────────────────────────────────────────────────

function POSKpis({ stats }) {
  const monthRev = stats.month?.revenue || 0;
  const lastMonthRev = stats.lastMonthRevenue || 0;
  const trend = lastMonthRev > 0 ? Math.round(((monthRev - lastMonthRev) / lastMonthRev) * 100) : null;
  const trendLabel = trend !== null ? (trend >= 0 ? `↑ ${trend}% vs last month` : `↓ ${Math.abs(trend)}% vs last month`) : `${stats.month?.transactions || 0} transactions`;
  const kpis = [
    { icon: TrendingUp,   label: "Today's revenue",  value: fmt(stats.today?.revenue),  sub: `${stats.today?.transactions || 0} sales today`,   color: 'var(--emerald)' },
    { icon: ShoppingCart, label: 'This month',        value: fmt(monthRev),              sub: trendLabel,                                        color: 'var(--cyan)' },
    { icon: FileText,     label: 'Pending invoices',  value: stats.pendingInvoices || 0, sub: `${stats.overdueInvoices || 0} overdue`,           color: stats.overdueInvoices > 0 ? 'var(--vermilion)' : 'var(--navy)' },
    { icon: Users,        label: 'Customers',         value: stats.customers || 0,       sub: `${stats.products || 0} products`,                 color: 'var(--navy)' },
  ];
  if (stats.todayAppointments > 0) kpis.push({ icon: Calendar, label: 'Appointments today', value: stats.todayAppointments, color: 'var(--amber)' });
  return (
    <>
      <KpiBar stats={kpis} />
      {(stats.expiredProducts > 0 || stats.expiringProducts > 0 || stats.lowStockProducts > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
          {stats.expiredProducts > 0 && (
            <a href="/inventory?filter=expired" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: '#FEE2E2', color: 'var(--vermilion)', fontSize: 12, fontWeight: 600, textDecoration: 'none', border: '1px solid #FECACA' }}>
              <AlertCircle size={13} /> {stats.expiredProducts} expired
            </a>
          )}
          {stats.expiringProducts > 0 && (
            <a href="/inventory?filter=expiring" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: '#FEF3C7', color: '#B45309', fontSize: 12, fontWeight: 600, textDecoration: 'none', border: '1px solid #FDE68A' }}>
              <AlertTriangle size={13} /> {stats.expiringProducts} expiring soon
            </a>
          )}
          {stats.lowStockProducts > 0 && (
            <a href="/inventory?filter=low-stock" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: '#FEF3C7', color: '#B45309', fontSize: 12, fontWeight: 600, textDecoration: 'none', border: '1px solid #FDE68A' }}>
              <AlertTriangle size={13} /> {stats.lowStockProducts} low stock
            </a>
          )}
        </div>
      )}
    </>
  );
}

function SalonPosKpis({ stats }) {
  const monthRev = stats.month?.revenue || 0;
  const lastMonthRev = stats.lastMonthRevenue || 0;
  const trend = lastMonthRev > 0 ? Math.round(((monthRev - lastMonthRev) / lastMonthRev) * 100) : null;
  const trendLabel = trend !== null ? (trend >= 0 ? `↑ ${trend}% vs last month` : `↓ ${Math.abs(trend)}% vs last month`) : `${stats.month?.transactions || 0} transactions`;
  return (
    <>
      <KpiBar stats={[
        { icon: TrendingUp,   label: "Today's revenue",    value: fmt(stats.today?.revenue),     sub: `${stats.today?.transactions || 0} services today`, color: 'var(--emerald)' },
        { icon: ShoppingCart, label: 'This month',          value: fmt(monthRev),                 sub: trendLabel,                                         color: 'var(--cyan)' },
        { icon: Calendar,     label: 'Appointments today',  value: stats.todayAppointments || 0,  sub: 'Booked slots',                                     color: 'var(--navy)' },
        { icon: Users,        label: 'Customers',           value: stats.customers || 0,          sub: 'Total served',                                     color: '#6B7280' },
      ]} />
      {(stats.expiredProducts > 0 || stats.expiringProducts > 0 || stats.lowStockProducts > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
          {stats.expiredProducts > 0 && (
            <a href="/inventory?filter=expired" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: '#FEE2E2', color: 'var(--vermilion)', fontSize: 12, fontWeight: 600, textDecoration: 'none', border: '1px solid #FECACA' }}>
              <AlertCircle size={13} /> {stats.expiredProducts} expired
            </a>
          )}
          {stats.expiringProducts > 0 && (
            <a href="/inventory?filter=expiring" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: '#FEF3C7', color: '#B45309', fontSize: 12, fontWeight: 600, textDecoration: 'none', border: '1px solid #FDE68A' }}>
              <AlertTriangle size={13} /> {stats.expiringProducts} expiring soon
            </a>
          )}
          {stats.lowStockProducts > 0 && (
            <a href="/inventory?filter=low-stock" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: '#FEF3C7', color: '#B45309', fontSize: 12, fontWeight: 600, textDecoration: 'none', border: '1px solid #FDE68A' }}>
              <AlertTriangle size={13} /> {stats.lowStockProducts} low stock
            </a>
          )}
        </div>
      )}
    </>
  );
}

function CoachingKpis({ stats }) {
  return (
    <KpiBar stats={[
      { icon: GraduationCap, label: 'Active students',        value: stats.activeStudents || 0,     sub: `${stats.students || 0} total enrolled`,         color: 'var(--navy)' },
      { icon: CheckCircle,   label: 'Fees collected (month)', value: fmt(stats.collectedThisMonth), sub: `${stats.collectedCount || 0} payments received`, color: 'var(--emerald)' },
      { icon: Clock,         label: 'Fees outstanding',       value: fmt(stats.feesDue),            sub: `${stats.feesDueCount || 0} pending`,             color: 'var(--amber)' },
      { icon: AlertCircle,   label: 'Overdue fees',           value: stats.overdueFees || 0,        sub: 'Send reminders',                                 color: 'var(--vermilion)' },
    ]} />
  );
}

function ClinicKpis({ stats }) {
  return (
    <KpiBar stats={[
      { icon: Calendar,  label: 'Appointments today',  value: stats.todayAppointments || 0,   sub: `${stats.monthAppointments || 0} this month`, color: 'var(--cyan)' },
      { icon: Clock,     label: 'Scheduled (pending)', value: stats.pendingAppointments || 0, sub: 'Awaiting confirmation',                      color: 'var(--amber)' },
      { icon: Users,     label: 'Patients',            value: stats.patients || 0,            sub: 'Total registered',                           color: 'var(--navy)' },
      { icon: FileText,  label: 'Pending invoices',    value: stats.pendingInvoices || 0,     sub: `${stats.overdueInvoices || 0} overdue`,       color: stats.overdueInvoices > 0 ? 'var(--vermilion)' : 'var(--navy)' },
    ]} />
  );
}

function GymKpis({ stats }) {
  const expiringCount = stats.expiringMembers?.length || 0;
  const activeTrainerCount = [...new Set(
    (stats.todaySchedule || []).filter(a => a.staff?.name || a.staffName).map(a => a.staff?.name || a.staffName)
  )].length;

  return (
    <>
      <KpiBar style={{ marginBottom: expiringCount > 0 ? 12 : 16 }} stats={[
        { icon: Users,       label: 'Total members',   value: stats.members || 0,            sub: `+${stats.newMembersThisMonth || 0} this month`,    color: 'var(--navy)' },
        { icon: Calendar,    label: 'Sessions today',  value: stats.todayAppointments || 0,  sub: 'Training sessions',                                color: 'var(--cyan)' },
        { icon: UserCheck,   label: 'Active trainers', value: activeTrainerCount,            sub: 'On duty today',                                    color: '#8B5CF6' },
        { icon: CheckCircle, label: 'Revenue (month)', value: fmt(stats.collectedThisMonth), sub: `${stats.collectedCount || 0} memberships`,         color: 'var(--emerald)' },
        { icon: Clock,       label: 'Expiring soon',   value: expiringCount,                 sub: 'In next 7 days',                                   color: expiringCount > 0 ? 'var(--amber)' : '#9CA3AF' },
        { icon: AlertCircle, label: 'Overdue',         value: stats.overdueFees || 0,        sub: 'Send reminders',                                   color: stats.overdueFees > 0 ? 'var(--vermilion)' : '#9CA3AF' },
      ]} />

      {/* Expiring alert */}
      {expiringCount > 0 && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={16} color="var(--amber)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: '#92400E' }}>{expiringCount} membership{expiringCount > 1 ? 's' : ''} expiring in 7 days</p>
            <p style={{ fontSize: 12, color: '#B45309', marginTop: 2, marginBottom: 0 }}>Send renewal reminders via WhatsApp Campaigns.</p>
          </div>
          <a href="/campaigns" style={{ fontSize: 12, color: '#92400E', fontWeight: 700, whiteSpace: 'nowrap', textDecoration: 'none', padding: '6px 14px', background: '#FCD34D', borderRadius: 8 }}>
            Send Campaign →
          </a>
        </div>
      )}
    </>
  );
}

// ── Gym: Upcoming Sessions Panel ──────────────────────────────────────────────

const GYM_CLASS_PALETTE = ['#8B5CF6','#3B82F6','#EF4444','#10B981','#F59E0B','#06B6D4','#EC4899','#6366F1'];
const gymClassColorCache = {};
const gymClassColor = (name) => {
  if (!name) return '#6B7280';
  if (gymClassColorCache[name]) return gymClassColorCache[name];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  const c = GYM_CLASS_PALETTE[Math.abs(h) % GYM_CLASS_PALETTE.length];
  gymClassColorCache[name] = c;
  return c;
};

function GymUpcomingSessionsPanel({ sessions }) {
  const navigate = useNavigate();
  const upcoming = (sessions || [])
    .filter(s => {
      const dt = new Date(s.startTime);
      return dt >= new Date();
    })
    .slice(0, 8);

  return (
    <Card>
      <PanelHeader title="Today's Sessions" href="/appointments" linkLabel="All sessions →" />
      {!upcoming.length ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Calendar size={28} color="#E5E7EB" style={{ display: 'block', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 12px' }}>No upcoming sessions today</p>
          <button onClick={() => navigate('/appointments')}
            style={{ fontSize: 12, fontWeight: 600, color: 'var(--cyan)', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
            + Book Session
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {upcoming.map((s, i) => {
            const time = new Date(s.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
            const trainer = s.staff?.name || s.staffName;
            const classColor = gymClassColor(s.service?.name);
            const statusColors = { CONFIRMED: { bg: '#F0FDF4', c: '#16A34A' }, SCHEDULED: { bg: '#EFF6FF', c: '#3B82F6' }, COMPLETED: { bg: '#F3F4F6', c: '#6B7280' } };
            const sc = statusColors[s.status] || statusColors.SCHEDULED;
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, background: '#FAFAFA', border: '1px solid #F3F4F6' }}>
                {/* Time block */}
                <div style={{ width: 52, textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy)', lineHeight: 1, fontFamily: 'var(--font-mono)' }}>{time.split(' ')[0]}</div>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>{time.split(' ')[1]}</div>
                </div>
                {/* Color dot */}
                <div style={{ width: 3, height: 32, borderRadius: 2, background: classColor, flexShrink: 0 }} />
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.customer?.name || 'Walk-in'}
                    </span>
                    {s.service?.name && (
                      <span style={{ background: classColor + '18', color: classColor, fontSize: 10, fontWeight: 700, borderRadius: 5, padding: '1px 7px', flexShrink: 0 }}>
                        {s.service.name}
                      </span>
                    )}
                  </div>
                  {trainer && (
                    <div style={{ fontSize: 11, color: '#047857', fontWeight: 600 }}>
                      🏋️ {trainer}
                    </div>
                  )}
                </div>
                {/* Status */}
                <div style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: sc.bg, color: sc.c, flexShrink: 0 }}>
                  {s.status}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ── Gym: Active Trainers Panel ────────────────────────────────────────────────
function ActiveTrainersPanel({ sessions }) {
  const navigate = useNavigate();
  const trainerMap = {};
  (sessions || []).forEach(s => {
    const name = s.staff?.name || s.staffName;
    if (!name) return;
    if (!trainerMap[name]) trainerMap[name] = { name, sessions: [], statuses: new Set() };
    trainerMap[name].sessions.push(s);
    trainerMap[name].statuses.add(s.status);
  });
  const trainers = Object.values(trainerMap).sort((a, b) => b.sessions.length - a.sessions.length);

  if (!trainers.length) return null;

  return (
    <Card>
      <PanelHeader title="Trainers on Duty Today" href="/staff" linkLabel="Manage staff →" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {trainers.map((t, i) => {
          const confirmed = t.sessions.filter(s => s.status === 'CONFIRMED').length;
          const completed = t.sessions.filter(s => s.status === 'COMPLETED').length;
          const classes = [...new Set(t.sessions.map(s => s.service?.name).filter(Boolean))];
          return (
            <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: '#FAFAFA', border: '1px solid #F3F4F6' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, var(--navy) 0%, var(--cyan) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 800, flexShrink: 0 }}>
                {t.name[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                  {classes.length > 0 ? classes.slice(0, 2).join(' · ') : 'Sessions today'}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', lineHeight: 1 }}>{t.sessions.length}</div>
                <div style={{ fontSize: 10, color: '#9CA3AF' }}>session{t.sessions.length !== 1 ? 's' : ''}</div>
              </div>
              {completed > 0 && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--emerald)', flexShrink: 0 }} title={`${completed} completed`} />
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function EventKpis({ stats }) {
  return (
    <div className="kpi-grid">
      <KpiCard label="Upcoming events (7 days)" value={stats.upcomingEvents || 0}   sub={`${stats.monthBookings || 0} booked this month`}      icon={Calendar}    color="var(--cyan)" />
      <KpiCard label="Invoiced this month"      value={fmt(stats.monthInvoiced)}    sub={`${stats.invoiceCount || 0} invoices raised`}          icon={FileText}    color="var(--navy)" />
      <KpiCard label="Collected this month"     value={fmt(stats.monthCollected)}   sub="Advance & full payments"                              icon={CheckCircle} color="var(--emerald)" />
      <KpiCard label="Balance due"              value={fmt(stats.balanceDue)}       sub={`${stats.clients || 0} active clients`}               icon={Clock}       color={stats.balanceDue > 0 ? 'var(--amber)' : '#6B7280'} />
    </div>
  );
}

function MallKpis({ stats }) {
  const occupancy = stats.totalUnits > 0 ? Math.round((stats.occupiedUnits / stats.totalUnits) * 100) : 0;
  return (
    <>
      <div className="kpi-grid" style={{ marginBottom: 14 }}>
        <KpiCard label="Occupancy"            value={`${occupancy}%`}             sub={`${stats.occupiedUnits}/${stats.totalUnits} units`}      icon={Home}        color="var(--navy)" />
        <KpiCard label="Vacant units"         value={stats.vacantUnits || 0}      sub="Available to lease"                                     icon={Building2}   color={stats.vacantUnits > 0 ? 'var(--amber)' : 'var(--emerald)'} />
        <KpiCard label="Monthly rent due"     value={fmt(stats.monthlyRentDue)}   sub={`From ${stats.activeTenants || 0} tenants`}             icon={DollarSign}  color="var(--cyan)" />
        <KpiCard label="Collected this month" value={fmt(stats.monthCollection)}  sub="From paid invoices"                                     icon={CheckCircle} color="var(--emerald)" />
      </div>
      {stats.overdueLeases > 0 && (
        <Card style={{ borderLeft: '3px solid var(--vermilion)', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={16} color="var(--vermilion)" />
            <div>
              <p style={{ fontWeight: 700, fontSize: 14 }}>{stats.overdueLeases} lease(s) expired or overdue</p>
              <p style={{ fontSize: 13, color: '#6B7280', marginTop: 1 }}>Review lease agreements and send renewal notices.</p>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}

function FreelancerKpis({ stats }) {
  return (
    <div className="kpi-grid">
      <KpiCard label="Invoiced this month"  value={fmt(stats.monthInvoiced)}    sub={`${stats.invoiceCount || 0} invoices raised`}   icon={FileText}    color="var(--navy)" />
      <KpiCard label="Collected this month" value={fmt(stats.monthCollected)}   sub="Payments received"                             icon={CheckCircle} color="var(--emerald)" />
      <KpiCard label="Pending invoices"     value={stats.pendingInvoices || 0}  sub={`${stats.overdueInvoices || 0} overdue`}       icon={Clock}       color={stats.overdueInvoices > 0 ? 'var(--vermilion)' : 'var(--amber)'} alert={stats.overdueInvoices > 0} />
      <KpiCard label="Clients"              value={stats.clients || 0}          sub="Total clients"                                 icon={Users}       color="var(--cyan)" />
    </div>
  );
}

function SupplierKpis({ stats }) {
  return (
    <div className="kpi-grid">
      <KpiCard label="Invoiced this month"  value={fmt(stats.monthInvoiced)}   sub={`${stats.invoiceCount || 0} invoices raised`}          icon={FileText}    color="var(--navy)" />
      <KpiCard label="Collected this month" value={fmt(stats.monthCollected)}  sub="Payments received"                                    icon={CheckCircle} color="var(--emerald)" />
      <KpiCard label="Outstanding"          value={fmt(stats.outstanding)}     sub={`${stats.outstandingCount || 0} unpaid invoices`}      icon={Clock}       color={stats.outstanding > 0 ? 'var(--amber)' : '#6B7280'} />
      <KpiCard label="Stock items"          value={stats.products || 0}        sub={`${stats.clients || 0} clients`}                       icon={Package}     color="var(--cyan)" />
    </div>
  );
}

// ── Secondary panel components ───────────────────────────────────────────────

function PanelHeader({ title, href, linkLabel = 'View all →' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>{title}</h3>
      {href && <a href={href} style={{ fontSize: 12, color: 'var(--cyan)', fontWeight: 600 }}>{linkLabel}</a>}
    </div>
  );
}

function LowStockPanel({ items }) {
  if (!items?.length) return null;
  return (
    <Card>
      <PanelHeader title="Low stock items" href="/inventory" />
      <div>
        {items.map((p, i) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{p.name}</div>
            <div style={{ fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 6, background: p.stock === 0 ? '#FEF2F2' : '#FFFBEB', color: p.stock === 0 ? 'var(--vermilion)' : 'var(--amber)' }}>
              {p.stock} {p.unit || 'units'}
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF', minWidth: 64, textAlign: 'right' }}>limit {p.lowStockAlert}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SchedulePanel({ schedule, title = "Today's schedule", href = '/appointments' }) {
  return (
    <Card>
      <PanelHeader title={title} href={href} linkLabel="Manage →" />
      {!schedule?.length
        ? <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '20px 0', margin: 0 }}>No appointments today</p>
        : schedule.map((apt, i) => {
            const time = new Date(apt.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            const isConfirmed = apt.status === 'CONFIRMED';
            return (
              <div key={apt.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', minWidth: 48, fontFamily: 'var(--font-display)' }}>{time}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{apt.customer?.name}</div>
                  {apt.service?.name && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{apt.service.name}</div>}
                  {apt.customer?.phone && !apt.service?.name && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{apt.customer.phone}</div>}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: isConfirmed ? '#F0FDF4' : '#FFFBEB', color: isConfirmed ? 'var(--emerald)' : 'var(--amber)' }}>
                  {apt.status}
                </div>
              </div>
            );
          })
      }
    </Card>
  );
}

function OverduePanel({ list }) {
  if (!list?.length) return null;
  return (
    <Card>
      <PanelHeader title="Overdue fees" href="/fees" />
      {list.map((f, i) => {
        const balance = fmt((f.netAmount || 0) - (f.paidAmount || 0));
        const dueDateStr = new Date(f.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        return (
          <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{f.student?.name}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{f.student?.phone} · Due {dueDateStr}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--vermilion)' }}>{balance}</div>
          </div>
        );
      })}
    </Card>
  );
}

function ExpiringMembersPanel({ members }) {
  if (!members?.length) return null;
  return (
    <Card>
      <PanelHeader title="Memberships expiring soon" href="/customers" />
      {members.map((m, i) => {
        const expiry = new Date(m.expiryDate);
        const daysLeft = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
        const expiryStr = expiry.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        return (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{m.customer?.name}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{m.planName} · expires {expiryStr}</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 6, background: '#FFFBEB', color: 'var(--amber)' }}>
              {daysLeft}d left
            </div>
          </div>
        );
      })}
    </Card>
  );
}

function UpcomingEventsPanel({ events }) {
  if (!events?.length) return null;
  return (
    <Card>
      <PanelHeader title="Upcoming events (14 days)" href="/appointments" linkLabel="Manage →" />
      {events.map((e, i) => {
        const d = new Date(e.startTime);
        const dateStr = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
        const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        return (
          <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', minWidth: 72, lineHeight: 1.4, fontFamily: 'var(--font-display)' }}>
              <div>{dateStr}</div>
              <div style={{ fontWeight: 400, color: '#9CA3AF' }}>{timeStr}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{e.customer?.name}</div>
              {e.customer?.phone && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{e.customer.phone}</div>}
            </div>
          </div>
        );
      })}
    </Card>
  );
}

function AgingPanel({ agingBuckets, topOutstanding }) {
  const b = agingBuckets || { current: 0, late: 0, overdue: 0 };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card>
        <PanelHeader title="Invoice aging" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { label: 'Current', value: b.current, color: 'var(--emerald)', bg: '#F0FDF4' },
            { label: 'Late (30d+)', value: b.late, color: 'var(--amber)', bg: '#FFFBEB' },
            { label: 'Overdue (60d+)', value: b.overdue, color: 'var(--vermilion)', bg: '#FEF2F2' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ textAlign: 'center', padding: '12px 8px', background: bg, borderRadius: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color, fontFamily: 'var(--font-display)' }}>{fmt(value)}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>
      </Card>
      {topOutstanding?.length > 0 && <OutstandingPanel topOutstanding={topOutstanding} />}
    </div>
  );
}

function OutstandingPanel({ topOutstanding }) {
  if (!topOutstanding?.length) return null;
  return (
    <Card>
      <PanelHeader title="Top outstanding" href="/invoices" />
      {topOutstanding.map((inv, i) => (
        <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{inv.customer?.name}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{inv.invoiceNumber}</div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--vermilion)' }}>{fmt(inv.balanceDue)}</div>
        </div>
      ))}
    </Card>
  );
}

function UnitListPanel({ unitList }) {
  if (!unitList?.length) return null;
  return (
    <Card>
      <PanelHeader title="Units" href="/lease" linkLabel="Manage →" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
        {unitList.map((u) => {
          const lease = u.leases?.[0];
          return (
            <div key={u.id} style={{ padding: '10px 12px', borderRadius: 10, background: lease ? '#F0FDF4' : '#F9FAFB', border: `1px solid ${lease ? '#BBF7D0' : 'var(--border)'}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{u.unitNumber}</div>
              {lease ? (
                <>
                  <div style={{ fontSize: 11, color: '#047857', marginTop: 3, fontWeight: 600 }}>{lease.businessName}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>{fmt(lease.monthlyRent)}/mo</div>
                </>
              ) : (
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>Vacant</div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function PaymentMethodPanel({ breakdown }) {
  if (!breakdown?.length) return null;
  const total = breakdown.reduce((s, m) => s + m.total, 0);
  const COLORS = { CASH: 'var(--emerald)', UPI: 'var(--cyan)', CARD: 'var(--navy)', CREDIT: 'var(--amber)', CHEQUE: '#9CA3AF' };
  return (
    <Card>
      <PanelHeader title="Payment methods today" />
      {breakdown.map((m, i) => {
        const pct = total > 0 ? Math.round(m.total / total * 100) : 0;
        const color = COLORS[m.method] || '#6B7280';
        return (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{m.method}</span>
              <span style={{ color: '#6B7280' }}>{fmt(m.total)} · {pct}%</span>
            </div>
            <div style={{ height: 6, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.4s' }} />
            </div>
          </div>
        );
      })}
    </Card>
  );
}

function TopSellersPanel({ sellers }) {
  if (!sellers?.length) return null;
  const max = Math.max(...sellers.map(s => s.revenue), 1);
  return (
    <Card>
      <PanelHeader title="Top sellers this week" href="/inventory" />
      {sellers.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#D1D5DB', minWidth: 20, textAlign: 'center' }}>#{i + 1}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>{s.name}</div>
            <div style={{ height: 4, background: '#F3F4F6', borderRadius: 3 }}>
              <div style={{ height: '100%', width: `${Math.round(s.revenue / max * 100)}%`, background: 'var(--cyan)', borderRadius: 3 }} />
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 12 }}>
            <div style={{ fontWeight: 700, color: 'var(--navy)' }}>{fmt(s.revenue)}</div>
            <div style={{ color: '#9CA3AF' }}>{s.qty} units</div>
          </div>
        </div>
      ))}
    </Card>
  );
}

function RentCollectionPanel({ rentCollection }) {
  if (!rentCollection?.length) return null;
  const paid = rentCollection.find(r => r.status === 'PAID');
  const pending = rentCollection.filter(r => ['SENT', 'OVERDUE'].includes(r.status));
  const paidTotal = paid?.total || 0;
  const pendingTotal = pending.reduce((s, r) => s + r.total, 0);
  const grandTotal = paidTotal + pendingTotal;
  const paidPct = grandTotal > 0 ? Math.round(paidTotal / grandTotal * 100) : 0;
  return (
    <Card>
      <PanelHeader title="Rent collection this month" href="/invoices" />
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
          <span style={{ color: '#6B7280' }}>Collected</span>
          <strong style={{ color: 'var(--emerald)' }}>{fmt(paidTotal)} ({paidPct}%)</strong>
        </div>
        <div style={{ height: 8, background: '#F3F4F6', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${paidPct}%`, background: 'var(--emerald)', borderRadius: 6 }} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
        <span style={{ color: '#6B7280' }}>Pending / Overdue</span>
        <strong style={{ color: pendingTotal > 0 ? 'var(--vermilion)' : '#9CA3AF' }}>{fmt(pendingTotal)}</strong>
      </div>
    </Card>
  );
}

function PurchaseOrderPanel({ orders }) {
  if (!orders?.length) return null;
  const STATUS_COLOR = { DRAFT: '#9CA3AF', ORDERED: 'var(--cyan)', RECEIVED: 'var(--emerald)', CANCELLED: 'var(--vermilion)' };
  return (
    <Card>
      <PanelHeader title="Recent purchase orders" href="/vendors" />
      {orders.map((o, i) => (
        <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{o.vendor?.name || 'Unknown vendor'}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{o.poNumber}</div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginRight: 8 }}>{fmt(o.subtotal)}</div>
          <div style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#F3F4F6', color: STATUS_COLOR[o.status] || '#6B7280' }}>{o.status}</div>
        </div>
      ))}
    </Card>
  );
}

function EventPaymentPanel({ monthInvoiced, monthCollected, balanceDue, invoiceCount }) {
  const collected = monthCollected || 0;
  const total = monthInvoiced || 0;
  const pct = total > 0 ? Math.round(collected / total * 100) : 0;
  return (
    <Card>
      <PanelHeader title="Payment collection status" href="/invoices" />
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
          <span style={{ color: '#6B7280' }}>Collected this month</span>
          <strong style={{ color: 'var(--emerald)' }}>{fmt(collected)} ({pct}%)</strong>
        </div>
        <div style={{ height: 8, background: '#F3F4F6', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--emerald)', borderRadius: 6 }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', fontFamily: 'var(--font-display)' }}>{fmt(total)}</div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Total invoiced</div>
        </div>
        <div style={{ background: balanceDue > 0 ? '#FEF3C7' : '#F0FDF4', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: balanceDue > 0 ? 'var(--amber)' : 'var(--emerald)', fontFamily: 'var(--font-display)' }}>{fmt(balanceDue)}</div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Balance due</div>
        </div>
      </div>
    </Card>
  );
}

// ── Profile type groups (must match reports.service.js) ─────────────────────

const SALON_POS_TYPES = ['SALON','BEAUTY_PARLOUR','BARBERSHOP','MOBILE_REPAIR','OPTICAL','VET_CLINIC','LAUNDRY'];
const CLINIC_TYPES    = ['CLINIC','DENTAL','DIAGNOSTIC_LAB','AYURVEDA','HOSPITAL','PHYSIOTHERAPY'];
const COACHING_TYPES  = ['COACHING','HOME_TUITION','MUSIC_SCHOOL','DANCE_ACADEMY','DRIVING_SCHOOL','COMPUTER_TRAINING'];
const GYM_TYPES       = ['GYM','SPA','YOGA_STUDIO','MARTIAL_ARTS','SPORTS_ACADEMY','SWIMMING_ACADEMY','CROSSFIT_STUDIO'];
const EVENT_TYPES     = ['EVENT_PLANNER','DECORATOR','TENT_HOUSE','CATERING','PHOTOGRAPHY','TAILORING'];
const INVOICE_TYPES   = ['FREELANCER','DIGITAL_AGENCY','CA_FIRM','LAW_FIRM','CONSTRUCTION','INTERIOR_DESIGN','TRANSPORT','PACKERS_MOVERS','CAR_RENTAL','TRAVEL_AGENCY','INSURANCE_AGENCY','PEST_CONTROL','REAL_ESTATE'];
const PROPERTY_TYPES  = ['MALL','CO_WORKING'];
const SUPPLIER_TYPES  = ['SUPPLIER','WHOLESALE'];

// ── Quick action definitions ─────────────────────────────────────────────────

const A = {
  sale:     (sub = 'Open POS')             => ({ label: 'New sale',        sub, href: '/pos',          color: 'var(--navy)',    icon: ShoppingCart }),
  invoice:  (sub = 'Bill a customer')      => ({ label: 'New invoice',     sub, href: '/invoices',     color: 'var(--cyan)',    icon: FileText }),
  apt:      (sub = 'Book a slot')          => ({ label: 'New appointment', sub, href: '/appointments', color: 'var(--cyan)',    icon: Calendar }),
  product:  (sub = 'Grow your catalog')    => ({ label: 'Add product',     sub, href: '/inventory',    color: 'var(--emerald)', icon: Package }),
  reports:  (sub = 'Sales & revenue')      => ({ label: 'View reports',    sub, href: '/reports',      color: '#6B7280',        icon: TrendingUp }),
  fee:      (sub = 'Record payment')       => ({ label: 'Collect fee',     sub, href: '/fees',         color: 'var(--emerald)', icon: CheckCircle }),
  student:  (sub = 'New admission')        => ({ label: 'Add student',     sub, href: '/fees',         color: 'var(--navy)',    icon: GraduationCap }),
  customer: (sub = 'View all')             => ({ label: 'Customers',       sub, href: '/customers',    color: 'var(--amber)',   icon: Users }),
  addCust:  (sub = 'Build your base')      => ({ label: 'Add customer',    sub, href: '/customers',    color: 'var(--emerald)', icon: Users }),
  staff:    ()                             => ({ label: 'Staff attendance', sub: 'Mark today', href: '/staff', color: '#6B7280', icon: UserCheck }),
  vendor:   ()                             => ({ label: 'Order from vendor', sub: 'Purchase order', href: '/vendors', color: '#6B7280', icon: Truck }),
  lease:    (sub = 'View outstanding')     => ({ label: 'Rent due',        sub, href: '/lease',        color: 'var(--amber)',   icon: Home }),
  unit:     ()                             => ({ label: 'Add unit',         sub: 'Register space', href: '/lease', color: 'var(--cyan)', icon: Building2 }),
  expense:  ()                             => ({ label: 'Log expense',      sub: 'Track outgoing', href: '/expenses', color: 'var(--amber)', icon: DollarSign }),
  inventory: ()                            => ({ label: 'Inventory',        sub: 'Check stock', href: '/inventory', color: 'var(--emerald)', icon: Package }),
};

const QUICK_ACTIONS = {
  // ── Retail & Commerce ────────────────────────────────────────────────────────
  RETAIL:         [A.sale('Open POS'), A.invoice(), A.product(), A.reports()],
  KIRANA:         [A.sale('Open POS'), A.inventory(), A.customer('Udhar & credit'), A.reports('Daily summary')],
  MEDICAL_STORE:  [A.sale('Open POS'), A.product('Add medicine'), A.customer(), A.reports()],
  STATIONARY:     [A.sale('Open POS'), A.product(), A.invoice(), A.reports()],
  SWEET_SHOP:     [A.sale('Open POS'), A.inventory(), A.reports(), A.vendor()],
  BAKERY:         [A.sale('Open POS'), A.apt('Take order'), A.inventory(), A.reports()],
  JEWELLERY:      [A.sale('Open POS'), A.invoice('Bill a customer'), A.customer(), A.reports()],
  HARDWARE:       [A.sale('Open POS'), A.inventory(), A.vendor(), A.reports()],
  ELECTRICAL:     [A.sale('Open POS'), A.apt('Schedule job'), A.inventory(), A.reports()],
  CLOTHING:       [A.sale('Open POS'), A.apt('Alteration booking'), A.product(), A.customer()],
  FOOTWEAR:       [A.sale('Open POS'), A.product(), A.invoice(), A.reports()],
  ELECTRONICS:    [A.sale('Open POS'), A.product(), A.invoice(), A.customer()],
  MOBILE_REPAIR:  [A.apt('Book repair'), A.sale('POS billing'), A.inventory(), A.reports()],
  OPTICAL:        [A.apt('Eye checkup'), A.sale('POS billing'), A.customer(), A.reports()],
  BOOKSTORE:      [A.sale('Open POS'), A.product(), A.fee('Collect tuition fee'), A.reports()],
  FLORIST:        [A.sale('Open POS'), A.apt('Bulk order'), A.inventory(), A.reports()],
  DEALER:         [A.sale('Open POS'), A.inventory(), A.invoice(), A.vendor()],
  WORKSHOP:       [A.sale('Open POS'), A.invoice('Job card billing'), A.inventory(), A.vendor()],
  OTHER:          [A.sale(), A.invoice(), A.addCust(), A.reports('Business summary')],

  // ── Food & Beverage ────────────────────────────────────────────────────────
  RESTAURANT:     [A.sale('New order'), A.invoice('Table billing'), A.inventory(), A.reports('Daily revenue')],
  DHABA:          [A.sale('Open POS'), A.inventory(), A.reports(), A.expense()],
  CLOUD_KITCHEN:  [A.sale('Open POS'), A.inventory(), A.reports(), A.expense()],
  JUICE_BAR:      [A.sale('Open POS'), A.inventory(), A.reports()],
  CANTEEN_MESS:   [A.sale('Open POS'), A.fee('Collect mess fee'), A.customer(), A.reports()],
  COURIER:        [A.sale('Open POS'), A.invoice(), A.customer(), A.reports()],

  // ── Salon / Service + POS ────────────────────────────────────────────────────
  SALON:          [A.apt('Book a slot'), A.sale('POS billing'), A.staff(), A.reports('Revenue summary')],
  BEAUTY_PARLOUR: [A.apt('Book a slot'), A.sale('POS billing'), A.staff(), A.reports()],
  BARBERSHOP:     [A.apt('Book a slot'), A.sale('POS billing'), A.customer(), A.reports()],
  LAUNDRY:        [A.apt('Book pickup'), A.sale('POS billing'), A.customer(), A.reports()],
  VET_CLINIC:     [A.apt('Book appointment'), A.sale('POS billing'), A.inventory(), A.reports()],

  // ── Clinic / Healthcare ────────────────────────────────────────────────────
  CLINIC:         [A.apt('Book a patient'), A.invoice('Bill a patient'), A.customer('Patients'), A.staff()],
  DENTAL:         [A.apt('New patient'), A.invoice(), A.customer('Patients'), A.reports()],
  DIAGNOSTIC_LAB: [A.apt('New test booking'), A.invoice(), A.customer('Patients'), A.reports()],
  PHYSIOTHERAPY:  [A.apt('Book session'), A.fee('Collect session fee'), A.customer('Patients'), A.reports()],
  AYURVEDA:       [A.apt('Book consultation'), A.invoice(), A.inventory(), A.reports()],
  HOSPITAL:       [A.apt('OPD booking'), A.invoice('Bill patient'), A.customer('Patients'), A.staff()],

  // ── Coaching / Education ─────────────────────────────────────────────────────
  COACHING:       [A.fee('Collect fee'), A.student(), A.invoice('Bill a parent'), A.reports('Fee report')],
  HOME_TUITION:   [A.fee('Collect fee'), A.student(), A.expense(), A.reports()],
  MUSIC_SCHOOL:   [A.fee('Collect fee'), A.apt('Schedule class'), A.student(), A.reports()],
  DANCE_ACADEMY:  [A.fee('Collect fee'), A.apt('Schedule class'), A.invoice(), A.reports()],
  DRIVING_SCHOOL: [A.fee('Collect fee'), A.apt('Schedule lesson'), A.invoice(), A.reports()],
  COMPUTER_TRAINING: [A.fee('Collect fee'), A.apt('Schedule batch'), A.invoice(), A.reports()],

  // ── Fitness & Sports ─────────────────────────────────────────────────────────
  GYM:             [A.apt('Book a session'), A.invoice('Membership billing'), A.customer('Manage members'), A.expense()],
  SPA:             [A.apt('Book session'), A.fee('Collect fee'), A.customer(), A.reports()],
  YOGA_STUDIO:     [A.apt('Book a class'), A.fee('Collect fee'), A.customer('Members'), A.reports()],
  MARTIAL_ARTS:    [A.apt('Book a session'), A.fee('Collect fee'), A.customer('Students'), A.expense()],
  SPORTS_ACADEMY:  [A.apt('Book a session'), A.fee('Collect fee'), A.sale('Kit & equipment'), A.customer('Athletes')],
  SWIMMING_ACADEMY:[A.apt('Book a class'), A.fee('Collect fee'), A.customer('Members'), A.expense()],
  CROSSFIT_STUDIO: [A.apt('Book a session'), A.fee('Collect fee'), A.sale('Supplements & merch'), A.customer('Members')],

  // ── Events ───────────────────────────────────────────────────────────────────
  EVENT_PLANNER:  [A.apt('New booking'), A.invoice(), A.customer(), A.reports()],
  DECORATOR:      [A.apt('New booking'), A.inventory(), A.invoice(), A.reports()],
  TENT_HOUSE:     [A.apt('New booking'), A.inventory(), A.invoice(), A.reports()],
  CATERING:       [A.apt('New order'), A.inventory(), A.invoice(), A.customer()],
  PHOTOGRAPHY:    [A.apt('New booking'), A.invoice(), A.customer(), A.reports()],
  TAILORING:      [A.apt('New order'), A.invoice(), A.customer(), A.reports()],

  // ── Professional Services ─────────────────────────────────────────────────────
  FREELANCER:     [A.invoice('Bill a client'), A.addCust('New client'), A.expense(), A.reports()],
  DIGITAL_AGENCY: [A.invoice('Bill a client'), A.addCust('New client'), A.expense(), A.reports()],
  CA_FIRM:        [A.fee('Collect retainer'), A.invoice(), A.customer('Clients'), A.reports()],
  LAW_FIRM:       [A.apt('New consultation'), A.invoice(), A.customer('Clients'), A.reports()],
  CONSTRUCTION:   [A.invoice('Bill milestone'), A.vendor(), A.customer(), A.reports()],
  INTERIOR_DESIGN:[A.apt('New project'), A.invoice(), A.customer(), A.reports()],
  INSURANCE_AGENCY:[A.fee('Collect premium'), A.invoice(), A.customer(), A.reports()],
  TRAVEL_AGENCY:  [A.apt('New booking'), A.invoice(), A.customer(), A.reports()],
  PEST_CONTROL:   [A.apt('Schedule visit'), A.invoice(), A.customer(), A.reports()],

  // ── Transport & Logistics ─────────────────────────────────────────────────────
  TRANSPORT:      [A.invoice('New consignment'), A.customer(), A.expense(), A.reports()],
  PACKERS_MOVERS: [A.apt('Book move'), A.invoice(), A.customer(), A.reports()],
  CAR_RENTAL:     [A.apt('New rental'), A.invoice(), A.customer(), A.reports()],
  CAB_SERVICE:    [A.sale('New trip'), A.invoice(), A.customer(), A.expense()],

  // ── Construction & Design ─────────────────────────────────────────────────────
  REAL_ESTATE:    [A.apt('New site visit'), A.lease('Rent due'), A.invoice(), A.reports()],
  CO_WORKING:     [A.lease('Rent due'), A.invoice('Bill member'), A.unit(), A.reports()],

  // ── Property ─────────────────────────────────────────────────────────────────
  MALL:           [A.lease('Rent due'), A.invoice('Bill a tenant'), A.unit(), A.reports('Collection report')],

  // ── Trade & Supply ────────────────────────────────────────────────────────────
  SUPPLIER:       [A.product('Add stock item'), A.invoice(), A.vendor(), A.reports()],
  WHOLESALE:      [A.invoice(), A.inventory(), A.vendor(), A.reports()],
};

// ── Business labels ──────────────────────────────────────────────────────────

const BUSINESS_LABELS = {
  RETAIL: 'Retail store', KIRANA: 'Kirana store', COACHING: 'Coaching institute',
  SALON: 'Salon', CLINIC: 'Clinic', RESTAURANT: 'Restaurant', GYM: 'Gym & fitness',
  MALL: 'Shopping complex', FREELANCER: 'Freelance business', WORKSHOP: 'Workshop',
  OTHER: 'Business',
  MEDICAL_STORE: 'Medical store', STATIONARY: 'Stationery shop', SWEET_SHOP: 'Sweet shop',
  BAKERY: 'Bakery', JEWELLERY: 'Jewellery store', HARDWARE: 'Hardware store',
  ELECTRICAL: 'Electrical store', CLOTHING: 'Clothing store', FOOTWEAR: 'Footwear store',
  ELECTRONICS: 'Electronics store', MOBILE_REPAIR: 'Mobile repair', OPTICAL: 'Optical store',
  BOOKSTORE: 'Book store', FLORIST: 'Flower shop',
  DHABA: 'Dhaba', CATERING: 'Catering service', CLOUD_KITCHEN: 'Cloud kitchen',
  JUICE_BAR: 'Juice bar', CANTEEN_MESS: 'Canteen / Mess',
  EVENT_PLANNER: 'Event planner', DECORATOR: 'Decorator', TENT_HOUSE: 'Tent house',
  DENTAL: 'Dental clinic', DIAGNOSTIC_LAB: 'Diagnostic lab', PHYSIOTHERAPY: 'Physiotherapy',
  AYURVEDA: 'Ayurveda clinic', HOSPITAL: 'Hospital', VET_CLINIC: 'Veterinary clinic',
  BEAUTY_PARLOUR: 'Beauty parlour', SPA: 'Spa & wellness', LAUNDRY: 'Laundry service',
  TAILORING: 'Tailoring shop', BARBERSHOP: 'Barbershop',
  HOME_TUITION: 'Home tuition', MUSIC_SCHOOL: 'Music school', DANCE_ACADEMY: 'Dance academy',
  DRIVING_SCHOOL: 'Driving school', COMPUTER_TRAINING: 'Computer training',
  CA_FIRM: 'CA firm', LAW_FIRM: 'Law firm', REAL_ESTATE: 'Real estate agency',
  INSURANCE_AGENCY: 'Insurance agency', TRAVEL_AGENCY: 'Travel agency',
  PHOTOGRAPHY: 'Photography studio', DIGITAL_AGENCY: 'Digital agency',
  CAB_SERVICE: 'Cab service', TRANSPORT: 'Transport service', CAR_RENTAL: 'Car rental',
  COURIER: 'Courier service', PACKERS_MOVERS: 'Packers & movers',
  CONSTRUCTION: 'Construction firm', INTERIOR_DESIGN: 'Interior design',
  CO_WORKING: 'Co-working space',
  DEALER: 'Dealer', SUPPLIER: 'Supplier', WHOLESALE: 'Wholesale business',
  PEST_CONTROL: 'Pest control',
  YOGA_STUDIO: 'Yoga studio', MARTIAL_ARTS: 'Martial arts academy',
  SPORTS_ACADEMY: 'Sports academy', SWIMMING_ACADEMY: 'Swimming academy',
  CROSSFIT_STUDIO: 'CrossFit studio',
};

// Skeleton loader
function Skeleton() {
  return (
    <div style={{ padding: 32 }}>
      <div style={{ height: 28, width: 260, background: '#E5E7EB', borderRadius: 8, marginBottom: 10, animation: 'pulse 1.4s ease-in-out infinite' }} />
      <div style={{ height: 16, width: 200, background: '#E5E7EB', borderRadius: 6, marginBottom: 28, animation: 'pulse 1.4s ease-in-out infinite' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ height: 100, background: '#E5E7EB', borderRadius: 14, animation: 'pulse 1.4s ease-in-out infinite' }} />
        ))}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}

// ── Homework Progress Dashboard Card ─────────────────────────────────────────

const TODAY_STR = new Date().toISOString().slice(0, 10);
const SUBJECT_COLORS_D = ['#06B6D4','#8B5CF6','#F59E0B','#10B981','#EF4444','#3B82F6','#EC4899','#14B8A6'];
const subColor = (s, list) => {
  const i = list.indexOf(s);
  return SUBJECT_COLORS_D[i >= 0 ? i % SUBJECT_COLORS_D.length : (s?.charCodeAt(0) || 0) % SUBJECT_COLORS_D.length];
};

function HomeworkDashCard({ subjects = [] }) {
  const navigate = useNavigate();
  const [hw, setHw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getHomework({ from: TODAY_STR, to: TODAY_STR })
      .then(r => setHw(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleStudent = async (hwId, studentId, currentStatus) => {
    const newStatus = currentStatus === 'DONE' ? 'PENDING' : 'DONE';
    setSaving(true);
    try {
      await bulkUpdateSubmissions(hwId, [{ studentId, status: newStatus }]);
      setHw(prev => prev.map(h => h.id !== hwId ? h : {
        ...h,
        submissions: h.submissions.map(s =>
          (s.studentId === studentId || s.student?.id === studentId) ? { ...s, status: newStatus } : s
        ),
      }));
    } catch { /* silent */ } finally { setSaving(false); }
  };

  const totalSubs  = hw.reduce((a, h) => a + (h.submissions?.length || 0), 0);
  const doneSubs   = hw.reduce((a, h) => a + (h.submissions?.filter(s => s.status === 'DONE').length || 0), 0);
  const overallPct = totalSubs > 0 ? Math.round((doneSubs / totalSubs) * 100) : null;
  const pendingCount = totalSubs - doneSubs;

  return (
    <Card style={{ marginBottom: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={15} color="var(--cyan)" />
          </div>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>Today's Homework</h3>
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>
        <a onClick={() => navigate('/progress')} style={{ fontSize: 12, color: 'var(--cyan)', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>
          Progress Hub →
        </a>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#9CA3AF', fontSize: 13 }}>Loading…</div>
      ) : hw.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <BookOpen size={28} color="#E5E7EB" style={{ display: 'block', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 10px' }}>No homework assigned for today</p>
          <button onClick={() => navigate('/progress')} style={{
            fontSize: 12, fontWeight: 600, color: 'var(--cyan)', background: 'rgba(6,182,212,0.08)',
            border: '1px solid rgba(6,182,212,0.2)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
          }}>
            + Assign Homework
          </button>
        </div>
      ) : (
        <>
          {/* Summary bar */}
          {overallPct !== null && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                <span style={{ color: '#6B7280', fontWeight: 500 }}>
                  {hw.length} assignment{hw.length !== 1 ? 's' : ''} · {doneSubs} of {totalSubs} submissions done
                </span>
                <span style={{ fontWeight: 700, color: overallPct >= 80 ? '#16A34A' : overallPct >= 50 ? '#D97706' : '#EF4444' }}>
                  {overallPct}%
                </span>
              </div>
              <div style={{ height: 6, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 4, transition: 'width 0.5s',
                  background: overallPct >= 80 ? '#16A34A' : overallPct >= 50 ? '#F59E0B' : '#EF4444',
                  width: `${overallPct}%` }} />
              </div>
              {pendingCount > 0 && (
                <p style={{ fontSize: 11, color: '#D97706', margin: '5px 0 0', fontWeight: 600 }}>
                  ⚠ {pendingCount} student{pendingCount !== 1 ? 's' : ''} yet to submit
                </p>
              )}
            </div>
          )}

          {/* Per-homework rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {hw.map(h => {
              const total = h.submissions?.length || 0;
              const done  = h.submissions?.filter(s => s.status === 'DONE').length || 0;
              const p     = total > 0 ? Math.round((done / total) * 100) : null;
              const color = subColor(h.subject, subjects);
              const isExp = expandedId === h.id;

              return (
                <div key={h.id} style={{ border: '1px solid #F3F4F6', borderRadius: 10, overflow: 'hidden' }}>
                  {/* Row header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: '#FAFAFA' }}>
                    <div style={{ width: 3, height: 32, borderRadius: 3, background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ background: color + '20', color, fontSize: 10, fontWeight: 700, borderRadius: 5, padding: '1px 7px' }}>
                          {h.subject}
                        </span>
                        {h.classGroup && (
                          <span style={{ background: '#F3F4F6', color: '#6B7280', fontSize: 10, borderRadius: 5, padding: '1px 6px' }}>
                            {h.classGroup}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {h.description}
                      </div>
                    </div>
                    {p !== null && (
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1,
                          color: p >= 80 ? '#16A34A' : p >= 50 ? '#D97706' : '#EF4444' }}>{p}%</div>
                        <div style={{ fontSize: 10, color: '#9CA3AF' }}>{done}/{total}</div>
                      </div>
                    )}
                    {total > 0 && (
                      <button onClick={() => setExpandedId(isExp ? null : h.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '2px 4px', flexShrink: 0 }}>
                        {isExp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    )}
                  </div>

                  {/* Completion micro-bar */}
                  {p !== null && (
                    <div style={{ height: 2, background: '#F3F4F6' }}>
                      <div style={{ height: 2, background: color, width: `${p}%`, transition: 'width 0.3s' }} />
                    </div>
                  )}

                  {/* Expanded student list */}
                  {isExp && h.submissions?.length > 0 && (
                    <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                      {h.submissions.map(sub => {
                        const sid = sub.studentId || sub.student?.id;
                        const isDone = sub.status === 'DONE';
                        return (
                          <div key={sid} style={{ borderBottom: '1px solid #F9FAFB' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px' }}>
                              <button onClick={() => !saving && toggleStudent(h.id, sid, sub.status)}
                                style={{ background: 'none', border: 'none', padding: 0, cursor: saving ? 'not-allowed' : 'pointer', flexShrink: 0,
                                  color: isDone ? '#16A34A' : '#D1D5DB' }}>
                                {isDone ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                              </button>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: isDone ? '#15803D' : 'var(--navy)' }}>
                                  {sub.student?.name || 'Student'}
                                </div>
                                {sub.notes && (
                                  <div style={{ fontSize: 10, color: '#6B7280', fontStyle: 'italic', marginTop: 1,
                                    background: '#FFFBEB', borderRadius: 4, padding: '1px 5px', display: 'inline-block' }}>
                                    📝 {sub.notes}
                                  </div>
                                )}
                              </div>
                              <span style={{
                                fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 5, flexShrink: 0,
                                background: isDone ? '#F0FDF4' : '#F9FAFB',
                                color: isDone ? '#16A34A' : '#9CA3AF',
                              }}>
                                {isDone ? 'Done' : 'Pending'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}

// ── Exam Countdown Widget ────────────────────────────────────────────────────
function ExamCountdownWidget() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);

  useEffect(() => {
    getExams().then(r => {
      const all = r.data?.data || [];
      const today = new Date().toDateString();
      const upcoming = all
        .filter(e => new Date(e.examDate) >= new Date(today))
        .sort((a, b) => new Date(a.examDate) - new Date(b.examDate))
        .slice(0, 3);
      setExams(upcoming);
    }).catch(() => {});
  }, []);

  if (!exams.length) return null;

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '14px 16px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, background: 'rgba(139,92,246,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={14} color="#8B5CF6" />
          </div>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>Upcoming Exams</h3>
            <p style={{ fontSize: 10, color: '#9CA3AF', margin: 0 }}>Next {exams.length} scheduled</p>
          </div>
        </div>
        <button onClick={() => navigate('/progress')} style={{ fontSize: 11, color: 'var(--cyan)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
          Exam Prep →
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {exams.map(exam => {
          const days = Math.ceil((new Date(exam.examDate) - new Date(new Date().toDateString())) / 86400000);
          const topics = Array.isArray(exam.topics) ? exam.topics : [];
          const covered = topics.filter(t => t.covered).length;
          const avgR = exam.studentPreps?.length
            ? Math.round(exam.studentPreps.reduce((a, p) => a + (p.readiness || 0), 0) / exam.studentPreps.length)
            : null;
          const urgColor = days <= 3 ? '#DC2626' : days <= 7 ? '#D97706' : '#16A34A';
          return (
            <div key={exam.id} onClick={() => navigate('/progress')} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 9, background: '#FAFAFA', border: '1px solid #F3F4F6', cursor: 'pointer' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${urgColor}15`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: urgColor, lineHeight: 1 }}>{days}</div>
                <div style={{ fontSize: 8, color: urgColor, opacity: 0.7 }}>days</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exam.title}</div>
                <div style={{ fontSize: 10, color: '#9CA3AF' }}>
                  {exam.subject} · {new Date(exam.examDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  {topics.length > 0 && ` · ${covered}/${topics.length} topics`}
                </div>
              </div>
              {avgR !== null && (
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: avgR >= 70 ? '#16A34A' : avgR >= 40 ? '#D97706' : '#DC2626', lineHeight: 1 }}>{avgR}%</div>
                  <div style={{ fontSize: 9, color: '#9CA3AF' }}>ready</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Home Tuition dedicated dashboard ────────────────────────────────────────

function HomeTuitionDashboard({ stats, user, tenant }) {
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const collected = stats.collectedThisMonth || 0;
  const outstanding = stats.feesDue || 0;
  const total = collected + outstanding;
  const collectionPct = total > 0 ? Math.round(collected / total * 100) : 0;

  const HT_ACTIONS = [
    { label: 'Collect Fee',      sub: 'Record payment',     href: '/fees',      color: 'var(--emerald)', icon: CheckCircle },
    { label: 'Add Student',      sub: 'New admission',      href: '/customers', color: 'var(--navy)',    icon: GraduationCap },
    { label: 'Log Expense',      sub: 'Track outgoing',     href: '/expenses',  color: 'var(--amber)',   icon: DollarSign },
    { label: 'WhatsApp Parents', sub: 'Send reminders',     href: '/campaigns', color: '#25D366',        icon: MessageCircle },
    { label: 'View Reports',     sub: 'Fee & student data', href: '/reports',   color: '#6B7280',        icon: TrendingUp },
    { label: 'Staff Attendance', sub: 'Mark today',         href: '/staff',     color: '#6B7280',        icon: UserCheck },
  ];

  return (
    <div style={{ padding: isMobile ? 12 : 32, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: isMobile ? 16 : 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 18 : 22, fontWeight: 800, color: 'var(--navy)', letterSpacing: '-0.02em', margin: 0 }}>
            {greeting}, {user?.name?.split(' ')[0]}.
          </h1>
          <span style={{ background: 'var(--surface-1)', color: '#6B7280', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, border: '1px solid var(--border)' }}>Home Tuition</span>
        </div>
        <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>
          {tenant?.name} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* 6 KPI cards — 3 columns × 2 rows */}
      <div className="kpi-grid" style={{ marginBottom: 26 }}>
        <KpiCard label="Total students"       value={stats.students || 0}            sub="Enrolled in your tuition"                                          icon={GraduationCap} color="var(--navy)" />
        <KpiCard label="Active students"      value={stats.activeStudents || 0}      sub={`${(stats.students || 0) - (stats.activeStudents || 0)} inactive`}  icon={UserCheck}     color="var(--cyan)" />
        <KpiCard label="Collected this month" value={fmt(stats.collectedThisMonth)}  sub={`${stats.collectedCount || 0} payments received`}                   icon={CheckCircle}   color="var(--emerald)" />
        <KpiCard label="Outstanding"          value={fmt(stats.feesDue)}             sub={`${stats.feesDueCount || 0} pending records`}                       icon={Clock}         color="var(--amber)" />
        <KpiCard label="Pending fees"         value={stats.feesDueCount || 0}        sub="Records awaiting collection"                                         icon={AlertTriangle} color="var(--amber)" />
        <KpiCard label="Overdue fees"         value={stats.overdueFees || 0}         sub="Send reminders to parents"                                          icon={AlertCircle}   color="var(--vermilion)" alert={stats.overdueFees > 0} />
      </div>

      {/* Exam Countdown */}
      <ExamCountdownWidget />

      {/* Homework Progress Card */}
      <div style={{ marginBottom: 20 }}>
        <HomeworkDashCard subjects={tenant?.receiptConfig?.subjects || []} />
      </div>

      {/* 2-column main area */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 3fr) minmax(0, 2fr)', gap: 20, alignItems: 'start', marginBottom: 24 }}>

        {/* Left — Overdue students list with WA + Collect actions */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
              Overdue fees
              {stats.overdueList?.length > 0 && (
                <span style={{ marginLeft: 8, background: '#FEF2F2', color: 'var(--vermilion)', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>
                  {stats.overdueList.length}
                </span>
              )}
            </h3>
            <a href="/fees" style={{ fontSize: 12, color: 'var(--cyan)', fontWeight: 600, textDecoration: 'none' }}>View all →</a>
          </div>
          {!stats.overdueList?.length ? (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <CheckCircle size={26} color="var(--emerald)" style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>No overdue fees — all caught up!</p>
            </div>
          ) : stats.overdueList.map((f, i) => {
            const balance = (f.netAmount || 0) - (f.paidAmount || 0);
            const dueStr = new Date(f.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            const phone = f.student?.phone;
            const waText = `📚 *Fee Reminder — ${tenant?.name}*\n\nDear Parent,\n\n${f.description || 'Fees'} for *${f.student?.name}* is overdue since ${dueStr}.\n\n💰 Balance Due: *${fmt(balance)}*\n\nKindly clear dues. Contact: ${tenant?.phone || ''}\n\nThank you 🙏`;
            return (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                  {f.student?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.student?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--vermilion)', marginTop: 2 }}>Overdue since {dueStr} · {f.description || 'Fees'}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--vermilion)', flexShrink: 0, marginRight: 4 }}>{fmt(balance)}</div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {phone && (
                    <a href={waLink(phone, waText)} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '4px 9px', borderRadius: 7, background: '#25D366', color: '#fff', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
                      <MessageCircle size={11} /> Remind
                    </a>
                  )}
                  <button onClick={() => navigate('/fees')} style={{ padding: '4px 9px', borderRadius: 7, background: 'var(--navy)', color: '#fff', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                    Collect
                  </button>
                </div>
              </div>
            );
          })}
        </Card>

        {/* Right — Month summary card + quick actions list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Month summary — dark navy */}
          <div style={{ background: 'var(--navy)', borderRadius: 16, padding: '20px 20px 22px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              {new Date().toLocaleString('en-IN', { month: 'long' })} Collection
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 3, letterSpacing: '-0.02em' }}>{fmt(collected)}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 14 }}>
              {stats.collectedCount || 0} payments · {collectionPct}% of total
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ height: '100%', width: `${collectionPct}%`, background: 'var(--cyan)', borderRadius: 4, transition: 'width 0.5s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>Outstanding</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: outstanding > 0 ? '#FCA5A5' : 'rgba(255,255,255,0.6)' }}>{fmt(outstanding)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>Pending records</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{stats.feesDueCount || 0}</div>
              </div>
            </div>
          </div>

          {/* Quick actions — vertical list */}
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', margin: '0 0 10px' }}>Quick actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {HT_ACTIONS.map((a) => (
                <div key={a.href + a.label} onClick={() => navigate(a.href)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 13px',
                  background: '#fff', borderRadius: 10, cursor: 'pointer',
                  border: '1px solid var(--border)', borderLeft: `3px solid ${a.color}`,
                  boxShadow: 'var(--shadow-sm)', transition: 'box-shadow 0.15s, transform 0.1s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `${a.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <a.icon size={14} color={a.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{a.label}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{a.sub}</div>
                  </div>
                  <ArrowRight size={13} color="#D1D5DB" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Smart Actions */}
      <SmartActionsWidget tenantName={tenant?.name} tenantPhone={tenant?.phone} />
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtWA = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const waLink = (phone, text) => {
  let p = String(phone || '').replace(/\D/g, '');
  if (p.startsWith('0')) p = p.slice(1);
  if (p.length === 10) p = '91' + p;
  return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
};

// ── Smart Actions Widget ──────────────────────────────────────────────────────
function SmartActionsWidget({ tenantName, tenantPhone }) {
  const [actions, setActions] = useState(null);
  const [summary, setSummary] = useState(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    getPendingActions().then(r => setActions(r.data.data)).catch(() => {});
    getDailySummary().then(r => setSummary(r.data.data)).catch(() => {});
  }, []);

  if (!actions && !summary) return null;

  const fees = actions?.fees || [];
  const appts = actions?.appointments || [];
  const lowStock = actions?.lowStock || [];
  const totalCount = fees.length + appts.length + lowStock.length;

  const todayStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  const summaryWAText = summary ? `📊 *Daily Sales Summary — ${tenantName}*\n📅 ${todayStr}\n\n🛒 Total Sales: *${fmtWA(summary.totalSales)}* (${summary.bills} bills)\n💵 Cash: ${fmtWA(summary.cashSales)} · UPI: ${fmtWA(summary.upiSales)}\n💸 Expenses: ${fmtWA(summary.totalExp)}\n📈 Net: *${fmtWA(summary.net)}*\n\nHave a great evening! 🙏` : '';

  const WaBtn = ({ phone, text, label }) => (
    <a href={waLink(phone, text)} target="_blank" rel="noopener noreferrer"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: '#25D366', color: '#fff', fontSize: 11, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
      <MessageCircle size={11} /> {label || 'WhatsApp'}
    </a>
  );

  return (
    <div style={{ marginBottom: 24, borderRadius: 14, border: '1px solid var(--border)', background: '#fff', overflow: 'hidden' }}>
      {/* Header */}
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', cursor: 'pointer', borderBottom: open ? '1px solid var(--border)' : 'none', background: 'var(--surface-1)' }}>
        <Zap size={16} color="var(--navy)" />
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)', flex: 1 }}>Smart Actions</span>
        {totalCount > 0 && (
          <span style={{ background: 'var(--vermilion)', color: '#fff', borderRadius: 10, fontSize: 11, fontWeight: 700, padding: '1px 8px' }}>{totalCount} pending</span>
        )}
        <span style={{ fontSize: 12, color: '#9CA3AF' }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{ padding: '0 0 4px' }}>
          {/* Daily Summary */}
          {summary && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <TrendingUp size={15} color="#059669" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Today's Sales</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>
                  {summary.bills} bills · {fmtWA(summary.totalSales)} total · Net {fmtWA(summary.net)}
                </div>
              </div>
              {tenantPhone && (
                <WaBtn phone={tenantPhone} text={summaryWAText} label="Send Summary" />
              )}
            </div>
          )}

          {/* Fee reminders */}
          {fees.map(fee => {
            const phone = fee.student?.phone || fee.student?.parentPhone;
            const balance = fee.netAmount - fee.paidAmount;
            const isOverdue = new Date(fee.dueDate) < new Date();
            const dueStr = new Date(fee.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
            const waText = `📚 *Fee Reminder — ${tenantName}*\n\nDear ${fee.student?.parentName || fee.student?.name},\n\n${fee.description || 'Fee'} for *${fee.student?.name}* is ${isOverdue ? 'overdue' : 'due soon'} (${dueStr}).\n\n💰 Balance Due: *${fmtWA(balance)}*\n\nPlease clear dues. Contact us at ${tenantPhone}\n\nThank you!`;
            return (
              <div key={fee.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: isOverdue ? '#FEF2F2' : '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <GraduationCap size={15} color={isOverdue ? 'var(--vermilion)' : 'var(--amber)'} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{fee.student?.name} — {fmtWA(balance)} due</div>
                  <div style={{ fontSize: 12, color: isOverdue ? 'var(--vermilion)' : '#6B7280' }}>{isOverdue ? '⚠️ Overdue' : 'Due'}: {dueStr} · {fee.description}</div>
                </div>
                {phone && <WaBtn phone={phone} text={waText} label="Remind" />}
              </div>
            );
          })}

          {/* Today's appointments */}
          {appts.map(appt => {
            const phone = appt.customer?.phone;
            const timeStr = new Date(appt.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            const waText = `📅 *Appointment Reminder — ${tenantName}*\n\nHello ${appt.customer?.name || 'Customer'},\n\nYou have an appointment today at *${timeStr}*:\n📌 ${appt.service?.name || appt.title}\n\nPlease arrive 5 mins early. Call us: ${tenantPhone} 🙏`;
            return (
              <div key={appt.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Calendar size={15} color="#2563EB" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{appt.customer?.name || 'Walk-in'} at {timeStr}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{appt.service?.name || appt.title}</div>
                </div>
                {phone && <WaBtn phone={phone} text={waText} label="Remind" />}
              </div>
            );
          })}

          {/* Low stock */}
          {lowStock.map(product => (
            <div key={product.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Package size={15} color="var(--amber)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{product.name}</div>
                <div style={{ fontSize: 12, color: 'var(--amber)' }}>Only {product.stock} units left — reorder soon</div>
              </div>
              <a href="/inventory?section=purchase-orders" style={{ fontSize: 11, fontWeight: 700, color: 'var(--navy)', textDecoration: 'none', padding: '4px 10px', borderRadius: 6, border: '1.5px solid var(--border)', background: 'var(--surface-1)', whiteSpace: 'nowrap' }}>
                Create PO →
              </a>
            </div>
          ))}

          {totalCount === 0 && !summary && (
            <div style={{ padding: '24px 18px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
              <CheckCircle size={20} style={{ margin: '0 auto 8px', opacity: 0.4, display: 'block' }} />
              All caught up! No pending actions.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Category Tally Panel ──────────────────────────────────────────────────────
function CategoryTallyPanel({ catReport, loading }) {
  const navigate = useNavigate();
  const fmtV = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const categoriesWithProducts = (catReport || []).filter(c => c.summary.count > 0);
  const totalValue = categoriesWithProducts.reduce((s, c) => s + c.summary.inventoryValue, 0);

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Package size={14} color="var(--navy)" />
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>Category Tally</h3>
        {totalValue > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
            Total: {fmtV(totalValue)}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '20px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Loading…</div>
      ) : categoriesWithProducts.length === 0 ? (
        <div style={{ padding: '20px 0', textAlign: 'center', color: '#9CA3AF' }}>
          <Package size={24} style={{ margin: '0 auto 8px', opacity: 0.3, display: 'block' }} />
          <p style={{ fontSize: 13 }}>No products with categories yet.</p>
          <button onClick={() => navigate('/inventory')}
            style={{ marginTop: 8, fontSize: 12, color: 'var(--navy)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Go to Inventory →
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {categoriesWithProducts.slice(0, 6).map(cat => {
            const pct = totalValue > 0 ? (cat.summary.inventoryValue / totalValue) * 100 : 0;
            return (
              <div key={cat.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 15, width: 22, textAlign: 'center', flexShrink: 0 }}>{cat.icon || '📦'}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span>
                  {cat.code && <span style={{ fontSize: 10, fontWeight: 700, color: cat.color || '#64748B', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{cat.code}</span>}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>{cat.summary.count}</span>
                    <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 3 }}>items</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cyan)', fontFamily: 'var(--font-mono)', flexShrink: 0, minWidth: 72, textAlign: 'right' }}>{fmtV(cat.summary.inventoryValue)}</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: '#F3F4F6', marginLeft: 30, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: cat.color || 'var(--cyan)', borderRadius: 2, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            );
          })}
          {categoriesWithProducts.length > 6 && (
            <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 2 }}>+{categoriesWithProducts.length - 6} more categories</p>
          )}
          <button onClick={() => navigate('/inventory?tab=analytics')}
            style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: 'var(--navy)', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '6px 0', cursor: 'pointer', width: '100%' }}>
            View full tally in Inventory →
          </button>
        </div>
      )}
    </Card>
  );
}

// ── Trainer Dashboard (STAFF role in GYM) ───────────────────────────────────
const SPEC_PALETTE = ['#8B5CF6','#3B82F6','#EF4444','#10B981','#F59E0B','#06B6D4','#EC4899','#6366F1','#F97316','#84CC16'];
const GRAD_PAIRS_T = [['#0F2349','#1FB8D6'],['#7C3AED','#A78BFA'],['#065F46','#34D399'],['#92400E','#FBBF24'],['#1E3A8A','#60A5FA'],['#881337','#FB7185']];
const trainerGrad = (n = '') => { let h = 0; for (let i = 0; i < n.length; i++) h = n.charCodeAt(i) + ((h << 5) - h); const [a, b] = GRAD_PAIRS_T[Math.abs(h) % GRAD_PAIRS_T.length]; return `linear-gradient(135deg,${a} 0%,${b} 100%)`; };
const specCol = (n = '') => { let h = 0; for (let i = 0; i < n.length; i++) h = n.charCodeAt(i) + ((h << 5) - h); return SPEC_PALETTE[Math.abs(h) % SPEC_PALETTE.length]; };
const fmtT = (dt) => dt ? new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
const fmtDT = (dt) => {
  const d = new Date(dt);
  const today = new Date().toDateString() === d.toDateString();
  const tomorrow = new Date(Date.now() + 86400000).toDateString() === d.toDateString();
  const day = today ? 'Today' : tomorrow ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  return `${day} · ${fmtT(d)}`;
};

const STATUS_STYLE = {
  CONFIRMED:  { bg: '#F0FDF4', c: '#16A34A', label: 'Confirmed' },
  SCHEDULED:  { bg: '#EFF6FF', c: '#3B82F6', label: 'Scheduled' },
  COMPLETED:  { bg: '#F3F4F6', c: '#6B7280', label: 'Done' },
  CANCELLED:  { bg: '#FEF2F2', c: '#DC2626', label: 'Cancelled' },
  NO_SHOW:    { bg: '#FFFBEB', c: '#D97706', label: 'No-show' },
};

function TrainerSessionCard({ s }) {
  const nav = useNavigate();
  const st = STATUS_STYLE[s.status] || STATUS_STYLE.SCHEDULED;
  const cc = specCol(s.service?.name || '');
  return (
    <div onClick={() => nav('/appointments')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: '#fff', border: '1px solid #F3F4F6', cursor: 'pointer', transition: 'box-shadow 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; }}>
      <div style={{ width: 4, height: 44, borderRadius: 3, background: cc, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {s.customer?.name || 'Walk-in'}
        </div>
        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
          {s.service?.name && <span style={{ color: cc, fontWeight: 600 }}>{s.service.name}</span>}
          <span>·</span>
          <span>{fmtDT(s.startTime || s.scheduledAt)}</span>
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: st.bg, color: st.c, flexShrink: 0 }}>{st.label}</span>
    </div>
  );
}

function TrainerDashboard({ user, tenant }) {
  const nav = useNavigate();
  const { isMobile } = useBreakpoint();
  const [staffRecord, setStaffRecord] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStaff(), getAppointments({ limit: 200 })]).then(([sr, ar]) => {
      const staff = sr.data.data || [];
      const me = staff.find(s => s.email === user.email) || staff.find(s => s.name === user.name) || null;
      setStaffRecord(me);
      const apptData = ar.data.data;
      const allAppts = Array.isArray(apptData) ? apptData : (apptData?.appointments || []);
      if (me) {
        setSessions(allAppts.filter(s => s.staffId === me.id || (s.staff?.name || s.staffName || '').toLowerCase() === me.name.toLowerCase()));
      } else {
        setSessions(allAppts);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user.email, user.name]);

  const now = new Date();
  const todaySessions = sessions.filter(s => new Date(s.startTime || s.scheduledAt).toDateString() === now.toDateString());
  const upcomingSessions = sessions.filter(s => {
    const dt = new Date(s.startTime || s.scheduledAt);
    return dt > now && dt.toDateString() !== now.toDateString() && dt <= new Date(now.getTime() + 7 * 86400000);
  }).sort((a, b) => new Date(a.startTime || a.scheduledAt) - new Date(b.startTime || b.scheduledAt));
  const completedTotal = sessions.filter(s => s.status === 'COMPLETED').length;
  const uniqueMembers = [...new Map(sessions.filter(s => s.customer).map(s => [s.customer.id, s.customer])).values()];

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const gradient = trainerGrad(user.name);
  const specs = staffRecord?.specialization || [];

  if (loading) {
    return (
      <div style={{ padding: isMobile ? 16 : 28, maxWidth: 900, margin: '0 auto' }}>
        <div style={{ height: 180, background: '#F3F4F6', borderRadius: 20, animation: 'pulse 1.4s ease-in-out infinite', marginBottom: 16 }} />
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
        {[...Array(3)].map((_, i) => <div key={i} style={{ height: 72, background: '#F3F4F6', borderRadius: 12, marginBottom: 10, animation: 'pulse 1.4s ease-in-out infinite' }} />)}
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? 16 : 28, maxWidth: 900, margin: '0 auto' }}>

      {/* Profile hero card */}
      <div style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
        <div style={{ background: gradient, padding: isMobile ? '20px 20px 60px' : '24px 28px 72px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#fff' }}>
            {tenant?.name}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>{greeting}</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>{user.name}</h1>
          {staffRecord && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>{staffRecord.role || 'Trainer'} {staffRecord.department ? `· ${staffRecord.department}` : ''}</div>}
        </div>

        <div style={{ background: '#fff', padding: isMobile ? '0 16px 20px' : '0 24px 24px', position: 'relative' }}>
          {/* Stats row overlapping gradient */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: -28, marginBottom: 20 }}>
            {[
              { label: "Today's Sessions", value: todaySessions.length, color: 'var(--cyan)', bg: '#F0F9FF' },
              { label: 'This Week', value: upcomingSessions.length + todaySessions.length, color: '#7C3AED', bg: '#F5F3FF' },
              { label: 'Total Done', value: completedTotal, color: '#10B981', bg: '#F0FDF4' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ background: bg, borderRadius: 14, padding: '14px 10px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: `1px solid ${color}22` }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Specializations */}
          {specs.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: staffRecord?.bio ? 14 : 0 }}>
              {specs.map(s => (
                <span key={s} style={{ background: specCol(s) + '18', color: specCol(s), fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>{s}</span>
              ))}
            </div>
          )}

          {/* Bio */}
          {staffRecord?.bio && (
            <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, margin: '12px 0 0', borderLeft: '3px solid var(--cyan)', paddingLeft: 12 }}>
              {staffRecord.bio}
            </p>
          )}

          {/* Certifications */}
          {staffRecord?.certifications?.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
              {staffRecord.certifications.map(c => (
                <span key={c} style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Award size={10} /> {c}
                </span>
              ))}
            </div>
          )}

          {/* Contact */}
          {(staffRecord?.phone || staffRecord?.email) && (
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              {staffRecord.phone && (
                <a href={`tel:${staffRecord.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '6px 12px', textDecoration: 'none', color: '#047857', fontSize: 12, fontWeight: 600 }}>
                  <Phone size={12} /> {staffRecord.phone}
                </a>
              )}
              {staffRecord.email && (
                <a href={`mailto:${staffRecord.email}`} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '6px 12px', textDecoration: 'none', color: '#1D4ED8', fontSize: 12, fontWeight: 600 }}>
                  <Mail size={12} /> {staffRecord.email}
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Today's sessions */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--navy)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={16} color="var(--cyan)" /> Today's Schedule
          </h2>
          <button onClick={() => nav('/appointments')} style={{ fontSize: 12, fontWeight: 600, color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer' }}>
            View all →
          </button>
        </div>
        {todaySessions.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border)', padding: '28px 20px', textAlign: 'center' }}>
            <Dumbbell size={28} color="#E5E7EB" style={{ display: 'block', margin: '0 auto 8px' }} />
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>No sessions scheduled for today</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todaySessions.map(s => <TrainerSessionCard key={s.id} s={s} />)}
          </div>
        )}
      </div>

      {/* Upcoming sessions */}
      {upcomingSessions.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--navy)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} color="#7C3AED" /> Upcoming This Week
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcomingSessions.slice(0, 5).map(s => <TrainerSessionCard key={s.id} s={s} />)}
            {upcomingSessions.length > 5 && (
              <button onClick={() => nav('/appointments')} style={{ fontSize: 13, color: 'var(--cyan)', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 10, padding: '10px', cursor: 'pointer', fontWeight: 600 }}>
                +{upcomingSessions.length - 5} more sessions → View all
              </button>
            )}
          </div>
        </div>
      )}

      {/* Members I train */}
      {uniqueMembers.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--navy)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={16} color="#10B981" /> My Members
              <span style={{ background: '#D1FAE5', color: '#065F46', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{uniqueMembers.length}</span>
            </h2>
            <button onClick={() => nav('/customers')} style={{ fontSize: 12, fontWeight: 600, color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer' }}>
              View all →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            {uniqueMembers.slice(0, 8).map(m => {
              let h = 0; for (let i = 0; i < (m.name || '').length; i++) h = m.name.charCodeAt(i) + ((h << 5) - h);
              const colors = ['#EDE9FE','#DBEAFE','#D1FAE5','#FEF3C7','#FFE4E6','#CFFAFE'];
              const textColors = ['#7C3AED','#1D4ED8','#065F46','#92400E','#BE123C','#0E7490'];
              const ci = Math.abs(h) % colors.length;
              return (
                <div key={m.id} onClick={() => nav(`/customers/${m.id}`)} style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'box-shadow 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: colors[ci], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: textColors[ci], flexShrink: 0 }}>
                    {m.name[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                    {m.phone && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{m.phone}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { label: 'All Sessions', sub: 'View & manage your schedule', icon: Calendar, href: '/appointments', color: 'var(--cyan)' },
          { label: 'Members', sub: 'Browse gym members', icon: Users, href: '/customers', color: '#7C3AED' },
          { label: 'My Profile', sub: 'View attendance & pay', icon: Activity, href: '/staff', color: '#10B981' },
        ].map(({ label, sub, icon: Icon, href, color }) => (
          <div key={href} onClick={() => nav(href)} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', border: '1px solid var(--border)', borderLeft: `3px solid ${color}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'box-shadow 0.15s, transform 0.1s' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'none'; }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Icon size={16} color={color} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>{label}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Owner/Admin Dashboard ─────────────────────────────────────────────────────
function OwnerDashboard({ user, tenant }) {
  const { isMobile } = useBreakpoint();
  const { branchId } = useBranch();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [catReport, setCatReport] = useState([]);
  const [catLoading, setCatLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    getDashboard(branchId ? { branchId } : undefined)
      .then(d => setStats(d.data.data))
      .catch(err => {
        console.error('Dashboard load error:', err);
        setLoadError(err?.response?.data?.message || err?.message || 'Unknown error');
      })
      .finally(() => setLoading(false));
  }, [branchId]);

  useEffect(() => {
    if (!stats) return;
    const btype = stats?.businessType || tenant?.businessType || 'OTHER';
    const isInventoryBusiness = !['HOME_TUITION','COACHING','TUITION','COACHING_INSTITUTE','GYM','FITNESS','YOGA',
      'CLINIC','HOSPITAL','DENTIST','DERMATOLOGIST','AYURVEDA','VETERINARY','VET_CLINIC',
      'CA_FIRM','LAWYER','CONSULTANT','FREELANCER','TRAVEL_AGENCY','PROPERTY',
      'LEASE','PAYING_GUEST','CO_WORKING'].includes(btype);
    if (!isInventoryBusiness) return;
    setCatLoading(true);
    getCategoryReport().then(r => setCatReport(r.data.data || [])).catch(() => {}).finally(() => setCatLoading(false));
  }, [stats]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const btype = stats?.businessType || tenant?.businessType || 'OTHER';
  const actions = QUICK_ACTIONS[btype] || QUICK_ACTIONS.OTHER;
  const businessLabel = BUSINESS_LABELS[btype] || 'Business';

  if (loading) return <Skeleton />;
  if (!stats) return (
    <div style={{ padding: 32 }}>
      <p style={{ color: 'var(--vermilion)', fontWeight: 600, marginBottom: 8 }}>Failed to load dashboard.</p>
      {loadError && <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 12, fontFamily: 'var(--font-mono)', background: '#F9FAFB', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>{loadError}</p>}
      <button onClick={() => { setLoading(true); setLoadError(null); getDashboard(branchId ? { branchId } : undefined).then(d => setStats(d.data.data)).catch(e => setLoadError(e?.response?.data?.message || e?.message || 'Unknown error')).finally(() => setLoading(false)); }}
        style={{ padding: '8px 16px', borderRadius: 9, background: 'var(--navy)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
        Retry
      </button>
    </div>
  );

  if (btype === 'HOME_TUITION') {
    return <HomeTuitionDashboard stats={stats} user={user} tenant={tenant} />;
  }

  const renderKpis = () => {
    if (SALON_POS_TYPES.includes(btype))  return <SalonPosKpis stats={stats} />;
    if (CLINIC_TYPES.includes(btype))     return <ClinicKpis stats={stats} />;
    if (COACHING_TYPES.includes(btype))   return <CoachingKpis stats={stats} />;
    if (GYM_TYPES.includes(btype))        return <GymKpis stats={stats} />;
    if (EVENT_TYPES.includes(btype))      return <EventKpis stats={stats} />;
    if (INVOICE_TYPES.includes(btype))    return <FreelancerKpis stats={stats} />;
    if (PROPERTY_TYPES.includes(btype))   return <MallKpis stats={stats} />;
    if (SUPPLIER_TYPES.includes(btype))   return <SupplierKpis stats={stats} />;
    return <POSKpis stats={stats} />;
  };

  const renderSecondary = () => {
    if (SALON_POS_TYPES.includes(btype)) return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {stats.weeklyRevenue?.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '3fr 2fr', gap: 16 }}>
            <RevenueTrendChart data={stats.weeklyRevenue} />
            <RecentTransactionsPanel transactions={stats.recentTransactions} />
          </div>
        )}
        <SchedulePanel schedule={stats.todaySchedule} />
      </div>
    );

    if (CLINIC_TYPES.includes(btype)) return (
      <SchedulePanel schedule={stats.todaySchedule} title="Today's patients" href="/appointments" />
    );

    if (COACHING_TYPES.includes(btype)) return (
      <OverduePanel list={stats.overdueList} />
    );

    if (GYM_TYPES.includes(btype)) return (
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '3fr 2fr', gap: 16 }}>
        <GymUpcomingSessionsPanel sessions={stats.todaySchedule} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ActiveTrainersPanel sessions={stats.todaySchedule} />
          <ExpiringMembersPanel members={stats.expiringMembers} />
        </div>
      </div>
    );

    if (EVENT_TYPES.includes(btype)) return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <UpcomingEventsPanel events={stats.upcomingEventList} />
        <EventPaymentPanel
          monthInvoiced={stats.monthInvoiced}
          monthCollected={stats.monthCollected}
          balanceDue={stats.balanceDue}
          invoiceCount={stats.invoiceCount}
        />
      </div>
    );

    if (INVOICE_TYPES.includes(btype)) return (
      <AgingPanel agingBuckets={stats.agingBuckets} topOutstanding={stats.topOutstanding} />
    );

    if (PROPERTY_TYPES.includes(btype)) return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <UnitListPanel unitList={stats.unitList} />
          <RentCollectionPanel rentCollection={stats.rentCollection} />
        </div>
      </div>
    );

    if (SUPPLIER_TYPES.includes(btype)) return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <OutstandingPanel topOutstanding={stats.topOutstanding} />
        <PurchaseOrderPanel orders={stats.recentPurchaseOrders} />
      </div>
    );

    // POS Retail — default: trend + recent txns + low stock + category tally + payment methods + top sellers
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {stats.weeklyRevenue?.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '3fr 2fr', gap: 16 }}>
            <RevenueTrendChart data={stats.weeklyRevenue} />
            <RecentTransactionsPanel transactions={stats.recentTransactions} />
          </div>
        )}
        <LowStockPanel items={stats.lowStockItems} />
        <CategoryTallyPanel catReport={catReport} loading={catLoading} />
        {(stats.paymentMethodBreakdown?.length > 0 || stats.weekTopSellers?.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <PaymentMethodPanel breakdown={stats.paymentMethodBreakdown} />
            <TopSellersPanel sellers={stats.weekTopSellers} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ ...P.wrap(isMobile), maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: isMobile ? 16 : 24, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: isMobile ? 40 : 48, height: isMobile ? 40 : 48, borderRadius: '50%', background: 'linear-gradient(135deg, var(--navy) 0%, var(--cyan) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: isMobile ? 16 : 18, fontWeight: 800, flexShrink: 0, boxShadow: '0 2px 8px rgba(15,41,66,0.2)' }}>
          {user?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 17 : 21, fontWeight: 800, color: 'var(--navy)', letterSpacing: '-0.02em', margin: 0 }}>
              {greeting}, {user?.name?.split(' ')[0]}.
            </h1>
            <span style={{ background: 'var(--surface-1)', color: '#6B7280', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, border: '1px solid var(--border)' }}>{businessLabel}</span>
          </div>
          <p style={{ color: '#9CA3AF', fontSize: 12, margin: 0 }}>
            {tenant?.name} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Business-type KPIs */}
      <div style={{ marginBottom: 24 }}>
        {renderKpis()}
      </div>

      {/* Smart Actions */}
      <SmartActionsWidget tenantName={tenant?.name} tenantPhone={tenant?.phone} />

      {/* Quick actions */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>Quick actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(220px, 1fr))', gap: isMobile ? 8 : 10 }}>
          {actions.map((a) => <QuickAction key={a.href + a.label} {...a} />)}
        </div>
      </div>

      {/* Secondary panel — contextual list data per business type */}
      {renderSecondary()}
    </div>
  );
}

// ── Dashboard router ──────────────────────────────────────────────────────────
const GYM_TYPES_D = ['GYM', 'SPA', 'YOGA_STUDIO', 'MARTIAL_ARTS', 'SPORTS_ACADEMY', 'SWIMMING_ACADEMY', 'CROSSFIT_STUDIO'];

export default function Dashboard() {
  const { user, tenant } = useAuth();
  if (user?.role === 'STAFF' && GYM_TYPES_D.includes(tenant?.businessType)) {
    return <TrainerDashboard user={user} tenant={tenant} />;
  }
  return <OwnerDashboard user={user} tenant={tenant} />;
}

