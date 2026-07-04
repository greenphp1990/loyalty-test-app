import React from "react";
import Link from "next/link";
import { Heart, ShieldCheck, Lock, EyeOff } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black/40 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
          
          {/* Brand Info */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-white">
                <Heart className="h-4 w-4 fill-current" />
              </div>
              <span className="text-lg font-bold text-white">Loyalty Test</span>
            </Link>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
              Verify relationship trust anonymously and reward connection securely. 
              Built with zero-knowledge concepts to protect privacy and prevent abuse.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <span className="inline-flex items-center space-x-1 rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-medium text-muted-foreground border border-white/5">
                <Lock className="h-3 w-3 text-primary" />
                <span>Encrypted Answers</span>
              </span>
              <span className="inline-flex items-center space-x-1 rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-medium text-muted-foreground border border-white/5">
                <EyeOff className="h-3 w-3 text-secondary" />
                <span>100% Anonymous</span>
              </span>
              <span className="inline-flex items-center space-x-1 rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-medium text-muted-foreground border border-white/5">
                <ShieldCheck className="h-3 w-3 text-accent" />
                <span>Anti-Abuse Filters</span>
              </span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Product</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/how-it-works" className="hover:text-white transition-smooth">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-smooth">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-smooth">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Legal</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/privacy" className="hover:text-white transition-smooth">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-smooth">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/faq#abuse" className="hover:text-white transition-smooth">
                  Report Abuse
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-muted-foreground">
            &copy; {new Date().getFullYear()} Loyalty Test. All rights reserved. Focused on the Nigerian market.
          </p>
          <p className="text-[10px] text-muted-foreground/60 leading-normal max-w-md text-center md:text-right">
            Disclaimer: This platform is intended as a fun, mutual gift-giving experience. 
            We strictly prohibit blackmail, stalking, or harassment. All custom questions are safety-screened.
          </p>
        </div>
      </div>
    </footer>
  );
}
