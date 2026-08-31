import Link from "next/link";
import React from "react";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = {
  label?: string;
  href?: string;
  id?: string;
  icon?: React.ReactNode;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  ariaLabel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: React.ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
  autoFocus?: boolean;
};

const baseStyles = `cursor-pointer inline-flex items-center justify-center font-semibold transition-all duration-200 gap-2 
  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 
  disabled:opacity-50 disabled:cursor-not-allowed`;

const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-11 px-3 text-sm",
  md: "min-h-11 px-5 text-base",
  lg: "min-h-11 px-6 text-base",
};

const variantStyles: Record<ButtonVariant, string> = {
  primary: `bg-brand-600 border-2 border-white text-white hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600`,
  secondary: `bg-white text-brand-700 border-2 border-brand-600 hover:bg-brand-50 dark:bg-brand-900/30 dark:border-brand-400 dark:text-brand-300 dark:hover:bg-brand-900/50`,
  tertiary: `bg-transparent text-white hover:bg-brand-900/30`,
  destructive: `bg-red-600 border-2 border-white text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600`,
};

const roundedStyles = "rounded-full shadow-lg";
const defaultStyles = "rounded-lg";

function renderButtonContent(
  styles: string,
  {
    label,
    href,
    id,
    icon,
    onClick,
    type = "button",
    ariaLabel,
    children,
    disabled,
    autoFocus,
  }: ButtonProps
) {
  const content = children ?? (
    <>
      {icon && <span aria-hidden="true">{icon}</span>}
      {label && <span>{label}</span>}
    </>
  );

  if (href) {
    const isExternal = href.startsWith("http") || href.startsWith("//");

    if (isExternal) {
      return (
        <a
          id={id}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={styles}
          aria-label={ariaLabel}
        >
          {content}
        </a>
      );
    }

    return (
      <Link id={id} href={href} className={styles} aria-label={ariaLabel}>
        {content}
      </Link>
    );
  }

  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      className={styles}
      aria-label={ariaLabel}
      autoFocus={autoFocus}
      disabled={disabled}
    >
      {content}
    </button>
  );
}

export function Button({
  label,
  href,
  id,
  icon,
  onClick,
  type = "button",
  className = "",
  ariaLabel,
  variant = "primary",
  size = "md",
  children,
  disabled = false,
  fullWidth = false,
  autoFocus = false,
}: ButtonProps) {
  const styles = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    defaultStyles,
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return renderButtonContent(styles, {
    label,
    href,
    id,
    icon,
    onClick,
    type,
    ariaLabel,
    children,
    disabled,
    autoFocus,
  });
}

// Convenience exports for backward compatibility & semantic clarity
export const PrimaryButton = (props: Omit<ButtonProps, "variant">) => (
  <Button variant="primary" {...props} />
);

export const SecondaryButton = (props: Omit<ButtonProps, "variant">) => (
  <Button variant="secondary" {...props} />
);

export const TertiaryButton = (props: Omit<ButtonProps, "variant">) => (
  <Button variant="tertiary" {...props} />
);

export const DestructiveButton = (props: Omit<ButtonProps, "variant">) => (
  <Button variant="destructive" {...props} />
);

// Rounded variant helpers (for hero CTAs that need rounded-full)
export const PrimaryButtonRounded = (props: Omit<ButtonProps, "variant">) => (
  <Button variant="primary" className={`${roundedStyles} ${props.className || ""}`} {...props} />
);

export const SecondaryButtonRounded = (props: Omit<ButtonProps, "variant">) => (
  <Button variant="secondary" className={`${roundedStyles} ${props.className || ""}`} {...props} />
);
