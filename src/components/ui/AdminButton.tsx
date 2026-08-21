import React from "react";

type AdminButtonVariant = "primary" | "secondary" | "destructive";
type AdminButtonSize = "sm" | "md";

type AdminButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
};

const baseStyles = `inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:focus-visible:outline-brand-400 disabled:cursor-not-allowed`;

// Contrast pairs chosen for >= 4.5:1 label contrast in both modes
// (brand palette maps to the emerald scale, see globals.scss @theme).
const variantStyles: Record<AdminButtonVariant, string> = {
  primary:
    "bg-brand-700 text-white hover:bg-brand-800 dark:bg-brand-500 dark:text-gray-900 dark:hover:bg-brand-400 disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-700 dark:disabled:text-gray-500",
  secondary:
    "border-2 border-brand-700 bg-white text-brand-700 hover:bg-brand-50 dark:border-brand-400 dark:bg-transparent dark:text-brand-400 dark:hover:bg-white/5 disabled:border-gray-300 disabled:bg-transparent disabled:text-gray-400 dark:disabled:border-gray-600 dark:disabled:text-gray-500",
  destructive:
    "bg-red-700 text-white hover:bg-red-800 dark:bg-red-600 dark:text-white dark:hover:bg-red-500 disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-700 dark:disabled:text-gray-500",
};

const sizeStyles: Record<AdminButtonSize, string> = {
  sm: "min-h-[36px] px-3 text-sm",
  md: "min-h-[44px] px-5 text-base",
};

export function AdminButton({
  variant = "primary",
  size = "md",
  type = "button",
  className,
  children,
  ...rest
}: AdminButtonProps) {
  const styles =
    `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className || ""}`.trim();

  return (
    <button type={type} className={styles} {...rest}>
      {children}
    </button>
  );
}
