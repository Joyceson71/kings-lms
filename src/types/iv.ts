export interface IVLocation {
  id: string;
  iv_trip_id: string;
  user_id: string;
  lat: number;
  lng: number;
  is_online: boolean;
  role: 'student' | 'faculty' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface IVPoi {
  id: string;
  type: 'Meeting' | 'Restrooms' | 'Exit' | 'Custom';
  lat: number;
  lng: number;
}

export interface IVGeofenceZone {
  id: string;
  iv_trip_id: string;
  name: string;
  zone_type: 'permitted' | 'restricted' | 'danger';
  polygon: Array<{ lat: number; lng: number }> | string;
  created_by: string;
  created_at: string;
}

export interface IVMessage {
  id: string;
  iv_trip_id: string;
  user_id: string;
  content: string;
  lat?: number;
  lng?: number;
  photo_url?: string | null;
  is_broadcast: boolean;
  created_at: string;
}

export interface IVAlert {
  id: string;
  iv_trip_id: string;
  message: string;
  gather_lat?: number;
  gather_lng?: number;
  created_at: string;
}

export interface IVSosEvent {
  id: string;
  iv_trip_id: string;
  student_id: string;
  lat: number;
  lng: number;
  resolved_at?: string | null;
  created_at: string;
}
