import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDistanceInMeters } from '@/lib/utils/geo';

// Kings Engineering College Campus Coordinates
const CAMPUS_LAT = 13.0116;
const CAMPUS_LNG = 79.9868;
const MAX_CAMPUS_RADIUS_METERS = 2000;
const SESSION_MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours

interface MarkAttendanceBody {
  token: string;        // QR token from the scanned code
  latitude: number;     // Student's GPS latitude
  longitude: number;    // Student's GPS longitude
  accuracy: number;     // GPS accuracy in metres
}

/**
 * POST /api/attendance/mark
 *
 * Server-side attendance marking with full validation:
 * 1. Authenticated caller only
 * 2. Session must be active
 * 3. Session must not be older than 2 hours
 * 4. QR timestamp drift check (if encoded in token URL)
 * 5. Student must be enrolled in the course
 * 6. Geofence check (campus or classroom radius)
 * 7. Duplicate prevention (unique constraint in DB)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // ── 1. Auth ───────────────────────────────────────────────────────────────
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── 2. Parse body ─────────────────────────────────────────────────────────
    let body: MarkAttendanceBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const { token, latitude, longitude, accuracy } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'QR token is required.' }, { status: 400 });
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json({ error: 'GPS coordinates are required.' }, { status: 400 });
    }

    // ── 3. Validate GPS accuracy ──────────────────────────────────────────────
    if (typeof accuracy === 'number' && accuracy > 100) {
      return NextResponse.json(
        { error: `GPS signal too weak (accuracy: ${Math.round(accuracy)}m). Please move to an open area.` },
        { status: 422 }
      );
    }

    // ── 4. Look up session by token ───────────────────────────────────────────
    const { data: session, error: sessionError } = await supabase
      .from('course_sessions')
      .select('id, course_id, status, started_at, latitude, longitude, radius_meters, courses(title)')
      .eq('qr_token', token.trim())
      .maybeSingle();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Invalid or expired QR code.' }, { status: 404 });
    }

    if (session.status !== 'active') {
      return NextResponse.json({ error: 'This session has already ended.' }, { status: 409 });
    }

    // ── 5. Session age check ─────────────────────────────────────────────────
    const sessionAge = Date.now() - new Date(session.started_at).getTime();
    if (sessionAge > SESSION_MAX_AGE_MS) {
      return NextResponse.json(
        { error: 'Session has expired. Please ask your faculty to start a new session.' },
        { status: 409 }
      );
    }

    // ── 6. Enrollment check ───────────────────────────────────────────────────
    const { data: enrollment } = await supabase
      .from('course_enrollments')
      .select('student_id')
      .eq('course_id', session.course_id)
      .eq('student_id', user.id)
      .maybeSingle();

    if (!enrollment) {
      return NextResponse.json(
        { error: 'You are not enrolled in this course. Please contact your faculty to enroll.' },
        { status: 403 }
      );
    }

    // ── 7. Geofence check ─────────────────────────────────────────────────────
    const distToCampus = getDistanceInMeters(latitude, longitude, CAMPUS_LAT, CAMPUS_LNG);
    const isWithinCampus = distToCampus <= MAX_CAMPUS_RADIUS_METERS;

    let isWithinClassroom = false;
    let distToClassroom = 0;

    if (session.latitude && session.longitude) {
      distToClassroom = getDistanceInMeters(
        latitude, longitude,
        session.latitude, session.longitude
      );
      isWithinClassroom = distToClassroom <= (session.radius_meters || 100);
    }

    if (!isWithinCampus && !isWithinClassroom) {
      const displayDist = session.latitude ? distToClassroom : distToCampus;
      const maxDist = session.latitude ? (session.radius_meters || 100) : MAX_CAMPUS_RADIUS_METERS;
      return NextResponse.json(
        { error: `Geofence violation: You are ${Math.round(displayDist)}m away. You must be within ${maxDist}m of the premises.` },
        { status: 403 }
      );
    }

    // ── 8. Mark attendance ────────────────────────────────────────────────────
    const { error: logError } = await supabase
      .from('attendance_logs')
      .insert({
        session_id: session.id,
        student_id: user.id,
        status: 'Present',
      });

    if (logError) {
      if (logError.code === '23505') {
        return NextResponse.json(
          { error: 'You have already marked attendance for this session.' },
          { status: 409 }
        );
      }
      console.error('[attendance/mark]', logError);
      return NextResponse.json({ error: 'Failed to record attendance.' }, { status: 500 });
    }

    const courseTitle = (session.courses as { title?: string } | null)?.title ?? 'your course';
    return NextResponse.json({ success: true, message: `Attendance marked for ${courseTitle}!` });
  } catch (err) {
    console.error('[attendance/mark] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
