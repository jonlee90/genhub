import { cn } from "@/lib/utils";

interface TopAccentBarProps {
  className?: string;
}

export function TopAccentBar({ className }: TopAccentBarProps) {
  return (
    <div
      className={cn(
        "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-construction-blue via-construction-accent to-construction-blue",
        className,
      )}
    />
  );
}
