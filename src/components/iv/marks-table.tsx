'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Mark = {
  id?: string;
  student_id: string;
  course_id: string;
  exam_type: string;
  marks_obtained: number | null;
  max_marks: number;
};

type Props = {
  courseId: string;
  students: { id: string; full_name: string; roll_number: string }[];
  initialMarks: Mark[];
  isFaculty: boolean;
  examTypes: string[];
};

export function MarksTable({ courseId, students, initialMarks, isFaculty, examTypes }: Props) {
  const [marks, setMarks] = useState<Mark[]>(initialMarks);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleMarkChange = (studentId: string, examType: string, val: string) => {
    const numVal = val === '' ? null : Number(val);
    if (numVal !== null && (numVal < 0 || numVal > 100)) return; // basic validation
    
    setMarks(prev => {
      const existing = prev.find(m => m.student_id === studentId && m.exam_type === examType);
      if (existing) {
        return prev.map(m => m === existing ? { ...m, marks_obtained: numVal } : m);
      } else {
        return [...prev, { student_id: studentId, course_id: courseId, exam_type: examType, marks_obtained: numVal, max_marks: 100 }];
      }
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Upsert marks
      const toUpsert = marks.filter(m => m.marks_obtained !== null).map(m => ({
        student_id: m.student_id,
        course_id: m.course_id,
        exam_type: m.exam_type,
        marks_obtained: m.marks_obtained,
        max_marks: m.max_marks || 100
      }));

      if (toUpsert.length === 0) {
        toast.info('No marks to save');
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('internal_marks').upsert(toUpsert, { onConflict: 'student_id,course_id,exam_type' });
      
      if (error) throw error;
      toast.success('Marks saved successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to save marks');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-secondary/30 text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium">Roll No</th>
              <th className="px-4 py-3 font-medium">Student Name</th>
              {examTypes.map(et => (
                <th key={et} className="px-4 py-3 font-medium text-center">{et.replace(/_/g, ' ')}</th>
              ))}
              <th className="px-4 py-3 font-medium text-center">Total (Avg)</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => {
              const studentMarks = marks.filter(m => m.student_id === student.id);
              const totalObtained = studentMarks.reduce((acc, m) => acc + (m.marks_obtained || 0), 0);
              const avg = studentMarks.length > 0 ? (totalObtained / studentMarks.length).toFixed(1) : '-';

              return (
                <tr key={student.id} className="border-b border-border hover:bg-secondary/10 transition-colors">
                  <td className="px-4 py-3 font-mono text-muted-foreground">{student.roll_number || 'N/A'}</td>
                  <td className="px-4 py-3 font-medium">{student.full_name}</td>
                  
                  {examTypes.map(et => {
                    const mark = studentMarks.find(m => m.exam_type === et);
                    return (
                      <td key={et} className="px-4 py-2 text-center">
                        {isFaculty ? (
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={mark?.marks_obtained ?? ''}
                            onChange={(e) => handleMarkChange(student.id, et, e.target.value)}
                            className="w-20 text-center mx-auto h-8 bg-background"
                            placeholder="-"
                          />
                        ) : (
                          <span className={mark?.marks_obtained != null && mark.marks_obtained < 50 ? 'text-red-500 font-bold' : ''}>
                            {mark?.marks_obtained ?? '-'}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center font-bold text-primary">
                    {avg}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {isFaculty && (
        <div className="p-4 bg-secondary/20 flex justify-end border-t border-border">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save All Marks'}
          </Button>
        </div>
      )}
    </div>
  );
}
