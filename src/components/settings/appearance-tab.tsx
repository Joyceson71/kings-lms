import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface AppearanceTabProps {
  theme: string | undefined;
  setTheme: (theme: string) => void;
  profile: any;
}

export function AppearanceTab({ theme, setTheme, profile }: AppearanceTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Appearance</h2>
        <p className="text-sm text-muted-foreground">Customize how Kings EC Platform looks for you.</p>
      </div>
      <div className="space-y-4">
        <p className="text-sm font-medium text-foreground">Theme</p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { id: 'dark', label: 'Dark', preview: 'from-gray-900 to-slate-800' },
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
  );
}
