import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDashboard, getAiInsights } from '../../api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import {
  TrendingUp, ShoppingCart, FileText, Users, Package, AlertTriangle,
  Sparkles, Calendar, GraduationCap, Building2, DollarSign, UserCheck,
  Clock, Home, AlertCircle, CheckCircle, ArrowRight, Truck,
} from 'lucide-react';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

function KpiCard({ label, value, sub, icon: Icon, color = 'var(--navy)', alert = false }) {
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 6, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: alert ? 'var(--vermilion)' : 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{value}</p>
          {sub && <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 5 }}>{sub}</p>}
        </div>
        <div style={{ width: 42, height: 42, background: `${color}18`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={19} color={color} />
        </div>
      </div>
    </Card>
  );
}

function QuickAction({ label, sub, href, color, icon: Icon }) {
  const nav = useNavigate();
  return (
    <div onClick={() => nav(href)} style={{
      background: '#fff', borderRadius: 12, padding: '16px 18px', cursor: 'pointer',
      border: `1px solid var(--border)`, borderLeft: `3px solid ${color}`,
      boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: 12,
      transition: 'box-shadow 0.15s, transform 0.1s',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'none'; }}
    >
      {Icon && <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={16} color={color} />
      </div>}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{sub}</div>}
      </div>
      <ArrowRight size={14} color="#D1D5DB" />
    </div>
  );
}

// ── Business-type KPI layouts ────────────────────────────────────────────────

