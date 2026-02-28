import { useState, useRef, useEffect } from 'react';
import { lookupBarcode } from '../utils/openFoodFacts.js';
import './BarcodeScanner.css';

const lookupCache = new Map();

export default function BarcodeScanner({ onResult, onClose }) {
  const [status, setStatus] = useState('starting');
  const [manualCode, setManualCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const processedRef = useRef(false);
  const mountedRef = useRef(true);

  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  function stopCamera() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  async function doLookup(barcode) {
    if (processedRef.current) return;
    processedRef.current = true;
    if (mountedRef.current) setStatus('loading');
    stopCamera();

    try {
      let product;
      if (lookupCache.has(barcode)) {
        product = lookupCache.get(barcode);
      } else {
        product = await lookupBarcode(barcode);
        lookupCache.set(barcode, product);
      }

      if (!mountedRef.current) return;

      if (product) {
        onResultRef.current(product);
      } else {
        setStatus('not-found');
        setErrorMsg(`No product found for barcode ${barcode}`);
      }
    } catch {
      if (!mountedRef.current) return;
      setStatus('error');
      setErrorMsg('Network error — check your connection and try again');
    }
  }

  useEffect(() => {
    mountedRef.current = true;

    async function getDetector() {
      const formats = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'];
      // Try native BarcodeDetector first
      if (typeof globalThis.BarcodeDetector !== 'undefined') {
        try { return new globalThis.BarcodeDetector({ formats }); } catch { /* fall through */ }
      }
      // Polyfill for iOS / unsupported browsers
      try {
        const { BarcodeDetector: Polyfill } = await import('barcode-detector');
        return new Polyfill({ formats });
      } catch {
        return null;
      }
    }

    async function start() {
      const configs = [
        { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } },
        { video: { facingMode: 'user' } },
        { video: true },
      ];

      let stream = null;
      for (const c of configs) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(c);
          break;
        } catch {
          // try next
        }
      }

      if (!mountedRef.current) {
        if (stream) stream.getTracks().forEach((t) => t.stop());
        return;
      }

      if (!stream) {
        setStatus('cam-denied');
        setErrorMsg('Camera access denied — enter barcode manually below');
        return;
      }

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;
      try { await video.play(); } catch { /* autoplay blocked */ }
      if (!mountedRef.current) return;
      setStatus('scanning');

      const detector = await getDetector();
      if (!detector || !mountedRef.current) return;

      let busy = false;
      timerRef.current = setInterval(async () => {
        if (busy || !mountedRef.current || processedRef.current || !video || video.readyState < 2) return;
        busy = true;
        try {
          const results = await detector.detect(video);
          if (results.length > 0 && mountedRef.current && !processedRef.current) {
            doLookup(results[0].rawValue);
          }
        } catch {
          // ignore
        }
        busy = false;
      }, 500);
    }

    start();

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleManualSubmit(e) {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code) return;
    processedRef.current = false;
    doLookup(code);
  }

  function handleClose() {
    stopCamera();
    onCloseRef.current();
  }

  return (
    <div className="barcode-overlay">
      <div className="barcode-header">
        <button className="barcode-close" onClick={handleClose} aria-label="Close scanner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <span className="barcode-title">Scan Barcode</span>
      </div>

      <div className="barcode-viewfinder">
        <video
          ref={videoRef}
          className="barcode-video"
          autoPlay
          playsInline
          muted
        />
        {status === 'scanning' && (
          <div className="barcode-scan-line" />
        )}
      </div>

      {status === 'starting' && (
        <div className="barcode-status">
          <div className="barcode-spinner" />
          <span>Starting camera...</span>
        </div>
      )}

      {status === 'loading' && (
        <div className="barcode-status">
          <div className="barcode-spinner" />
          <span>Looking up product...</span>
        </div>
      )}

      {status === 'scanning' && (
        <p className="barcode-hint">Point camera at a barcode — or type it below</p>
      )}

      {status === 'not-found' && (
        <div className="barcode-status barcode-status--error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
          </svg>
          <span>{errorMsg}</span>
          <button className="barcode-retry" onClick={handleClose}>Close</button>
        </div>
      )}

      {status === 'error' && (
        <div className="barcode-status barcode-status--error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
          </svg>
          <span>{errorMsg}</span>
          <button className="barcode-retry" onClick={handleClose}>Close</button>
        </div>
      )}

      {status === 'cam-denied' && (
        <div className="barcode-status barcode-status--error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16.88 3.549L7.12 20.451" /><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-3h8l2 3h3a2 2 0 0 1 2 2z" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      <form className="barcode-manual" onSubmit={handleManualSubmit}>
        <input
          className="barcode-manual-input"
          type="text"
          inputMode="numeric"
          placeholder="Enter barcode number..."
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
        />
        <button className="barcode-manual-btn" type="submit" disabled={!manualCode.trim()}>
          Look up
        </button>
      </form>
    </div>
  );
}
