"use client";
import { useState, useEffect } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Image from "next/image";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`bg-white sticky top-0 z-50 transition-shadow duration-300 ${scrolled ? "shadow-sm" : "shadow-none"
        }`}
    >
      <div className="mx-auto max-w-7xl px-6 flex items-center justify-between h-16">
        {/* Hamburger (mobile) */}
        <button
          className="md:hidden text-gray-700 hover:text-[#1bae69]"
          onClick={() => setMobileOpen(true)}
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 md:mx-0 mx-auto">
          <Image
            src="/images/healthlane-logo-horizontal.png"
            alt="HealthLane Logo"
            width={150}
            height={58}
            className="h-auto w-[140px] sm:w-[150px] md:w-[150px] lg:w-[160px]"
            priority
          />

        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-8 ml-auto">
          <Link
            href="/about"
            className="text-sm font-medium text-gray-700 hover:text-[#1bae69] transition-colors duration-300"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium text-gray-700 hover:text-[#1bae69] transition-colors duration-300"
          >
            Contact
          </Link>

          <div className="flex items-center space-x-3">
            <Link
              href="/signup"
              className="text-sm font-semibold text-[#1bae69] border border-[#1bae69] rounded-full px-4 py-1.5 hover:bg-[#1bae69] hover:text-white transition-all duration-200"
            >
              Sign Up
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold text-white bg-[#1bae69] rounded-full px-4 py-1.5 hover:bg-[#169a5f] transition-all duration-200"
            >
              Log In
            </Link>
          </div>
        </nav>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-lg z-50 transform transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-gray-200">
          <Image
            src="/images/healthlane-logo-horizontal.png"
            alt="HealthLane Logo"
            width={150}
            height={58}
            className="h-auto w-[140px] sm:w-[150px] md:w-[150px] lg:w-[160px]"
            priority
          />


          <button
            className="text-gray-700 hover:text-[#1bae69]"
            onClick={() => setMobileOpen(false)}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <nav className="px-6 py-4 space-y-2">
          <Link
            href="/about"
            className="block text-sm font-medium text-gray-700 hover:text-[#1bae69] py-3 border-b border-gray-100"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="block text-sm font-medium text-gray-700 hover:text-[#1bae69] py-3 border-b border-gray-100"
          >
            Contact
          </Link>
          <Link
            href="/signup"
            className="block text-sm font-semibold text-[#1bae69] border border-[#1bae69] rounded-full px-4 py-2 text-center hover:bg-[#1bae69] hover:text-white transition-all duration-200 mt-4"
          >
            Sign Up
          </Link>
          <Link
            href="/login"
            className="block text-sm font-semibold text-white bg-[#1bae69] rounded-full px-4 py-2 text-center hover:bg-[#169a5f] transition-all duration-200"
          >
            Log In
          </Link>
        </nav>
      </div>
    </header>
  );
}