import { Phone, Mail, MapPin } from "lucide-react";
import { siWhatsapp, siTelegram, siFacebook, siInstagram } from "simple-icons";
import { CONTACT_INFO } from "@/config/contact";

type ContactKey =
  "phone" | "email" | "address" | "whatsapp" | "telegram" | "facebook" | "instagram";

interface ContactLinksProps {
  variant?: "buttons" | "list" | "icons-only";
  only?: ContactKey[];
  className?: string;
}

// Simple Icon Renderer helper component
function SimpleIcon({
  icon,
  className = "w-4 h-4",
}: {
  icon: { path: string; title: string };
  className?: string;
}) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d={icon.path} />
    </svg>
  );
}

export default function ContactLinks({
  variant = "buttons",
  only,
  className = "",
}: ContactLinksProps) {
  const allLinks = [
    {
      key: "phone" as ContactKey,
      label: CONTACT_INFO.phone.display,
      href: CONTACT_INFO.phone.href,
      renderIcon: (cls: string) => <Phone className={cls} />,
      color: "bg-blue-600 hover:bg-blue-700 text-white",
    },
    {
      key: "email" as ContactKey,
      label: CONTACT_INFO.email.display,
      href: CONTACT_INFO.email.href,
      renderIcon: (cls: string) => <Mail className={cls} />,
      color: "bg-gray-700 hover:bg-gray-800 text-white",
    },
    {
      key: "address" as ContactKey,
      label: CONTACT_INFO.address.display,
      href: CONTACT_INFO.address.href,
      renderIcon: (cls: string) => <MapPin className={cls} />,
      color: "bg-gray-700 hover:bg-gray-800 text-white",
      target: "_blank",
    },
    {
      key: "whatsapp" as ContactKey,
      label: "WhatsApp",
      href: CONTACT_INFO.whatsapp.href,
      renderIcon: (cls: string) => <SimpleIcon icon={siWhatsapp} className={cls} />,
      color: "bg-[#25D366] hover:bg-[#20bd5a] text-white",
      target: "_blank",
    },
    {
      key: "telegram" as ContactKey,
      label: "Telegram",
      href: CONTACT_INFO.telegram.href,
      renderIcon: (cls: string) => <SimpleIcon icon={siTelegram} className={cls} />,
      color: "bg-[#24A1DE] hover:bg-[#208fc7] text-white",
      target: "_blank",
    },
  ];

  const links = only ? allLinks.filter((item) => only.includes(item.key)) : allLinks;

  if (variant === "icons-only") {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {links.map((item) => (
          <a
            key={item.key}
            href={item.href}
            target={item.target}
            rel={item.target ? "noopener noreferrer" : undefined}
            aria-label={item.label}
            className="hover:bg-brand-100 hover:text-brand-600 dark:hover:bg-brand-900/40
              dark:hover:text-brand-400 rounded-full bg-gray-100 p-3 text-gray-700 transition-colors
              dark:bg-gray-800 dark:text-gray-300"
          >
            {item.renderIcon("w-6 h-6")}
          </a>
        ))}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <ul className={`space-y-3 ${className}`}>
        {links.map((item) => (
          <li key={item.key}>
            <a
              href={item.href}
              target={item.target}
              rel={item.target ? "noopener noreferrer" : undefined}
              className="hover:text-brand-600 dark:hover:text-brand-400 text-md inline-flex
                items-center gap-3 font-medium text-gray-600 transition-colors dark:text-gray-300"
            >
              <span className="text-brand-600 shrink-0">{item.renderIcon("w-4 h-4")}</span>
              <span>{item.label}</span>
            </a>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {links.map((item) => (
        <a
          key={item.key}
          href={item.href}
          target={item.target}
          rel={item.target ? "noopener noreferrer" : undefined}
          className={`text-md inline-flex items-center gap-2 rounded-lg px-4 py-2.5 font-semibold
          shadow-sm transition-all duration-200 hover:-translate-y-0.5 ${item.color}`}
        >
          {item.renderIcon("w-4 h-4 shrink-0")}
          <span>{item.label}</span>
        </a>
      ))}
    </div>
  );
}
