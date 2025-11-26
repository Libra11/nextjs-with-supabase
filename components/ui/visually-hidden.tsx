import React from "react"
import { cn } from "@/lib/utils"

/**
 * VisuallyHidden component for accessibility
 * Hides content visually while keeping it accessible to screen readers
 */
interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {}

export const VisuallyHidden = React.forwardRef<
  HTMLSpanElement,
  VisuallyHiddenProps
>(({ className, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        "absolute w-[1px] h-[1px] p-0 -m-[1px] overflow-hidden whitespace-nowrap",
        "border-0 clip-rect-0 opacity-0",
        className
      )}
      {...props}
    />
  )
})

VisuallyHidden.displayName = "VisuallyHidden" 