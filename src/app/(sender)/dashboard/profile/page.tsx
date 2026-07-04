"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Phone, Gift, Wallet, LogOut, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  status: string;
  referralCode: string;
  wallet: {
    balance: number;
    currency: string;
    status: string;
  } | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/v1/auth/me");
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to load profile details.");
          setLoading(false);
          return;
        }

        setProfile(data.user);
      } catch (err) {
        console.error("Profile load error:", err);
        setError("Network connection error.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      const response = await fetch("/api/v1/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        // Clear caches and redirect to landing page
        router.push("/login");
        router.refresh();
      } else {
        alert("Logout failed. Please try again.");
        setLogoutLoading(false);
      }
    } catch (err) {
      console.error("Logout error:", err);
      setLogoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center space-y-3 py-32">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground">Loading your profile settings...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center space-y-4 py-32 text-center px-4">
        <p className="text-sm text-destructive font-semibold">{error || "Failed to authenticate session."}</p>
        <Link href="/login" className="inline-flex h-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 px-5 text-xs text-white hover:bg-white/10">
          Sign In again
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      
      {/* Back & header */}
      <div className="flex items-center space-x-3 border-b border-white/5 pb-6">
        <Link href="/dashboard" className="rounded-xl border border-white/5 bg-white/5 p-2 text-muted-foreground hover:text-white transition-smooth">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Your Account Settings</h1>
          <p className="text-xs text-muted-foreground">Manage your credentials, referral rewards, and security preferences.</p>
        </div>
      </div>

      {/* Main card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Card details */}
        <div className="md:col-span-2 glass-panel p-8 rounded-3xl border border-white/5 space-y-6">
          
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white font-extrabold text-lg shadow-lg">
              {profile.fullName.substring(0,1).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">{profile.fullName}</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-0.5">{profile.role.replace("_", " ")} &bull; {profile.status}</p>
            </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* Details list */}
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground/60" />
                <span>Email Address</span>
              </span>
              <span className="font-semibold text-white">{profile.email}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground/60" />
                <span>Phone Number</span>
              </span>
              <span className="font-semibold text-white">{profile.phoneNumber}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground flex items-center space-x-2">
                <Gift className="h-4 w-4 text-muted-foreground/60" />
                <span>Your Referral Code</span>
              </span>
              <span className="font-semibold text-primary select-all">{profile.referralCode}</span>
            </div>
          </div>

        </div>

        {/* Wallet & Quick Payout Card */}
        <div className="md:col-span-1 space-y-6">
          
          <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Wallet Credit</p>
              <p className="text-2xl font-extrabold text-white">
                {profile.wallet ? `₦${profile.wallet.balance.toLocaleString()}` : "₦0"}
              </p>
            </div>
            
            <div className="h-px bg-white/5" />

            <button
              onClick={handleLogout}
              disabled={logoutLoading}
              className="w-full inline-flex h-10 items-center justify-center rounded-xl bg-destructive/10 border border-destructive/20 text-xs font-semibold text-destructive hover:bg-destructive/15 transition-smooth disabled:opacity-50 cursor-pointer"
            >
              {logoutLoading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  <span>Signing Out...</span>
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </>
              )}
            </button>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-[10px] text-muted-foreground leading-normal flex items-start space-x-2">
            <ShieldCheck className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <span>
              Your account sessions are secured using JWT edge-cryptography tokens. Keep your login passwords confidential.
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
