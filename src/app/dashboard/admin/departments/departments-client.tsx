'use client';

import { useState, useMemo, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Plus, Edit2, Trash2, Users, Search, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

export interface DepartmentData {
  id: string;
  code: string;
  name: string;
  head_id: string | null;
  head_name: string | null;
  student_count: number;
}

export interface FacultyData {
  id: string;
  full_name: string | null;
  email: string | null;
}

// ─── Dialogs ──────────────────────────────────────────────────────────────────

function DepartmentDialog({
  dept,
  faculties,
  onClose,
  onSave
}: {
  dept?: DepartmentData | null;
  faculties: FacultyData[];
  onClose: () => void;
  onSave: (data: { code: string; name: string; head_id?: string }) => Promise<void>;
}) {
  const [code, setCode] = useState(dept?.code || '');
  const [name, setName] = useState(dept?.name || '');
  const [headId, setHeadId] = useState(dept?.head_id || '');
  const [pending, startTransition] = useTransition();

  const isEdit = !!dept;

  function handleSubmit() {
    if (!code || !name) return;
    startTransition(async () => {
      await onSave({ code, name, head_id: headId || undefined });
      onClose();
    });
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit Department' : 'Add Department'}</DialogTitle>
        <DialogDescription>
          {isEdit ? 'Update the details for this department.' : 'Create a new academic department.'}
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 py-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department Code</label>
          <Input 
            placeholder="e.g. CSE" 
            value={code} 
            onChange={e => setCode(e.target.value.toUpperCase())}
            className="bg-secondary/30 border-border/40"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</label>
          <Input 
            placeholder="e.g. Computer Science and Engineering" 
            value={name} 
            onChange={e => setName(e.target.value)}
            className="bg-secondary/30 border-border/40"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Head of Department</label>
          <select
            value={headId}
            onChange={e => setHeadId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-secondary/30 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border-border/40"
          >
            <option value="">-- Unassigned --</option>
            {faculties.map(f => (
              <option key={f.id} value={f.id}>
                {f.full_name || f.email}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DialogFooter>
        <DialogClose className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2" onClick={onClose}>
          Cancel
        </DialogClose>
        <Button onClick={handleSubmit} disabled={pending || !code || !name} className="rounded-xl">
          {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {pending ? 'Saving…' : 'Save Department'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function DeleteDialog({
  dept,
  onClose,
  onConfirm
}: {
  dept: DepartmentData;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      await onConfirm();
      onClose();
    });
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="text-destructive">Delete Department</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete <strong>{dept.name} ({dept.code})</strong>?
          This action cannot be undone. Users or courses assigned to this department will have it cleared.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2" onClick={onClose}>
          Cancel
        </DialogClose>
        <Button onClick={handleSubmit} disabled={pending} variant="destructive" className="rounded-xl">
          {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {pending ? 'Deleting…' : 'Yes, Delete'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminDepartmentsClient({
  initialDepartments,
  faculties
}: {
  initialDepartments: DepartmentData[];
  faculties: FacultyData[];
}) {
  const router = useRouter();
  const [departments, setDepartments] = useState(initialDepartments);
  const [search, setSearch] = useState('');
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editDept, setEditDept] = useState<DepartmentData | null>(null);
  const [deleteDept, setDeleteDept] = useState<DepartmentData | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return departments.filter(d => 
      d.code.toLowerCase().includes(q) || 
      d.name.toLowerCase().includes(q)
    );
  }, [departments, search]);

  // ─── API Helpers ───

  async function handleAdd(data: { code: string; name: string; head_id?: string }) {
    const res = await fetch('/api/admin/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create');
    const { data: newDept } = await res.json();
    setDepartments(prev => [...prev, { ...newDept, head_name: faculties.find(f => f.id === data.head_id)?.full_name || null, student_count: 0 }]);
    router.refresh();
  }

  async function handleEdit(data: { code: string; name: string; head_id?: string }) {
    if (!editDept) return;
    const res = await fetch('/api/admin/departments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editDept.id, ...data }),
    });
    if (!res.ok) throw new Error('Failed to update');
    const { data: updated } = await res.json();
    setDepartments(prev => prev.map(d => d.id === editDept.id ? { ...d, ...updated, head_name: faculties.find(f => f.id === data.head_id)?.full_name || null } : d));
    router.refresh();
  }

  async function handleDelete() {
    if (!deleteDept) return;
    const res = await fetch('/api/admin/departments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deleteDept.id }),
    });
    if (!res.ok) throw new Error('Failed to delete');
    setDepartments(prev => prev.filter(d => d.id !== deleteDept.id));
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-in-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-black tracking-tight" >
              <span className="gradient-text">Departments</span>
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">Manage academic departments</p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="h-10 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl hover:-translate-y-0.5 hover:shadow-[0_8px_24px_oklch(0.65_0.26_285/0.4)] transition-all duration-200 group"
        >
          <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
          Add Department
        </Button>
      </div>

      <div className="flex gap-3 animate-slide-in-up opacity-0" style={{ animationDelay: '80ms', animationFillMode: 'forwards' }}>
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search departments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 bg-secondary/40 border-border/40 rounded-xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-slide-in-up opacity-0" style={{ animationDelay: '160ms', animationFillMode: 'forwards' }}>
        {filtered.map(dept => (
          <div key={dept.id} className="bg-[#111113]/80 backdrop-blur-xl rounded-2xl p-5 border border-[#1f1f23] hover:border-primary/30 hover:bg-[#151518]/90 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full group">
            <div className="flex items-start justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors flex items-center justify-center">
                <span className="font-bold text-primary text-sm">{dept.code}</span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setEditDept(dept)}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setDeleteDept(dept)}
                  className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-foreground leading-tight flex-1" >
              {dept.name}
            </h3>
            
            <div className="mt-4 pt-4 border-t border-border/30 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">HOD</p>
                <p className="text-sm font-medium text-foreground truncate">{dept.head_name || 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Students</p>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span className="text-sm font-medium text-foreground">{dept.student_count}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dialogs */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DepartmentDialog faculties={faculties} onClose={() => setIsAddOpen(false)} onSave={handleAdd} />
      </Dialog>
      
      <Dialog open={!!editDept} onOpenChange={(open) => !open && setEditDept(null)}>
        {editDept && (
          <DepartmentDialog dept={editDept} faculties={faculties} onClose={() => setEditDept(null)} onSave={handleEdit} />
        )}
      </Dialog>
      
      <Dialog open={!!deleteDept} onOpenChange={(open) => !open && setDeleteDept(null)}>
        {deleteDept && (
          <DeleteDialog dept={deleteDept} onClose={() => setDeleteDept(null)} onConfirm={handleDelete} />
        )}
      </Dialog>
    </div>
  );
}
