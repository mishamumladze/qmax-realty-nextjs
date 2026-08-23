"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LanguageSelector } from "./LanguageSelector";
import { useTranslations } from "next-intl";

import { Menu, X, Home, Share2, Users, Building2, Info } from "lucide-react";

export default function Navbar() {
  const t = useTranslations("Components.Navbar");

  const navLinks = [
    { href: "/", page: "home", label: t("Home"), icon: Home },
    { href: "/socials", page: "Socials", label: t("Socials"), icon: Share2 },
    { href: "/listings", page: "listings", label: t("Listings"), icon: Users },
    { href: "/contact", page: "Contact", label: t("Contact"), icon: Building2 },
    { href: "/about", page: "About", label: t("About"), icon: Info },
  ];

  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const drawerRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = useCallback(() => setIsOpen(false), []);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeMenu();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeMenu]);

  // Focus trap + initial focus
  useEffect(() => {
    if (!isOpen || !drawerRef.current) return;

    const drawer = drawerRef.current;
    const getFocusable = () =>
      drawer.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

    // Focus first focusable element
    const timer = setTimeout(() => {
      const focusable = getFocusable();
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }, 50);

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    drawer.addEventListener("keydown", handleTab);
    return () => {
      clearTimeout(timer);
      drawer.removeEventListener("keydown", handleTab);
    };
  }, [isOpen]);

  // Restore focus to hamburger when drawer closes
  useEffect(() => {
    if (!isOpen && hamburgerRef.current) {
      hamburgerRef.current.focus();
    }
  }, [isOpen]);

  return (
    <>
      {/* Desktop & Mobile Fixed Navbar Bar */}
      <nav
        id="navbar"
        className="fixed bottom-0 z-50 w-full border-t border-gray-200 bg-white/95 shadow-sm
          backdrop-blur-lg md:top-0 md:bottom-auto md:border-t-0 md:border-b dark:border-gray-700
          dark:bg-gray-900/95"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex flex-shrink-0 items-center">
              <Link href="/" className="flex flex-shrink-0 items-center space-x-2">
                <Image
                  src="/img/Light/Logo200.webp"
                  alt="QMAX Realty Logo Light"
                  width={40}
                  height={40}
                  className="block h-8 w-8 md:h-10 md:w-10 dark:hidden"
                  priority={false}
                />
                <Image
                  src="/img/Dark/Logo200.webp"
                  alt="QMAX Realty Logo Dark"
                  width={40}
                  height={40}
                  className="hidden h-8 w-8 md:h-10 md:w-10 dark:block"
                  priority={false}
                />
                <span
                  className="inline text-base font-bold text-gray-800 md:text-xl dark:text-white"
                >
                  QMAX Realty
                </span>
              </Link>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex md:items-center md:gap-8">
              <div className="flex items-baseline space-x-6">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`relative rounded-md px-3 py-2 text-sm font-medium
                      transition-colors duration-200 ${
                        isActive
                          ? "text-brand-600 dark:text-brand-400 font-semibold"
                          : `hover:text-brand-600 dark:hover:text-brand-400 text-gray-600
                            dark:text-gray-300`
                      }`}
                    >
                      <span className="relative z-10">{link.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="desktop-active-pill"
                          className="bg-brand-600 absolute inset-x-0 bottom-0 h-0.5"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Desktop Language Selector */}
              <div className="border-l border-gray-200 pl-6 dark:border-gray-700">
                <LanguageSelector />
              </div>
            </div>

            {/* Right Side: Mobile Menu Toggle & Language Selector */}
            <div className="flex min-w-0 items-center justify-end gap-3 md:hidden">
              {/* Mobile Language Selector */}
              <LanguageSelector />

              <button
                ref={hamburgerRef}
                type="button"
                onClick={toggleMenu}
                className="hover:text-brand-600 focus:ring-brand-500 dark:hover:text-brand-400 flex
                  items-center gap-1.5 rounded-lg p-2 text-gray-600 transition-all duration-200
                  hover:bg-gray-100 focus:ring-2 focus:outline-none dark:text-gray-300
                  dark:hover:bg-gray-800"
                aria-label={isOpen ? "Close main menu" : "Open main menu"}
                aria-expanded={isOpen}
                aria-controls="mobile-menu"
              >
                {isOpen ? (
                  <X className="h-6 w-6 transition-all duration-300" />
                ) : (
                  <Menu className="h-6 w-6 transition-all duration-300" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Slide-Up Mobile Drawer */}
      <div
        ref={drawerRef}
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
        className={`fixed inset-x-0 bottom-0 z-40 transform transition-transform duration-300
          ease-in-out md:hidden ${isOpen ? "translate-y-0" : "translate-y-full"}`}
      >
        <div
          className="border-brand-500 safe-area-bottom max-h-[80vh] overflow-y-auto rounded-t-2xl
            border-t-4 bg-white shadow-2xl dark:bg-gray-900"
        >
          <div
            className="hover:bg-brand-500/10 flex cursor-pointer justify-center pt-3 pb-1
              transition-colors duration-200"
            onClick={closeMenu}
          >
            <div className="h-1.5 w-12 rounded-full bg-gray-300" />
          </div>
          <div className="space-y-1 px-4 pt-2 pb-12">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className={`relative flex items-center justify-between rounded-xl px-4 py-3
                  text-base font-medium transition-all duration-200 ${
                    isActive
                      ? "text-brand-600 dark:text-brand-400 font-semibold"
                      : `hover:text-brand-600 dark:hover:text-brand-400 text-gray-600
                        dark:text-gray-300`
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobile-active-pill"
                      className="bg-brand-50 dark:bg-brand-900/40 absolute inset-0 rounded-xl"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}

                  <span className="relative z-10">{link.label}</span>
                  <Icon className="text-brand-600 relative z-10 h-5 w-5" />
                </Link>
              );
            })}
            <div className="my-3 border-t border-gray-200 dark:border-gray-700" />
          </div>
        </div>
      </div>

      {/* Mobile Drawer Backdrop Overlay */}
      <div
        onClick={closeMenu}
        className={`fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity duration-300
          md:hidden ${
            isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
      />
    </>
  );
}
