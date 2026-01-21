import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardSurfaceProps<T extends ElementType> = {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  as?: T;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

export function CardSurface<T extends ElementType = "div">({
  children,
  className,
  interactive = false,
  as,
  ...props
}: CardSurfaceProps<T>) {
  const Component = (as || "div") as ElementType;

  return (
    <Component
      className={cn(
        "bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-xl shadow-sm",
        interactive &&
          "transition-all duration-200 active:scale-[0.99] active:shadow-md",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
