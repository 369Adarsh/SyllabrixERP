import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Zap, Usb } from 'lucide-react';

export default function BarcodeScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const scannerId = 'syllabrix-qr-reader';
    let scanner;
    try {
      scanner = new Html5Qrcode(scannerId);
      scannerRef.current = scanner;
    } catch (e) {
      setError('Camera not available on this device. Use a USB barcode scanner instead.');
      return;
    }

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
          () => {}
        );
      })
      .then(() => setStarted(true))
      .catch(err => {
        const msg = err?.message || '';
        if (msg.includes('No camera') || msg.includes('no cameras')) {
          setError('No camera found on this device.');
        } else if (msg.includes('denied') || msg.includes('permission') || msg.includes('NotAllowed')) {
          setError('Camera access denied. Allow camera permission in your browser and try again.');
        } else {
          setError('Camera could not start. Use a USB barcode scanner instead.');
        }
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
        background: '#fff', borderRadius: 16, padding: 24, width: 400,
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
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>Camera or USB scanner</div>
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
        ) : !started ? (
          <div style={{ background: '#F9FAFB', border: '1px solid var(--border)', borderRadius: 10, padding: 32, marginBottom: 16, textAlign: 'center' }}>
            <Camera size={28} color="#D1D5DB" style={{ marginBottom: 10 }} />
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>Starting camera...</p>
          </div>
        ) : (
          <div style={{ borderRadius: 10, overflow: 'hidden', border: '2px solid var(--border)', marginBottom: 16 }}>
            <div id="syllabrix-qr-reader" style={{ width: '100%' }} />
          </div>
        )}

        {/* USB Scanner section */}
        <div style={{ background: 'var(--surface-1)', borderRadius: 10, padding: 14, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Usb size={14} color="var(--cyan)" />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>Using a USB barcode scanner?</span>
          </div>
          <p style={{ fontSize: 12, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
            1. Close this popup<br />
            2. Click on the <strong>search bar</strong> in POS<br />
            3. Scan the product — it types automatically<br />
            4. Press <strong>Enter</strong> to add to cart
          </p>
        </div>
      </div>
    </div>
  );
}
