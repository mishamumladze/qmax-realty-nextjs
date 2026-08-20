import {
  siInstagram,
  siFacebook,
  siTiktok,
  siTelegram,
  siWhatsapp,
} from "simple-icons";

export const CONTACT_INFO = {
  phone: {
    display: "+995 555 00 00 00",
    href: "tel:+995555000000",
  },
  email: {
    display: "info@qmaxrealty.ge",
    href: "mailto:info@qmaxrealty.ge",
  },
  address: {
    display: "Rustaveli Ave 12, Tbilisi, Georgia",
    href: "https://maps.google.com/?q=Rustaveli+Ave+12+Tbilisi+Georgia",
  },
  whatsapp: {
    display: "WhatsApp",
    href: "https://wa.me/995555000000?text=Hello!%20I'd%20like%20to%20inquire%20about%20properties.",
  },
  telegram: {
    display: "Telegram",
    href: "https://t.me/qmaxrealty",
  },
};

export const SOCIAL_MEDIAS = [
  {
    key: "instagram",
    name: "Instagram",
    handle: "@qmax_realestate",
    tagline: "Daily updates",
    description:
      "Follow QMAX Realty for property photos, new listings, and standout homes worldwide.",
    cta_text: "Follow Us",
    cta_url: "https://instagram.com/qmax_realestate",
    icon: siInstagram,
    gradient: "from-purple-500 to-pink-500",
  },
  {
    key: "facebook",
    name: "Facebook",
    handle: "QMAXRealty",
    tagline: "Community updates",
    description:
      "Join our community for market insights, local tips, and exclusive property announcements.",
    cta_text: "Like Page",
    cta_url: "https://facebook.com/QMAXRealty",
    icon: siFacebook,
    gradient: "from-blue-600 to-blue-700",
  },
  {
    key: "tiktok",
    name: "TikTok",
    handle: "@qmax_realty",
    tagline: "Short property clips",
    description:
      "Quick, engaging property clips and behind-the-scenes moments from our listing team.",
    cta_text: "Follow",
    cta_url: "https://tiktok.com/@qmax_realty",
    icon: siTiktok,
    gradient: "from-black to-gray-800",
  },
  {
    key: "telegram",
    name: "Telegram",
    handle: "@QMAX_Realty",
    tagline: "Instant updates",
    description:
      "Get instant notifications about new property listings, price changes, and market news.",
    cta_text: "Join Channel",
    cta_url: CONTACT_INFO.telegram.href,
    icon: siTelegram,
    gradient: "from-blue-400 to-blue-500",
  },
  {
    key: "whatsapp",
    name: "WhatsApp",
    handle: CONTACT_INFO.phone.display,
    tagline: "24/7 support",
    description:
      "Direct communication for property inquiries, viewing requests, and buying or renting support.",
    cta_text: "Message Us",
    cta_url: CONTACT_INFO.whatsapp.href,
    icon: siWhatsapp,
    gradient: "from-green-500 to-green-600",
  },
];