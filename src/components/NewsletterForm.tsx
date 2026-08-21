"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

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
        setMessage(data.error || "Something went wrong. Please try again.");
        return;
      }

      if (!data.ok) {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      setMessage("Thank you for subscribing! You'll receive our latest updates soon.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network error. Please check your connection and try again.");
    }
  }

  return (
    <div className="mx-auto max-w-md">
      {status === "success" && (
        <div
          className="mb-6 rounded-xl border border-green-200 bg-green-50 px-6 py-3 text-center
            text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300"
        >
          {message}
        </div>
      )}
      {status === "error" && (
        <div
          className="mb-6 rounded-xl border border-red-200 bg-red-50 px-6 py-3 text-center
            text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          type="email"
          id="newsletter-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          autoComplete="email"
          className="focus:ring-brand-500 flex-1 rounded-lg border border-gray-300 px-4 py-3
            text-gray-800 focus:border-transparent focus:ring-2 focus:outline-none
            dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-brand-600 hover:bg-brand-700 rounded-lg px-6 py-3 font-semibold text-white
            transition-colors duration-200 disabled:opacity-50"
        >
          {status === "loading" ? "Subscribing..." : "Subscribe"}
        </button>
      </form>
    </div>
  );
}
