"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Wallet, CreditCard, RefreshCw, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface Transaction {
  id: string;
  transactionType: string;
  description: string;
  amount: number;
  status: string;
  createdAt: string;
  reference: string;
}

interface UserWallet {
  balance: number;
  currency: string;
  status: string;
}

export default function SenderWallet() {
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState<number>(2000);
  const [withdrawalBank, setWithdrawalBank] = useState("");
  const [withdrawalAccount, setWithdrawalAccount] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [funding, setFunding] = useState(false);

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        setLoading(true);
        // Fetch user info (wallet balance is inside)
        const userRes = await fetch("/api/v1/auth/me");
        if (!userRes.ok) throw new Error("Failed to load user profile.");
        const userData = await userRes.json();
        setWallet(userData.user.wallet);

        // Fetch wallet transactions
        const txRes = await fetch("/api/v1/sender/wallet/transactions");
        if (!txRes.ok) throw new Error("Failed to load transaction logs.");
        const txData = await txRes.json();
        setTransactions(txData.transactions || []);
      } catch (err: any) {
        console.error("Wallet data fetch error:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleFundWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setFunding(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch("/api/v1/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentType: "WALLET_FUNDING",
          amount: fundAmount
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to initialize wallet funding.");
      }

      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        throw new Error("No checkout URL returned from payment gateway.");
      }
    } catch (err: any) {
      console.error("Wallet funding initialization error:", err);
      setFeedbackMsg({
        type: "error",
        text: err.message || "An unexpected error occurred while processing funding request."
      });
      setFunding(false);
    }
  };

  const handleWithdrawMock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawalBank || !withdrawalAccount) {
      setFeedbackMsg({
        type: "error",
        text: "Please provide a valid bank and bank account number.",
      });
      return;
    }
    setFeedbackMsg({
      type: "success",
      text: "Withdrawal payout request submitted. Withdrawals will be processed upon administrator approval.",
    });
    setTimeout(() => setFeedbackMsg(null), 8000);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading wallet profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <div className="glass-panel p-8 rounded-3xl border border-destructive/20 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold text-white">Wallet Connection Error</h2>
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

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-white/5 pb-6">
        <Link href="/dashboard" className="rounded-xl border border-white/5 bg-white/5 p-2 text-muted-foreground hover:text-white transition-smooth">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Your Wallet</h1>
          <p className="text-xs text-muted-foreground">Manage your deposit credits, test refunds, and payout options.</p>
        </div>
      </div>

      {feedbackMsg && (
        <div className={`p-4 rounded-xl border flex items-start space-x-3 text-xs ${
          feedbackMsg.type === "success" 
            ? "bg-accent/10 border-accent/20 text-accent" 
            : "bg-destructive/10 border-destructive/20 text-destructive"
        }`}>
          {feedbackMsg.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Balance & Actions */}
        <div className="md:col-span-1 space-y-6">
          
          {/* Balance Card */}
          <div className="glass-panel p-6 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-transparent to-secondary/5 space-y-4">
            <div className="flex items-center justify-between">
              <Wallet className="h-6 w-6 text-primary" />
              <span className={`text-[10px] border font-semibold px-2 py-0.5 rounded-full uppercase ${
                wallet?.status === "ACTIVE" 
                  ? "bg-accent/10 border-accent/20 text-accent" 
                  : "bg-destructive/10 border-destructive/20 text-destructive"
              }`}>
                {wallet?.status || "INACTIVE"}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Available Balance</p>
              <p className="text-4xl font-extrabold text-white">
                {formatCurrency(wallet?.balance || 0)}
              </p>
            </div>
            <div className="text-[10px] text-muted-foreground/60 leading-normal">
              Used to create tests, fund airtime/data top-ups, or request bank payouts.
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Fund Wallet</h3>
            <form className="space-y-3" onSubmit={handleFundWallet}>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Amount (NGN)</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                  <input
                    type="number"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(Number(e.target.value))}
                    min={500}
                    className="w-full bg-white/5 border border-white/5 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={funding}
                className="glow-primary w-full inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary text-xs font-semibold text-white transition-smooth disabled:opacity-50"
              >
                {funding ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Fund via Paystack</span>
                )}
              </button>
            </form>
          </div>

        </div>

        {/* Transaction History & Withdrawals */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Withdrawal Request Form */}
          <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Withdraw Payout</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              If withdrawals are permitted by the administrator, you can request wallet payout transfers back to your Nigerian bank account.
            </p>
            <form onSubmit={handleWithdrawMock} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Bank Name (e.g. GTBank)"
                  value={withdrawalBank}
                  onChange={(e) => setWithdrawalBank(e.target.value)}
                  className="bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white placeholder-muted-foreground/45 focus:outline-none focus:border-primary/30"
                />
                <input
                  type="text"
                  placeholder="Account Number (10 digits)"
                  value={withdrawalAccount}
                  onChange={(e) => setWithdrawalAccount(e.target.value)}
                  maxLength={10}
                  className="bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white placeholder-muted-foreground/45 focus:outline-none focus:border-primary/30"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-semibold text-white hover:bg-white/10 transition-smooth"
              >
                Request Withdrawal Payout
              </button>
            </form>
          </div>

          {/* Wallet Ledger */}
          <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <RefreshCw className="h-3.5 w-3.5 text-primary" />
                <span>Wallet Ledger Logs</span>
              </h3>
            </div>
            {transactions.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                <Wallet className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="font-bold text-white mb-1">No Transactions Found</p>
                <p className="text-[10px]">Your deposit, refund, and payment history will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5 text-xs text-muted-foreground">
                {transactions.map((tx) => {
                  const isPositive = ["DEPOSIT", "REFUND"].includes(tx.transactionType);
                  return (
                    <div key={tx.id} className="flex justify-between items-center p-4 hover:bg-white/5 transition-smooth">
                      <div>
                        <p className="font-bold text-white">{tx.description || tx.transactionType}</p>
                        <p className="text-[10px] text-muted-foreground/75 mt-0.5">{formatDate(tx.createdAt)}</p>
                        <p className="text-[9px] text-muted-foreground/40 font-mono mt-0.5">Ref: {tx.reference}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${isPositive ? "text-accent" : "text-destructive"}`}>
                          {isPositive ? "+" : "-"}{formatCurrency(tx.amount)}
                        </p>
                        <span className={`text-[9px] font-semibold uppercase ${
                          tx.status === "SUCCESSFUL" ? "text-accent" :
                          tx.status === "PENDING" ? "text-secondary" :
                          "text-destructive"
                        }`}>{tx.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
