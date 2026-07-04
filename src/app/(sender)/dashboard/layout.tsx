"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, ClipboardList, Wallet, CreditCard, 
  Award, Heart, User, LogOut, Plus, Loader2 
} from "lucide-react";

interface UserInfo {
  fullName: string;
  email: string;
  role: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch("/api/v1/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error("Dashboard check error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [router]);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/v1/auth/logout", { method: "POST" });
      if (response.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Loyalty Tests", href: "/dashboard/tests", icon: ClipboardList },
    { name: "Wallet Balance", href: "/dashboard/wallet", icon: Wallet },
    { name: "Payment Billing", href: "/dashboard/payments", icon: CreditCard },
    { name: "Carrier Payouts", href: "/dashboard/rewards", icon: Award },
    { name: "Affiliate Referrals", href: "/dashboard/referrals", icon: Heart },
    { name: "Account Profile", href: "/dashboard/profile", icon: User },
  ];

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center space-y-3 py-32">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground">Loading dashboard environment...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-background relative">
      
      {/* Sidebar - Desktop only */}
      <aside className="hidden md:flex md:w-64 flex-col fixed inset-y-16 left-0 border-r border-white/5 bg-background/50 backdrop-blur-md z-30">
        
        {/* Creation Wizard CTA */}
        <div className="p-4">
          <Link
            href="/dashboard/tests/create"
            className="glow-primary w-full inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary text-xs font-bold uppercase tracking-wider text-white transition-smooth"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            <span>Create Loyalty Test</span>
          </Link>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold transition-smooth ${
                  isActive 
                    ? "bg-gradient-to-r from-primary/15 to-secondary/5 text-primary border-l-2 border-primary" 
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card info & Logout */}
        <div className="p-4 border-t border-white/5 bg-black/10">
          <div className="flex items-center space-x-3 mb-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-white font-bold text-xs">
              {user.fullName.substring(0,1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate leading-none">{user.fullName}</p>
              <p className="text-[9px] text-muted-foreground truncate mt-1 leading-none">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full inline-flex h-9 items-center justify-center rounded-lg bg-destructive/10 border border-destructive/20 text-xs font-semibold text-destructive hover:bg-destructive/15 transition-smooth cursor-pointer"
          >
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

      </aside>

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col md:pl-64 pb-20 md:pb-0">
        <div className="flex-grow">
          {children}
        </div>
      </div>

      {/* Bottom Nav Bar - Mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-white/5 bg-background/90 backdrop-blur-lg flex items-center justify-around px-2 z-40">
        
        {/* Loop first 3 items */}
        {navItems.slice(0, 3).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center space-y-1 py-1 px-3 rounded-xl transition-smooth ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[9px] font-bold">{item.name.split(" ")[0]}</span>
            </Link>
          );
        })}

        {/* Center Floating Plus Action */}
        <Link
          href="/dashboard/tests/create"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-white shadow-lg -translate-y-3 border-4 border-background"
          aria-label="Create test"
        >
          <Plus className="h-5 w-5" />
        </Link>

        {/* Loop next 2 items */}
        {navItems.slice(5, 7).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center space-y-1 py-1 px-3 rounded-xl transition-smooth ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[9px] font-bold">{item.name.split(" ")[1]}</span>
            </Link>
          );
        })}

      </nav>

    </div>
  );
}
