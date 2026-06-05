import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTREnvironments } from '../../api/platform';
import toast from 'react-hot-toast';

const ENV_META = {
  dev:        { label: 'Development', branch: 'dev',     color: '#64748B', description: 'Active development — code being written' },
  quality:    { label: 'Quality',     branch: 'quality', color: '#A78BFA', description: 'Staging — tested, awaiting production sign-off' },
  production: { label: 'Production',  branch: 'main',    color: '#34D399', description: 'Live — serving real users' },
};

export default function TransportEnvironments() {
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data: res } = await getTREnvironments();
      setData(res.data);
    } catch { toast.error('Failed to load environment status'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={{ padding: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <button onClick={() => navigate('/platform/transport')}
          style={{ padding: '7px 14px', background: 'transparent', border: '1px solid #1E2D3D', borderRadius: 7, color: '#64748B', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          ← Transport Manager
        </button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#F1F5F9' }}>Environment Status</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Live view of what is in each environment right now</p>
        </div>
        <button onClick={load} style={{ marginLeft: 'auto', padding: '7px 14px', background: 'rgba(31,184,214,0.08)', border: '1px solid #1FB8D6', borderRadius: 7, color: '#1FB8D6', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#64748B', fontSize: 14, textAlign: 'center', paddingTop: 60 }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Environment Pipeline Visual */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', gap: 0, alignItems: 'center' }}>
            {['dev', null, 'quality', null, 'production'].map((key, i) => {
              if (!key) return (
                <div key={i} style={{ textAlign: 'center', color: '#1E2D3D', fontSize: 20, fontWeight: 700 }}>→</div>
              );
              const meta = ENV_META[key];
              const sha  = data?.branches?.[key]?.sha;
              return (
                <div key={key} style={{ background: '#192533', border: `1px solid ${meta.color}33`, borderRadius: 12, padding: '20px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: meta.color }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: meta.color }}>{meta.label}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#64748B', marginBottom: 4 }}>
                    branch: <span style={{ color: '#94A3B8' }}>{meta.branch}</span>
                  </div>
                  {sha ? (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#64748B' }}>
                      HEAD: <span style={{ color: '#1FB8D6' }}>{sha}</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: '#334155' }}>GitHub not connected</div>
                  )}
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 8 }}>{meta.description}</div>
                </div>
              );
            })}
          </div>

          {/* Quality TRs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <EnvSection
              title="In Quality"
              color="#A78BFA"
              trs={data?.qualityTRs || []}
              emptyMsg="No TRs currently in Quality"
              navigate={navigate}
              dateField="promotedToQualityAt"
              dateLabel="To Quality"
            />
            <EnvSection
              title="In Production"
              color="#34D399"
              trs={data?.prodTRs || []}
              emptyMsg="No TRs in Production yet"
              navigate={navigate}
              dateField="promotedToProdAt"
              dateLabel="To Prod"
            />
          </div>

          {/* Dev count */}
          <div style={{ background: '#192533', border: '1px solid #1E2D3D', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#64748B' }} />
            <span style={{ fontSize: 13, color: '#64748B' }}>
              <span style={{ color: '#94A3B8', fontWeight: 700 }}>{data?.devCount || 0}</span> TR{(data?.devCount || 0) !== 1 ? 's' : ''} currently in Development
            </span>
            <button onClick={() => navigate('/platform/transport')}
              style={{ marginLeft: 'auto', fontSize: 12, color: '#1FB8D6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              View all →
            </button>
          </div>

          {/* Recent Rollbacks */}
          {data?.rollbacks?.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#F87171', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                Recent Rollbacks
              </div>
              {data.rollbacks.map((tr) => (
                <div key={tr.id}
                  onClick={() => navigate(`/platform/transport/${tr.id}`)}
                  style={{ background: '#192533', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#F87171', marginRight: 10 }}>{tr.trCode}</span>
                    <span style={{ fontSize: 13, color: '#94A3B8' }}>{tr.title}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', textAlign: 'right' }}>
                    <div>{tr.rolledBackReason || '—'}</div>
                    <div>{tr.rolledBackAt ? new Date(tr.rolledBackAt).toLocaleDateString('en-IN') : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EnvSection({ title, color, trs, emptyMsg, navigate, dateField, dateLabel }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
        <span style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{title}</span>
        <span style={{ fontSize: 11, color, background: `${color}18`, padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>{trs.length}</span>
      </div>
      {trs.length === 0 ? (
        <div style={{ border: '1px dashed #1E2D3D', borderRadius: 10, padding: '20px 16px', textAlign: 'center', color: '#334155', fontSize: 12 }}>
          {emptyMsg}
        </div>
      ) : (
        trs.map((tr) => (
          <div key={tr.id}
            onClick={() => navigate(`/platform/transport/${tr.id}`)}
            style={{ background: '#192533', border: '1px solid #1E2D3D', borderRadius: 10, padding: '12px 16px', marginBottom: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = color}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#1E2D3D'}
          >
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#1FB8D6', marginBottom: 3 }}>{tr.trCode}</div>
              <div style={{ fontSize: 13, color: '#E2E8F0', fontWeight: 500 }}>{tr.title}</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{tr.businessTypeCode}</div>
            </div>
            <div style={{ fontSize: 11, color: '#64748B', textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
              <div style={{ color: '#94A3B8', fontWeight: 600 }}>{dateLabel}</div>
              <div>{tr[dateField] ? new Date(tr[dateField]).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
