'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

type Entry = {
  id: string;
  course_id: string;
  day_of_week: number;
  period_number: number;
  room_number: string;
  courses?: { title: string; code: string };
};

type Props = {
  initialData: Entry[];
  isFaculty: boolean;
  courses: { id: string; title: string; code: string }[];
};

export default function TimetableClient({ initialData, isFaculty, courses }: Props) {
  const [timetable, setTimetable] = useState<Entry[]>(initialData);
  const [selectedCell, setSelectedCell] = useState<{ day: number; period: number } | null>(null);
  const [courseId, setCourseId] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();

  const handleCellClick = (day: number, period: number) => {
    if (!isFaculty) return;
    const existing = timetable.find(e => e.day_of_week === day && e.period_number === period);
    setSelectedCell({ day, period });
    if (existing) {
      setCourseId(existing.course_id);
      setRoomNumber(existing.room_number || '');
    } else {
      setCourseId('');
      setRoomNumber('');
    }
  };

  const handleSave = async () => {
    if (!selectedCell || !courseId) return;
    setLoading(true);
    
    try {
      const existing = timetable.find(e => e.day_of_week === selectedCell.day && e.period_number === selectedCell.period);
      
      let newEntry: any;
      if (existing) {
        // Update
        const { data, error } = await supabase
          .from('timetable')
          .update({ course_id: courseId, room_number: roomNumber })
          .eq('id', existing.id)
          .select('*, courses(title, code)')
          .single();
        
        if (error) throw error;
        newEntry = data;
        setTimetable(prev => prev.map(e => e.id === existing.id ? newEntry : e));
      } else {
        // Insert
        const { data, error } = await supabase
          .from('timetable')
          .insert({
            course_id: courseId,
            room_number: roomNumber,
            day_of_week: selectedCell.day,
            period_number: selectedCell.period
          })
          .select('*, courses(title, code)')
          .single();
          
        if (error) throw error;
        newEntry = data;
        setTimetable(prev => [...prev, newEntry]);
      }
      
      toast.success('Timetable updated!');
      setSelectedCell(null);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to update timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCell) return;
    const existing = timetable.find(e => e.day_of_week === selectedCell.day && e.period_number === selectedCell.period);
    if (!existing) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from('timetable').delete().eq('id', existing.id);
      if (error) throw error;
      setTimetable(prev => prev.filter(e => e.id !== existing.id));
      toast.success('Entry removed');
      setSelectedCell(null);
    } catch (err) {
      toast.error('Failed to remove entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center border-collapse min-w-[800px]">
            <thead className="bg-secondary/30">
              <tr>
                <th className="p-4 border-b border-r border-border text-left w-32">Day</th>
                {PERIODS.map(p => (
                  <th key={p} className="p-4 border-b border-r border-border font-medium">Period {p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((dayName, i) => {
                const dayIndex = i + 1;
                return (
                  <tr key={dayIndex} className="border-b border-border hover:bg-secondary/10 transition-colors">
                    <td className="p-4 font-semibold text-left border-r border-border bg-secondary/5">{dayName}</td>
                    {PERIODS.map(period => {
                      const entry = timetable.find(e => e.day_of_week === dayIndex && e.period_number === period);
                      return (
                        <td 
                          key={period} 
                          className={`p-2 border-r border-border h-24 align-top transition-colors ${isFaculty ? 'cursor-pointer hover:bg-primary/5' : ''}`}
                          onClick={() => handleCellClick(dayIndex, period)}
                        >
                          {entry ? (
                            <div className="bg-primary/10 border border-primary/20 rounded p-2 h-full flex flex-col justify-between animate-fade-in text-left">
                              <span className="font-bold text-primary truncate" title={entry.courses?.title}>
                                {entry.courses?.code || entry.courses?.title}
                              </span>
                              <span className="text-xs text-muted-foreground bg-background/50 self-start px-1.5 rounded mt-2">
                                {entry.room_number || 'TBA'}
                              </span>
                            </div>
                          ) : (
                            <div className="h-full flex flex-col justify-center text-muted-foreground/30 text-xs items-center">
                              {isFaculty ? '+' : '-'}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selectedCell} onOpenChange={(open) => !open && setSelectedCell(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Timetable Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Course</label>
              <Select value={courseId} onValueChange={(val) => val && setCourseId(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course..." />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.code} - {c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Room Number</label>
              <Input 
                placeholder="e.g. LAB-1, LH-302" 
                value={roomNumber} 
                onChange={e => setRoomNumber(e.target.value)} 
              />
            </div>
            
            <div className="flex justify-between pt-2">
              <Button variant="destructive" onClick={handleDelete} disabled={loading || !timetable.find(e => e.day_of_week === selectedCell?.day && e.period_number === selectedCell?.period)}>
                Remove
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSelectedCell(null)}>Cancel</Button>
                <Button onClick={handleSave} disabled={loading || !courseId}>Save</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
