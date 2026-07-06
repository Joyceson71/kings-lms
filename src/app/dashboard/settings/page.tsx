'use client';

import { useState } from 'react';
import { TiltCard } from '@/components/ui/tilt-card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  User, Bell, Shield, Palette, GraduationCap,
  Save, Camera, Mail, Phone, MapPin, Book, CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/lib/hooks/use-user';
import { useTheme } from 'next-themes';
import { createClient } from '@/lib/supabase/client';

type SettingsTab = 'profile' | 'notifications' | 'security' | 'appearance';

const tabs: { key: SettingsTab; label: string; icon: React.ElementType }[] = [
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

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200',
        enabled ? 'bg-primary shadow-[0_0_10px_oklch(0.65_0.26_285/0.4)]' : 'bg-secondary'
      )}
      aria-checked={enabled}
      role="switch"
    >
      <span
        className={cn(
          'inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200',
          enabled ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { profile, displayName, role } = useUser();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [notifications, setNotifications] = useState(notificationSettings);
  const [saved, setSaved] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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
        <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
          <span className="gradient-text">Settings</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your profile, preferences, and account security.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        {/* Sidebar tabs */}
        <div className="animate-slide-in-up opacity-0" style={{ animationDelay: '80ms', animationFillMode: 'forwards' }}>
          <TiltCard intensity={4} glareEffect={false}>
            <div className="glass-card rounded-2xl p-3 space-y-1">
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
                    <Icon className={cn('h-4 w-4', activeTab === tab.key ? 'text-primary' : 'text-muted-foreground')} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </TiltCard>
        </div>

        {/* Content panel */}
        <div className="animate-slide-in-up opacity-0" style={{ animationDelay: '160ms', animationFillMode: 'forwards' }}>
          <TiltCard intensity={3} glareEffect={false}>
            <div className="glass-card rounded-2xl p-6 md:p-8">

              {/* Profile tab */}
              {activeTab === 'profile' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-bold text-foreground mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>Profile Information</h2>
                    <p className="text-sm text-muted-foreground">Update your personal details and academic info.</p>
                  </div>

                  {/* Avatar section */}
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <Avatar name={displayName} size="xl" ring="violet" glow />
                      <button className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary border-2 border-background flex items-center justify-center hover:bg-primary/90 transition-colors shadow-lg">
                        <Camera className="h-3.5 w-3.5 text-white" />
                      </button>
                    </div>
                    <div>
                      <p className="text-base font-bold text-foreground">{displayName}</p>
                      <p className="text-sm text-muted-foreground capitalize">{role} · ECE Department</p>
                      <Badge variant={role === 'faculty' ? 'faculty' : role === 'admin' ? 'admin' : 'student'} className="mt-2 capitalize">
                        {role}
                      </Badge>
                    </div>
                  </div>

                  {/* Form */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="settings-name" className="text-sm font-medium">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="settings-name" defaultValue={displayName} className="pl-9 h-11 bg-background/40 border-border/60 rounded-xl" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="settings-email" className="text-sm font-medium">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="settings-email" type="email" defaultValue={profile?.email ?? ''} className="pl-9 h-11 bg-background/40 border-border/60 rounded-xl" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="settings-phone" className="text-sm font-medium">Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="settings-phone" defaultValue="+91 98765 43210" className="pl-9 h-11 bg-background/40 border-border/60 rounded-xl" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="settings-dept" className="text-sm font-medium">Department</Label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="settings-dept" defaultValue="Electronics & Communication Engineering" className="pl-9 h-11 bg-background/40 border-border/60 rounded-xl" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="settings-office" className="text-sm font-medium">Office Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="settings-office" defaultValue="Block A, Room 204" className="pl-9 h-11 bg-background/40 border-border/60 rounded-xl" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="settings-courses" className="text-sm font-medium">Courses Handling</Label>
                      <div className="relative">
                        <Book className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="settings-courses" defaultValue="EC-301, EC-302, EC-303" className="pl-9 h-11 bg-background/40 border-border/60 rounded-xl" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-foreground mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>Notification Preferences</h2>
                    <p className="text-sm text-muted-foreground">Choose which events you want to be notified about.</p>
                  </div>
                  <div className="space-y-4">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="flex items-center justify-between p-4 rounded-xl border border-border/30 bg-background/20 hover:bg-background/30 transition-colors">
                        <div className="flex-1 mr-4">
                          <p className="text-sm font-semibold text-foreground">{notif.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{notif.description}</p>
                        </div>
                        <Toggle enabled={notif.enabled} onChange={() => toggleNotification(notif.id)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Security tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-foreground mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>Security Settings</h2>
                    <p className="text-sm text-muted-foreground">Manage your password and account security.</p>
                  </div>
                  <div className="space-y-5">
                    <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                        <p className="text-sm font-semibold text-emerald-400">Account is secured</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Last sign-in: Today at 8:30 AM · Chrome on Windows</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" placeholder="••••••••" className="h-11 bg-background/40 border-border/60 rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" placeholder="••••••••" className="h-11 bg-background/40 border-border/60 rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                      <Input id="confirm-new-password" type="password" placeholder="••••••••" className="h-11 bg-background/40 border-border/60 rounded-xl" />
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance tab */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-foreground mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>Appearance</h2>
                    <p className="text-sm text-muted-foreground">Customize how Kings EC Platform looks for you.</p>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-foreground">Theme</p>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        { id: 'dark', label: 'Dark', preview: 'from-gray-900 to-slate-800' },
                        { id: 'light', label: 'Light', preview: 'from-gray-100 to-white' },
                        { id: 'system', label: 'System', preview: 'from-gray-400 to-gray-500' },
                      ].map((t) => {
                        const active = theme === t.id;
                        return (
                          <button
                            key={t.id}
                            id={`theme-${t.id}`}
                            onClick={async () => {
                              setTheme(t.id);
                              if (profile?.id) {
                                const supabase = createClient();
                                await supabase.from('profiles').update({ theme: t.id }).eq('id', profile.id);
                              }
                            }}
                            className={cn(
                              'p-4 rounded-xl border-2 text-left transition-all duration-200',
                              active ? 'border-primary' : 'border-border/40 hover:border-border'
                            )}
                          >
                            <div className={`h-10 rounded-lg bg-gradient-to-br ${t.preview} mb-2 shadow-sm`} />
                            <p className={`text-sm font-medium ${active ? 'text-primary' : 'text-foreground'}`}>{t.label}</p>
                            {active && <Badge variant="default" className="mt-1 text-[10px] px-1.5">Active</Badge>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
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
                    className="h-10 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl hover:-translate-y-0.5 hover:shadow-[0_8px_24px_oklch(0.65_0.26_285/0.4)] transition-all duration-200 gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </TiltCard>
        </div>
      </div>
    </div>
  );
}
