"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Buttons";
import type { AdminCredentials } from "@/types/admin";

const inputClasses =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-brand-400";

export function LoginForm() {
  const router = useRouter();
  const t = useTranslations("Components.Admin.LoginForm");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    // Client-side required validation before any network request.
    if (username.trim() === "" || password === "") {
      setError(t("errors.missing_credentials"));
      return;
    }

    const credentials: AdminCredentials = { username: username.trim(), password };

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        setError(t("errors.invalid_credentials"));
        return;
      }

      const data: { token?: string } = await response.json();
      if (!data.token) {
        setError(t("errors.signin_failed"));
        return;
      }

      window.localStorage.setItem("admin_token", data.token);
      document.cookie = `admin_token=${data.token}; path=/; max-age=604800; samesite=lax`;
      router.push("/admin");
    } catch {
      setError(t("errors.network"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="mx-auto w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm
        dark:border-gray-700 dark:bg-gray-800"
    >
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">{t("title")}</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="login-username"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t("labels.username")}
          </label>
          <input
            id="login-username"
            name="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            disabled={submitting}
            className={`mt-1.5 ${inputClasses}`}
          />
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t("labels.password")}
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={submitting}
            className={`mt-1.5 ${inputClasses}`}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full"
          disabled={submitting}
        >
          {submitting ? t("buttons.signing_in") : t("buttons.sign_in")}
        </Button>

        <div aria-live="polite">
          {error ? (
            <p role="status" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
