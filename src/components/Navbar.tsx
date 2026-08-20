"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion"; // 1. Import Framer Motion

import {
  Menu,
  X,
  Home,
  Share2,
  Users,
  Building2,
  Info,
} from "lucide-react";

const navLinks = [
  { href: "/", page: "home", label: "Home", icon: Home },
  { href: "/socials", page: "socials", label: "Socials", icon: Share2 },
  { href: "/listings", page: "listings", label: "Listings", icon: Users },
  { href: "/contact", page: "contact", label: "Contact", icon: Building2 },
  { href: "/about", page: "about", label: "About", icon: Info },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Desktop & Mobile Fixed Navbar Bar */}
      <nav
        id="navbar"
        className="fixed bottom-0 md:top-0 md:bottom-auto z-50 w-full bg-white/95 backdrop-blur-lg border-t md:border-t-0 md:border-b border-gray-200 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link
                href="/"
                className="flex-shrink-0 flex items-center space-x-2"
              >
                <Image
                  src="/img/Logo200.webp"
                  alt="QMAX Realty Logo"
                  width={40}
                  height={40}
                  className="h-8 w-8 md:h-10 md:w-10"
                />
                <span className="inline font-bold text-[0.7rem] md:text-xl text-gray-800">
                  QMAX Realty
                </span>
              </Link>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden md:block">
              <div className="flex items-baseline space-x-6">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`relative px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        isActive ? "text-emerald-600 font-semibold" : "text-gray-600 hover:text-emerald-600"
                      }`}
                    >
                      {/* Link Text */}
                      <span className="relative z-10">{link.label}</span>
                      
                      {/* 2. Sliding Underline for Desktop */}
                      {isActive && (
                        <motion.div
                          layoutId="desktop-active-pill"
                          className="absolute inset-x-0 bottom-0 h-0.5 bg-emerald-600"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right Side: Mobile Menu Toggle */}
            <div className="flex items-center justify-end gap-3 min-w-0 md:hidden">
              <button
                type="button"
                onClick={toggleMenu}
                className="flex items-center gap-1.5 p-2 rounded-lg text-gray-600 hover:text-emerald-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
                aria-label={isOpen ? "Close main menu" : "Open main menu"}
                aria-expanded={isOpen}
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
        className={`md:hidden fixed inset-x-0 bottom-0 z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="bg-white rounded-t-2xl shadow-2xl border-t-4 border-emerald-500 max-h-[80vh] overflow-y-auto safe-area-bottom">
          <div
            className="flex justify-center pt-3 pb-1 cursor-pointer hover:bg-emerald-500/10 transition-colors duration-200"
            onClick={closeMenu}
          >
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>
          <div className="px-4 pt-2 pb-12 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className={`relative flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                    isActive ? "text-emerald-600 font-semibold" : "text-gray-600 hover:text-emerald-600"
                  }`}
                >
                  {/* 3. Sliding Background Pill for Mobile Drawer */}
                  {isActive && (
                    <motion.div
                      layoutId="mobile-active-pill"
                      className="absolute inset-0 bg-emerald-50 rounded-xl"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}

                  <span className="relative z-10">{link.label}</span>
                  <Icon className="relative z-10 w-5 h-5 text-emerald-600" />
                </Link>
              );
            })}
            <div className="border-t border-gray-200 my-3" />
          </div>
        </div>
      </div>

      {/* Mobile Drawer Backdrop Overlay */}
      <div
        onClick={closeMenu}
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />
    </>
  );
}
