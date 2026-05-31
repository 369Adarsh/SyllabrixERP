import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function PaymentRedirect() {
  const [params] = useSearchParams();
  const pa = params.get('pa') || '';
  const am = params.get('am') || '';
  const pn = params.get('pn') || '';
  const tn = params.get('tn') || 'Membership';

  const upiLink = `upi://pay?pa=${encodeURIComponent(pa)}&pn=${encodeURIComponent(pn)}&am=${encodeURIComponent(am)}&cu=INR&tn=${encodeURIComponent(tn)}`;
  const displayAmt = `₹${Number(am).toLocaleString('en-IN')}`;

  useEffect(() => {
    const t = setTimeout(() => { window.location.href = upiLink; }, 600);
    return () => clearTimeout(t);
  }, [upiLink]);

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
        <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 32 }}>Opening your UPI app…</div>

        <a
          href={upiLink}
          style={{ display: 'block', padding: '16px', background: '#059669', color: '#fff', borderRadius: 14, fontSize: 16, fontWeight: 700, textDecoration: 'none', marginBottom: 16 }}
        >
          Tap to Pay Now
        </a>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
          {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
            <span key={app} style={{ fontSize: 11, color: '#6B7280', background: '#F3F4F6', padding: '4px 10px', borderRadius: 20 }}>{app}</span>
          ))}
        </div>

        <div style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.6 }}>
          UPI ID: <strong style={{ fontFamily: 'monospace', color: '#374151' }}>{pa}</strong>
          <br />If the app doesn't open, copy the UPI ID above and pay manually.
        </div>
      </div>
    </div>
  );
}
