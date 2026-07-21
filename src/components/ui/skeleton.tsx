import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[#1f1f23]/50 border border-[#1f1f23]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
