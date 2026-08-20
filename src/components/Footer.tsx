import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Mail } from 'lucide-react';
import ContactLinks from './ContactLinks';

// Optional: Define props if you want dynamic data, or define fallback constants
interface FooterProps {
  contactPhone?: string;
  contactAddress?: string;
  contactEmail?: string;
  whatsappUrl?: string;
  telegramUrl?: string;
}

export default function Footer({
}: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 my-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          
          {/* Logo */}
          <div className="logo-container">
            <Link href="/" aria-label="QMAX Realty homepage">
              <Image
                src="/img/Logo550.webp"
                alt="QMAX Realty Logo"
                width={550}
                height={550}
                className="w-40 h-auto"
                priority={false}
              />
            </Link>
          </div>

          {/* Contact Info */}
          <ContactLinks 
            variant="list" 
            only={["email", "phone", "address"]} 
          />
          {/* Social Links */}
          <ContactLinks 
            variant="icons-only" 
            only={["whatsapp", "telegram"]} 
            className="mt-4 md:mt-0"
          />
        </div>

        {/* Map */}
        <div className="map-container mt-8 mb-8">
          <iframe
            title="QMAX Realty Office Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d73888.86342402626!2d31.366121!3d36.7898965!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14c3598de8ddfd4d%3A0xeda826ac64e176dc!2sSide%2C%20Manavgat%2FAntalya%2C%20T%C3%BCrkiye!5e1!3m2!1sen!2sge!4v1786216775962!5m2!1sen!2sge"
            className="w-full h-80 border-0 rounded-lg"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-6 text-center text-sm text-gray-500">
          <p>&copy; {currentYear} QMAX Realty. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}