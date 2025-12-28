import * as React from "react"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-construction-blue/20 focus-visible:border-construction-blue hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 transition-colors md:text-sm resize-vertical",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
