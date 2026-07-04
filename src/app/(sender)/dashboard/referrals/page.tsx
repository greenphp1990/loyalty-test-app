"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Heart, Loader2, AlertCircle, Copy, Check, Users, Gift, RefreshCw, Calendar } from "lucide-react";

interface ReferredUser {
  fullName: string;
  email: string;
  createdAt: string;
}

interface Referral {
  id: string;
  commissionAmount: number;
  status: string;
  createdAt: string;
  referredUser: ReferredUser;
}

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchReferralData = async () => {
      try {
        setLoading(true);
        // Get profile (includes referralCode)
        const profileRes = await fetch("/api/v1/auth/me");
        if (!profileRes.ok) throw new Error("Failed to load user profile.");
        const profileData = await profileRes.json();
        setReferralCode(profileData.user.referralCode);

        // Get referrals logs
        const referralsRes = await fetch("/api/v1/sender/referrals");
        if (!referralsRes.ok) throw new Error("Failed to load referrals history.");
        const referralsData = await referralsRes.json();
        setReferrals(referralsData.referrals || []);
      } catch (err: any) {
        console.error("Fetch referrals error:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchReferralData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleCopyLink = () => {
    if (!referralCode) return;
    const origin = window.location.origin;
    const referralUrl = `${origin}/register?ref=${referralCode}`;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading referrals tracker...</p>
      </div>
    );
  }

  const paidReferrals = referrals.filter((r) => r.status === "PAID");
  const totalPaidCommissions = paidReferrals.reduce((sum, r) => sum + r.commissionAmount, 0);
  const pendingReferrals = referrals.filter((r) => r.status === "PENDING");
  const totalPendingCommissions = pendingReferrals.reduce((sum, r) => sum + r.commissionAmount, 0);

  const shareUrl = referralCode ? `${window.location.origin}/register?ref=${referralCode}` : "";

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-white/5 pb-6">
        <Link href="/dashboard" className="rounded-xl border border-white/5 bg-white/5 p-2 text-muted-foreground hover:text-white transition-smooth">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <span>Affiliate Referrals</span>
          </h1>
          <p className="text-xs text-muted-foreground">Share your referral link, invite new senders, and earn commissions on their first funded test.</p>
        </div>
      </div>

      {error ? (
        <div className="glass-panel p-8 rounded-3xl border border-destructive/20 text-center space-y-4 max-w-md mx-auto">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <p className="text-xs text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full h-10 rounded-xl bg-white/5 border border-white/10 text-xs text-white hover:bg-white/10"
          >
            Retry Loading
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Link Sharing & Stats */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Referral Sharing Panel */}
            <div className="glass-panel p-6 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-transparent to-secondary/5 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
                <Gift className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Earn ₦500 per Referral</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Earn a cash commission of ₦500 credited straight to your wallet when a new sender registers using your referral link and successfully funds their first loyalty test.
                </p>
              </div>

              {/* Referral Link Box */}
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Your Referral Link</label>
                <div className="flex bg-black/35 rounded-xl border border-white/5 overflow-hidden">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 bg-transparent px-3 py-2 text-[10px] text-white focus:outline-none select-all font-mono"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="bg-white/5 border-l border-white/5 px-3 py-2 hover:bg-white/10 transition-smooth flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    {copied ? (
                      <Check className="h-4.5 w-4.5 text-accent" />
                    ) : (
                      <Copy className="h-4.5 w-4.5 text-white" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
              {/* Total Referrals */}
              <div className="glass-panel p-4 rounded-2xl border border-white/5 flex items-center space-x-3.5">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-muted-foreground">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Total Invited</p>
                  <p className="text-lg font-bold text-white mt-0.5">{referrals.length} Senders</p>
                </div>
              </div>

              {/* Paid Commission */}
              <div className="glass-panel p-4 rounded-2xl border border-white/5 flex items-center space-x-3.5">
                <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                  <Heart className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Commissions Paid</p>
                  <p className="text-lg font-bold text-white mt-0.5">{formatCurrency(totalPaidCommissions)}</p>
                </div>
              </div>

              {/* Pending Commission */}
              <div className="glass-panel p-4 rounded-2xl border border-white/5 flex items-center space-x-3.5">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
                  <Gift className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Commissions Pending</p>
                  <p className="text-lg font-bold text-white mt-0.5">{formatCurrency(totalPendingCommissions)}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column - Invited Users List */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Referrals list */}
            <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span>Your Invited Network</span>
                </h3>
              </div>

              {referrals.length === 0 ? (
                <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
                  <Users className="h-8 w-8 mx-auto text-muted-foreground/30" />
                  <p className="font-bold text-white">No Referrals Registered Yet</p>
                  <p className="text-[10px]">Invite friends to Loyalty Test. When they register and fund a test, you'll earn money.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5 text-xs text-muted-foreground">
                  {referrals.map((ref) => (
                    <div key={ref.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 hover:bg-white/5 transition-smooth gap-4">
                      <div>
                        <p className="font-bold text-white">{ref.referredUser.fullName || "Referred User"}</p>
                        <p className="text-[10px] text-muted-foreground/75 mt-0.5">{ref.referredUser.email}</p>
                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground/55 mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>Joined: {formatDate(ref.referredUser.createdAt)}</span>
                        </div>
                      </div>
                      
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t border-white/5 sm:border-0 pt-2 sm:pt-0">
                        <p className="text-[10px] text-muted-foreground sm:text-right">Commission Reward</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-bold text-white text-xs">{formatCurrency(ref.commissionAmount)}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-bold border uppercase ${
                            ref.status === "PAID" ? "bg-accent/10 border-accent/20 text-accent" :
                            ref.status === "PENDING" ? "bg-secondary/10 border-secondary/20 text-secondary" :
                            "bg-destructive/10 border-destructive/20 text-destructive"
                          }`}>{ref.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
