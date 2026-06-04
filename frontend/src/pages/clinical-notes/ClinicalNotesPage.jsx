import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { P } from '../../styles/page';
import { getCustomers, getPatientNoteHistory } from '../../api';
import {
  Stethoscope, Search, FileText, Calendar, ChevronRight,
  User, Clock, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ── Note summary card ─────────────────────────────────────────────────────────
function NoteCard({ note, onClick }) {
  const hasFollowUp  = note.followUpDate && new Date(note.followUpDate) > new Date();
  const followUpDue  = note.followUpDate && new Date(note.followUpDate) <= new Date();

  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 14,
      width: '100%', textAlign: 'left',
      background: '#fff', border: '1.5px solid #E5E7EB',
      borderRadius: 12, padding: '14px 18px', cursor: 'pointer',
      marginBottom: 10, transition: 'all 0.12s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--cyan)'; e.currentTarget.style.background = '#F0FDFE'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = '#fff'; }}
    >
      {/* Date column */}
      <div style={{ width: 52, flexShrink: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 800, color: 'var(--navy)', lineHeight: 1 }}>
          {new Date(note.createdAt).getDate()}
        </div>
        <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>
          {new Date(note.createdAt).toLocaleDateString('en-IN', { month: 'short' })}
        </div>
        <div style={{ fontSize: 10, color: '#C4C4C4' }}>
          {new Date(note.createdAt).getFullYear()}
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: 2, height: 44, background: note.soapA ? '#10B981' : '#E5E7EB', borderRadius: 2, flexShrink: 0 }} />

      {/* Note info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          {note.serviceName && (
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', background: '#EFF6FF', padding: '2px 8px', borderRadius: 20 }}>
              {note.serviceName}
            </span>
          )}
          {note.diagnosisCode && (
            <span style={{ fontSize: 11, color: '#7C3AED', background: '#F5F3FF', padding: '2px 8px', borderRadius: 20, fontFamily: 'var(--font-mono)' }}>
              {note.diagnosisCode}
            </span>
          )}
          {hasFollowUp && (
            <span style={{ fontSize: 11, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 3 }}>
              <Clock size={9} /> Follow-up {fmtDate(note.followUpDate)}
            </span>
          )}
          {followUpDue && (
            <span style={{ fontSize: 11, color: '#DC2626', background: '#FEF2F2', padding: '2px 8px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 3 }}>
              <AlertCircle size={9} /> Follow-up overdue
            </span>
          )}
        </div>
        <div style={{ fontSize: 13, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {note.soapA || <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>No assessment recorded</span>}
        </div>
      </div>

      <ChevronRight size={16} color="#D1D5DB" style={{ flexShrink: 0 }} />
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ClinicalNotesPage() {
  const { isMobile } = useBreakpoint();
  const navigate      = useNavigate();

  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState([]);
  const [showDrop, setShowDrop] = useState(false);
  const [patient,  setPatient]  = useState(null);
  const [notes,    setNotes]    = useState([]);
  const [loading,  setLoading]  = useState(false);

  const searchTimer = useRef(null);
  const wrapRef     = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowDrop(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Debounced search
  const search = useCallback((q) => {
    clearTimeout(searchTimer.current);
    if (!q.trim()) { setResults([]); setShowDrop(false); return; }
    searchTimer.current = setTimeout(async () => {
      try {
        const r = await getCustomers({ search: q, limit: 8 });
        setResults(r.data.data || []);
        setShowDrop(true);
      } catch { /* silent */ }
    }, 280);
  }, []);

  const loadNotes = useCallback(async (customerId) => {
    setLoading(true);
    try {
      const r = await getPatientNoteHistory(customerId, { limit: 50 });
      setNotes(r.data.data || []);
    } catch {
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, []);

  const selectPatient = (p) => {
    setPatient(p);
    setQuery(`${p.name}${p.phone ? ` (${p.phone})` : ''}`);
    setShowDrop(false);
    loadNotes(p.id);
  };

  const clearPatient = () => { setPatient(null); setQuery(''); setNotes([]); };

  return (
    <div style={{ ...P.wrap(isMobile), maxWidth: 860, margin: '0 auto' }}>

      {/* Header */}
      <div style={P.head}>
        <div>
          <h1 style={P.h1(isMobile)}>Clinical Notes</h1>
          <p style={P.sub}>Search a patient to view their visit history and open EMR</p>
        </div>
      </div>

      {/* Patient search */}
      <div ref={wrapRef} style={{ position: 'relative', marginBottom: 28 }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); search(e.target.value); if (!e.target.value) clearPatient(); }}
            onFocus={() => results.length > 0 && setShowDrop(true)}
            placeholder="Search patient by name or phone…"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '12px 40px 12px 38px',
              border: '1.5px solid var(--border)', borderRadius: 12,
              fontSize: 14, outline: 'none',
              background: patient ? '#F0FDF4' : '#fff',
            }}
          />
          {patient && (
            <button onClick={clearPatient} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 18, lineHeight: 1 }}>
              ×
            </button>
          )}
        </div>

        {showDrop && results.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
            background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)', marginTop: 4, maxHeight: 260, overflowY: 'auto',
          }}>
            {results.map(p => (
              <button key={p.id} onMouseDown={() => selectPatient(p)} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                textAlign: 'left', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
                borderBottom: '1px solid #F9FAFB',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
                  {p.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{p.name}</div>
                  {p.phone && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{p.phone}</div>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Empty state */}
      {!patient && (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', border: '1px solid var(--border)', borderRadius: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Stethoscope size={28} color="#3B82F6" />
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--navy)', margin: '0 0 6px' }}>Search for a Patient</h3>
          <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0 }}>Type a name or phone number to find a patient and view their clinical notes</p>
        </div>
      )}

      {/* Notes list */}
      {patient && (
        <>
          {/* Patient header */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800 }}>
                {patient.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--navy)' }}>{patient.name}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {patient.phone && <span>{patient.phone}</span>}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FileText size={11} /> {notes.length} visit{notes.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading visit history…</div>
          ) : notes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', border: '1px solid var(--border)', borderRadius: 14 }}>
              <Calendar size={28} style={{ color: '#D1D5DB', marginBottom: 12 }} />
              <div style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: 4 }}>No clinical notes yet</div>
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>
                Notes are created when a visit is recorded. Book an appointment for {patient.name} and open EMR from the appointment row.
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                Visit History — most recent first
              </div>
              {notes.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onClick={() => note.appointmentId && navigate(`/emr/${note.appointmentId}`)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
