"use client";

import { Button, type ButtonProps } from "./ui/Buttons";
import { trackEvent } from "@/lib/analytics";

export function TrackedWhatsAppButton(props: ButtonProps) {
  const { onClick, ...rest } = props;
  return (
    <Button
      {...rest}
      onClick={(e) => {
        trackEvent("whatsapp_click");
        onClick?.(e);
      }}
    />
  );
}

interface TrackedWhatsAppAnchorProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
}

export function TrackedWhatsAppAnchor({ onClick, children, ...rest }: TrackedWhatsAppAnchorProps) {
  return (
    <a
      {...rest}
      onClick={(e) => {
        trackEvent("whatsapp_click");
        onClick?.(e);
      }}
    >
      {children}
    </a>
  );
}
