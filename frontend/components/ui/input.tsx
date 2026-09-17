import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-border bg-white px-3 py-1 text-sm text-brand shadow-sm transition-[border-color,box-shadow] placeholder:text-muted",
          "hover:border-brand/40",
          "focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25",
          "disabled:cursor-not-allowed disabled:border-border disabled:bg-slate-50 disabled:text-brand disabled:opacity-100",
          "aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-red-500/20",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