function POSKpis({ stats }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 14 }}>
        <KpiCard label="Today's revenue"    value={fmt(stats.today?.revenue)}  sub={`${stats.today?.transactions || 0} sales today`}    icon={TrendingUp}   color="var(--emerald)" />
        <KpiCard label="This month"         value={fmt(stats.month?.revenue)}  sub={`${stats.month?.transactions || 0} transactions`}   icon={ShoppingCart} color="var(--cyan)" />
        <KpiCard label="Pending invoices"   value={stats.pendingInvoices || 0} sub={`${stats.overdueInvoices || 0} overdue`}           icon={FileText}     color={stats.overdueInvoices > 0 ? 'var(--vermilion)' : 'var(--navy)'} alert={stats.overdueInvoices > 0} />
        <KpiCard label="Customers"          value={stats.customers || 0}       sub={`${stats.products || 0} products`}                 icon={Users}        color="var(--navy)" />
      </div>
      {stats.todayAppointments > 0 && (
        <KpiCard label="Appointments today" value={stats.todayAppointments} icon={Calendar} color="var(--amber)" />
      )}
      {stats.expiredProducts > 0 && (
        <Card style={{ borderLeft: '3px solid var(--vermilion)', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={16} color="var(--vermilion)" />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--vermilion)' }}>{stats.expiredProducts} product{stats.expiredProducts > 1 ? 's' : ''} already expired — remove from shelves</p>
              <p style={{ fontSize: 13, color: '#6B7280', marginTop: 1 }}>Selling expired stock is a legal and health risk.</p>
            </div>
            <a href="/inventory?filter=expired" style={{ fontSize: 12, color: 'var(--vermilion)', fontWeight: 600, whiteSpace: 'nowrap' }}>View →</a>
          </div>
        </Card>
      )}
      {stats.expiringProducts > 0 && (
        <Card style={{ borderLeft: '3px solid var(--amber)', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={16} color="var(--amber)" />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 14 }}>{stats.expiringProducts} product{stats.expiringProducts > 1 ? 's' : ''} expiring within 30 days</p>
              <p style={{ fontSize: 13, color: '#6B7280', marginTop: 1 }}>Sell or return to distributor before expiry.</p>
            </div>
            <a href="/inventory?filter=expiring" style={{ fontSize: 12, color: 'var(--amber)', fontWeight: 600, whiteSpace: 'nowrap' }}>View →</a>
          </div>
        </Card>
      )}
      {stats.lowStockProducts > 0 && (
        <Card style={{ borderLeft: '3px solid var(--amber)', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={16} color="var(--amber)" />
            <div>
              <p style={{ fontWeight: 700, fontSize: 14 }}>{stats.lowStockProducts} products running low on stock</p>
              <p style={{ fontSize: 13, color: '#6B7280', marginTop: 1 }}>Check your inventory before you run out.</p>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}

function SalonPosKpis({ stats }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 14 }}>
        <KpiCard label="Today's revenue"    value={fmt(stats.today?.revenue)}     sub={`${stats.today?.transactions || 0} services today`}  icon={TrendingUp} color="var(--emerald)" />
        <KpiCard label="This month"         value={fmt(stats.month?.revenue)}     sub={`${stats.month?.transactions || 0} transactions`}     icon={ShoppingCart} color="var(--cyan)" />
        <KpiCard label="Appointments today" value={stats.todayAppointments || 0} sub="Booked slots"                                        icon={Calendar}   color="var(--navy)" />
        <KpiCard label="Customers"          value={stats.customers || 0}          sub="Total served"                                        icon={Users}      color="#6B7280" />
      </div>
      {stats.expiredProducts > 0 && (
        <Card style={{ borderLeft: '3px solid var(--vermilion)', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={16} color="var(--vermilion)" />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--vermilion)' }}>{stats.expiredProducts} product{stats.expiredProducts > 1 ? 's' : ''} already expired</p>
              <p style={{ fontSize: 13, color: '#6B7280', marginTop: 1 }}>Remove from use immediately.</p>
            </div>
            <a href="/inventory?filter=expired" style={{ fontSize: 12, color: 'var(--vermilion)', fontWeight: 600 }}>View →</a>
          </div>
        </Card>
      )}
      {stats.expiringProducts > 0 && (
        <Card style={{ borderLeft: '3px solid var(--amber)', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={16} color="var(--amber)" />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 14 }}>{stats.expiringProducts} product{stats.expiringProducts > 1 ? 's' : ''} expiring within 30 days</p>
              <p style={{ fontSize: 13, color: '#6B7280', marginTop: 1 }}>Sell before expiry date.</p>
            </div>
            <a href="/inventory?filter=expiring" style={{ fontSize: 12, color: 'var(--amber)', fontWeight: 600 }}>View →</a>
          </div>
        </Card>
      )}
      {stats.lowStockProducts > 0 && (
        <Card style={{ borderLeft: '3px solid var(--amber)', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={16} color="var(--amber)" />
            <div>
              <p style={{ fontWeight: 700, fontSize: 14 }}>{stats.lowStockProducts} products running low</p>
              <p style={{ fontSize: 13, color: '#6B7280', marginTop: 1 }}>Restock your supplies before appointments.</p>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}

function CoachingKpis({ stats }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
      <KpiCard label="Active students"        value={stats.activeStudents || 0}      sub={`${stats.students || 0} total enrolled`}            icon={GraduationCap} color="var(--navy)" />
      <KpiCard label="Fees collected (month)" value={fmt(stats.collectedThisMonth)}  sub={`${stats.collectedCount || 0} payments received`}    icon={CheckCircle}   color="var(--emerald)" />
      <KpiCard label="Fees outstanding"       value={fmt(stats.feesDue)}             sub={`${stats.feesDueCount || 0} pending fee records`}    icon={Clock}         color="var(--amber)" />
      <KpiCard label="Overdue fees"           value={stats.overdueFees || 0}         sub="Send reminders to parents"                          icon={AlertCircle}   color="var(--vermilion)" alert={stats.overdueFees > 0} />
    </div>
  );
}

function ClinicKpis({ stats }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
      <KpiCard label="Appointments today"   value={stats.todayAppointments || 0}  sub={`${stats.monthAppointments || 0} this month`}      icon={Calendar}   color="var(--cyan)" />
      <KpiCard label="Scheduled (pending)"  value={stats.pendingAppointments || 0} sub="Awaiting confirmation"                            icon={Clock}      color="var(--amber)" />
      <KpiCard label="Patients"             value={stats.patients || 0}            sub="Total registered"                                 icon={Users}      color="var(--navy)" />
      <KpiCard label="Pending invoices"     value={stats.pendingInvoices || 0}     sub={`${stats.overdueInvoices || 0} overdue`}          icon={FileText}   color={stats.overdueInvoices > 0 ? 'var(--vermilion)' : 'var(--navy)'} alert={stats.overdueInvoices > 0} />
    </div>
  );
}

function GymKpis({ stats }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
      <KpiCard label="Members"                value={stats.members || 0}             sub="Total active members"             icon={Users}         color="var(--navy)" />
      <KpiCard label="Classes today"          value={stats.todayAppointments || 0}   sub="Scheduled sessions"               icon={Calendar}      color="var(--cyan)" />
      <KpiCard label="Fees collected (month)" value={fmt(stats.collectedThisMonth)}  sub="This month's collections"         icon={CheckCircle}   color="var(--emerald)" />
      <KpiCard label="Overdue membership"     value={stats.overdueFees || 0}         sub={`${stats.feesDue || 0} pending`}  icon={AlertCircle}   color="var(--vermilion)" alert={stats.overdueFees > 0} />
    </div>
  );
}

function EventKpis({ stats }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 14 }}>
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
      <KpiCard label="Invoiced this month"  value={fmt(stats.monthInvoiced)}    sub={`${stats.invoiceCount || 0} invoices raised`}   icon={FileText}    color="var(--navy)" />
      <KpiCard label="Collected this month" value={fmt(stats.monthCollected)}   sub="Payments received"                             icon={CheckCircle} color="var(--emerald)" />
      <KpiCard label="Pending invoices"     value={stats.pendingInvoices || 0}  sub={`${stats.overdueInvoices || 0} overdue`}       icon={Clock}       color={stats.overdueInvoices > 0 ? 'var(--vermilion)' : 'var(--amber)'} alert={stats.overdueInvoices > 0} />
      <KpiCard label="Clients"              value={stats.clients || 0}          sub="Total clients"                                 icon={Users}       color="var(--cyan)" />
    </div>
  );
}

function SupplierKpis({ stats }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
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
const GYM_TYPES       = ['GYM','SPA'];
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
  HOME_TUITION:   [A.fee('Collect fee'), A.student(), A.invoice(), A.reports()],
  MUSIC_SCHOOL:   [A.fee('Collect fee'), A.apt('Schedule class'), A.student(), A.reports()],
  DANCE_ACADEMY:  [A.fee('Collect fee'), A.apt('Schedule class'), A.invoice(), A.reports()],
  DRIVING_SCHOOL: [A.fee('Collect fee'), A.apt('Schedule lesson'), A.invoice(), A.reports()],
  COMPUTER_TRAINING: [A.fee('Collect fee'), A.apt('Schedule batch'), A.invoice(), A.reports()],

  // ── Gym & Wellness ────────────────────────────────────────────────────────────
  GYM:            [A.fee('Membership payment'), A.apt('Schedule class'), A.customer('Members'), A.staff()],
  SPA:            [A.apt('Book session'), A.fee('Collect fee'), A.customer(), A.reports()],

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

// ── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, tenant } = useAuth();
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboard(), getAiInsights()])
      .then(([d, i]) => { setStats(d.data.data); setInsights(i.data.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const btype = stats?.businessType || tenant?.businessType || 'OTHER';
  const actions = QUICK_ACTIONS[btype] || QUICK_ACTIONS.OTHER;
  const businessLabel = BUSINESS_LABELS[btype] || 'Business';

  if (loading) return <Skeleton />;

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
      <ExpiringMembersPanel members={stats.expiringMembers} />
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

    // POS Retail — default: low stock + payment methods + top sellers
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <LowStockPanel items={stats.lowStockItems} />
        {(stats.paymentMethodBreakdown?.length > 0 || stats.weekTopSellers?.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <PaymentMethodPanel breakdown={stats.paymentMethodBreakdown} />
            <TopSellersPanel sellers={stats.weekTopSellers} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: 32, maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--navy)', letterSpacing: '-0.02em', margin: 0 }}>
            {greeting}, {user?.name?.split(' ')[0]}.
          </h1>
          <span style={{ background: 'var(--surface-1)', color: '#6B7280', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, border: '1px solid var(--border)' }}>{businessLabel}</span>
        </div>
        <p style={{ color: '#6B7280', fontSize: 13 }}>
          {tenant?.name} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* AI Insights */}
      {insights?.insights?.length > 0 && (
        <div style={{ marginBottom: 22, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {insights.insights.map((ins, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px',
              background: ins.type === 'danger' ? '#FEF2F2' : ins.type === 'warning' ? '#FFFBEB' : '#F0F9FF',
              borderRadius: 10,
              border: `1px solid ${ins.type === 'danger' ? '#FECACA' : ins.type === 'warning' ? '#FDE68A' : '#BAE6FD'}`,
            }}>
              <Sparkles size={14} color={ins.type === 'danger' ? 'var(--vermilion)' : ins.type === 'warning' ? 'var(--amber)' : 'var(--cyan)'} />
              <span style={{ fontSize: 13, flex: 1 }}>{ins.message}</span>
              <Badge color={ins.type === 'danger' ? 'red' : ins.type === 'warning' ? 'amber' : 'blue'}>{ins.action}</Badge>
            </div>
          ))}
        </div>
      )}

      {/* Business-type KPIs */}
      <div style={{ marginBottom: 24 }}>
        {renderKpis()}
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>Quick actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          {actions.map((a) => <QuickAction key={a.href + a.label} {...a} />)}
        </div>
      </div>

      {/* Secondary panel — contextual list data per business type */}
      {renderSecondary()}
    </div>
  );
}
