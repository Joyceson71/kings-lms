export function getAttendanceColor(rate: number): 'emerald' | 'gold' | 'red' | 'violet' {
  if (rate >= 80) return 'emerald';
  if (rate >= 75) return 'gold';
  return 'red';
}
export function getAttendanceStatus(rate: number) {
  if (rate >= 80) return { label: 'Safe', cls: 'text-emerald-400' };
  if (rate >= 75) return { label: 'Watch', cls: 'text-amber-400' };
  return { label: 'Low', cls: 'text-red-400' };
}
export function formatDueDate(iso: string | null) {
  if (!iso) return 'No deadline';
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  return `Due in ${diffDays}d`;
}
export function isOverdue(iso: string | null) {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}
export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
