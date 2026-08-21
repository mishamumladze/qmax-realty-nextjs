"use client";

import { useState } from "react";
import { CONTACT_INFO } from "@/config/contact";

const CONTACT_SUBJECTS = [
  { value: "buying", label: "I'm interested in buying" },
  { value: "selling", label: "I want to sell my property" },
  { value: "renting", label: "I'm looking to rent" },
  { value: "valuation", label: "I need a property valuation" },
  { value: "investment", label: "I want to invest" },
  { value: "general", label: "General inquiry" },
];

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  submit?: string;
}

interface ContactFormProps {
  initialSubject?: string;
}

export default function ContactForm({ initialSubject = "" }: ContactFormProps) {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: initialSubject,
    message: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (formData.phone && formData.phone.length > 30) {
      newErrors.phone = "Phone number is too long";
    }

    if (!formData.subject) {
      newErrors.subject = "Please select a subject";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        const fieldErrors: FormErrors = {};
        if (data.fields) {
          if (data.fields.name) fieldErrors.firstName = data.fields.name;
          if (data.fields.lastName) fieldErrors.lastName = data.fields.lastName;
          if (data.fields.email) fieldErrors.email = data.fields.email;
          if (data.fields.phone) fieldErrors.phone = data.fields.phone;
          if (data.fields.subject) fieldErrors.subject = data.fields.subject;
          if (data.fields.message) fieldErrors.message = data.fields.message;
        }
        fieldErrors.submit = data.error || "Failed to send message. Please try again.";
        setErrors(fieldErrors);
        return;
      }

      if (!data.ok) {
        setErrors({
          submit: "Something went wrong. Please try again.",
        });
        return;
      }

      setSuccess(true);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch {
      setErrors({
        submit: "Network error. Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-8 shadow-lg md:p-10 dark:bg-gray-800">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Send us a message</h2>

      {success && (
        <div
          className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800
            dark:bg-green-900/20"
        >
          <p className="font-semibold text-green-800">
            ✓ Message sent successfully! We'll get back to you soon.
          </p>
        </div>
      )}

      {errors.submit && (
        <div
          className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800
            dark:bg-red-900/20"
        >
          <p className="text-red-800">{errors.submit}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name Row */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="firstName"
              className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white"
            >
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={`focus:ring-brand-500 w-full rounded-lg border px-4 py-3 focus:ring-2
                focus:outline-none ${
                  errors.firstName
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300 dark:border-gray-500 dark:bg-gray-900"
                }`}
              placeholder="John"
              disabled={loading}
            />
            {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
          </div>
          <div>
            <label
              htmlFor="lastName"
              className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white"
            >
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={`focus:ring-brand-500 w-full rounded-lg border px-4 py-3 focus:ring-2
                focus:outline-none ${
                  errors.lastName
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300 dark:border-gray-500 dark:bg-gray-900"
                }`}
              placeholder="Doe"
              disabled={loading}
            />
            {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
          </div>
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white"
          >
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`focus:ring-brand-500 w-full rounded-lg border px-4 py-3 focus:ring-2
              focus:outline-none ${
                errors.email
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300 dark:border-gray-500 dark:bg-gray-900"
              }`}
            placeholder="john@example.com"
            disabled={loading}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="phone"
            className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white"
          >
            Phone (Optional)
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={`focus:ring-brand-500 w-full rounded-lg border px-4 py-3 focus:ring-2
              focus:outline-none ${
                errors.phone
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300 dark:border-gray-500 dark:bg-gray-900"
              }`}
            placeholder={CONTACT_INFO.phone.display}
            disabled={loading}
          />
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
        </div>

        {/* Subject */}
        <div>
          <label
            htmlFor="subject"
            className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white"
          >
            Subject *
          </label>
          <select
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className={`focus:ring-brand-500 w-full rounded-lg border px-4 py-3 focus:ring-2
              focus:outline-none ${
                errors.subject
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300 dark:border-gray-500 dark:bg-gray-900"
              }`}
            disabled={loading}
          >
            <option value="">Select a subject...</option>
            {CONTACT_SUBJECTS.map((subj) => (
              <option key={subj.value} value={subj.value}>
                {subj.label}
              </option>
            ))}
          </select>
          {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
        </div>

        {/* Message */}
        <div>
          <label
            htmlFor="message"
            className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white"
          >
            Message *
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={6}
            className={`focus:ring-brand-500 w-full resize-none rounded-lg border px-4 py-3
              focus:ring-2 focus:outline-none ${
                errors.message
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300 dark:border-gray-500 dark:bg-gray-900"
              }`}
            placeholder="Tell us more about your property needs..."
            disabled={loading}
          />
          {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message}</p>}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600
            w-full rounded-lg py-3 font-semibold text-white transition-colors duration-200
            disabled:bg-gray-400 dark:text-gray-900"
        >
          {loading ? "Sending..." : "Send Message"}
        </button>

        <p className="text-center text-xs text-gray-500">
          By submitting this form, you agree to our privacy policy.
        </p>
      </form>
    </div>
  );
}
