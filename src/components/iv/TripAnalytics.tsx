'use client';

import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Battery, Users, Activity, Navigation, AlertTriangle, ShieldCheck } from 'lucide-react';

interface TripAnalyticsProps {
  students: any[];
  sosEvents: any[];
  breaches: any[];
}

// Haversine formula to calculate distance between two coordinates in meters
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

export default function TripAnalytics({ students, sosEvents, breaches }: TripAnalyticsProps) {
  // 1. Battery Analytics
  const batteryData = useMemo(() => {
    return students
      .filter(s => s.battery !== null && s.battery !== undefined)
      .map(s => ({
        name: s.profiles?.full_name?.split(' ')[0] || 'Unknown',
        battery: s.battery,
        fill: s.battery > 50 ? '#10b981' : s.battery > 20 ? '#f59e0b' : '#ef4444'
      }))
      .sort((a, b) => a.battery - b.battery);
  }, [students]);

  const criticalBatteries = batteryData.filter(d => d.battery <= 20).length;

  // 2. Group Cohesion (Centroid & Spread)
  const cohesionMetrics = useMemo(() => {
    const active = students.filter(s => s.is_online && s.lat && s.lng);
    if (active.length === 0) return { spread: 0, status: 'Unknown' };

    // Calculate centroid
    const centerLat = active.reduce((sum, s) => sum + s.lat, 0) / active.length;
    const centerLng = active.reduce((sum, s) => sum + s.lng, 0) / active.length;

    // Calculate average distance from centroid
    let totalDist = 0;
    let maxDist = 0;
    active.forEach(s => {
      const d = getDistanceInMeters(centerLat, centerLng, s.lat, s.lng);
      totalDist += d;
      if (d > maxDist) maxDist = d;
    });

    const avgSpread = totalDist / active.length;
    
    let status = 'Excellent';
    if (avgSpread > 500) status = 'Dispersed';
    if (avgSpread > 2000) status = 'Critical Spread';

    return { spread: Math.round(avgSpread), maxSpread: Math.round(maxDist), status, activeCount: active.length };
  }, [students]);

  // 3. Activity Timeline (Mocked from current stats for demonstration, in a real app this would use historical data)
  const activityData = useMemo(() => {
    const onlineCount = students.filter(s => s.is_online).length;
    return [
      { time: '1h ago', online: Math.max(0, onlineCount - 5), sos: 0 },
      { time: '45m ago', online: Math.max(0, onlineCount - 2), sos: 1 },
      { time: '30m ago', online: onlineCount, sos: 0 },
      { time: '15m ago', online: onlineCount, sos: 0 },
      { time: 'Now', online: onlineCount, sos: sosEvents.length }
    ];
  }, [students, sosEvents]);

  // 4. Student Risk Profiling
  const riskData = useMemo(() => {
    return students.slice(0, 6).map(s => {
      const sSos = sosEvents.filter(e => e.student_id === s.user_id).length;
      const sBreach = breaches.filter(b => b.user_id === s.user_id).length;
      const batteryScore = s.battery ? (100 - s.battery) / 10 : 5;
      
      return {
        subject: s.profiles?.full_name?.split(' ')[0] || 'Unknown',
        SOS: sSos * 10,
        Breaches: sBreach * 5,
        BatteryRisk: batteryScore,
        fullMark: 20
      };
    });
  }, [students, sosEvents, breaches]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary/20 text-primary rounded-xl">
          <Activity size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Trip Analytics</h2>
          <p className="text-muted-foreground">Real-time health and telemetry data for the group.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-muted/40 p-6 rounded-2xl border border-border shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Group Cohesion</p>
            <h3 className="text-3xl font-bold text-foreground">{cohesionMetrics.spread}m</h3>
            <p className={`text-xs mt-2 font-bold ${cohesionMetrics.status === 'Excellent' ? 'text-emerald-500' : 'text-amber-500'}`}>
              {cohesionMetrics.status}
            </p>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-full">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-muted/40 p-6 rounded-2xl border border-border shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Critical Batteries</p>
            <h3 className="text-3xl font-bold text-foreground">{criticalBatteries}</h3>
            <p className="text-xs mt-2 font-medium text-muted-foreground">
              Devices &lt; 20%
            </p>
          </div>
          <div className={`p-3 rounded-full ${criticalBatteries > 0 ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-500'}`}>
            <Battery size={24} />
          </div>
        </div>

        <div className="bg-muted/40 p-6 rounded-2xl border border-border shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Max Deviation</p>
            <h3 className="text-3xl font-bold text-foreground">{cohesionMetrics.maxSpread}m</h3>
            <p className="text-xs mt-2 font-medium text-muted-foreground">
              Furthest student
            </p>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-500 rounded-full">
            <Navigation size={24} />
          </div>
        </div>

        <div className="bg-muted/40 p-6 rounded-2xl border border-border shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Security Events</p>
            <h3 className="text-3xl font-bold text-foreground">{sosEvents.length + breaches.length}</h3>
            <p className="text-xs mt-2 font-medium text-muted-foreground">
              Total logged alerts
            </p>
          </div>
          <div className={`p-3 rounded-full ${(sosEvents.length + breaches.length) > 0 ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-500'}`}>
            {(sosEvents.length + breaches.length) > 0 ? <AlertTriangle size={24} /> : <ShieldCheck size={24} />}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Battery Chart */}
        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Battery className="text-muted-foreground" size={20} /> Device Battery Levels
          </h3>
          <div className="h-[300px] w-full">
            {batteryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={batteryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: any) => [`${value}%`, 'Battery']}
                  />
                  <Bar dataKey="battery" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No battery data available
              </div>
            )}
          </div>
        </div>

        {/* Connectivity Trend */}
        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Activity className="text-muted-foreground" size={20} /> Connection & Alert Trend
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '8px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="online" name="Online Devices" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="sos" name="SOS Alerts" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Radar */}
        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm lg:col-span-2 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 w-full">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <AlertTriangle className="text-muted-foreground" size={20} /> Student Risk Matrix
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Identifies students who may need attention based on low battery, repeated geofence breaches, or SOS triggers.
            </p>
            <div className="h-[350px] w-full">
              {riskData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={riskData}>
                    <PolarGrid stroke="#ffffff20" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 20]} tick={false} axisLine={false} />
                    <Radar name="SOS Risk" dataKey="SOS" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                    <Radar name="Breach Risk" dataKey="Breaches" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                    <Radar name="Battery Risk" dataKey="BatteryRisk" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '8px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  Not enough data for risk matrix
                </div>
              )}
            </div>
          </div>
          
          <div className="w-full md:w-[350px] space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Action Items</h4>
            {criticalBatteries > 0 && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex gap-4 items-start">
                <Battery className="text-destructive mt-1 shrink-0" />
                <div>
                  <p className="font-bold text-destructive">Low Batteries Detected</p>
                  <p className="text-sm text-destructive/80 mt-1">{criticalBatteries} students have devices under 20%. Please notify them to plug into power banks.</p>
                </div>
              </div>
            )}
            {cohesionMetrics.status !== 'Excellent' && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-4 items-start">
                <Users className="text-amber-500 mt-1 shrink-0" />
                <div>
                  <p className="font-bold text-amber-500">Group Dispersed</p>
                  <p className="text-sm text-amber-500/80 mt-1">Average spread is {cohesionMetrics.spread}m. Max spread is {cohesionMetrics.maxSpread}m. Consider requesting students to gather.</p>
                </div>
              </div>
            )}
            {sosEvents.length > 0 && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex gap-4 items-start">
                <AlertTriangle className="text-destructive mt-1 shrink-0" />
                <div>
                  <p className="font-bold text-destructive">Unresolved SOS</p>
                  <p className="text-sm text-destructive/80 mt-1">There are SOS alerts that require immediate attention from the faculty staff.</p>
                </div>
              </div>
            )}
            {criticalBatteries === 0 && cohesionMetrics.status === 'Excellent' && sosEvents.length === 0 && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex gap-4 items-start">
                <ShieldCheck className="text-emerald-500 mt-1 shrink-0" />
                <div>
                  <p className="font-bold text-emerald-500">All Systems Nominal</p>
                  <p className="text-sm text-emerald-500/80 mt-1">No critical issues detected. The group is cohesive and devices are charged.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
