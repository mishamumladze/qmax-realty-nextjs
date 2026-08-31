"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PrimaryButton } from "./ui/Buttons";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const t = useTranslations("Components.NewsForm");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || t("status.wrong"));
        return;
      }

      if (!data.ok) {
        setStatus("error");
        setMessage(t("status.wrong"));
        return;
      }

      setStatus("success");
      setMessage(t("status.success"));
      setEmail("");
    } catch {
      setStatus("error");
      setMessage(t("status.network"));
    }
  }

  return (
    /* Added w-full here to ensure it stretches to the max-w-md limit */
    <div className="mx-auto w-full max-w-md">
      {status === "success" && (
        <div
          id="newsletter-success"
          role="status"
          aria-live="polite"
          className="mb-6 w-full rounded-xl border border-green-200 bg-green-50 px-6 py-3
            text-center text-green-700 dark:border-green-800 dark:bg-green-900/30
            dark:text-green-300"
        >
          {message}
        </div>
      )}
      {status === "error" && (
        <div
          id="newsletter-error"
          role="alert"
          className="mb-6 w-full rounded-xl border border-red-200 bg-red-50 px-6 py-3 text-center
            text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
        >
          {message}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col gap-1.5"
        aria-busy={status === "loading"}
      >
        {/* Restructured: Put input and button in their own flex row container */}
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <input
            type="email"
            id="newsletter-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("input.text")}
            required
            autoComplete="email"
            className="focus:ring-brand-500 w-full flex-1 rounded-lg border border-gray-300 px-4
              py-3 text-gray-800 focus:border-transparent focus:ring-2 focus:outline-none
              dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          />
          <PrimaryButton
            type="submit"
            disabled={status === "loading"}
            aria-busy={status === "loading"}
          >
            {" "}
            {status === "loading" ? t("input.subbing") : t("input.sub")}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}
