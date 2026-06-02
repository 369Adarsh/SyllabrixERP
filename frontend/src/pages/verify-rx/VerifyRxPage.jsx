import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Pill, CheckCircle, AlertCircle, Shield } from 'lucide-react';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

export default function VerifyRxPage() {
  const { token } = useParams();
  const [rx, setRx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/v1/public/rx/${token}`)
      .then((r) => { if (!r.ok) throw new Error('Invalid or expired QR code'); return r.json(); })
      .then(setRx)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const containerStyle = {
    minHeight: '100vh', background: '#F4F7FA',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px', fontFamily: "'Plus Jakarta Sans', sans-serif",
  };

  if (loading) return <div style={containerStyle}><div style={{ color: '#6B7280', fontSize: 14 }}>Verifying prescription…</div></div>;

  if (error) return (
    <div style={containerStyle}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 32, textAlign: 'center', maxWidth: 360, border: '1px solid #FECACA' }}>
        <AlertCircle size={40} color="#DC2626" />
        <div style={{ fontWeight: 700, fontSize: 18, color: '#DC2626', marginTop: 12 }}>Invalid QR Code</div>
        <div style={{ fontSize: 13, color: '#6B7280', marginTop: 8 }}>{error}</div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 16 }}>This QR code may be fake, expired, or tampered.</div>
      </div>
    </div>
  );

  return (
    <div style={containerStyle}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 520, border: '1px solid #D5DCE8' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '12px 14px', background: '#ECFDF5', borderRadius: 10, border: '1px solid #A7F3D0' }}>
          <Shield size={22} color="#059669" />
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#059669' }}>Verified Prescription</div>
            <div style={{ fontSize: 12, color: '#047857' }}>Authentic — issued via Syllabrix HMS</div>
          </div>
          <CheckCircle size={20} color="#059669" style={{ marginLeft: 'auto' }} />
        </div>

        {/* Rx info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #F3F4F6' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1A2535' }}>{rx.patientName}</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>Dr. {rx.doctorName}</div>
            {rx.diagnosis && <div style={{ fontSize: 12, color: '#374151', marginTop: 4, background: '#F4F7FA', borderRadius: 6, padding: '3px 8px', display: 'inline-block' }}>{rx.diagnosis}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#17B9D0', fontWeight: 700 }}>{rx.rxNumber}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{fmtDate(rx.createdAt)}</div>
          </div>
        </div>

        {/* Medicines */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Pill size={14} color="#17B9D0" /> Medicines ({rx.items.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rx.items.map((item, i) => (
              <div key={i} style={{ padding: '10px 12px', background: '#F4F7FA', borderRadius: 8, border: '1px solid #E8EDF3' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#1A2535' }}>{item.drugName}</span>
                    {item.strength && <span style={{ fontSize: 12, color: '#6B7280', marginLeft: 6 }}>{item.strength}</span>}
                    {item.formulation && <span style={{ fontSize: 11, background: '#fff', border: '1px solid #D5DCE8', borderRadius: 4, padding: '1px 6px', marginLeft: 5 }}>{item.formulation}</span>}
                  </div>
                  {(item.isScheduleH || item.isScheduleX) && (
                    <span style={{ fontSize: 10, background: '#FEF3C7', color: '#D97706', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>
                      {item.isScheduleX ? 'Sch-X' : 'Sch-H'}
                    </span>
                  )}
                </div>
                {(item.dose || item.frequency || item.duration) && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
                    {[item.dose, item.frequency, item.duration, item.instructions].filter(Boolean).map((v, j) => (
                      <span key={j} style={{ fontSize: 11, background: '#fff', border: '1px solid #D5DCE8', borderRadius: 4, padding: '2px 8px', color: '#374151' }}>{v}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', borderTop: '1px solid #F3F4F6', paddingTop: 12 }}>
          Verified by Syllabrix HMS · This prescription is digitally verified and tamper-evident.
          <br />For pharmacy use only. Valid as per applicable drug schedule.
        </div>
      </div>
    </div>
  );
}
