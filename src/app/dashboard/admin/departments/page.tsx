'use client';

import { TiltCard } from '@/components/ui/tilt-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Plus, Edit2, Trash2, Users } from 'lucide-react';
import { useState } from 'react';

const initialDepartments = [
  { id: 'ECE', name: 'Electronics and Communication', head: 'Dr. A. Smith', students: 420 },
  { id: 'CSE', name: 'Computer Science', head: 'Dr. J. Doe', students: 510 },
  { id: 'IT', name: 'Information Technology', head: 'Prof. M. Raj', students: 380 },
  { id: 'AIDS', name: 'Artificial Intelligence & Data Science', head: 'Dr. K. Prasad', students: 210 },
  { id: 'AIML', name: 'Artificial Intelligence & Machine Learning', head: 'Dr. S. Ramesh', students: 180 },
  { id: 'RAA', name: 'Robotics and Automation', head: 'Dr. R. Kumar', students: 120 },
  { id: 'MECH', name: 'Mechanical Engineering', head: 'Dr. P. Nair', students: 300 },
  { id: 'BME', name: 'Biomedical Engineering', head: 'Dr. N. Singh', students: 150 },
];

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState(initialDepartments);
  const [search, setSearch] = useState('');

  const filtered = departments.filter(d => 
    d.id.toLowerCase().includes(search.toLowerCase()) || 
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-in-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <span className="gradient-text">Departments</span>
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">Manage academic departments</p>
        </div>
        <Button
          className="h-10 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl hover:-translate-y-0.5 hover:shadow-[0_8px_24px_oklch(0.65_0.26_285/0.4)] transition-all duration-200 group"
        >
          <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
          Add Department
        </Button>
      </div>

      <div className="flex gap-3 animate-slide-in-up opacity-0" style={{ animationDelay: '80ms', animationFillMode: 'forwards' }}>
        <Input 
          placeholder="Search departments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm h-10 bg-secondary/40 border-border/40 rounded-xl"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-slide-in-up opacity-0" style={{ animationDelay: '160ms', animationFillMode: 'forwards' }}>
        {filtered.map(dept => (
          <TiltCard key={dept.id} intensity={5}>
            <div className="glass-card rounded-2xl p-5 border border-border/40 hover:border-primary/30 transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="font-bold text-primary">{dept.id}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-foreground leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {dept.name}
              </h3>
              
              <div className="mt-4 pt-4 border-t border-border/30 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">HOD</p>
                  <p className="text-sm font-medium text-foreground">{dept.head}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Students</p>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    <span className="text-sm font-medium text-foreground">{dept.students}</span>
                  </div>
                </div>
              </div>
            </div>
          </TiltCard>
        ))}
      </div>
    </div>
  );
}
