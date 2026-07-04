"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Wallet, History, Heart, CheckCircle, Clock, XCircle, ArrowRight, Loader2, Sparkles } from "lucide-react";

interface Stats {
  totalTests: number;
  pendingTests: number;
  completedTests: number;
  passedTests: number;
  failedTests: number;
  walletBalance: number;
  referralEarnings: number;
}

interface LoyaltyTest {
  id: string;
  receiverName: string;
  questionText: string;
  giftType: string;
  giftAmount: number;
  testStatus: string;
  resultStatus: string | null;
  createdAt: string;
  testToken: string;
}

export default function SenderDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentTests, setRecentTests] = useState<LoyaltyTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch stats
        const statsRes = await fetch("/api/v1/sender/stats");
        if (!statsRes.ok) throw new Error("Failed to load dashboard statistics.");
        const statsData = await statsRes.json();

        // Fetch tests
        const testsRes = await fetch("/api/v1/sender/tests");
        if (!testsRes.ok) throw new Error("Failed to load recent loyalty tests.");
        const testsData = await testsRes.json();

        setStats(statsData.stats);
        setRecentTests(testsData.tests || []);
      } catch (err: any) {
        console.error("Dashboard fetch error:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Assembling dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="glass-panel p-8 rounded-3xl border border-destructive/20 text-center space-y-4 max-w-md mx-auto">
          <XCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold text-white">Failed to Load Dashboard</h2>
          <p className="text-xs text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full h-11 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white hover:bg-white/10 transition-smooth"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const activeTests = recentTests.filter((t) => t.testStatus === "ACTIVE");
  const displayTests = recentTests.slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Dashboard</span>
            <Sparkles className="h-5 w-5 text-secondary animate-pulse" />
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Manage relationship verification tests, rewards, and payouts.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/wallet"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-semibold text-white hover:bg-white/10 transition-smooth"
          >
            <Wallet className="mr-2 h-4 w-4 text-secondary" />
            <span>Fund Wallet</span>
          </Link>
          <Link
            href="/dashboard/tests/create"
            className="glow-primary inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary px-4 text-xs font-semibold text-white transition-smooth"
          >
            <Plus className="mr-1 h-4 w-4" />
            <span>Create Test</span>
          </Link>
        </div>
      </div>

      {/* Grid of Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Wallet */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-2 hover:border-secondary/30 transition-smooth">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Wallet Balance</p>
          <p className="text-3xl font-extrabold text-white">{formatCurrency(stats?.walletBalance || 0)}</p>
          <p className="text-[10px] text-accent font-medium">Ready for reward payouts</p>
        </div>

        {/* Active Tests */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-2 hover:border-primary/30 transition-smooth">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Active Tests</p>
          <p className="text-3xl font-extrabold text-white">{stats?.pendingTests || 0}</p>
          <p className="text-[10px] text-secondary flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>Awaiting replies</span>
          </p>
        </div>

        {/* Completed Tests */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-2 hover:border-white/20 transition-smooth">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Completed</p>
          <p className="text-3xl font-extrabold text-white">{stats?.completedTests || 0}</p>
          <p className="text-[10px] text-primary flex items-center space-x-1">
            <CheckCircle className="h-3 w-3" />
            <span>{stats?.passedTests || 0} Passed, {stats?.failedTests || 0} Failed</span>
          </p>
        </div>

        {/* Referral Earnings */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-2 hover:border-accent/30 transition-smooth">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Referral Commissions</p>
          <p className="text-3xl font-extrabold text-white">{formatCurrency(stats?.referralEarnings || 0)}</p>
          <p className="text-[10px] text-accent flex items-center space-x-1">
            <Heart className="h-3 w-3" />
            <span>Affiliate bonuses paid</span>
          </p>
        </div>

      </div>

      {/* Recent Activity Table */}
      <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <History className="h-4.5 w-4.5 text-primary" />
            <span>Recent Loyalty Tests</span>
          </h2>
          {recentTests.length > 5 && (
            <Link
              href="/dashboard/tests"
              className="text-[11px] text-primary hover:text-primary-light font-semibold flex items-center gap-1 group"
            >
              <span>View All</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
        
        {displayTests.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-muted-foreground">
              <History className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-white">No Loyalty Tests Yet</p>
              <p className="text-[10px] text-muted-foreground max-w-xs mx-auto">Create a test to check a partner's responsiveness and offer airtime/data rewards.</p>
            </div>
            <Link
              href="/dashboard/tests/create"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-white hover:bg-primary-light transition-smooth"
            >
              Start First Test
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 uppercase tracking-wider text-muted-foreground text-[10px] font-semibold">
                <tr>
                  <th className="px-6 py-4">Receiver</th>
                  <th className="px-6 py-4">Question</th>
                  <th className="px-6 py-4">Reward Amount</th>
                  <th className="px-6 py-4">Date Created</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-muted-foreground">
                {displayTests.map((test) => (
                  <tr key={test.id} className="hover:bg-white/5 transition-smooth">
                    <td className="px-6 py-4 font-bold text-white">{test.receiverName}</td>
                    <td className="px-6 py-4 max-w-xs truncate">{test.questionText}</td>
                    <td className="px-6 py-4 font-medium">
                      {formatCurrency(test.giftAmount)} {test.giftType}
                    </td>
                    <td className="px-6 py-4">{formatDate(test.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-semibold border ${
                        test.testStatus === "COMPLETED" ? "bg-white/5 border-white/10 text-muted-foreground" :
                        test.testStatus === "ACTIVE" ? "bg-secondary/10 border-secondary/20 text-secondary" :
                        test.testStatus === "EXPIRED" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                        test.testStatus === "DECLINED" ? "bg-destructive/10 border-destructive/20 text-destructive" :
                        "bg-destructive/10 border-destructive/20 text-destructive"
                      }`}>
                        {test.testStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold">
                      {test.resultStatus ? (
                        <span className={
                          test.resultStatus === "PASSED" ? "text-accent" :
                          test.resultStatus === "PARTIAL_PASS" ? "text-amber-400" :
                          "text-destructive"
                        }>
                          {test.resultStatus}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
