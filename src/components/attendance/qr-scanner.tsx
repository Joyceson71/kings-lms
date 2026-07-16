'use client';

import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Loader2, CheckCircle2, AlertCircle, Camera, Zap, ZapOff, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  isProcessing: boolean;
  scanError: string | null;
  scanSuccess: string | null;
}

export function QRScannerModal({ isOpen, onClose, onScanSuccess, isProcessing, scanError, scanSuccess }: QRScannerModalProps) {
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Initialize and get cameras
  useEffect(() => {
    if (!isOpen || scanSuccess) return;

    let mounted = true;
    
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        if (mounted) {
          setCameras(devices);
          // Prefer back camera if available by guessing label
          const backCamera = devices.find(c => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('rear'));
          setActiveCameraId(backCamera ? backCamera.id : devices[0].id);
          setHasPermission(true);
        }
      } else {
        if (mounted) setHasPermission(false);
      }
    }).catch(err => {
      console.error("Error getting cameras", err);
      if (mounted) setHasPermission(false);
    });

    return () => { mounted = false; };
  }, [isOpen, scanSuccess]);

  // Handle scanning when camera is selected
  useEffect(() => {
    if (!isOpen || scanSuccess || !activeCameraId || isProcessing) {
      // If we stop scanning, stop the instance
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
      return;
    }

    setIsStarting(true);
    const html5QrCode = new Html5Qrcode("qr-reader");
    html5QrCodeRef.current = html5QrCode;

    html5QrCode.start(
      activeCameraId,
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        if (html5QrCode.isScanning) {
          html5QrCode.pause(true);
        }
        onScanSuccess(decodedText);
      },
      () => {
        // ignore scan failures
      }
    ).then(() => {
      setIsStarting(false);
    }).catch(err => {
      console.error("Failed to start scanner", err);
      setIsStarting(false);
    });

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode.clear()).catch(console.error);
      } else {
        html5QrCode.clear();
      }
    };
  }, [isOpen, activeCameraId, onScanSuccess, scanSuccess, isProcessing]);

  // Toggle Flashlight
  const toggleFlashlight = async () => {
    if (!html5QrCodeRef.current?.isScanning) return;
    try {
      const state = !isFlashlightOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: state } as any]
      });
      setIsFlashlightOn(state);
    } catch (err) {
      console.error("Flashlight not supported", err);
    }
  };

  const switchCamera = () => {
    if (cameras.length < 2) return;
    const currentIndex = cameras.findIndex(c => c.id === activeCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setActiveCameraId(cameras[nextIndex].id);
  };

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

          <div className="w-full relative min-h-[300px] flex flex-col items-center justify-center bg-secondary/20 rounded-2xl overflow-hidden border border-border/50">
            {scanSuccess ? (
              <div className="flex flex-col items-center p-6 text-center animate-in zoom-in duration-300 z-10 bg-background/95 w-full h-full justify-center absolute inset-0">
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
              <div className="flex flex-col items-center z-10 absolute inset-0 bg-background/80 backdrop-blur-sm justify-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                <p className="text-sm font-medium text-foreground">Processing attendance...</p>
              </div>
            ) : hasPermission === false ? (
              <div className="flex flex-col items-center p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4 text-destructive">
                  <Camera className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Camera Access Denied</h3>
                <p className="text-sm text-muted-foreground mb-6">Please allow camera permissions in your browser to scan the QR code.</p>
                <Button onClick={() => window.location.reload()} variant="outline" className="rounded-xl">
                  Reload Page
                </Button>
              </div>
            ) : (
              <>
                {/* The actual video feed container */}
                <div id="qr-reader" className="w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover" />
                
                {/* Custom Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Darkened edges */}
                  <div className="absolute inset-0 bg-black/40" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 15% 15%, 15% 85%, 85% 85%, 85% 15%, 15% 15%)' }} />
                  
                  {/* Scanner Box frame */}
                  <div className="absolute top-[15%] left-[15%] right-[15%] bottom-[15%] border-2 border-primary/50 rounded-xl overflow-hidden shadow-[inset_0_0_20px_rgb(99_102_241/0.2)]">
                    {/* Animated scanning line */}
                    {!isStarting && <div className="absolute w-full h-0.5 bg-primary shadow-[0_0_8px_2px_theme(colors.primary.DEFAULT)] animate-scan" />}
                  </div>
                </div>

                {isStarting && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                )}
                
                {/* Camera Controls */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4 z-10">
                  {cameras.length > 1 && (
                    <Button 
                      onClick={switchCamera}
                      size="icon"
                      variant="secondary"
                      className="rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/20 backdrop-blur-md"
                    >
                      <RefreshCcw className="h-4 w-4" />
                    </Button>
                  )}
                  <Button 
                    onClick={toggleFlashlight}
                    size="icon"
                    variant="secondary"
                    className="rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/20 backdrop-blur-md"
                  >
                    {isFlashlightOn ? <Zap className="h-4 w-4 text-amber-400" /> : <ZapOff className="h-4 w-4" />}
                  </Button>
                </div>
              </>
            )}
          </div>

          {scanError && !scanSuccess && (
            <div className="mt-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 w-full flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{scanError}</span>
            </div>
          )}

          {!scanSuccess && hasPermission !== false && (
            <p className="mt-6 text-xs text-muted-foreground/70 text-center">
              Position the QR code within the frame to scan automatically.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
