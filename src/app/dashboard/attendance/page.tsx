"use client";

import { useRole } from "@/components/role-provider";
import { FacultyView } from "./components/faculty-view";
import { StudentView } from "./components/student-view";

export default function AttendancePage() {
  const { role } = useRole();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-bold tracking-tight mb-6 text-gradient">Smart Attendance</h1>
      
      {role === "student" ? <StudentView /> : <FacultyView />}
    </div>
  );
}
