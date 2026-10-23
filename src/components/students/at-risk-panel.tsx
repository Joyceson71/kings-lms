'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type AtRiskStudent = {
  studentId: string; studentName: string; rollNumber: string | null;
  courseId: string; courseName: string; attendancePercent: number | null;
  internalPercent: number | null; missingSubmissions: number; reasons: string[];
};

export function AtRiskPanel({ students, courses }: { students: AtRiskStudent[]; courses: Array<{ id: string; name: string }> }) {
  const [courseId, setCourseId] = useState('all');
  const [sort, setSort] = useState('risk');
  const [selected, setSelected] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const rows = useMemo(() => students.filter(row => courseId === 'all' || row.courseId === courseId).sort((a, b) => {
    if (sort === 'attendance') return (a.attendancePercent ?? 101) - (b.attendancePercent ?? 101);
    if (sort === 'marks') return (a.internalPercent ?? 101) - (b.internalPercent ?? 101);
    if (sort === 'name') return a.studentName.localeCompare(b.studentName);
    return b.reasons.length + b.missingSubmissions - a.reasons.length - a.missingSubmissions;
  }), [students, courseId, sort]);
  const send = async () => {
    if (courseId === 'all') { toast.error('Choose a course before notifying students.'); return; }
    const recipients = rows.filter(row => selected.includes(row.studentId));
    if (!recipients.length) return;
    setSending(true);
    try {
      const response = await fetch('/api/at-risk/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ course_id: courseId, student_ids: [...new Set(recipients.map(row => row.studentId))], title: 'Academic support check-in', message: 'Your instructor would like to check in about your recent course progress. Please reach out to discuss how we can support you.' }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Could not send notifications.');
      toast.success(`Sent to ${recipients.length} student${recipients.length === 1 ? '' : 's'}.`);
      setSelected([]);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not send notifications.'); }
    finally { setSending(false); }
  };
  return <section className="space-y-5">
    <header><h1 className="text-2xl font-bold">At-Risk Students</h1><p className="text-sm text-muted-foreground">Review attendance, internal marks, and overdue submissions.</p></header>
    <div className="flex flex-wrap items-center gap-2">
      <select aria-label="Filter by course" value={courseId} onChange={event => { setCourseId(event.target.value); setSelected([]); }} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="all">All courses</option>{courses.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}</select>
      <select aria-label="Sort students" value={sort} onChange={event => setSort(event.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="risk">Highest risk</option><option value="attendance">Lowest attendance</option><option value="marks">Lowest marks</option><option value="name">Name</option></select>
      <Button className="ml-auto" onClick={send} disabled={sending || selected.length === 0}><Bell />{sending ? 'Sending…' : `Notify selected (${selected.length})`}</Button>
    </div>
    {courseId === 'all' && <p className="text-xs text-muted-foreground">Choose a course to select students and send a check-in notification.</p>}
    {rows.length === 0 ? <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">No students currently meet the at-risk criteria.</div> : <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="p-3"><input type="checkbox" aria-label="Select all visible students" checked={rows.length > 0 && rows.every(row => selected.includes(row.studentId))} disabled={courseId === 'all'} onChange={event => setSelected(event.target.checked ? [...new Set([...selected, ...rows.map(row => row.studentId)])] : selected.filter(id => !rows.some(row => row.studentId === id)))} /></th><th className="p-3">Student</th><th className="p-3">Course</th><th className="p-3">Attendance</th><th className="p-3">Internal marks</th><th className="p-3">Missing work</th><th className="p-3">Flags</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.courseId}:${row.studentId}`} className="border-t"><td className="p-3"><input type="checkbox" aria-label={`Select ${row.studentName}`} disabled={courseId === 'all'} checked={selected.includes(row.studentId)} onChange={event => setSelected(event.target.checked ? [...selected, row.studentId] : selected.filter(id => id !== row.studentId))} /></td><td className="p-3 font-medium">{row.studentName}<div className="text-xs text-muted-foreground">{row.rollNumber ?? ''}</div></td><td className="p-3">{row.courseName}</td><td className="p-3">{row.attendancePercent === null ? '—' : `${row.attendancePercent}%`}</td><td className="p-3">{row.internalPercent === null ? '—' : `${row.internalPercent}%`}</td><td className="p-3">{row.missingSubmissions}</td><td className="p-3"><div className="flex flex-wrap gap-1">{row.reasons.map(reason => <span key={`${index}:${reason}`} className="rounded-full bg-amber-500/10 px-2 py-1 text-[11px] text-amber-700 dark:text-amber-300">{reason}</span>)}</div></td></tr>)}</tbody></table></div>}
  </section>;
}
