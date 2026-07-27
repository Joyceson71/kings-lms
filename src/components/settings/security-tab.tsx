import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle } from 'lucide-react';

export function SecurityTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Security Settings</h2>
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
  );
}
