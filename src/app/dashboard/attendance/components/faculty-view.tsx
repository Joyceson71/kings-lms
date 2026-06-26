"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, QrCode, Loader2, Users } from "lucide-react";
import { createAttendanceSession } from "@/app/actions/attendance";

// Dummy IDs for testing until Auth is ready
const MOCK_FACULTY_ID = "00000000-0000-0000-0000-000000000001";
const MOCK_SUBJECT_ID = "00000000-0000-0000-0000-000000000002";

export function FacultyView() {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState("");
  const [radius, setRadius] = useState(50);

  const startSession = async () => {
    setLoading(true);
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const res = await createAttendanceSession(
          MOCK_FACULTY_ID,
          MOCK_SUBJECT_ID,
          latitude,
          longitude,
          radius
        );

        if (res.success) {
          setSession(res.session);
        } else {
          setError(res.error || "Failed to create session.");
        }
        setLoading(false);
      },
      (err) => {
        setError(`Location access denied. Please allow location access to start a geofenced session. (${err.message})`);
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  if (session) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-500">
        <Card className="glass-card border-primary/20 bg-primary/5 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-600" />
          <h2 className="text-2xl font-bold mb-2">Scan to join</h2>
          <p className="text-muted-foreground mb-8">Students must be within {session.radius_meters}m to mark attendance.</p>
          
          <div className="bg-white p-4 rounded-2xl shadow-[0_0_50px_rgba(var(--primary),0.2)]">
            <QRCodeSVG 
              value={session.qr_token} 
              size={250} 
              level="H" 
              includeMargin={false}
              fgColor="#000000"
            />
          </div>
          
          <Button variant="outline" className="mt-8 border-white/10" onClick={() => setSession(null)}>
            End Session
          </Button>
        </Card>
        
        <Card className="glass-panel border-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Live Attendance
            </CardTitle>
            <CardDescription>Students who have successfully checked in.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary/50" />
              <p>Waiting for students to scan...</p>
            </div>
            {/* Realtime list would map here via Supabase realtime subscriptions in Phase 3 */}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="glass-panel border-white/5 max-w-xl animate-in slide-in-from-bottom-4 duration-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-primary" />
          Start Attendance Session
        </CardTitle>
        <CardDescription>Generate a dynamic QR code bound to your current physical location.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Allowed Radius (meters)</Label>
          <Input 
            type="number" 
            value={radius} 
            onChange={(e) => setRadius(Number(e.target.value))}
            className="bg-black/20 border-white/10"
          />
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3" /> Students must be inside this radius to mark attendance.
          </p>
        </div>
        
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        <Button onClick={startSession} disabled={loading} className="w-full relative overflow-hidden group">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span className="relative z-10 font-medium">Generate Geofenced QR</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
