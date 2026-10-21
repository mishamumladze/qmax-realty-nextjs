"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import {
  Briefcase,
  Globe,
  GraduationCap,
  HeartPulse,
  House,
  IdCard,
  Landmark,
  Languages,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

type Service = {
  key: string;
  icon: LucideIcon;
};

const SERVICES: Service[] = [
  { key: "residence_permit", icon: IdCard },
  { key: "real_estate", icon: House },
  { key: "schengen_visa", icon: Globe },
  { key: "employment", icon: Briefcase },
  { key: "university_admission", icon: GraduationCap },
  { key: "translation_services", icon: Languages },
  { key: "title_insurance", icon: ShieldCheck },
  { key: "insurance", icon: HeartPulse },
  { key: "state_municipal_services", icon: Landmark },
  { key: "family_support", icon: Users },
  { key: "additional_services", icon: Sparkles },
];

const TRANSLATION_LANGUAGES = [
  { key: "turkish", code: "TR" },
  { key: "russian", code: "RU" },
  { key: "english", code: "EN" },
  { key: "ukrainian", code: "UA" },
  { key: "uzbek", code: "UZ" },
  { key: "german", code: "DE" },
  { key: "french", code: "FR" },
  { key: "arabic", code: "AR" },
  { key: "kazakh", code: "KZ" },
  { key: "azerbaijani", code: "AZ" },
];

export default function DocumentsContent() {
  const t = useTranslations("Pages.Documents");
  const [activeKey, setActiveKey] = useState(SERVICES[0].key);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const isHorizontal = event.key === "ArrowLeft" || event.key === "ArrowRight";
    const isVertical = event.key === "ArrowUp" || event.key === "ArrowDown";

    if (!isHorizontal && !isVertical && event.key !== "Home" && event.key !== "End") {
      return;
    }

    event.preventDefault();

    let nextIndex = index;

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + SERVICES.length) % SERVICES.length;
    } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % SERVICES.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = SERVICES.length - 1;
    }

    setActiveKey(SERVICES[nextIndex].key);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label={t("Tabs.aria_label")}
        className="flex flex-wrap justify-center gap-3"
      >
        {SERVICES.map((service, index) => {
          const Icon = service.icon;
          const isActive = service.key === activeKey;

          return (
            <button
              key={service.key}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              id={`documents-tab-${service.key}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`documents-panel-${service.key}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveKey(service.key)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border
              px-4 py-3 text-center text-xs leading-snug font-bold tracking-[0.12em] uppercase
              transition-colors duration-200 sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)]
              ${
                isActive
                  ? `border-brand-600 bg-brand-600 hover:bg-brand-700 dark:border-brand-500
                    dark:bg-brand-500 dark:hover:bg-brand-600 text-white shadow-md`
                  : `hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800
                    dark:hover:border-brand-800 dark:hover:bg-brand-900/40 dark:hover:text-brand-200
                    border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800
                    dark:text-gray-200`
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true"/>
              <span>{t(`Services.${service.key}.title`)}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        {SERVICES.map((service) => {
          const Icon = service.icon;
          const isActive = service.key === activeKey;
          const items = Object.values(
            t.raw(`Services.${service.key}.items`) as Record<string, string>
          );
          const noteKey = `Services.${service.key}.note`;

          return (
            <section
              key={service.key}
              id={`documents-panel-${service.key}`}
              role="tabpanel"
              aria-labelledby={`documents-tab-${service.key}`}
              hidden={!isActive}
              tabIndex={0}
              className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-10
                dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-start gap-4">
                <span
                  className="bg-brand-50 dark:bg-brand-900/40 flex h-12 w-12 shrink-0 items-center
                    justify-center rounded-xl"
                >
                  <Icon className="text-brand-700 dark:text-brand-300 h-6 w-6" aria-hidden="true"/>
                </span>
                <div className="min-w-0">
                  <h2 className="text-h2 font-bold text-balance text-gray-900 dark:text-white">
                    {t(`Services.${service.key}.title`)}
                  </h2>
                  <p className="mt-2 text-base font-medium text-gray-600 dark:text-gray-300">
                    {t(`Services.${service.key}.subtitle`)}
                  </p>
                </div>
              </div>

              <ul className="mt-6 grid gap-x-8 gap-y-2.5 md:grid-cols-2">
                {items.map((item, itemIndex) => (
                  <li
                    key={itemIndex}
                    className="flex items-start gap-3 text-sm leading-relaxed text-gray-700
                      dark:text-gray-200"
                  >
                    <span
                      aria-hidden="true"
                      className="bg-brand-600 dark:bg-brand-400 mt-2 h-1.5 w-1.5 shrink-0
                        rounded-full"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {t.has(noteKey) && (
                <p
                  className="border-brand-600 bg-brand-50 text-brand-900 dark:border-brand-400
                    dark:bg-brand-900/40 dark:text-brand-100 mt-6 rounded-xl border-l-4 px-4 py-3
                    text-sm font-semibold"
                >
                  {t(noteKey)}
                </p>
              )}

              {service.key === "translation_services" && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t("Languages.title")}
                  </h3>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {TRANSLATION_LANGUAGES.map((language) => (
                      <li
                        key={language.key}
                        className="inline-flex items-center gap-1.5 rounded-full border
                          border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700
                          dark:border-gray-600 dark:bg-gray-700/40 dark:text-gray-200"
                      >
                        <span
                          aria-hidden="true"
                          className="bg-brand-50 text-brand-700 dark:bg-brand-900/40
                            dark:text-brand-300 flex h-5 min-w-5 items-center justify-center
                            rounded-full px-1 text-[10px] font-bold"
                        >
                          {language.code}
                        </span>
                        <span>{t(`Languages.${language.key}`)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
