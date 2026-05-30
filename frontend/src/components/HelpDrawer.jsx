import { useState, useEffect, useCallback } from 'react';
import { getModuleHelpPublic } from '../api/index';

const LANGS = [
  { code: 'en', label: 'EN', full: 'English' },
  { code: 'hi', label: 'HI', full: 'हिन्दी' },
  { code: 'gu', label: 'GU', full: 'ગુજરાતી' },
  { code: 'mr', label: 'MR', full: 'मराठी' },
];

const S = {
  overlay:  { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' },
  drawer:   { width: 420, maxWidth: '92vw', height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 32px rgba(0,0,0,0.14)', overflowY: 'auto' },
  header:   { background: 'linear-gradient(135deg,#0F2942,#0E6B7A)', padding: '22px 22px 18px', flexShrink: 0 },
  title:    { fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 4 },
  overview: { fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 },
  langRow:  { display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' },
  langBtn:  (active) => ({ padding: '4px 12px', borderRadius: 20, border: `1px solid ${active ? '#17B9D0' : 'rgba(255,255,255,0.25)'}`, background: active ? '#17B9D0' : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em' }),
  body:     { flex: 1, padding: '20px 22px', overflowY: 'auto' },
  section:  { marginBottom: 24 },
  secHead:  { fontSize: 13, fontWeight: 800, color: '#0F2942', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 },
  secLine:  { flex: 1, height: 1, background: '#E5E7EB' },
  step:     { display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
  stepNum:  { width: 24, height: 24, borderRadius: '50%', background: '#0F2942', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  stepBody: { flex: 1 },
  stepText: { fontSize: 13, color: '#1F2937', lineHeight: 1.55, fontWeight: 500 },
  stepTip:  { fontSize: 11.5, color: '#6B7280', marginTop: 4, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, padding: '5px 10px', lineHeight: 1.4 },
  empty:    { textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' },
  emptyIcon:{ fontSize: 40, marginBottom: 12 },
  emptyMsg: { fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 },
  emptyDesc:{ fontSize: 13, color: '#9CA3AF' },
  closeBtn: { position: 'absolute', top: 16, right: 18, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 18, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
};

function LangSwitch({ lang, setLang, available }) {
  return (
    <div style={S.langRow}>
      {LANGS.map((l) => (
        <button
          key={l.code}
          style={S.langBtn(lang === l.code)}
          onClick={() => setLang(l.code)}
          title={l.full}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

export default function HelpDrawer({ moduleKey, moduleName, onClose }) {
  const [lang, setLang]       = useState(() => localStorage.getItem('helpLang') || 'en');
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (l) => {
    setLoading(true);
    try {
      const r = await getModuleHelpPublic(moduleKey, l);
      setArticle(r.data?.data || null);
    } catch {
      setArticle(null);
    } finally {
      setLoading(false);
    }
  }, [moduleKey]);

  useEffect(() => { load(lang); }, [lang, load]);

  const handleLang = (l) => {
    setLang(l);
    localStorage.setItem('helpLang', l);
  };

  const sections = Array.isArray(article?.sections) ? article.sections : [];

  return (
    <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={S.drawer}>
        {/* Header */}
        <div style={{ ...S.header, position: 'relative' }}>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
            How to use
          </div>
          <div style={S.title}>{article?.title || moduleName || 'Module Guide'}</div>
          {article?.overview && <div style={S.overview}>{article.overview}</div>}
          <LangSwitch lang={lang} setLang={handleLang} />
        </div>

        {/* Body */}
        <div style={S.body}>
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Loading…</div>
          ) : !article ? (
            <div style={S.empty}>
              <div style={S.emptyIcon}>📖</div>
              <div style={S.emptyMsg}>No guide available yet</div>
              <div style={S.emptyDesc}>
                A step-by-step guide for {moduleName || 'this module'} hasn't been published yet.
                {lang !== 'en' && ' Try switching to English.'}
              </div>
            </div>
          ) : sections.length === 0 ? (
            <div style={S.empty}>
              <div style={S.emptyIcon}>📝</div>
              <div style={S.emptyMsg}>Guide has no sections yet</div>
              <div style={S.emptyDesc}>Content is being prepared.</div>
            </div>
          ) : (
            sections.map((sec, si) => {
              const steps = Array.isArray(sec.steps) ? sec.steps : [];
              return (
                <div key={si} style={S.section}>
                  {sec.heading && (
                    <div style={S.secHead}>
                      <span>{sec.heading}</span>
                      <div style={S.secLine} />
                    </div>
                  )}
                  {steps.map((step, idx) => (
                    <div key={idx} style={S.step}>
                      <div style={S.stepNum}>{idx + 1}</div>
                      <div style={S.stepBody}>
                        <div style={S.stepText}>{step.instruction}</div>
                        {step.tip && <div style={S.stepTip}>💡 {step.tip}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ── Trigger button — drop this anywhere in a module page header ───────────────
export function HelpButton({ moduleKey, moduleName, style }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="How to use this module"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 8, border: '1px solid #E5E7EB',
          background: '#fff', color: '#374151', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', ...style,
        }}
      >
        <span style={{ fontSize: 14 }}>📖</span> How to use
      </button>
      {open && <HelpDrawer moduleKey={moduleKey} moduleName={moduleName} onClose={() => setOpen(false)} />}
    </>
  );
}
