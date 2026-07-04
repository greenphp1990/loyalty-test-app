"use client";

import React from "react";
import Link from "next/link";
import { Lock, Heart } from "lucide-react";

export default function ResetPassword() {
  return (
    <div className="flex flex-1 items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
        
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white">
            <Heart className="h-5 w-5 fill-current" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Choose a new password</h2>
          <p className="text-xs text-muted-foreground">
            Please enter your new password below to complete the reset.
          </p>
        </div>

        {/* Form Placeholder */}
        <form className="space-y-4 pt-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/5 focus:border-primary/55 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-muted-foreground/45 transition-smooth focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/5 focus:border-primary/55 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-muted-foreground/45 transition-smooth focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
          </div>

          <button
            type="submit"
            className="glow-primary w-full inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary text-xs font-semibold uppercase tracking-wider text-white transition-smooth hover:opacity-95"
          >
            Update Password
          </button>
        </form>

        <div className="h-px bg-white/5 my-4" />

        <div className="text-center">
          <Link href="/login" className="text-[10px] text-muted-foreground hover:text-white transition-smooth">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
