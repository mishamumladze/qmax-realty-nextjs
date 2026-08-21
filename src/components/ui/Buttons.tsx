import Link from "next/link";
import React from "react";

type ButtonProps = {
  label: string;
  href?: string;
  id?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
};

const baseStyles = `inline-flex items-center justify-center px-6 py-3 font-semibold transition-all duration-200 gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600`;
const roundStyles = `${baseStyles} rounded-full shadow-lg`;
const transparentStyles = `${baseStyles} rounded-lg`;

function renderButtonContent(
  styles: string,
  { label, href, id, icon, onClick, type = "button" }: ButtonProps
) {
  if (href) {
    const isExternal = href.startsWith("http") || href.startsWith("//");

    if (isExternal) {
      return (
        <a id={id} href={href} target="_blank" rel="noopener noreferrer" className={styles}>
          {icon && <span>{icon}</span>}
          {label}
        </a>
      );
    }

    return (
      <Link id={id} href={href} className={styles}>
        {icon && <span>{icon}</span>}
        {label}
      </Link>
    );
  }

  return (
    <button id={id} type={type} onClick={onClick} className={styles}>
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );
}

// ─── Base Buttons ─────────────────────────────────────────────────────────────────────────────
export function PrimaryButton(props: ButtonProps) {
  const styles =
    `${baseStyles} bg-brand-600 border-2 border-white text-white hover:bg-brand-700 rounded-lg dark:bg-brand-500 dark:hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${props.className || ""}`.trim();
  return renderButtonContent(styles, props);
}

export function SecondaryButton(props: ButtonProps) {
  const styles =
    `${baseStyles} bg-white text-brand-700 hover:bg-brand-50 rounded-lg dark:bg-gray-800 dark:text-brand-400 dark:hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${props.className || ""}`.trim();
  return renderButtonContent(styles, props);
}

// ─── Rounded Buttons ──────────────────────────────────────────────────────────────────────────
export function PrimaryButtonRounded(props: ButtonProps) {
  const styles =
    `${roundStyles} text-white hover:shadow-xl hover:-translate-y-0.5 hover:bg-brand-500 active:bg-brand-700 hover:shadow-brand-500/40 bg-brand-600 dark:bg-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${props.className || ""}`.trim();
  return renderButtonContent(styles, props);
}

// ─── Transparent Buttons ──────────────────────────────────────────────────────────────────────
export function PrimaryButtonTransparent(props: ButtonProps) {
  const styles =
    `${transparentStyles} bg-brand-600/20 hover:bg-brand-600/30 dark:bg-brand-400/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${props.className || ""}`.trim();
  return renderButtonContent(styles, props);
}

export function SecondaryButtonTransparent(props: ButtonProps) {
  const styles =
    `${transparentStyles} border-2 border-brand-600 text-brand-600 hover:bg-brand-600/5 dark:border-brand-400 dark:text-brand-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${props.className || ""}`.trim();
  return renderButtonContent(styles, props);
}

export function SocialsButton(props: ButtonProps) {
  const styles =
    `${transparentStyles} bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${props.className || ""}`.trim();
  return renderButtonContent(styles, props);
}
