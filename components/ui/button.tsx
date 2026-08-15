import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

const sizeStyle: Record<string, string> = {
  default: "px-4 py-2 text-sm",
  sm: "px-3 py-1.5 text-xs",
  lg: "px-5 py-2.5 text-sm",
  icon: "h-10 w-10 shrink-0",
};

const variantStyle: Record<string, string> = {
  default: "bg-accent text-accent-foreground hover:opacity-90",
  outline: "border border-border text-foreground hover:bg-surface-2",
  ghost: "text-muted-foreground hover:text-foreground hover:bg-surface-2",
  secondary: "bg-surface-2 text-foreground hover:bg-surface border border-border/50",
  destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
};

export function Button({
  children,
  className = "",
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed ${sizeStyle[size]} ${variantStyle[variant]} ${className}`;

  // asChild renders the single child element itself (e.g. a Link) with the
  // button's classes merged in, instead of nesting a real <button> around it.
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ className?: string }>;
    return React.cloneElement(child, {
      className: `${classes} ${child.props.className ?? ""}`.trim(),
    });
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
