import { useNavigate } from 'react-router-dom';

const MODULES = [
  { icon: '🧾', name: 'Invoicing' }, { icon: '📦', name: 'Inventory' },
  { icon: '🛒', name: 'Point of Sale' }, { icon: '👥', name: 'CRM' },
  { icon: '📅', name: 'Appointments' }, { icon: '💰', name: 'Expenses' },
  { icon: '👨‍💼', name: 'Staff & HR' }, { icon: '📊', name: 'Reports' },
  { icon: '🤖', name: 'AI Copilot' }, { icon: '📱', name: 'WhatsApp' },
  { icon: '💳', name: 'Memberships' }, { icon: '🏦', name: 'Accounts' },
];

const BUSINESSES = [
  'Kirana Store', 'Retail Shop', 'Gym & Fitness', 'Salon & Spa',
  'Clinic', 'Restaurant', 'Coaching Centre', 'Workshop',
  'Freelancer', 'Mall', 'Pharmacy', 'Bakery',
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#060E1A', color: '#fff', fontFamily: "'Inter', -apple-system, sans-serif", overflowX: 'hidden' }}>

      {/* ── Nav ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(6,14,26,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 5vw' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/logo-wordmark.svg" alt="Syllabrix" style={{ height: 28, objectFit: 'contain' }}
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
            <span style={{ display: 'none', fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>
              Syllab<span style={{ color: '#17B9D0' }}>rix</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => navigate('/login')} style={{ padding: '8px 18px', background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#CBD5E1', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              Log in
            </button>
            <button onClick={() => navigate('/register')} style={{ padding: '8px 20px', background: 'linear-gradient(135deg,#17B9D0,#0E9CB5)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Start Free →
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ padding: '80px 5vw 60px', textAlign: 'center', position: 'relative' }}>
        {/* Glow */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse at center, rgba(23,185,208,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(23,185,208,0.1)', border: '1px solid rgba(23,185,208,0.25)', borderRadius: 20, padding: '5px 14px', marginBottom: 28, fontSize: 12, color: '#17B9D0', fontWeight: 600 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#17B9D0', display: 'inline-block', boxShadow: '0 0 8px #17B9D0' }} />
          Now live · 83 business types · Made in India
        </div>

        <h1 style={{ fontSize: 'clamp(36px, 7vw, 72px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 12px' }}>
          One Platform.
        </h1>
        <h1 style={{ fontSize: 'clamp(36px, 7vw, 72px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 12px', color: '#17B9D0' }}>
          Every Business.
        </h1>
        <h1 style={{ fontSize: 'clamp(36px, 7vw, 72px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 28px', color: '#334155' }}>
          All of India.
        </h1>

        <p style={{ fontSize: 'clamp(15px,2vw,18px)', color: '#94A3B8', maxWidth: 580, margin: '0 auto 36px', lineHeight: 1.7 }}>
          Syllabrix is India's most complete business ERP — <strong style={{ color: '#CBD5E1' }}>inventory, billing, CRM, staff, GST, AI and more.</strong> Built for kiranas, gyms, coaching centres, clinics, restaurants, and 80+ other business types.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/register')} style={{ padding: '14px 32px', background: 'linear-gradient(135deg,#17B9D0,#0E9CB5)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 24px rgba(23,185,208,0.35)' }}>
            ✦ Start Free Trial — 14 Days
          </button>
          <button onClick={() => document.getElementById('modules').scrollIntoView({ behavior: 'smooth' })} style={{ padding: '14px 28px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#CBD5E1', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            See all modules ↓
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(24px,5vw,60px)', marginTop: 56, flexWrap: 'wrap' }}>
          {[['83+', 'Business Types'], ['23', 'Modules'], ['100%', 'GST Compliant'], ['Free', '14-Day Trial']].map(([val, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 900, color: '#17B9D0', letterSpacing: '-0.02em' }}>{val}</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 4, fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Modules ── */}
      <section id="modules" style={{ padding: '60px 5vw', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#17B9D0', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Everything Built In</div>
          <h2 style={{ fontSize: 'clamp(24px,4vw,38px)', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>One subscription. Every tool.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 12 }}>
          {MODULES.map(m => (
            <div key={m.name} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '18px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>{m.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#CBD5E1' }}>{m.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Business Types ── */}
      <section style={{ padding: '40px 5vw 60px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#17B9D0', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Built For Your Business</div>
          <h2 style={{ fontSize: 'clamp(24px,4vw,38px)', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>83 business types supported</h2>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {BUSINESSES.map(b => (
            <span key={b} style={{ background: 'rgba(23,185,208,0.08)', border: '1px solid rgba(23,185,208,0.18)', borderRadius: 20, padding: '6px 16px', fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>
              {b}
            </span>
          ))}
          <span style={{ background: 'rgba(23,185,208,0.08)', border: '1px solid rgba(23,185,208,0.18)', borderRadius: 20, padding: '6px 16px', fontSize: 13, color: '#17B9D0', fontWeight: 600 }}>
            +71 more →
          </span>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '60px 5vw 80px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', background: 'linear-gradient(135deg,rgba(23,185,208,0.1),rgba(14,156,181,0.05))', border: '1px solid rgba(23,185,208,0.2)', borderRadius: 20, padding: 'clamp(32px,5vw,56px)' }}>
          <h2 style={{ fontSize: 'clamp(22px,4vw,34px)', fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.02em' }}>Ready to grow your business?</h2>
          <p style={{ color: '#64748B', margin: '0 0 28px', fontSize: 15 }}>Start your free 14-day trial. No credit card required.</p>
          <button onClick={() => navigate('/register')} style={{ padding: '14px 36px', background: 'linear-gradient(135deg,#17B9D0,#0E9CB5)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 24px rgba(23,185,208,0.35)' }}>
            Start Free Trial →
          </button>
          <div style={{ marginTop: 16, fontSize: 12, color: '#475569' }}>
            Already have an account? <span onClick={() => navigate('/login')} style={{ color: '#17B9D0', cursor: 'pointer', fontWeight: 600 }}>Log in</span>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px 5vw', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 12, color: '#334155' }}>
          © {new Date().getFullYear()} Syllabrix Technologies Pvt. Ltd. · Built for Indian businesses
        </p>
      </footer>
    </div>
  );
}
