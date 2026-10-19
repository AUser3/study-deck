import { ArrowRight } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const InteractiveHoverButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, className, type = "button", ...props }, ref) => {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "group relative w-auto cursor-pointer overflow-hidden rounded-full border bg-background px-6 py-2 text-center font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="flex items-center justify-center gap-2">
        <span className="h-2 w-2 rounded-full bg-primary transition-transform duration-300 group-hover:scale-[100.8] motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
        <span className="inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:opacity-100">
          {children}
        </span>
      </span>
      <span className="absolute top-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 text-primary-foreground opacity-0 transition-all duration-300 group-hover:-translate-x-5 group-hover:opacity-100 motion-reduce:hidden">
        <span>{children}</span>
        <ArrowRight className="h-4 w-4" aria-hidden />
      </span>
    </button>
  );
});
InteractiveHoverButton.displayName = "InteractiveHoverButton";
