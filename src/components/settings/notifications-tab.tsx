import { cn } from '@/lib/utils';

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

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

interface NotificationsTabProps {
  notifications: NotificationSetting[];
  toggleNotification: (id: string) => void;
}

export function NotificationsTab({ notifications, toggleNotification }: NotificationsTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Notification Preferences</h2>
        <p className="text-sm text-muted-foreground">Choose which events you want to be notified about.</p>
      </div>
      <div className="space-y-4">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className="flex items-center justify-between p-4 rounded-xl border border-border/30 bg-background/20 hover:bg-background/30 transition-colors"
          >
            <div className="flex-1 mr-4">
              <p className="text-sm font-semibold text-foreground">{notif.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{notif.description}</p>
            </div>
            <Toggle enabled={notif.enabled} onChange={() => toggleNotification(notif.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}
