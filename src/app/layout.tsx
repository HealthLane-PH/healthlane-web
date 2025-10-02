import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap", // makes sure it swaps in quickly
});

export const metadata: Metadata = {
  title: "BitSpace Camps",
  description: "Register for STEAM Camps at BitSpace",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body className="font-sans bg-white text-grayMid">
        <AuthProvider>
          <Header />
          <main className="pt-[64px]">
            <div className="mx-auto max-w-7xl px-6">
              {children}
            </div>
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}