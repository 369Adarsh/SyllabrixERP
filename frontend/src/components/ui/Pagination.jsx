import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, total, limit, onPageChange, label = 'items' }) {
  if (!totalPages || totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--border)', background: '#F9FAFB', flexWrap: 'wrap', gap: 8 }}>
      <span style={{ fontSize: 13, color: '#6B7280' }}>
        Showing <strong>{from}–{to}</strong> of <strong>{total}</strong> {label}
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1, display: 'flex', alignItems: 'center' }}
        >
          <ChevronLeft size={14} />
        </button>

        {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
          let p;
          if (totalPages <= 7) {
            p = i + 1;
          } else if (page <= 4) {
            p = i + 1;
            if (i === 6) p = totalPages;
            if (i === 5) return <span key={i} style={{ padding: '6px 4px', color: '#9CA3AF' }}>…</span>;
          } else if (page >= totalPages - 3) {
            if (i === 0) p = 1;
            else if (i === 1) return <span key={i} style={{ padding: '6px 4px', color: '#9CA3AF' }}>…</span>;
            else p = totalPages - (6 - i);
          } else {
            if (i === 0) p = 1;
            else if (i === 1) return <span key={i} style={{ padding: '6px 4px', color: '#9CA3AF' }}>…</span>;
            else if (i === 5) return <span key={i} style={{ padding: '6px 4px', color: '#9CA3AF' }}>…</span>;
            else if (i === 6) p = totalPages;
            else p = page + (i - 3);
          }
          return (
            <button key={i} onClick={() => onPageChange(p)} style={{
              padding: '6px 11px', borderRadius: 8, border: '1px solid var(--border)',
              background: p === page ? 'var(--navy)' : '#fff',
              color: p === page ? '#fff' : '#374151',
              fontWeight: p === page ? 700 : 400,
              cursor: 'pointer', fontSize: 13,
            }}>{p}</button>
          );
        })}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center' }}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
