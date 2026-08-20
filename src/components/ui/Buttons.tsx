import Link from 'next/link';
import React from 'react';

type ButtonProps = {
  label: string;
  href?: string;
  id?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
};

const baseStyles =
  `inline-flex items-center justify-center px-6 py-3 font-semibold transition-all duration-200 gap-2`;
const roundStyles =
  `${baseStyles} rounded-full shadow-lg`;
const transparentStyles =
  `${baseStyles} rounded-lg`;


function renderButtonContent(
  styles: string,
  { label, href, id, icon, onClick, type = 'button' }: ButtonProps
) {
  if (href) {
    const isExternal = href.startsWith('http') || href.startsWith('//');

    if (isExternal) {
      return (
        <a id={id} href={href} target="_blank" rel="noopener noreferrer" className={styles}>
          {icon && <span >{icon}</span>}
          {label}
        </a>
      );
    }

    return (
      <Link id={id} href={href} className={styles}>
        {icon && <span >{icon}</span>}
        {label}
      </Link>
    );
  }

  return (
    <button id={id} type={type} onClick={onClick} className={styles}>
      {icon && <span >{icon}</span>}
      {label}
    </button>
  );
}

// ─── Base Buttons ─────────────────────────────────────────────────────────────────────────────
export function PrimaryButton(props: ButtonProps) {
  const styles = `${baseStyles} bg-emerald-600 border-2 border-white text-white hover:bg-emerald-700 rounded-lg ${props.className || ''}`.trim();
  return renderButtonContent(styles, props);
}

export function SecondaryButton(props: ButtonProps) {
  const styles = `${baseStyles} bg-white text-emerald-700 hover:bg-emerald-50 rounded-lg ${props.className || ''}`.trim();
  return renderButtonContent(styles, props);
}

// ─── Rounded Buttons ──────────────────────────────────────────────────────────────────────────
export function PrimaryButtonRounded(props: ButtonProps) {
  const styles = `${roundStyles} text-white hover:shadow-xl hover:-translate-y-0.5 m-2 hover:bg-emerald-500 active:bg-emerald-700 hover:shadow-emerald-500/40 bg-emerald-600/80 ${props.className || ''}`.trim();
  return renderButtonContent(styles, props);
}

export function SecondaryButtonRounded(props: ButtonProps) {
  const styles = `${roundStyles} text-emerald hover:shadow-xl hover:-translate-y-0.5 m-2 hover:bg-white-500 active:bg-white-700 hover:shadow-white-500/40 bg-white-600/80 ${props.className || ''}`.trim();
  return renderButtonContent(styles, props);
}

// ─── Transparent Buttons ──────────────────────────────────────────────────────────────────────
export function PrimaryButtonTransparent(props: ButtonProps) {
  const styles = `${transparentStyles} bg-emerald-600/20 hover:bg-emerald-600/30 ${props.className || ''}`.trim();
  return renderButtonContent(styles, props);
}

export function SecondaryButtonTransparent(props: ButtonProps) {
  const styles = `${transparentStyles} border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600/5 ${props.className || ''}`.trim();
  return renderButtonContent(styles, props);
}

export function SocialsButton(props: ButtonProps) {
  const styles = `${transparentStyles} bg-white/20 hover:bg-white/30 ${props.className || ''}`.trim();
  return renderButtonContent(styles, props);
}