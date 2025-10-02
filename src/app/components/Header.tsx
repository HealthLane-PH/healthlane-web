"use client";
import { useState, useEffect } from "react";
import {
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  BanknotesIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  ShoppingBagIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import { FaBus } from "react-icons/fa";
import Link from "next/link";

export default function Header() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileDropdown, setMobileDropdown] = useState<string | null>(null);

  let closeTimeout: NodeJS.Timeout;

  const openMenu = (menu: string) => {
    clearTimeout(closeTimeout);
    setOpenDropdown(menu);
  };

  const closeMenu = () => {
    closeTimeout = setTimeout(() => setOpenDropdown(null), 150);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`bg-white sticky top-0 z-50 transition-shadow duration-300 ${scrolled ? "shadow-sm" : "shadow-none"
        }`}
    >
      <div className="mx-auto max-w-7xl px-6 flex items-center justify-between h-16">
        {/* Hamburger Left */}
        <button
          className="md:hidden text-gray-700 hover:text-[#008F32]"
          onClick={() => setMobileOpen(true)}
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        {/* Logo Center */}
        <div className="flex items-center mx-auto md:mx-0">
          <img
            src="../../../images/bitspace-logo-green.png"
            alt="BitSpace Logo"
            className="h-10 w-auto"
          />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-8 items-center ml-auto">
          <Link href="/"
            className="text-sm font-medium text-gray-700 hover:text-[#008F32] transition-colors duration-300"
          >
            Home
          </Link>

          {/* Camps Dropdown */}
          <div className="relative">
            <button
              className="flex items-center text-sm font-medium text-gray-700 hover:text-primary"
              onMouseEnter={() => setOpenDropdown("camps")}
            >
              Camps
              <ChevronDownIcon
                className={`ml-1 h-4 w-4 transition-transform duration-200 ${openDropdown === "camps" ? "rotate-180" : ""
                  }`}
              />
            </button>

            {openDropdown === "camps" && (
              <div
                className="absolute left-0 top-full mt-2 w-[500px] grid grid-cols-2 rounded-lg bg-white shadow-lg ring-1 ring-black/5 z-50 animate-fadeIn"
                onMouseEnter={() => setOpenDropdown("camps")}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <div className="p-6">
                  <h3 className="flex items-center text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">
                    <WrenchScrewdriverIcon className="h-4 w-4 mr-1 text-gray-400" />
                    Programs
                  </h3>
                  <ul className="space-y-1.5">
                    {[
                      { name: "Day Off Camp", slug: "/camps/day-off" },
                      { name: "Summer Camp", slug: "/camps/summer-camp" },
                      { name: "Thanksgiving Camp", slug: "/camps/thanksgiving-camp" },
                      { name: "Winter Break Camp", slug: "/camps/winter-break" },
                      { name: "Spring Break Camp", slug: "/camps/spring-break" },
                      { name: "Open Shop", slug: "/camps/open-shop" },
                      { name: "Holiday All-Ages Events", slug: "/camps/holiday" },
                    ].map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.slug}
                          className="block py-2 px-2 text-sm text-gray-800 hover:text-primary hover:bg-gray-100 rounded-md transition-colors duration-200"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 bg-gray-50">
                  <h3 className="flex items-center text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">
                    <ShoppingBagIcon className="h-4 w-4 mr-1 text-gray-400" />
                    Shop
                  </h3>
                  <ul className="space-y-1.5">
                    {[
                      { name: "Store", slug: "/store" },
                      { name: "Gift Certificates", slug: "/gift-certificates" },
                    ].map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.slug}
                          className="block py-2 text-sm text-gray-800 hover:text-primary hover:bg-gray-100 rounded-md transition-colors duration-200"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/design-build"
            className="text-sm font-medium text-gray-700 hover:text-[#008F32] transition-colors duration-300"
          >
            Design & Build
          </Link>

          {/* Educator Programs Dropdown */}
          <div className="relative">
            <button
              className="flex items-center text-sm font-medium text-gray-700 hover:text-primary"
              onMouseEnter={() => setOpenDropdown("educators")}
            >
              Educator Programs
              <ChevronDownIcon
                className={`ml-1 h-4 w-4 transition-transform duration-200 ${openDropdown === "educators" ? "rotate-180" : ""
                  }`}
              />
            </button>

            {openDropdown === "educators" && (
              <div
                className="absolute left-0 top-full mt-2 w-[360px] rounded-lg bg-white shadow-lg ring-1 ring-black/5 p-6 z-50 animate-fadeIn"
                onMouseEnter={() => setOpenDropdown("educators")}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <ul className="space-y-2">
                  {[
                    {
                      name: "Field Trips",
                      desc: "Bring your students to BitSPace for an immersive STEAM experience.",
                      slug: "/field-trips",
                      icon: FaBus,
                    },
                    {
                      name: "Income Generator",
                      desc: "Earn extra income while supporting your professional growth.",
                      slug: "/income-generator",
                      icon: BanknotesIcon,
                    },
                    {
                      name: "Professional Development",
                      desc: "Run a successful STEM or STEAM program for grades 3 to 8.",
                      slug: "/pd-courses",
                      icon: ClipboardDocumentCheckIcon,
                    },
                    {
                      name: "Curriculum",
                      desc: "Your one-stop resource for all things maker ed in one convenient platform!",
                      slug: "/curriculum",
                      icon: BookOpenIcon,
                    },
                  ].map((item) => (

                    <li
                      key={item.name}
                      className="flex items-start space-x-3 p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
                    >
                      <Link
                        href={item.slug}
                        className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-800 hover:text-[#008F32] transition-colors duration-200">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <Link
            href="/about"
            className="text-sm font-medium text-gray-700 hover:text-[#008F32] transition-colors duration-300"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium text-gray-700 hover:text-[#008F32] transition-colors duration-300"
          >
            Contact
          </Link>
        </nav>
      </div>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-gray-200">
          <img
            src="../../../images/bitspace-logo-green.png"
            alt="BitSpace Logo"
            className="h-8 w-auto"
          />
          <button
            className="text-gray-700 hover:text-[#008F32]"
            onClick={() => setMobileOpen(false)}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <nav className="px-6 py-4 space-y-1">
          <Link
            href="/"
            className="block text-sm font-medium text-gray-700 hover:text-[#008F32] py-3 border-b border-gray-100"
          >
            Home
          </Link>

          {/* Mobile expandable Camps */}
          <div className="border-b border-gray-100">
            <button
              className="flex justify-between w-full text-sm font-medium text-gray-700 hover:text-[#008F32] py-3"
              onClick={() =>
                setMobileDropdown(mobileDropdown === "camps" ? null : "camps")
              }
            >
              Camps
              <ChevronDownIcon
                className={`ml-2 h-4 w-4 transition-transform ${mobileDropdown === "camps" ? "rotate-180" : ""
                  }`}
              />
            </button>
            {mobileDropdown === "camps" && (
              <ul className="ml-3 mb-2 space-y-1">
                {[
                  { name: "Day Off Camp", slug: "/camps/day-off" },
                  { name: "Summer Camp", slug: "/camps/summer-camp" },
                  { name: "Thanksgiving Camp", slug: "/camps/thanksgiving-camp" },
                  { name: "Winter Break Camp", slug: "/camps/winter-break" },
                  { name: "Spring Break Camp", slug: "/camps/spring-break" },
                  { name: "Open Shop", slug: "/camps/open-shop" },
                  { name: "Holiday All-Ages Events", slug: "/camps/holiday" },
                ].map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.slug}
                      className="block text-sm text-gray-600 hover:text-[#008F32] py-1.5"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link
            href="/design-build"
            className="block text-sm font-medium text-gray-700 hover:text-[#008F32] py-3 border-b border-gray-100"
          >
            Design & Build
          </Link>

          {/* Mobile expandable Educator Programs */}
          <div className="border-b border-gray-100">
            <button
              className="flex justify-between w-full text-sm font-medium text-gray-700 hover:text-[#008F32] py-3"
              onClick={() =>
                setMobileDropdown(
                  mobileDropdown === "educators" ? null : "educators"
                )
              }
            >
              Educator Programs
              <ChevronDownIcon
                className={`ml-2 h-4 w-4 transition-transform ${mobileDropdown === "educators" ? "rotate-180" : ""
                  }`}
              />
            </button>
            {mobileDropdown === "educators" && (
              <ul className="ml-3 mb-2 space-y-1">
                {[
                  { name: "Field Trips", slug: "/field-trips" },
                  { name: "Income Generator", slug: "/income-generator" },
                  { name: "Professional Development", slug: "/pd-courses" },
                  { name: "Curriculum", slug: "/curriculum" },
                ].map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.slug}
                      className="block text-sm text-gray-600 hover:text-[#008F32] py-1.5"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link
            href="/about"
            className="block text-sm font-medium text-gray-700 hover:text-[#008F32] py-3 border-b border-gray-100"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="block text-sm font-medium text-gray-700 hover:text-[#008F32] py-3"
          >
            Contact
          </Link>
        </nav>
      </div>

    </header>
  );
}