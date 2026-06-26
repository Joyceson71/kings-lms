"use client";

import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin, ScanLine, CheckCircle2, XCircle, KeyRound } from "lucide-react";
import { markAttendance, markAttendanceByPin } from "@/app/actions/attendance";

const MOCK_STUDENTS = [
  { id: "00000000-0000-0000-0000-000000000003", name: "Jane Smith" },
  { id: "00000000-0000-0000-0000-000000000004", name: "Alice Johnson" },
  { id: "00000000-0000-0000-0000-000000000005", name: "Bob Williams" },
];

export function StudentView() {
  const [activeStudent, setActiveStudent] = useState(MOCK_STUDENTS[0].id);
  const [mode, setMode] = useState<"idle" | "scan" | "pin">("idle");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [pin, setPin] = useState("");
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const startScanner = () => {
    setMode("scan");
    setResult(null);
    
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
        },
        false
      );
      
      scannerRef.current = scanner;
      
      scanner.render(
        async (decodedText) => {
          scanner.pause(true);
          await handleScan(decodedText, false);
          scanner.clear();
          setMode("idle");
        },
        () => {} // Ignore read errors
      );
    }, 100);
  };

  const handleScan = async (token: string, isPin: boolean) => {
    setLoading(true);

    if (!navigator.geolocation) {
      setResult({ success: false, message: "Geolocation is not supported by your browser." });
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        let res;
        if (isPin) {
          res = await markAttendanceByPin(token, activeStudent, latitude, longitude);
        } else {
          res = await markAttendance(token, activeStudent, latitude, longitude);
        }

        setResult({
          success: res.success,
          message: res.success ? res.message! : res.error!,
        });
        setLoading(false);
        setPin(""); // Clear pin
      },
      (err) => {
        setResult({ success: false, message: `Location access denied. (${err.message})` });
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const submitPin = () => {
    if (pin.length !== 6) return;
    handleScan(pin, true);
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
          <h2 className="text-xl font-bold mb-2">{result.success ? "Attendance Recorded" : "Failed"}</h2>
          <p className="text-muted-foreground mb-8">{result.message}</p>
          <Button onClick={() => { setResult(null); setMode("idle"); }} variant="outline" className="border-white/10">
            Back
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
        <CardDescription>Select your identity and check in for class.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
        
        {/* Mock User Selector */}
        <div className="w-full bg-black/20 p-4 rounded-xl border border-white/5 space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Testing As (Mock User)</label>
          <Select value={activeStudent} onValueChange={(val) => val && setActiveStudent(val)}>
            <SelectTrigger className="w-full bg-transparent border-white/10">
              <SelectValue placeholder="Select a student" />
            </SelectTrigger>
            <SelectContent className="glass-panel border-white/10">
              {MOCK_STUDENTS.map(student => (
                <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="animate-pulse flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Verifying location...
            </p>
          </div>
        ) : mode === "scan" ? (
          <div className="w-full relative rounded-2xl overflow-hidden border-2 border-primary/20">
            <div id="qr-reader" className="w-full bg-black/50" />
            <Button 
              variant="ghost" 
              className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/80"
              onClick={() => {
                if (scannerRef.current) scannerRef.current.clear();
                setMode("idle");
              }}
            >
              Cancel
            </Button>
          </div>
        ) : mode === "pin" ? (
          <div className="w-full max-w-xs space-y-4 animate-in zoom-in-95">
            <div className="space-y-2">
              <label className="text-sm font-medium">Enter 6-Digit PIN</label>
              <Input 
                value={pin}
                onChange={(e) => setPin(e.target.value.toUpperCase())}
                placeholder="000000"
                className="text-center text-2xl tracking-widest h-14 bg-black/20 border-white/10"
                maxLength={6}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setMode("idle")}>Cancel</Button>
              <Button className="flex-1" onClick={submitPin} disabled={pin.length !== 6}>Submit</Button>
            </div>
          </div>
        ) : (
          <div className="py-4 w-full flex flex-col items-center gap-4">
            <Button onClick={startScanner} size="lg" className="w-full max-w-xs font-semibold h-14 text-lg">
              <ScanLine className="w-5 h-5 mr-2" />
              Scan QR Code
            </Button>
            
            <div className="flex items-center gap-4 w-full max-w-xs text-muted-foreground my-2">
              <div className="flex-1 h-[1px] bg-white/10" />
              <span className="text-xs uppercase font-medium">OR</span>
              <div className="flex-1 h-[1px] bg-white/10" />
            </div>

            <Button onClick={() => setMode("pin")} variant="outline" size="lg" className="w-full max-w-xs h-14 border-white/10">
              <KeyRound className="w-5 h-5 mr-2 text-muted-foreground" />
              Enter PIN Code
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
