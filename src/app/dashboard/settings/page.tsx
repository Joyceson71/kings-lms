'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  User, Bell, Shield, Palette, Save, CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/lib/hooks/use-user';
import { useTheme } from 'next-themes';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

import { ProfileTab } from '@/components/settings/profile-tab';
import { NotificationsTab } from '@/components/settings/notifications-tab';
import { SecurityTab } from '@/components/settings/security-tab';
import { AppearanceTab } from '@/components/settings/appearance-tab';

type SettingsTab = 'profile' | 'notifications' | 'security' | 'appearance';

const tabs: { key: SettingsTab; label: string; icon: React.ElementType<any> }[] = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'appearance', label: 'Appearance', icon: Palette },
];

const notificationSettings = [
  { id: 'new-session', label: 'New attendance sessions', description: 'Alert when a faculty starts a session', enabled: true },
  { id: 'assignment-due', label: 'Assignment deadlines', description: 'Reminders 24h and 1h before due date', enabled: true },
  { id: 'grade-posted', label: 'Grade updates', description: 'When an assignment is graded', enabled: true },
  { id: 'announcements', label: 'Course announcements', description: 'Faculty posts and course updates', enabled: false },
  { id: 'weekly-report', label: 'Weekly report', description: 'Summary of attendance and performance', enabled: false },
];

export default function SettingsPage() {
  const { profile, displayName, role } = useUser();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [notifications, setNotifications] = useState(notificationSettings);
  const [saved, setSaved] = useState(false);
  const { theme, setTheme } = useTheme();
  const [nameValue, setNameValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [deptValue, setDeptValue] = useState('');
  const [semesterValue, setSemesterValue] = useState('');
  const [rollValue, setRollValue] = useState('');

  // Sync controlled inputs once the hook has hydrated the profile
  useEffect(() => {
    if (displayName) setNameValue(displayName);
  }, [displayName]);
  useEffect(() => {
    if (profile?.email) setEmailValue(profile.email);
  }, [profile?.email]);
  useEffect(() => {
    if (profile) {
      if (profile.department) setDeptValue(profile.department);
      if (profile.semester) setSemesterValue(profile.semester.toString());
      if (profile.roll_number) setRollValue(profile.roll_number);
    }
  }, [profile]);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!profile?.id) return;
    setIsSaving(true);
    
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: nameValue,
          department: deptValue || null,
          semester: semesterValue ? parseInt(semesterValue, 10) : null,
          roll_number: rollValue || null
        })
        .eq('id', profile.id);
        
      if (error) throw error;
      
      await supabase.auth.updateUser({
        data: { full_name: nameValue }
      });
      
      toast.success("Profile saved");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      toast.error(err.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n))
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-slide-in-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <h1 className="text-3xl font-black tracking-tight" >
          <span className="gradient-text">Settings</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your profile, preferences, and account security.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        {/* Sidebar tabs */}
        <div className="animate-slide-in-up opacity-0" style={{ animationDelay: '80ms', animationFillMode: 'forwards' }}>
          <div className="bg-card border border-border rounded-2xl p-3 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    id={`settings-tab-${tab.key}`}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      activeTab === tab.key
                        ? 'bg-primary/15 text-primary shadow-[inset_0_0_0_1px_oklch(0.65_0.26_285/0.25)]'
                        : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                    )}
                  >
                    {/* @ts-expect-error dynamic component type mismatch */}
                    <Icon className={cn('h-4 w-4', activeTab === tab.key ? 'text-primary' : 'text-muted-foreground')} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
        </div>

        {/* Content panel */}
        <div className="animate-slide-in-up opacity-0" style={{ animationDelay: '160ms', animationFillMode: 'forwards' }}>
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8">

              {/* Profile tab */}
              {activeTab === 'profile' && (
                <ProfileTab 
                  displayName={displayName}
                  role={role}
                  nameValue={nameValue}
                  setNameValue={setNameValue}
                  emailValue={emailValue}
                  setEmailValue={setEmailValue}
                  deptValue={deptValue}
                  setDeptValue={setDeptValue}
                  semesterValue={semesterValue}
                  setSemesterValue={setSemesterValue}
                  rollValue={rollValue}
                  setRollValue={setRollValue}
                />
              )}

              {/* Notifications tab */}
              {activeTab === 'notifications' && (
                <NotificationsTab 
                  notifications={notifications}
                  toggleNotification={toggleNotification}
                />
              )}

              {/* Security tab */}
              {activeTab === 'security' && (
                <SecurityTab />
              )}

              {/* Appearance tab */}
              {activeTab === 'appearance' && (
                <AppearanceTab 
                  theme={theme}
                  setTheme={setTheme}
                  profile={profile}
                />
              )}

              {/* Save button */}
              <div className="mt-8 pt-6 border-t border-border/40 flex items-center justify-between">
                {saved && (
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium animate-fade-in">
                    <CheckCircle className="h-4 w-4" />
                    Changes saved!
                  </div>
                )}
                <div className="ml-auto">
                  <Button
                    id="settings-save-btn"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-10 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl hover:-translate-y-0.5 hover:shadow-[0_8px_24px_oklch(0.65_0.26_285/0.4)] transition-all duration-200 gap-2"
                  >
                    {isSaving ? <span className="animate-spin mr-1">⚪</span> : <Save className="h-4 w-4" />}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          
        </div>
      </div>
    </div>
  );
}
