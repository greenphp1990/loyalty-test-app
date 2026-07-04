"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Shield, Menu, X, LogOut, User } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; fullName: string; role: string } | null>(null);

  // Fetch session user on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/v1/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      }
    };
    checkSession();
  }, []);

  const handleSignOut = async () => {
    try {
      const response = await fetch("/api/v1/auth/logout", {
        method: "POST",
      });
      if (response.ok) {
        setUser(null);
        setMobileMenuOpen(false);
        router.push("/login");
        router.refresh();
      }
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const isAdmin = user && (user.role === "SUPER_ADMIN" || user.role === "FINANCE_ADMIN" || user.role === "SUPPORT_ADMIN" || user.role === "CONTENT_ADMIN");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg group-hover:scale-105 transition-smooth">
            <Heart className="h-5 w-5 fill-current" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-primary/80 bg-clip-text text-transparent group-hover:opacity-90 transition-smooth">
            Loyalty Test
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-muted-foreground">
          <Link href="/how-it-works" className="hover:text-white transition-smooth">
            How It Works
          </Link>
          <Link href="/pricing" className="hover:text-white transition-smooth">
            Pricing
          </Link>
          <Link href="/faq" className="hover:text-white transition-smooth">
            FAQ
          </Link>
          {user && (
            <Link href={isAdmin ? "/admin/dashboard" : "/dashboard"} className="text-primary hover:text-white transition-smooth font-semibold">
              Dashboard
            </Link>
          )}
        </nav>

        {/* CTA / Session Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-white transition-smooth border border-white/10 rounded-lg px-2.5 py-1.5 bg-white/5"
                >
                  <Shield className="h-3.5 w-3.5" />
                  <span>Admin Panel</span>
                </Link>
              )}
              <Link
                href="/dashboard/profile"
                className="flex items-center space-x-1.5 text-sm font-medium text-muted-foreground hover:text-white transition-smooth"
              >
                <User className="h-4 w-4 text-primary" />
                <span>{user.fullName}</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-muted-foreground hover:text-white hover:bg-white/10 transition-smooth cursor-pointer"
              >
                <LogOut className="mr-1.5 h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/admin/dashboard"
                className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-white transition-smooth border border-white/10 rounded-lg px-2.5 py-1.5 bg-white/5"
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Admin Portal</span>
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium hover:text-white transition-smooth"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="glow-primary inline-flex h-9 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary px-4 text-sm font-semibold text-white transition-smooth hover:opacity-95"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center space-x-3">
          {!user && (
            <Link
              href="/register"
              className="inline-flex h-8 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-secondary px-3 text-xs font-semibold text-white"
            >
              Start
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/5 hover:text-white"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/5 bg-background px-4 py-4 space-y-3">
          <nav className="flex flex-col space-y-3 text-sm font-medium text-muted-foreground">
            <Link
              href="/how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white py-1"
            >
              How It Works
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white py-1"
            >
              Pricing
            </Link>
            <Link
              href="/faq"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white py-1"
            >
              FAQ
            </Link>
            {user && (
              <Link
                href={isAdmin ? "/admin/dashboard" : "/dashboard"}
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-white py-1 font-semibold text-primary"
              >
                Dashboard
              </Link>
            )}
            
            <div className="h-px bg-white/5 my-2" />

            {user ? (
              <>
                <Link
                  href="/dashboard/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 hover:text-white py-1"
                >
                  <User className="h-4 w-4 text-primary" />
                  <span>{user.fullName}</span>
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 hover:text-white py-1"
                  >
                    <Shield className="h-4 w-4 text-secondary" />
                    <span>Admin Portal</span>
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 text-destructive hover:text-white py-1 w-full text-left cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-white py-1"
                >
                  Sign In
                </Link>
                <Link
                  href="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 hover:text-white py-1"
                >
                  <Shield className="h-4 w-4" />
                  <span>Admin Portal</span>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
