"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Award, Loader2, AlertCircle, RefreshCw, Calendar, Phone, CheckCircle, Clock } from "lucide-react";

interface Reward {
  id: string;
  rewardType: string;
  network: string;
  amount: number;
  provider: string;
  providerReference: string | null;
  status: string;
  deliveredAt: string | null;
  createdAt: string;
  receiverPhone: string;
  test: {
    receiverName: string;
  };
}

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/v1/sender/rewards");
        if (!res.ok) throw new Error("Failed to load reward delivery logs.");
        const data = await res.json();
        setRewards(data.rewards || []);
      } catch (err: any) {
        console.error("Fetch rewards error:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchRewards();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Pending";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading reward delivery logs...</p>
      </div>
    );
  }

  const successRewards = rewards.filter((r) => r.status === "SUCCESSFUL");
  const totalPayoutValue = successRewards.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center space-x-3">
          <Link href="/dashboard" className="rounded-xl border border-white/5 bg-white/5 p-2 text-muted-foreground hover:text-white transition-smooth">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <span>Carrier Payouts</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Track mobile airtime and data reward fulfillment delivery status logs.</p>
          </div>
        </div>

        {/* Aggregated Total Card */}
        {rewards.length > 0 && (
          <div className="glass-panel px-4 py-2 rounded-xl border border-white/5 text-xs flex items-center gap-3">
            <div>
              <p className="text-muted-foreground text-[10px] uppercase font-semibold">Total Delivered</p>
              <p className="text-white font-extrabold text-sm">{formatCurrency(totalPayoutValue)}</p>
            </div>
            <span className="h-6 w-px bg-white/10" />
            <div>
              <p className="text-muted-foreground text-[10px] uppercase font-semibold">Count</p>
              <p className="text-white font-extrabold text-sm">{successRewards.length} Payouts</p>
            </div>
          </div>
        )}
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
      ) : rewards.length === 0 ? (
        <div className="glass-panel p-16 rounded-3xl border border-white/5 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-muted-foreground">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">No Reward Deliveries Yet</h3>
            <p className="text-xs text-muted-foreground mt-1">
              When a receiver completes your loyalty test and passes, the airtime or data reward will automatically be dispatched, and the fulfillment logs will be shown here.
            </p>
          </div>
          <Link
            href="/dashboard/tests/create"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-white hover:bg-primary-light transition-smooth"
          >
            Create Loyalty Test Link
          </Link>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 text-primary" />
              <span>Telco Reward Dispatch Logs</span>
            </h2>
            <span className="text-[10px] text-muted-foreground">{rewards.length} rewards total</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 uppercase tracking-wider text-muted-foreground text-[10px] font-semibold">
                <tr>
                  <th className="px-6 py-4">Receiver</th>
                  <th className="px-6 py-4">Phone Number</th>
                  <th className="px-6 py-4">Reward Type</th>
                  <th className="px-6 py-4">Telco Network</th>
                  <th className="px-6 py-4">Provider Reference</th>
                  <th className="px-6 py-4">Delivered At</th>
                  <th className="px-6 py-4">Fulfillment Status</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-muted-foreground">
                {rewards.map((r) => (
                  <tr key={r.id} className="hover:bg-white/5 transition-smooth">
                    <td className="px-6 py-4 font-bold text-white">{r.test?.receiverName || "Unknown Partner"}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-muted-foreground/60" />
                        <span>{r.receiverPhone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium uppercase">{r.rewardType}</td>
                    <td className="px-6 py-4 font-bold text-white uppercase">{r.network}</td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">
                        {r.providerReference || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>{formatDate(r.deliveredAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase ${
                        r.status === "SUCCESSFUL" ? "bg-accent/10 border-accent/20 text-accent" :
                        r.status === "PROCESSING" ? "bg-secondary/10 border-secondary/20 text-secondary" :
                        r.status === "PENDING" ? "bg-secondary/10 border-secondary/20 text-secondary" :
                        "bg-destructive/10 border-destructive/20 text-destructive"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-white text-sm">
                      {formatCurrency(r.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
