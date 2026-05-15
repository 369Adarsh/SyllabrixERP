// Dashboard.jsx — composes the home view, drives the adaptation
const BUSINESS_PROFILES = {
  retail: {
    id: 'retail',
    label: 'Retail · Kirana',
    branchName: 'Sharma Kirana Stores',
    branchInitial: 'S',
    branchSub: 'Andheri W · Branch 2 of 3',
    searchHint: 'products, invoices, customers',
    primaryAction: 'New invoice',
    greeting: 'Good morning, Riya.',
    greetingSub: "Here's your shop today.",
    modules: [
      { id: 'pos',       icon: 'store',                 label: 'Point of Sale' },
      { id: 'inventory', icon: 'boxes',                 label: 'Inventory', badge: '12' },
      { id: 'invoices',  icon: 'receipt-indian-rupee',  label: 'Invoices' },
      { id: 'customers', icon: 'users',                 label: 'Customers' },
      { id: 'suppliers', icon: 'truck',                 label: 'Suppliers' },
      { id: 'cashbook',  icon: 'wallet',                label: 'Cashbook' },
    ],
    kpis: [
      { label: "Today's sales",   value: '₹1,24,560', delta: '▲ 18%', deltaTone: 'pos', sub: 'vs yesterday' },
      { label: 'Bills today',      value: '86',         delta: '▲ 9',  deltaTone: 'pos', sub: 'avg ₹1,449', variant: 'default' },
      { label: 'Cash in hand',     value: '₹38,420',    delta: '— 0%', deltaTone: 'flat', sub: 'all branches', variant: 'saffron' },
      { label: 'Low stock items',  value: '12',         delta: '▲ 4',  deltaTone: 'neg', sub: 'reorder needed', variant: 'gradient' },
    ],
    quickModules: [
      { icon: 'scan-barcode', label: 'Scan & bill', sub: 'Open POS scanner' },
      { icon: 'package-plus', label: 'Add product', sub: 'New SKU in 30s' },
      { icon: 'megaphone',    label: 'Run an offer', sub: 'Festive flat-discount' },
      { icon: 'sparkles',     label: 'Make a reel',  sub: 'AI video from products', tone: 'saffron' },
    ],
    table: {
      title: 'Recent invoices',
      cta: 'View all invoices',
      columns: [
        { label: 'Invoice', key: 'no' },
        { label: 'Customer', key: 'who' },
        { label: 'Branch', key: 'branch' },
        { label: 'Amount', align: 'right', render: (r) => <span className="numeric" style={{ fontWeight: 600 }}>₹{r.amt}</span> },
        { label: 'Status', render: (r) => <StatusPill tone={r.tone}>{r.status}</StatusPill> },
      ],
      rows: [
        { no: 'INV-2026-00481', who: 'Anjali Mehta',     branch: 'Andheri W',  amt: '4,820',  status: 'Paid',     tone: 'success' },
        { no: 'INV-2026-00482', who: 'Patil & Sons',     branch: 'Andheri W',  amt: '18,400', status: 'Pending',  tone: 'warning' },
        { no: 'INV-2026-00483', who: 'Ramesh Kirana',    branch: 'Bandra',     amt: '2,100',  status: 'Overdue',  tone: 'danger'  },
        { no: 'INV-2026-00484', who: 'Walk-in',          branch: 'Andheri W',  amt: '845',    status: 'Paid',     tone: 'success' },
        { no: 'INV-2026-00485', who: 'Dr. Khan Clinic',  branch: 'Bandra',     amt: '12,300', status: 'Paid',     tone: 'success' },
      ],
    },
    copilotHistory: [
      { role: 'ai', text: "Sales are up 18% today — biggest jump from your festive offer on cooking oil. Want me to extend it through the weekend?" },
    ],
    copilotSuggest: ['Why are sales up?', 'Draft a WhatsApp offer', 'Reorder low-stock items', 'Make a reel for Diwali'],
    copilotReply: 'Drafted a WhatsApp message to your top 120 customers. Preview ready in Marketing → Drafts.',
  },
  coaching: {
    id: 'coaching',
    label: 'Coaching institute',
    branchName: 'Achieve IIT Academy',
    branchInitial: 'A',
    branchSub: 'Kota · 3 batches active',
    searchHint: 'students, batches, fees',
    primaryAction: 'New admission',
    greeting: 'Good morning, Mr. Verma.',
    greetingSub: "Here's your institute today.",
    modules: [
      { id: 'students',   icon: 'graduation-cap', label: 'Students' },
      { id: 'admissions', icon: 'user-plus',      label: 'Admissions', badge: '4' },
      { id: 'batches',    icon: 'layers',         label: 'Batches' },
      { id: 'fees',       icon: 'receipt-indian-rupee', label: 'Fees' },
      { id: 'attendance', icon: 'calendar-check', label: 'Attendance' },
      { id: 'exams',      icon: 'clipboard-list', label: 'Exams' },
    ],
    kpis: [
      { label: 'Active students', value: '342',       delta: '▲ 18',  deltaTone: 'pos', sub: 'this term' },
      { label: 'Fees collected',   value: '₹8.4L',    delta: '▲ 12%', deltaTone: 'pos', sub: 'this month' },
      { label: 'Pending fees',     value: '₹1.2L',    delta: '▼ 6%',  deltaTone: 'pos', sub: '14 students',  variant: 'saffron' },
      { label: 'Inquiries → admit',value: '38%',      delta: '▲ 4pp', deltaTone: 'pos', sub: 'last 30 days', variant: 'gradient' },
    ],
    quickModules: [
      { icon: 'user-plus',     label: 'New admission', sub: 'Walk in to enrolled in 2 min' },
      { icon: 'calendar-plus', label: 'New batch',     sub: 'Schedule, faculty, fee plan' },
      { icon: 'message-circle',label: 'Parent message', sub: 'WhatsApp progress card' },
      { icon: 'sparkles',      label: 'Admissions reel', sub: 'AI video for new batch', tone: 'saffron' },
    ],
    table: {
      title: 'Today\'s classes',
      cta: 'Open timetable',
      columns: [
        { label: 'Time',    key: 'time' },
        { label: 'Batch',   key: 'batch' },
        { label: 'Faculty', key: 'fac' },
        { label: 'Room',    key: 'room' },
        { label: 'Students', align: 'right', render: (r) => <span className="numeric" style={{ fontWeight: 600 }}>{r.n}</span> },
        { label: 'Status',  render: (r) => <StatusPill tone={r.tone}>{r.status}</StatusPill> },
      ],
      rows: [
        { time: '08:00', batch: 'JEE Adv · Phy',    fac: 'Dr. Iyer',     room: 'A-101', n: 28, status: 'Live',    tone: 'info'    },
        { time: '10:00', batch: 'NEET · Bio',        fac: 'Ms. Naidu',   room: 'A-102', n: 32, status: 'Upcoming',tone: 'warning' },
        { time: '12:00', batch: 'Foundation · Math', fac: 'Mr. Khanna',  room: 'B-201', n: 24, status: 'Upcoming',tone: 'warning' },
        { time: '14:00', batch: 'JEE Main · Chem',   fac: 'Ms. Banerjee',room: 'A-101', n: 30, status: 'Upcoming',tone: 'warning' },
      ],
    },
    copilotHistory: [
      { role: 'ai', text: '14 students have fees pending past 7 days. Want me to send a soft WhatsApp reminder, or escalate to parents?' },
    ],
    copilotSuggest: ['Send fee reminders', 'Top 10 absent students', 'Make a results reel', 'Schedule a parent meet'],
    copilotReply: 'Sent. 14 messages drafted in Hindi + English. Going out at 6:00 PM.',
  },
  salon: {
    id: 'salon',
    label: 'Salon',
    branchName: 'Bloom Salon & Spa',
    branchInitial: 'B',
    branchSub: 'Powai · 6 chairs · 8 staff',
    searchHint: 'appointments, services, customers',
    primaryAction: 'New appointment',
    greeting: 'Good morning, Sneha.',
    greetingSub: "Here's your day.",
    modules: [
      { id: 'appts',     icon: 'calendar-clock', label: 'Appointments', badge: '14' },
      { id: 'services',  icon: 'scissors',       label: 'Services' },
      { id: 'customers', icon: 'users',          label: 'Customers' },
      { id: 'packages',  icon: 'gift',           label: 'Packages' },
      { id: 'staff',     icon: 'user-cog',       label: 'Staff incentives' },
      { id: 'cashbook',  icon: 'wallet',         label: 'Cashbook' },
    ],
    kpis: [
      { label: 'Today\'s bookings',  value: '14',      delta: '▲ 3',  deltaTone: 'pos', sub: '6 walk-ins likely' },
      { label: 'Revenue today',       value: '₹22,400',delta: '▲ 11%',deltaTone: 'pos', sub: 'avg ticket ₹1,600' },
      { label: 'No-shows this week',  value: '4',       delta: '▼ 2', deltaTone: 'pos', sub: 'auto-reminder on', variant: 'saffron' },
      { label: 'Staff utilisation',   value: '74%',     delta: '▲ 6pp',deltaTone: 'pos', sub: 'across 6 chairs', variant: 'gradient' },
    ],
    quickModules: [
      { icon: 'calendar-plus', label: 'Book appointment', sub: 'Pick service, staff, slot' },
      { icon: 'tag',           label: 'Sell a package',    sub: '5-visit hair spa, etc.' },
      { icon: 'message-circle',label: 'WhatsApp reminders',sub: 'Sent 1 day before' },
      { icon: 'sparkles',      label: 'Festive reel',      sub: 'AI promo for offers', tone: 'saffron' },
    ],
    table: {
      title: "Today's appointments",
      cta: 'Open calendar',
      columns: [
        { label: 'Time',    key: 'time' },
        { label: 'Customer',key: 'who' },
        { label: 'Service', key: 'svc' },
        { label: 'Staff',   key: 'staff' },
        { label: 'Total',   align: 'right', render: (r) => <span className="numeric" style={{ fontWeight: 600 }}>₹{r.amt}</span> },
        { label: 'Status',  render: (r) => <StatusPill tone={r.tone}>{r.status}</StatusPill> },
      ],
      rows: [
        { time: '10:00', who: 'Priya Shah',    svc: 'Hair colour',    staff: 'Reena',   amt: '3,200', status: 'Checked in', tone: 'success' },
        { time: '11:00', who: 'Aakash Kumar',  svc: 'Beard sculpt',   staff: 'Imran',   amt: '600',   status: 'Upcoming',   tone: 'warning' },
        { time: '12:30', who: 'Meena Joshi',   svc: 'Hair spa',       staff: 'Reena',   amt: '1,800', status: 'Upcoming',   tone: 'warning' },
        { time: '14:00', who: 'Walk-in',       svc: 'Manicure',       staff: 'Pooja',   amt: '450',   status: 'Open slot',  tone: 'info'    },
      ],
    },
    copilotHistory: [
      { role: 'ai', text: 'Reena is fully booked through Saturday. Ready to open Sunday slots, or shift two regulars to Pooja?' },
    ],
    copilotSuggest: ['Open Sunday slots', 'Top customers this month', 'Make a Diwali offer', 'Send no-show reminder'],
    copilotReply: 'Sunday 10AM–6PM is open with Reena. Promoted to your top 40 customers via WhatsApp.',
  },
  clinic: {
    id: 'clinic',
    label: 'Clinic',
    branchName: 'Care Plus Clinic',
    branchInitial: 'C',
    branchSub: 'Powai · 2 doctors',
    searchHint: 'patients, appointments, prescriptions',
    primaryAction: 'New visit',
    greeting: 'Good morning, Dr. Iyer.',
    greetingSub: "Here's today's schedule.",
    modules: [
      { id: 'appts',     icon: 'calendar-clock', label: 'Appointments', badge: '11' },
      { id: 'patients',  icon: 'users',          label: 'Patients' },
      { id: 'rx',        icon: 'pill',           label: 'Prescriptions' },
      { id: 'billing',   icon: 'receipt-indian-rupee', label: 'Billing' },
      { id: 'staff',     icon: 'stethoscope',    label: 'Staff schedule' },
      { id: 'reports',   icon: 'file-text',      label: 'Reports' },
    ],
    kpis: [
      { label: 'Visits today',       value: '11',       delta: '▲ 2',   deltaTone: 'pos', sub: '4 walk-ins' },
      { label: 'Revenue today',       value: '₹16,200',  delta: '▲ 8%',  deltaTone: 'pos', sub: 'consult + tests' },
      { label: 'Follow-ups due',      value: '7',        delta: '▼ 1',   deltaTone: 'pos', sub: 'auto-reminder set', variant: 'saffron' },
      { label: 'Patient retention',   value: '82%',      delta: '▲ 3pp', deltaTone: 'pos', sub: 'rolling 90d',       variant: 'gradient' },
    ],
    quickModules: [
      { icon: 'calendar-plus', label: 'New appointment', sub: 'Doctor, slot, contact' },
      { icon: 'pill',          label: 'Write prescription', sub: 'From last visit notes' },
      { icon: 'message-circle',label: 'Follow-up reminder', sub: 'Auto on day +7' },
      { icon: 'sparkles',      label: 'Health camp reel',   sub: 'AI promo video', tone: 'saffron' },
    ],
    table: {
      title: "Today's appointments",
      cta: 'Open schedule',
      columns: [
        { label: 'Time',     key: 'time' },
        { label: 'Patient',  key: 'who' },
        { label: 'Doctor',   key: 'doc' },
        { label: 'Reason',   key: 'reason' },
        { label: 'Fee',      align: 'right', render: (r) => <span className="numeric" style={{ fontWeight: 600 }}>₹{r.amt}</span> },
        { label: 'Status',   render: (r) => <StatusPill tone={r.tone}>{r.status}</StatusPill> },
      ],
      rows: [
        { time: '09:00', who: 'Reema Pathak',   doc: 'Dr. Iyer',  reason: 'Follow-up · BP',  amt: '500',  status: 'Checked in', tone: 'success' },
        { time: '09:30', who: 'Shashank Rao',   doc: 'Dr. Iyer',  reason: 'New · Cough',     amt: '700',  status: 'Upcoming',   tone: 'warning' },
        { time: '10:30', who: 'Manju Devi',     doc: 'Dr. Khan',  reason: 'New · Diabetes',  amt: '900',  status: 'Upcoming',   tone: 'warning' },
        { time: '11:30', who: 'Walk-in',        doc: 'Dr. Iyer',  reason: 'Vaccination',     amt: '450',  status: 'Open slot',  tone: 'info'    },
      ],
    },
    copilotHistory: [
      { role: 'ai', text: '7 patients have follow-ups due this week. Want me to send WhatsApp reminders with Dr. Iyer\'s next slots?' },
    ],
    copilotSuggest: ['Send follow-up reminders', 'Drug stock running low?', 'Make a health-camp reel', 'Patients overdue 30+ days'],
    copilotReply: 'Sent. Slots offered: Tue 11AM, Wed 4PM, Fri 9AM.',
  },
};

