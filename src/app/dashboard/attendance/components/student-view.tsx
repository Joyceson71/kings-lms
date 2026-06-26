"use client";

import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, ScanLine, CheckCircle2, XCircle } from "lucide-react";
import { markAttendance } from "@/app/actions/attendance";

const MOCK_STUDENT_ID = "00000000-0000-0000-0000-000000000003";

export function StudentView() {
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const startScanner = () => {
    setScanning(true);
    setResult(null);
    
    // Give UI a tick to mount the div
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
        },
        /* verbose= */ false
      );
      
      scannerRef.current = scanner;
      
      scanner.render(
        async (decodedText) => {
          // Pause scanner to prevent multiple rapid fires
          scanner.pause(true);
          await handleScan(decodedText);
          scanner.clear();
          setScanning(false);
        },
        (error) => {
          // Ignore general scan errors (happens when no QR in frame)
        }
      );
    }, 100);
  };

  const handleScan = async (qrToken: string) => {
    setLoading(true);

    if (!navigator.geolocation) {
      setResult({ success: false, message: "Geolocation is not supported by your browser." });
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const res = await markAttendance(
          qrToken,
          MOCK_STUDENT_ID,
          latitude,
          longitude
        );

        setResult({
          success: res.success,
          message: res.success ? res.message! : res.error!,
        });
        setLoading(false);
      },
      (err) => {
        setResult({ success: false, message: `Location access denied. (${err.message})` });
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  if (result) {
    return (
      <Card className="glass-card max-w-md mx-auto text-center border-white/10 animate-in zoom-in-95 duration-500">
        <CardContent className="pt-10 pb-8 flex flex-col items-center">
          {result.success ? (
            <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-destructive/20 text-destructive flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8" />
            </div>
          )}
          <h2 className="text-xl font-bold mb-2">{result.success ? "Attendance Recorded" : "Scan Failed"}</h2>
          <p className="text-muted-foreground mb-8">{result.message}</p>
          <Button onClick={() => setResult(null)} variant="outline" className="border-white/10">
            Scan Another
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-panel border-white/5 max-w-xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <ScanLine className="w-5 h-5 text-primary" />
          Mark Attendance
        </CardTitle>
        <CardDescription>Scan the QR code displayed by your professor.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="animate-pulse flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Verifying location...
            </p>
          </div>
        ) : scanning ? (
          <div className="w-full relative rounded-2xl overflow-hidden border-2 border-primary/20">
            <div id="qr-reader" className="w-full bg-black/50" />
            <Button 
              variant="ghost" 
              className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/80"
              onClick={() => {
                if (scannerRef.current) scannerRef.current.clear();
                setScanning(false);
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="py-8 w-full flex flex-col items-center">
            <div className="w-48 h-48 border-2 border-dashed border-white/20 rounded-3xl flex items-center justify-center mb-8 relative">
              <div className="absolute inset-4 border border-primary/30 rounded-2xl animate-[ping_3s_ease-in-out_infinite]" />
              <ScanLine className="w-12 h-12 text-muted-foreground" />
            </div>
            <Button onClick={startScanner} size="lg" className="w-full max-w-xs font-semibold">
              Open Scanner
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
