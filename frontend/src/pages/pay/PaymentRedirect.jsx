import { useSearchParams } from 'react-router-dom';

export default function PaymentRedirect() {
  const [params] = useSearchParams();
  const pa = params.get('pa') || '';
  const am = params.get('am') || '';
  const pn = params.get('pn') || '';
  const tn = params.get('tn') || 'Membership';

  const upiParams = `pa=${encodeURIComponent(pa)}&pn=${encodeURIComponent(pn)}&am=${encodeURIComponent(am)}&cu=INR&tn=${encodeURIComponent(tn)}`;

  // intent:// forces Android OS to show the "Open with" app chooser dialog
  // instead of auto-opening WhatsApp or any single default app
  const intentLink = `intent://pay?${upiParams}#Intent;scheme=upi;action=android.intent.action.VIEW;category=android.intent.category.DEFAULT;end;`;

  // App-specific deep links as fallback buttons
  const apps = [
    { name: 'GPay',     emoji: '🟢', link: `tez://upi/pay?${upiParams}` },
    { name: 'PhonePe',  emoji: '🟣', link: `phonepe://pay?${upiParams}` },
    { name: 'Paytm',    emoji: '🔵', link: `paytmmp://pay?${upiParams}` },
    { name: 'BHIM',     emoji: '🟠', link: `upi://pay?${upiParams}` },
  ];

  const displayAmt = `₹${Number(am).toLocaleString('en-IN')}`;

  if (!pa || !am) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <p style={{ color: '#9CA3AF', fontFamily: 'sans-serif' }}>Invalid payment link.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '36px 28px', maxWidth: 360, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

        <div style={{ fontSize: 52, marginBottom: 16 }}>💳</div>

        <div style={{ fontSize: 18, fontWeight: 700, color: '#1B3A6B', marginBottom: 4 }}>{pn}</div>
        <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>{tn}</div>

        <div style={{ fontSize: 44, fontWeight: 800, color: '#059669', marginBottom: 6 }}>{displayAmt}</div>
        <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 28 }}>Choose how you want to pay</div>

        {/* Primary button — triggers Android app chooser */}
        <a
          href={intentLink}
          style={{ display: 'block', padding: '16px', background: '#059669', color: '#fff', borderRadius: 14, fontSize: 16, fontWeight: 700, textDecoration: 'none', marginBottom: 16 }}
        >
          Pay with Any UPI App
        </a>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>or open directly</span>
          <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
        </div>

        {/* Individual app buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {apps.map((app) => (
            <a
              key={app.name}
              href={app.link}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px 8px', border: '1.5px solid #E5E7EB', borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#374151', textDecoration: 'none', background: '#F9FAFB' }}
            >
              <span style={{ fontSize: 16 }}>{app.emoji}</span>
              {app.name}
            </a>
          ))}
        </div>

        <div style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.6 }}>
          UPI ID: <strong style={{ fontFamily: 'monospace', color: '#374151' }}>{pa}</strong>
          <br />If no app opens, copy the UPI ID and pay manually.
        </div>
      </div>
    </div>
  );
}
