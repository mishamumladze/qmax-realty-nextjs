import { Metadata } from "next";
import { SOCIAL_MEDIAS } from "@/config/contact";
import ContactLinks from "@/components/ContactLinks";
import NewsletterForm from "@/components/NewsletterForm";
import { SocialsButton } from "@/components/ui/Buttons";

export const metadata: Metadata = {
  title: "Connect With Us - QMAX Realty Socials",
  description:
    "Follow QMAX Real Estate on Instagram, Facebook, TikTok, Telegram, WhatsApp & more.",
};

export default function SocialsPage() {
  return (
    <>
      <header className="text-center pt-12 md:pt-20">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
          Connect With Us
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
          Follow QMAX Realty for new property listings, market insights, and investment opportunities worldwide.
        </p>
      </header>

      {/* Social Cards Grid */}
      <div className="section">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {SOCIAL_MEDIAS.map((s) => (
            <div
              key={s.key}
              className={`bg-gradient-to-br ${s.gradient} rounded-2xl p-6 md:p-8 text-white shadow-lg hover:shadow-2xl transition-shadow flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                      <svg
                        role="img"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-6 h-6 text-white"
                        aria-hidden="true"
                      >
                        <path d={s.icon.path} />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{s.name}</h2>
                      <p className="text-white/80 text-sm">{s.handle}</p>
                    </div>
                  </div>
                  {/* <ExternalLink className="w-5 h-5 shrink-0 text-white/80" aria-hidden="true" /> */}
                </div>

                <p className="text-white/90 mb-6 text-sm leading-relaxed">
                  {s.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <span className="text-sm text-white/80">{s.tagline}</span>
                <SocialsButton
                  href={s.cta_url}
                  label={s.cta_text}
                  />
              </div>
            </div>
          ))}
        </div>
      </div>

      <section className="section text-center bg-gray-50 rounded-2xl shadow-lg">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">Get in Touch</h2>
        <p className="text-gray-600 max-w-2xl mx-auto mb-8">
          Have questions about our properties or need help finding your dream home? We're here to help!
        </p>
        <div className="flex justify-center">
          <ContactLinks variant="list" only={["email", "phone", "address"]} />
        </div>
      </section>

      <section className="section text-center bg-emerald-50 rounded-2xl shadow-lg">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">Stay Updated</h2>
        <p className="text-gray-600 mb-6">
          Subscribe for new property listings, market insights, and exclusive opportunities.
        </p>
        <NewsletterForm />
      </section>
    </>
  );
}