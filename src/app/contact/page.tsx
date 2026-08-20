// app/contact/page.tsx
"use client";

import { Metadata } from "next";
import Link from "next/link";
import { useState } from "react";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { PrimaryButton, SecondaryButton, SecondaryButtonTransparent } from "@/components/ui/Buttons";

// For SSG with metadata, export this from layout or parent server component
// export const metadata: Metadata = {
//   title: "Contact QMAX Realty - Get in Touch",
//   description:
//     "Contact QMAX Realty for expert guidance on buying, selling, or renting property.",
// };

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

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
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
        setErrors({
          submit: data.error || "Failed to send message. Please try again.",
        });
      } else {
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
      }
    } catch (error) {
      setErrors({
        submit: "An error occurred. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-16 md:py-24 overflow-hidden">
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90">
            Have questions? Our team is here to help. Reach out and let's talk
            about your property goals.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Info */}
          <div className="lg:col-span-1">
            <div className="space-y-8">
              {/* Email */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-emerald-100">
                    <Mail className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Email</h3>
                  <a
                    href="mailto:info@qmaxrealty.ge"
                    className="text-emerald-600 hover:text-emerald-700"
                  >
                    info@qmaxrealty.ge
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-emerald-100">
                    <Phone className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Phone</h3>
                  <a
                    href="tel:+995591000000"
                    className="text-emerald-600 hover:text-emerald-700"
                  >
                    +995 591 000 000
                  </a>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-green-100">
                    <MessageCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">WhatsApp</h3>
                  <a
                    href="https://wa.me/995591000000"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-700"
                  >
                    +995 591 000 000
                  </a>
                  <p className="text-sm text-gray-500 mt-1">Available 24/7</p>
                </div>
              </div>

              {/* Location */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-emerald-100">
                    <MapPin className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Office</h3>
                  <p className="text-gray-600">
                    123 Rustaveli Ave
                    <br />
                    Tbilisi, Georgia
                  </p>
                </div>
              </div>

              {/* CTA Card */}
              <div className="mt-8 p-6 bg-emerald-50 rounded-2xl border border-emerald-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Prefer to chat?
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Connect with our team instantly on WhatsApp for quick responses.
                </p>
                <a
                  href="https://wa.me/995591000000?text=Hi!%20I'd%20like%20to%20know%20more%20about%20QMAX%20Realty."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Start Chat
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>

              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-semibold">
                    ✓ Message sent successfully! We'll get back to you soon.
                  </p>
                </div>
              )}

              {errors.submit && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">{errors.submit}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-semibold text-gray-900 mb-2"
                    >
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        errors.firstName
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="John"
                      disabled={loading}
                    />
                    {errors.firstName && (
                      <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-semibold text-gray-900 mb-2"
                    >
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        errors.lastName
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Doe"
                      disabled={loading}
                    />
                    {errors.lastName && (
                      <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      errors.email
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="john@example.com"
                    disabled={loading}
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      errors.phone
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="+995 591 000 000"
                    disabled={loading}
                  />
                  {errors.phone && (
                    <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>

                {/* Subject */}
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      errors.subject
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
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
                  {errors.subject && (
                    <p className="text-red-600 text-sm mt-1">{errors.subject}</p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none ${
                      errors.message
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="Tell us more about your property needs..."
                    disabled={loading}
                  />
                  {errors.message && (
                    <p className="text-red-600 text-sm mt-1">{errors.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
                >
                  {loading ? "Sending..." : "Send Message"}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  By submitting this form, you agree to our privacy policy.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <section className="bg-emerald-50 py-12 border-t border-emerald-200">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Browse our listings or schedule a consultation with one of our experts today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <PrimaryButton
                label="Browse Properties"
                href="/listings"
            />
            <SecondaryButtonTransparent
                label="Chat on WhatsApp"
                href="https://wa.me/995591000000?text=Hi!%20I'd%20like%20to%20schedule%20a%20consultation."
            />
          </div>
        </div>
      </section>
    </main>
  );
}