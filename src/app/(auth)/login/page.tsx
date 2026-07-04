"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Heart, Lock, Mail, Loader2, AlertCircle } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("from") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errorParam = searchParams.get("error");
  const getWarningMessage = () => {
    if (errorParam === "session_expired") return "Your session has expired. Please sign in again.";
    if (errorParam === "account_disabled") return "Your account has been deactivated. Contact support.";
    if (errorParam === "unauthorized") return "You do not have permissions to access that page.";
    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed. Please try again.");
        setLoading(false);
        return;
      }

      const role = data.user.role;
      
      if (redirectPath) {
        router.push(redirectPath);
      } else if (role === "SUPER_ADMIN" || role === "FINANCE_ADMIN" || role === "SUPPORT_ADMIN" || role === "CONTENT_ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }

    } catch (err) {
      console.error("Login client error:", err);
      setError("A connection error occurred. Check your internet connection.");
      setLoading(false);
    }
  };

  const warningMsg = getWarningMessage();

  return (
    <div className="w-full max-w-md space-y-6 glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 h-16 w-16 bg-primary/10 rounded-bl-full -z-10" />
      
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white">
          <Heart className="h-5 w-5 fill-current" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Sign in to your account</h2>
        <p className="text-xs text-muted-foreground">
          Or{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            create a new account
          </Link>
        </p>
      </div>

      {/* Warning messages */}
      {warningMsg && !error && (
        <div className="rounded-xl bg-secondary/15 border border-secondary/20 p-3.5 text-xs text-secondary-foreground/90 flex items-start space-x-2">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 text-secondary" />
          <span>{warningMsg}</span>
        </div>
      )}

      {/* Error messages */}
      {error && (
        <div className="rounded-xl bg-destructive/15 border border-destructive/20 p-3.5 text-xs text-destructive-foreground/90 flex items-start space-x-2">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 text-destructive" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form className="space-y-4" onSubmit={handleLogin}>
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={loading}
              className="w-full bg-white/5 border border-white/5 focus:border-primary/55 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-muted-foreground/45 transition-smooth focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Password
            </label>
            <Link href="/forgot-password" className="text-[10px] text-primary hover:underline font-medium">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="w-full bg-white/5 border border-white/5 focus:border-primary/55 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-muted-foreground/45 transition-smooth focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-50"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="glow-primary w-full inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary text-xs font-semibold uppercase tracking-wider text-white transition-smooth hover:opacity-95 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Signing In...</span>
            </>
          ) : (
            <span>Sign In</span>
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
  );
}

export default function Login() {
  return (
    <div className="flex flex-1 items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-muted-foreground text-xs flex items-center"><Loader2 className="animate-spin mr-2 h-4 w-4" />Loading form...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
