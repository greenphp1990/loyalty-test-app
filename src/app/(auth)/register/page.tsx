"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, User, Mail, Phone, Gift, Loader2, AlertCircle, Lock } from "lucide-react";

export default function Register() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic client validation
    if (fullName.trim().length < 2) {
      setError("Please enter a valid full name.");
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phoneNumber,
          password,
          referralCode: referralCode || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed. Try again.");
        setLoading(false);
        return;
      }

      // Automatically redirects to the sender dashboard on success
      router.push("/dashboard");

    } catch (err) {
      console.error("Register client error:", err);
      setError("A connection error occurred. Check your network.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-16 w-16 bg-secondary/10 rounded-bl-full -z-10" />

        {/* Title */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white">
            <Heart className="h-5 w-5 fill-current" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Create your account</h2>
          <p className="text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-secondary hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        {/* Error messages */}
        {error && (
          <div className="rounded-xl bg-destructive/15 border border-destructive/20 p-3.5 text-xs text-destructive-foreground/90 flex items-start space-x-2">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 text-destructive" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form className="space-y-4" onSubmit={handleRegister}>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Abel Abel"
                disabled={loading}
                className="w-full bg-white/5 border border-white/5 focus:border-secondary/55 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-muted-foreground/45 transition-smooth focus:outline-none focus:ring-1 focus:ring-secondary/40 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                className="w-full bg-white/5 border border-white/5 focus:border-secondary/55 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-muted-foreground/45 transition-smooth focus:outline-none focus:ring-1 focus:ring-secondary/40 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="08012345678"
                disabled={loading}
                className="w-full bg-white/5 border border-white/5 focus:border-secondary/55 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-muted-foreground/45 transition-smooth focus:outline-none focus:ring-1 focus:ring-secondary/40 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Password (Min 8 characters)
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full bg-white/5 border border-white/5 focus:border-secondary/55 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-muted-foreground/45 transition-smooth focus:outline-none focus:ring-1 focus:ring-secondary/40 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Referral Code (Optional)
            </label>
            <div className="relative">
              <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="Enter referral code"
                disabled={loading}
                className="w-full bg-white/5 border border-white/5 focus:border-secondary/55 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-muted-foreground/45 transition-smooth focus:outline-none focus:ring-1 focus:ring-secondary/40 disabled:opacity-50"
              />
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground leading-normal">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="text-secondary hover:underline">
              Terms & Conditions
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-secondary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>

          <button
            type="submit"
            disabled={loading}
            className="glow-primary w-full inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary text-xs font-semibold uppercase tracking-wider text-white transition-smooth hover:opacity-95 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Registering Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <div className="h-px bg-white/5 my-4" />

        <div className="text-center">
          <Link href="/" className="text-[10px] text-muted-foreground hover:text-white transition-smooth">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
