import Link from "next/link";
import { FaTiktok, FaFacebookF, FaInstagram } from "react-icons/fa";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="w-full bg-[#1B1B1B] text-gray-400 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-5 gap-10 items-start">

        {/* Logo / Address */}
        <div>
          <Image
            src="/images/healthlane-logo-white.png"
            alt="HealthLane Logo"
            width={200}
            height={86}
            className="h-12 w-auto mb-4"
          />
          <p className="text-xs leading-6">
            Naga City, Camarines Sur
          </p>
          {/* Social icons */}
          <div className="flex space-x-4 mt-4">
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#008F32] transition-colors"
            >
              <FaTiktok className="h-4 w-4" />
            </a>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#008F32] transition-colors"
            >
              <FaFacebookF className="h-4 w-4" />
            </a>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#008F32] transition-colors"
            >
              <FaInstagram className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Quick Links - only visible on desktop */}
        <div className="hidden md:block">
          <h3 className="text-white text-sm font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2 text-xs">
            <li><Link href="/camps/day-off" className="hover:text-[#008F32] transition-colors">Day Off Camp</Link></li>
            <li><Link href="/camps/summer-camp" className="hover:text-[#008F32] transition-colors">Summer Camp</Link></li>
            <li><Link href="/camps/thanksgiving-camp" className="hover:text-[#008F32] transition-colors">Thanksgiving Camp</Link></li>
            <li><Link href="/camps/winter-break" className="hover:text-[#008F32] transition-colors">Winter Break Camp</Link></li>
          </ul>
        </div>

        {/* Educator Links - only visible on desktop */}
        <div className="hidden md:block">
          <h3 className="text-white text-sm font-semibold mb-3">Educator Programs</h3>
          <ul className="space-y-2 text-xs">
            <li><Link href="/design-build" className="hover:text-[#008F32] transition-colors">Design & Build</Link></li>
            <li><Link href="/educators/field-trips" className="hover:text-[#008F32] transition-colors">Field Trips</Link></li>
            <li><Link href="/educators/income-generator" className="hover:text-[#008F32] transition-colors">Income Generator</Link></li>
            <li><Link href="/educators/pd" className="hover:text-[#008F32] transition-colors">PD</Link></li>
            <li><Link href="/educators/curriculum" className="hover:text-[#008F32] transition-colors">Curriculum</Link></li>
          </ul>
        </div>

        {/* Legal Column (always visible) */}
        <div>
          <h3 className="text-white text-sm font-semibold mb-3 hidden md:block">Legal</h3>
          <ul className="space-y-2 text-xs">
            <li><Link href="/privacy-policy" className="hover:text-[#008F32] transition-colors">Privacy Policy</Link></li>
            <li><Link href="/tos" className="hover:text-[#008F32] transition-colors">Terms of Service</Link></li>
          </ul>
          <p className="text-[11px] text-gray-500 mt-6">
            © {new Date().getFullYear()} BitSpace Chicago. All rights reserved.
          </p>
        </div>
      </div>
    </footer >
  );
};

export default Footer;
