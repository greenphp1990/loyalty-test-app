import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Loyalty Test | Anonymous Relationship Questions & Locked Gift Rewards",
  description: "Anonymously test your partner's connection with safe relationship questions and locked gifts like airtime, data, or cash. Safe, private, and fun.",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "Loyalty Test | Anonymous Relationship Questions & Locked Gifts",
    description: "Anonymously test your partner's connection with safe relationship questions and locked gifts like airtime, data, or cash.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans selection:bg-primary/20 selection:text-white">
        {/* Background decorative glows */}
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-[40%] right-[-15%] h-[600px] w-[600px] rounded-full bg-secondary/5 blur-[150px] pointer-events-none -z-10" />
        
        <Header />
        <main className="flex-grow flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
