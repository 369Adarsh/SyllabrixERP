import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Zap } from 'lucide-react';

export default function BarcodeScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const scannerId = 'syllabrix-qr-reader';
    const scanner = new Html5Qrcode(scannerId);
    scannerRef.current = scanner;

    Html5Qrcode.getCameras()
      .then(cameras => {
        if (!cameras?.length) throw new Error('No camera found on this device');
        return scanner.start(
          { facingMode: 'environment' },
          { fps: 12, qrbox: { width: 280, height: 140 } },
          (decodedText) => {
            onScan(decodedText);
            scanner.stop().catch(() => {});
            onClose();
          },
          () => {} // suppress per-frame errors
        );
      })
      .then(() => setStarted(true))
      .catch(err => {
        setError(
          err?.message?.includes('No camera')
            ? 'No camera found. Use a USB barcode scanner — type the barcode in the search field and press Enter.'
            : 'Camera access denied. Allow camera permission and try again, or use a USB barcode scanner.'
        );
      });

    return () => {
      if (scannerRef.current) scannerRef.current.stop().catch(() => {});
    };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 24, width: 380,
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>Scan Barcode</div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>Point camera at product barcode</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: '#9CA3AF' }}>
            <X size={18} />
          </button>
        </div>

        {error ? (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: '#DC2626', lineHeight: 1.5, margin: 0 }}>{error}</p>
          </div>
        ) : (
          <div style={{ borderRadius: 10, overflow: 'hidden', border: '2px solid var(--border)', marginBottom: 16 }}>
            <div id="syllabrix-qr-reader" style={{ width: '100%' }} />
          </div>
        )}

        {/* USB Scanner tip */}
        <div style={{ background: 'var(--surface-1)', borderRadius: 10, padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Zap size={14} color="var(--cyan)" style={{ marginTop: 1, flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
            <strong>USB scanner:</strong> Just scan directly — it types into the search field automatically. Press Enter to add to cart.
          </p>
        </div>
      </div>
    </div>
  );
}
