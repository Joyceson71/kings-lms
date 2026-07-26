import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { jsPDF } from 'jspdf';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const trip_id = url.searchParams.get('trip_id');
  
  if (!trip_id) {
    return NextResponse.json({ error: 'Missing trip_id' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'faculty' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch trip
  const { data: trip } = await supabase.from('iv_trips').select('*').eq('id', trip_id).single();
  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  // Fetch students in this trip
  const { data: locations } = await supabase.from('iv_locations').select('*, profiles(first_name, last_name)').eq('iv_trip_id', trip_id);
  
  // Fetch sos events
  const { data: sosEvents } = await supabase.from('iv_sos_events').select('*').eq('iv_trip_id', trip_id);
  
  // Fetch geofence breaches
  const { data: breaches } = await supabase.from('iv_geofence_events').select('*, iv_geofence_zones(name)').in('zone_id', 
    (await supabase.from('iv_geofence_zones').select('id').eq('iv_trip_id', trip_id)).data?.map(z => z.id) || []
  );

  const doc = new jsPDF();
  
  doc.setFontSize(22);
  doc.text(`Trip Report: ${trip.name}`, 14, 20);
  
  doc.setFontSize(12);
  doc.text(`Date: ${new Date(trip.created_at).toLocaleDateString()}`, 14, 30);
  
  const tripEnd = locations && locations.length > 0 
    ? new Date(Math.max(...locations.map(l => new Date(l.updated_at).getTime()))) 
    : new Date();
  
  const durationMins = Math.round((tripEnd.getTime() - new Date(trip.created_at).getTime()) / 60000);
  doc.text(`Duration: ${durationMins} minutes`, 14, 38);
  
  doc.setFontSize(16);
  doc.text('Student Summary', 14, 55);
  
  let y = 65;
  doc.setFontSize(10);
  
  if (locations && locations.length > 0) {
    locations.forEach(loc => {
      const name = `${loc.profiles?.first_name} ${loc.profiles?.last_name}`;
      const sosCount = sosEvents?.filter(s => s.student_id === loc.user_id).length || 0;
      const breachCount = breaches?.filter(b => b.user_id === loc.user_id).length || 0;
      
      doc.text(`- ${name}: ${sosCount} SOS events, ${breachCount} geofence breaches`, 14, y);
      y += 8;
      
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
  } else {
    doc.text('No students tracked.', 14, y);
  }

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="trip-report-${trip_id.substring(0,8)}.pdf"`
    }
  });
}
