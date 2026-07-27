import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, User, Mail, Phone, GraduationCap, MapPin, Book } from 'lucide-react';

interface ProfileTabProps {
  displayName: string;
  role: string;
  nameValue: string;
  setNameValue: (val: string) => void;
  emailValue: string;
  setEmailValue: (val: string) => void;
}

export function ProfileTab({
  displayName,
  role,
  nameValue,
  setNameValue,
  emailValue,
  setEmailValue,
}: ProfileTabProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Profile Information</h2>
        <p className="text-sm text-muted-foreground">Update your personal details and academic info.</p>
      </div>

      {/* Avatar section */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <Avatar name={displayName} size="xl" ring="violet" glow />
          <button className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary border-2 border-background flex items-center justify-center hover:bg-primary/90 transition-colors shadow-lg">
            <Camera className="h-3.5 w-3.5 text-foreground" />
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
            <Input
              id="settings-name"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              className="pl-9 h-11 bg-background/40 border-border/60 rounded-xl"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="settings-email" className="text-sm font-medium">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="settings-email"
              type="email"
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
              className="pl-9 h-11 bg-background/40 border-border/60 rounded-xl"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="settings-phone" className="text-sm font-medium">Phone</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="settings-phone" placeholder="Enter phone number" className="pl-9 h-11 bg-background/40 border-border/60 rounded-xl" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="settings-dept" className="text-sm font-medium">Department</Label>
          <div className="relative">
            <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="settings-dept" placeholder="Enter department" className="pl-9 h-11 bg-background/40 border-border/60 rounded-xl" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="settings-office" className="text-sm font-medium">Office Location</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="settings-office" placeholder="e.g. Block A, Room 204" className="pl-9 h-11 bg-background/40 border-border/60 rounded-xl" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="settings-courses" className="text-sm font-medium">Courses Handling</Label>
          <div className="relative">
            <Book className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="settings-courses" placeholder="e.g. EC-301, EC-302" className="pl-9 h-11 bg-background/40 border-border/60 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
