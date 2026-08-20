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

      if (res.ok) {
        setStatus("success");
        setMessage("Thank you for subscribing! You'll receive our latest updates soon.");
        setEmail("");
      } else {
        throw new Error("Failed to subscribe");
      }
    } catch {
      setStatus("error");
      setMessage("Subscription failed. Please try again.");
    }
  }

  return (
    <div className="max-w-md mx-auto">
      {status === "success" && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-6 py-3 mb-6 text-center">
          {message}
        </div>
      )}
      {status === "error" && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-6 py-3 mb-6 text-center">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
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
          className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-800"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
        >
          {status === "loading" ? "Subscribing..." : "Subscribe"}
        </button>
      </form>
    </div>
  );
}