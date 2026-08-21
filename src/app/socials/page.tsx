import { Metadata } from "next";
import { SOCIAL_MEDIAS } from "@/config/contact";
import ContactLinks from "@/components/ContactLinks";
import NewsletterForm from "@/components/NewsletterForm";
import { SocialsButton } from "@/components/ui/Buttons";

export const metadata: Metadata = {
  title: "Connect With Us - QMAX Realty Socials",
  description: "Follow QMAX Real Estate on Instagram, Facebook, TikTok, Telegram, WhatsApp & more.",
};

export default function SocialsPage() {
  return (
    <>
      <header className="pt-12 text-center md:pt-20">
        <h1
          className="mb-4 text-3xl font-bold text-gray-800 md:text-4xl lg:text-5xl dark:text-white"
        >
          Connect With Us
        </h1>
        <p className="mx-auto max-w-3xl text-lg text-gray-600 md:text-xl dark:text-gray-300">
          Follow QMAX Realty for new property listings, market insights, and investment
          opportunities worldwide.
        </p>
      </header>

      {/* Social Cards Grid */}
      <div className="section">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {SOCIAL_MEDIAS.map((s) => (
            <div
              key={s.key}
              className={`bg-gradient-to-br ${s.gradient} flex flex-col justify-between rounded-2xl
              p-6 text-white shadow-lg transition-shadow hover:shadow-2xl md:p-8`}
            >
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full
                        bg-white/20"
                    >
                      <svg
                        role="img"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-6 w-6 text-white"
                        aria-hidden="true"
                      >
                        <path d={s.icon.path} />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{s.name}</h2>
                      <p className="text-sm text-white">{s.handle}</p>
                    </div>
                  </div>
                  {/* <ExternalLink className="w-5 h-5 shrink-0 text-white/80" aria-hidden="true"/> */}
                </div>

                <p className="mb-6 text-sm leading-relaxed text-white">{s.description}</p>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-sm text-white">{s.tagline}</span>
                <SocialsButton href={s.cta_url} label={s.cta_text} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <section className="section rounded-2xl bg-gray-50 text-center shadow-lg dark:bg-gray-800">
        <h2 className="mb-4 text-2xl font-bold text-gray-800 md:text-3xl dark:text-white">
          Get in Touch
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-gray-600 dark:text-gray-300">
          Have questions about our properties or need help finding your dream home? We're here to
          help!
        </p>
        <div className="flex justify-center">
          <ContactLinks variant="list" only={["email", "phone", "address"]} />
        </div>
      </section>

      <section
        className="section bg-brand-50 dark:bg-brand-900/20 rounded-2xl text-center shadow-lg"
      >
        <h2 className="mb-4 text-2xl font-bold text-gray-800 md:text-3xl dark:text-white">
          Stay Updated
        </h2>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          Subscribe for new property listings, market insights, and exclusive opportunities.
        </p>
        <NewsletterForm />
      </section>
    </>
  );
}
