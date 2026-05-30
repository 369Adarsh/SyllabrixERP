import { useEffect, useState, useMemo } from 'react';
import { getStockNetwork } from '../../api';
import { useBranch } from '../../context/BranchContext';
import { useAuth } from '../../context/AuthContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useNavigate } from 'react-router-dom';
import { Activity, Search, AlertTriangle, AlertCircle, CheckCircle2, GitBranch, Package, ArrowLeftRight } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  OK:       { bg: '#DCFCE7', color: '#15803D', label: 'OK' },
  LOW:      { bg: '#FEF9C3', color: '#92400E', label: 'Low' },
  CRITICAL: { bg: '#FEE2E2', color: '#DC2626', label: '0' },
};

function StatusBadge({ status, qty }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.OK;
  return (
    <span style={{
      display: 'inline-block', minWidth: 48, padding: '3px 8px',
      borderRadius: 6, fontSize: 12, fontWeight: 700, textAlign: 'center',
      background: cfg.bg, color: cfg.color,
    }}>
      {status === 'CRITICAL' && qty === 0 ? '0' : qty}
    </span>
  );
}

export default function StockNetwork() {
  const { isMobile } = useBreakpoint();
  const { hasBranches } = useBranch();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | OK | LOW | CRITICAL

  useEffect(() => {
    if (!hasBranches || user?.role !== 'OWNER') return;
    getStockNetwork()
      .then(r => setData(r.data.data || r.data))
      .catch(() => toast.error('Failed to load stock network'))
      .finally(() => setLoading(false));
  }, [hasBranches, user?.role]);

  const filtered = useMemo(() => {
    if (!data?.grid) return [];
    return data.grid.filter(row => {
      const matchSearch = !search || row.product.name.toLowerCase().includes(search.toLowerCase()) || row.product.sku?.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (statusFilter === 'ALL') return true;
      return row.branches.some(b => b.status === statusFilter);
    });
  }, [data, search, statusFilter]);

  const summary = useMemo(() => {
    if (!data?.grid) return { ok: 0, low: 0, critical: 0 };
    const seen = { ok: new Set(), low: new Set(), critical: new Set() };
    for (const row of data.grid) {
      for (const b of row.branches) {
        if (b.status === 'OK') seen.ok.add(`${row.product.id}_${b.branchId}`);
        else if (b.status === 'LOW') seen.low.add(`${row.product.id}_${b.branchId}`);
        else seen.critical.add(`${row.product.id}_${b.branchId}`);
      }
    }
    return { ok: seen.ok.size, low: seen.low.size, critical: seen.critical.size };
  }, [data]);

  if (user?.role !== 'OWNER') {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
        This page is accessible to owners only.
      </div>
    );
  }

  if (!hasBranches) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <GitBranch size={40} color="#D1D5DB" style={{ margin: '0 auto 12px', display: 'block' }} />
        <div style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>No branches yet</div>
        <div style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 20 }}>Set up branches in Settings to use stock network.</div>
        <button onClick={() => navigate('/settings')} style={{ padding: '9px 18px', borderRadius: 8, background: 'var(--navy)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          Go to Settings
        </button>
      </div>
    );
  }

  const branches = data?.branches || [];

  return (
    <div style={{ padding: isMobile ? '16px' : '24px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: isMobile ? 20 : 24, color: 'var(--navy)', letterSpacing: '-0.02em', marginBottom: 3 }}>
            Stock Network
          </h1>
          <p style={{ color: '#6B7280', fontSize: 14 }}>Live stock levels across all branches</p>
        </div>
        <button
          onClick={() => navigate('/stock-transfers')}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 9, background: 'var(--navy)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
        >
          <ArrowLeftRight size={14} /> Stock Transfers
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Healthy', value: summary.ok, icon: CheckCircle2, color: '#15803D', bg: '#DCFCE7', filter: 'OK' },
          { label: 'Low Stock', value: summary.low, icon: AlertTriangle, color: '#92400E', bg: '#FEF9C3', filter: 'LOW' },
          { label: 'Out of Stock', value: summary.critical, icon: AlertCircle, color: '#DC2626', bg: '#FEE2E2', filter: 'CRITICAL' },
        ].map(({ label, value, icon: Icon, color, bg, filter }) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(s => s === filter ? 'ALL' : filter)}
            style={{
              background: statusFilter === filter ? bg : '#fff',
              border: `1.5px solid ${statusFilter === filter ? color : 'var(--border)'}`,
              borderRadius: 12, padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Icon size={16} color={color} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>{label}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: statusFilter === filter ? color : 'var(--navy)', fontFamily: 'var(--font-display)' }}>
              {loading ? '—' : value}
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>product-branch pairs</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            placeholder="Search product or SKU…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 9, paddingBottom: 9, borderRadius: 9, border: '1.5px solid var(--border)', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff' }}
          />
        </div>
        {statusFilter !== 'ALL' && (
          <button
            onClick={() => setStatusFilter('ALL')}
            style={{ padding: '9px 14px', borderRadius: 9, border: '1.5px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#6B7280' }}
          >
            Clear filter ×
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 64, color: '#9CA3AF', fontSize: 14 }}>Loading stock network…</div>
      ) : !data ? (
        <div style={{ textAlign: 'center', padding: 64, color: '#9CA3AF', fontSize: 14 }}>No data available</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '11px 16px', textAlign: 'left', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: '#F9FAFB', zIndex: 2 }}>
                    Product
                  </th>
                  {branches.map(b => (
                    <th key={b.id} style={{ padding: '11px 14px', textAlign: 'center', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap', minWidth: 100 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <span>{b.name}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: '#9CA3AF', background: '#F3F4F6', padding: '1px 6px', borderRadius: 4 }}>
                          {b.code}
                          {b.isHQ && <span style={{ color: 'var(--cyan)', marginLeft: 4 }}>HQ</span>}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th style={{ padding: '11px 14px', textAlign: 'center', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={branches.length + 2} style={{ textAlign: 'center', padding: 48, color: '#9CA3AF' }}>
                      <Package size={28} style={{ margin: '0 auto 10px', display: 'block', color: '#D1D5DB' }} />
                      No products match your filters.
                    </td>
                  </tr>
                ) : filtered.map((row, idx) => (
                  <tr key={row.product.id} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                    <td style={{ padding: '10px 16px', position: 'sticky', left: 0, background: '#fff', zIndex: 1, borderRight: '1px solid #F3F4F6' }}>
                      <div style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: 2 }}>{row.product.name}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-mono)' }}>
                        {row.product.sku}
                        {row.product.unit && <span style={{ marginLeft: 6, color: '#D1D5DB' }}>·</span>}
                        {row.product.unit && <span style={{ marginLeft: 6 }}>{row.product.unit}</span>}
                      </div>
                    </td>
                    {row.branches.map(b => (
                      <td key={b.branchId} style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <StatusBadge status={b.status} qty={b.qty} />
                      </td>
                    ))}
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--font-mono)' }}>
                      {row.totalQty}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div style={{ padding: '10px 16px', background: '#F9FAFB', borderTop: '1px solid var(--border)', fontSize: 12, color: '#6B7280' }}>
              Showing {filtered.length} of {data.grid.length} products
            </div>
          )}
        </div>
      )}
    </div>
  );
}
