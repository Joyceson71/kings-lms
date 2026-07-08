'use client';

import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  isProcessing: boolean;
  scanError: string | null;
  scanSuccess: string | null;
}

export function QRScannerModal({ isOpen, onClose, onScanSuccess, isProcessing, scanError, scanSuccess }: QRScannerModalProps) {
  const [scannerReady, setScannerReady] = useState(false);

  useEffect(() => {
    if (!isOpen || scanSuccess) return;

    // Small delay to ensure modal DOM is painted before mounting scanner
    const timer = setTimeout(() => {
      setScannerReady(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [isOpen, scanSuccess]);

  useEffect(() => {
    if (!scannerReady || scanSuccess) return;

    // Configuration for html5-qrcode
    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    html5QrcodeScanner.render((decodedText) => {
      // Pause scanner while processing to avoid duplicate scans
      html5QrcodeScanner.pause(true);
      onScanSuccess(decodedText);
    }, () => {
      // Ignore routine scan errors (not finding a code immediately)
    });

    return () => {
      html5QrcodeScanner.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
      setScannerReady(false);
    };
  }, [scannerReady, onScanSuccess, scanSuccess]);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md animate-in fade-in duration-300"
        onClick={() => !isProcessing && !scanSuccess && onClose()}
      />
      
      <div className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 flex items-center justify-center animate-in zoom-in-95 duration-300 w-full max-w-sm">
        <div className="bg-background border border-border/50 rounded-3xl shadow-[0_20px_60px_-15px_oklch(0.65_0.26_285/0.3)] overflow-hidden w-full relative p-6 flex flex-col items-center">
          
          <div className="w-full flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold font-outfit">Scan QR Code</h2>
            <button 
              onClick={onClose}
              disabled={isProcessing}
              className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-full hover:bg-secondary disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="w-full relative min-h-[300px] flex items-center justify-center bg-secondary/20 rounded-2xl overflow-hidden border border-border/50">
            {scanSuccess ? (
              <div className="flex flex-col items-center p-6 text-center animate-in zoom-in duration-300">
                <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 text-emerald-500">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-emerald-400 mb-1">Attendance Marked!</h3>
                <p className="text-sm text-muted-foreground">{scanSuccess}</p>
                <Button 
                  onClick={onClose} 
                  className="mt-6 w-full rounded-xl bg-secondary text-foreground hover:bg-secondary/80"
                >
                  Close
                </Button>
              </div>
            ) : isProcessing ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                <p className="text-sm font-medium text-foreground">Processing attendance...</p>
              </div>
            ) : (
              <div id="qr-reader" className="w-full [&>div]:border-none [&_video]:rounded-xl w-full" />
            )}
          </div>

          {scanError && !scanSuccess && (
            <div className="mt-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 w-full flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{scanError}</span>
            </div>
          )}

          {!scanSuccess && (
            <p className="mt-6 text-xs text-muted-foreground/70 text-center">
              Position the QR code within the camera frame to scan automatically.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
