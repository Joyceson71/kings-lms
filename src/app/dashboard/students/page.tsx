'use client';

import { TiltCard } from '@/components/ui/tilt-card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, UserPlus, Mail, MoreVertical } from 'lucide-react';
import { useState } from 'react';

const students = [
  { id: 1, name: 'Arun Krishnamurthy', roll: 'KEC2024001', email: 'arun.k@kingsecc.in', course: 'CS-301', attendance: 94, role: 'student' as const, status: 'active' as const, year: '3rd Year' },
  { id: 2, name: 'Priya Nair', roll: 'KEC2024002', email: 'priya.n@kingsecc.in', course: 'CS-302', attendance: 88, role: 'student' as const, status: 'active' as const, year: '3rd Year' },
  { id: 3, name: 'Rahul Varma', roll: 'KEC2024003', email: 'rahul.v@kingsecc.in', course: 'MA-101', attendance: 62, role: 'student' as const, status: 'inactive' as const, year: '2nd Year' },
  { id: 4, name: 'Deepa Menon', roll: 'KEC2024004', email: 'deepa.m@kingsecc.in', course: 'CS-303', attendance: 97, role: 'student' as const, status: 'active' as const, year: '3rd Year' },
  { id: 5, name: 'Suresh Iyer', roll: 'KEC2024005', email: 'suresh.i@kingsecc.in', course: 'ENG-201', attendance: 75, role: 'student' as const, status: 'active' as const, year: '2nd Year' },
  { id: 6, name: 'Lakshmi Devi', roll: 'KEC2024006', email: 'lakshmi.d@kingsecc.in', course: 'CS-304', attendance: 91, role: 'student' as const, status: 'active' as const, year: '4th Year' },
  { id: 7, name: 'Karthik Rajan', roll: 'KEC2024007', email: 'karthik.r@kingsecc.in', course: 'CS-301', attendance: 58, role: 'student' as const, status: 'inactive' as const, year: '3rd Year' },
  { id: 8, name: 'Ananya Singh', roll: 'KEC2024008', email: 'ananya.s@kingsecc.in', course: 'MA-101', attendance: 83, role: 'student' as const, status: 'active' as const, year: '1st Year' },
];

export default function StudentsPage() {
  const [search, setSearch] = useState('');
  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.roll.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-in-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <span className="gradient-text">Students</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{students.length} students enrolled</p>
        </div>
        <Button
          id="add-student-btn"
          className="h-10 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl hover:-translate-y-0.5 hover:shadow-[0_8px_24px_oklch(0.65_0.26_285/0.4)] transition-all duration-200 group"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-slide-in-up opacity-0" style={{ animationDelay: '80ms', animationFillMode: 'forwards' }}>
        {[
          { label: 'Total', value: 1024, color: 'text-primary' },
          { label: 'Active', value: 961, color: 'text-emerald-400' },
          { label: 'At Risk', value: 63, color: 'text-amber-400' },
          { label: 'Inactive', value: 12, color: 'text-red-400' },
        ].map((s) => (
          <TiltCard key={s.label} intensity={12}>
            <div className="glass-card rounded-2xl p-4 text-center">
              <p className={`text-2xl font-black ${s.color}`} style={{ fontFamily: 'Outfit, sans-serif' }}>{s.value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          </TiltCard>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3 animate-slide-in-up opacity-0" style={{ animationDelay: '160ms', animationFillMode: 'forwards' }}>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="student-search"
            placeholder="Search students…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 bg-secondary/40 border-border/40 rounded-xl focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
        <Button variant="outline" className="h-10 border-border/40 rounded-xl gap-2 text-muted-foreground hover:text-foreground">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Student table */}
      <div className="animate-slide-in-up opacity-0" style={{ animationDelay: '240ms', animationFillMode: 'forwards' }}>
        <TiltCard intensity={2} glareEffect={false}>
          <div className="glass-card rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-border/50 bg-secondary/20">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Student</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:block">Course</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:block">Attendance</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"></span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border/30">
              {filtered.map((student, i) => (
                <div
                  key={student.id}
                  className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-4 items-center hover:bg-secondary/20 transition-colors duration-150 animate-fade-in opacity-0"
                  style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'forwards' }}
                >
                  {/* Name + Email */}
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={student.name} size="sm" ring={student.status === 'active' ? 'violet' : 'none'} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{student.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{student.roll} · {student.year}</p>
                    </div>
                  </div>

                  {/* Course */}
                  <span className="text-xs font-mono text-muted-foreground hidden md:block">{student.course}</span>

                  {/* Attendance */}
                  <div className="hidden sm:flex items-center gap-2 w-28">
                    <Progress
                      value={student.attendance}
                      variant={student.attendance >= 80 ? 'emerald' : student.attendance >= 70 ? 'gold' : 'red'}
                      size="sm"
                      className="flex-1"
                    />
                    <span className={`text-xs font-bold w-8 text-right ${
                      student.attendance >= 80 ? 'text-emerald-400' :
                      student.attendance >= 70 ? 'text-amber-400' : 'text-red-400'
                    }`}>{student.attendance}%</span>
                  </div>

                  {/* Status */}
                  <Badge variant={student.status === 'active' ? 'active' : 'inactive'} dot>
                    {student.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" aria-label="Email student">
                      <Mail className="h-3.5 w-3.5" />
                    </button>
                    <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors" aria-label="More options">
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No students match your search.</p>
              </div>
            )}
          </div>
        </TiltCard>
      </div>
    </div>
  );
}
