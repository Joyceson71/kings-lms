export type CourseWithAttendance = {
  id: string; title: string; code: string;
  total: number; attended: number; rate: number;
};

export type ActiveSession = {
  id: string; course_id: string; room: string | null;
  qr_token: string; started_at: string;
  courses: { title: string; code: string } | null;
};

export type PendingAssignment = { id: string; title: string; dueDate: string | null; course: string };

export type Notification = { id: string; title: string; message: string; type: string; created_at: string };

export interface StudentData {
  coursesWithAttendance: CourseWithAttendance[];
  activeSessions: ActiveSession[];
  pendingAssignments: PendingAssignment[];
  notifications: Notification[];
}

export interface TrendPoint { date: string; rate: number; present: number; total: number }
export interface AssignmentBreakdown { pending: number; submitted: number; graded: number }
