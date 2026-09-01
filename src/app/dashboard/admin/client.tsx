'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, Users, BookOpen, Upload, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function AdminClient({ users, stats }: any) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter((u: any) => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUploadCSV = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        toast.success(`Importing ${file.name}... (Simulated)`);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground brutalist-heading flex items-center gap-3">
            <Shield className="w-8 h-8 text-amber-500" /> Admin Panel
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage users, data, and system settings.</p>
        </div>
        <Button className="glow-violet" onClick={handleUploadCSV}>
          <Upload className="w-4 h-4 mr-2" /> Bulk Import Users
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-8">
        <div className="glass-card p-6 rounded-xl border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-lg text-foreground">Students</h3>
          </div>
          <p className="text-3xl font-black">{stats.students}</p>
        </div>
        <div className="glass-card p-6 rounded-xl border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-lg text-foreground">Faculty</h3>
          </div>
          <p className="text-3xl font-black">{stats.faculty}</p>
        </div>
        <div className="glass-card p-6 rounded-xl border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-lg text-foreground">Courses</h3>
          </div>
          <p className="text-3xl font-black">{stats.courses}</p>
        </div>
      </div>

      <div className="mt-8 glass-card rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-white/5">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search users by name or email..." 
            className="border-none bg-transparent focus-visible:ring-0 px-0"
          />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Department</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u: any) => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{u.full_name || 'No Name'}</td>
                  <td className="px-6 py-4 text-muted-foreground">{u.email || 'No Email'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      u.role === 'admin' ? 'bg-amber-500/20 text-amber-500' :
                      u.role === 'faculty' ? 'bg-emerald-500/20 text-emerald-500' :
                      'bg-indigo-500/20 text-indigo-500'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{u.department || '-'}</td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
