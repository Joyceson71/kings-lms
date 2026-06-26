"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Haversine formula to calculate distance between two coordinates in meters
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export async function createAttendanceSession(
  facultyId: string,
  subjectId: string,
  latitude: number,
  longitude: number,
  radiusMeters: number = 50
) {
  const supabase = await createClient();
  const pinCode = Math.floor(100000 + Math.random() * 900000).toString();

  const { data, error } = await supabase
    .from("attendance_sessions")
    .insert({
      faculty_id: facultyId,
      subject_id: subjectId,
      latitude,
      longitude,
      radius_meters: radiusMeters,
      pin_code: pinCode,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating session:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/attendance");
  return { success: true, session: data };
}

export async function markAttendance(
  qrToken: string,
  studentId: string,
  studentLat: number,
  studentLng: number
) {
  const supabase = await createClient();

  // 1. Find the active session using the scanned token
  const { data: session, error: sessionError } = await supabase
    .from("attendance_sessions")
    .select("*")
    .eq("qr_token", qrToken)
    .eq("is_active", true)
    .single();

  if (sessionError || !session) {
    return { success: false, error: "Invalid or expired QR Code." };
  }

  // 2. Calculate distance and verify geofence
  const distance = getDistanceInMeters(
    session.latitude,
    session.longitude,
    studentLat,
    studentLng
  );

  if (distance > session.radius_meters) {
    return {
      success: false,
      error: `You are too far from the classroom. (${Math.round(distance)}m away, max ${session.radius_meters}m)`,
    };
  }

  // 3. Record attendance
  const { error: recordError } = await supabase
    .from("attendance_records")
    .insert({
      session_id: session.id,
      student_id: studentId,
      latitude: studentLat,
      longitude: studentLng,
      distance_meters: distance,
      status: "present",
    });

  if (recordError) {
    // If it's a unique constraint violation, they already marked it
    if (recordError.code === "23505") {
      return { success: false, error: "You have already marked your attendance for this class." };
    }
    return { success: false, error: recordError.message };
  }

  revalidatePath("/dashboard/attendance");
  return { success: true, message: "Attendance marked successfully!" };
}

export async function markAttendanceByPin(
  pinCode: string,
  studentId: string,
  studentLat: number,
  studentLng: number
) {
  const supabase = await createClient();

  // 1. Find the active session using the PIN
  const { data: session, error: sessionError } = await supabase
    .from("attendance_sessions")
    .select("*")
    .eq("pin_code", pinCode)
    .eq("is_active", true)
    .single();

  if (sessionError || !session) {
    return { success: false, error: "Invalid or expired PIN." };
  }

  // 2. Calculate distance and verify geofence
  const distance = getDistanceInMeters(
    session.latitude,
    session.longitude,
    studentLat,
    studentLng
  );

  if (distance > session.radius_meters) {
    return {
      success: false,
      error: `You are too far from the classroom. (${Math.round(distance)}m away, max ${session.radius_meters}m)`,
    };
  }

  // 3. Record attendance
  const { error: recordError } = await supabase
    .from("attendance_records")
    .insert({
      session_id: session.id,
      student_id: studentId,
      latitude: studentLat,
      longitude: studentLng,
      distance_meters: distance,
      status: "present",
    });

  if (recordError) {
    if (recordError.code === "23505") {
      return { success: false, error: "You have already marked your attendance for this class." };
    }
    return { success: false, error: recordError.message };
  }

  revalidatePath("/dashboard/attendance");
  return { success: true, message: "Attendance marked successfully!" };
}

export async function getLiveAttendance(sessionId: string) {
  const supabase = await createClient();

  // Fetch records and join with profiles
  const { data, error } = await supabase
    .from("attendance_records")
    .select(`
      id,
      marked_at,
      status,
      profiles:student_id (
        id,
        first_name,
        last_name,
        avatar_url,
        email
      )
    `)
    .eq("session_id", sessionId)
    .order("marked_at", { ascending: false });

  if (error) {
    console.error("Error fetching live attendance:", error);
    return [];
  }

  // Map to a cleaner format
  return data.map((record: any) => ({
    id: record.id,
    marked_at: record.marked_at,
    status: record.status,
    student: record.profiles,
  }));
}