function Dashboard() {
  const [profileId, setProfileId] = React.useState('retail');
  const [theme, setTheme] = React.useState('light');
  const profile = BUSINESS_PROFILES[profileId];

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  return (
    <div className="app">
      <Sidebar profile={profile} active="home" onSelect={() => {}} />
      <main className="main">
        <TopBar profile={profile} onProfileChange={setProfileId} theme={theme} onTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
        <div className="scroll">
          <header className="page-head">
            <div>
              <div className="eyebrow">Home · {profile.label}</div>
              <h1 className="page-title">{profile.greeting}</h1>
              <p className="page-sub">{profile.greetingSub}</p>
            </div>
            <div className="page-actions">
              <button className="btn btn-secondary"><i data-lucide="download"></i> Export</button>
              <button className="btn btn-secondary"><i data-lucide="filter"></i> Filter</button>
            </div>
          </header>

          <section className="kpi-grid">
            {profile.kpis.map((k, i) => <KpiCard key={i} {...k} />)}
          </section>

          <section className="grid-2">
            <div className="card">
              <div className="card-head">
                <h3 className="card-title">{profile.table.title}</h3>
                <a href="#" className="card-link">{profile.table.cta} →</a>
              </div>
              <DataTable columns={profile.table.columns} rows={profile.table.rows} />
            </div>
            <div className="card">
              <div className="card-head">
                <h3 className="card-title">Quick actions</h3>
                <span className="eyebrow">Adapted for {profile.label.toLowerCase()}</span>
              </div>
              <div className="mt-grid">
                {profile.quickModules.map((m, i) => <ModuleTile key={i} {...m} />)}
              </div>
            </div>
          </section>

          <section className="card promo">
            <div className="promo-l">
              <div className="eyebrow" style={{ color: 'var(--saffron-300)' }}>AI Marketing Studio</div>
              <h3 className="promo-title">Make a reel from your shop today.</h3>
              <p className="promo-sub">Pick a goal, we pull live data, generate the script, score it, and send it to render. Ready in under a minute.</p>
              <div className="promo-actions">
                <button className="btn btn-saffron"><i data-lucide="sparkles"></i> Generate a reel</button>
                <button className="btn btn-ghost-light">Browse templates</button>
              </div>
            </div>
            <div className="promo-r">
              <img src="../../assets/illustration-ai-video.svg" alt="" />
            </div>
          </section>
        </div>
      </main>
      <AiCopilot profile={profile} />
    </div>
  );
}

window.Dashboard = Dashboard;
window.BUSINESS_PROFILES = BUSINESS_PROFILES;
