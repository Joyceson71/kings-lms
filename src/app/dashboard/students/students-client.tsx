'use client';

import { TiltCard } from '@/components/ui/tilt-card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, UserPlus, Mail, MoreVertical } from 'lucide-react';
import { useState } from 'react';
export default function StudentsClient({ initialStudents }: { initialStudents: any[] }) {
  const [search, setSearch] = useState('');
  
  const formattedStudents = initialStudents.map((s, idx) => ({
    id: s.id,
    name: s.full_name || 'Unknown Student',
    roll: s.roll_number || `KEC2024${idx.toString().padStart(3, '0')}`,
    email: s.id + '@student.in', // Mocking email since auth.users isn't exposed here
    course: s.department || 'General',
    attendance: s.attendance || 85,
    role: s.role,
    status: s.status,
    year: s.year_of_study ? `${s.year_of_study} Year` : '1st Year'
  }));

  const filtered = formattedStudents.filter(
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
          <p className="text-muted-foreground text-sm mt-1">{formattedStudents.length} students enrolled</p>
        </div>
        <Button
          id="add-student-btn"
          className="h-10 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl hover:-translate-y-0.5 hover:shadow-[0_8px_24px_oklch(0.65_0.26_285/0.4)] transition-all duration-200 group"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-slide-in-up opacity-0" style={{ animationDelay: '80ms', animationFillMode: 'forwards' }}>
        {[
          { label: 'Total', value: formattedStudents.length, color: 'text-primary' },
          { label: 'Active', value: formattedStudents.filter(s => s.status === 'active').length, color: 'text-emerald-400' },
          { label: 'At Risk', value: formattedStudents.filter(s => s.attendance < 75).length, color: 'text-amber-400' },
          { label: 'Inactive', value: formattedStudents.filter(s => s.status === 'inactive').length, color: 'text-red-400' },
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
