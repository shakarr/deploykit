import { memo } from "react";

import { cn } from "@lib/utils";

interface ButtonPropsI extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
}

export const Button: React.FC<ButtonPropsI> = memo(function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50",
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "md" && "px-4 py-2 text-sm",
        variant === "primary" && "bg-accent text-white hover:bg-accent-hover",
        variant === "secondary" &&
          "bg-surface-2 text-text-primary border border-border hover:bg-surface-3",
        variant === "danger" && "bg-danger/10 text-danger hover:bg-danger/20",
        variant === "ghost" &&
          "text-text-secondary hover:text-text-primary hover:bg-surface-2",
        className,
      )}
      {...props}
    />
  );
});
