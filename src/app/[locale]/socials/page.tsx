import { Metadata } from "next";
import { SOCIAL_MEDIAS } from "@/config/contact";
import ContactLinks from "@/components/ContactLinks";
import NewsletterForm from "@/components/NewsletterForm";
import { TertiaryButton } from "@/components/ui/Buttons";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages.Socials.Metadata");
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: "https://qmax-realty.vercel.app",
    },
    openGraph: {
      title: `${t("title")} - QMAX Realty`,
      description: t("description"),
      url: "https://qmax-realty.vercel.app",
      images: [
        {
          url: "https://qmax-realty.vercel.app/img/og-image.webp",
          width: 1200,
          height: 630,
          alt: t("og_alt"),
          type: "image/webp",
        },
      ],
    },
  };
}

export default async function SocialsPage() {
  const t = await getTranslations("Pages.Socials");
  return (
    <>
      <header className="pt-12 text-center md:pt-20">
        <h1
          className="mb-4 text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 dark:text-white"
        >
          {t("Hero.title")}
        </h1>
        <p className="mx-auto max-w-3xl text-base md:text-lg text-gray-600 dark:text-gray-300">
          {t("Hero.subtitle")}
        </p>
      </header>

      {/* Social Cards Grid */}
      <div className="mx-auto my-6 rounded-lg px-4 py-8 md:my-8 md:py-12">
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
                      <h3 className="text-xl md:text-2xl font-bold">{s.name}</h3>
                      <p className="text-sm text-white">{s.handle}</p>
                    </div>
                  </div>
                  {/* <ExternalLink className="w-5 h-5 shrink-0 text-white/80" aria-hidden="true"/> */}
                </div>

                <p className="mb-6 text-sm leading-relaxed text-white">
                  {t(`SocialCards.${s.key}.description`)}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-sm text-white">{t(`SocialCards.${s.key}.tagline`)}</span>
                <TertiaryButton href={s.cta_url} label={t(`SocialCards.${s.key}.cta_text`)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <section className="mx-auto my-6 rounded-lg px-4 py-8 md:my-8 md:py-12 rounded-2xl bg-gray-50 text-center shadow-lg dark:bg-gray-800">
        <h2 className="mb-4 text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          {t("GetInTouch.title")}
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-base md:text-lg text-gray-600 dark:text-gray-300">
          {t("GetInTouch.subtitle")}
        </p>
        <div className="flex justify-center">
          <ContactLinks variant="list" only={["email", "phone", "address"]} />
        </div>
      </section>

      <section
        className="mx-auto my-6 rounded-lg px-4 py-8 md:my-8 md:py-12 bg-brand-50 dark:bg-brand-900/20 rounded-2xl text-center shadow-lg"
      >
        <h2 className="mb-4 text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          {t("StayUpdated.title")}
        </h2>
        <p className="mb-6 text-base md:text-lg text-gray-600 dark:text-gray-300">{t("StayUpdated.subtitle")}</p>
        <NewsletterForm />
      </section>
    </>
  );
}
