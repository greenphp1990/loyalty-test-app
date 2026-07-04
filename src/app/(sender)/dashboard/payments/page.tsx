"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, Loader2, AlertCircle, RefreshCw, Calendar, Tag, ShieldCheck } from "lucide-react";

interface Payment {
  id: string;
  paymentType: string;
  gateway: string;
  gatewayReference: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
  test?: {
    receiverName: string;
    questionText: string;
  } | null;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/v1/sender/payments");
        if (!res.ok) throw new Error("Failed to load billing history.");
        const data = await res.json();
        setPayments(data.payments || []);
      } catch (err: any) {
        console.error("Fetch payments error:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading billing logs...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-white/5 pb-6">
        <Link href="/dashboard" className="rounded-xl border border-white/5 bg-white/5 p-2 text-muted-foreground hover:text-white transition-smooth">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <span>Payment Billing</span>
          </h1>
          <p className="text-xs text-muted-foreground">Historical records of gateway payments, test escrow funding, and top-ups.</p>
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
      ) : payments.length === 0 ? (
        <div className="glass-panel p-16 rounded-3xl border border-white/5 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-muted-foreground">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">No Billing Logs Found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              You haven't initiated any payment transactions yet. When you fund your wallet or pay for a test via Paystack, the audit logs will appear here.
            </p>
          </div>
          <Link
            href="/dashboard/wallet"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-white hover:bg-primary-light transition-smooth"
          >
            Fund Wallet Now
          </Link>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 text-primary" />
              <span>Billing Audit Trail</span>
            </h2>
            <span className="text-[10px] text-muted-foreground">{payments.length} transaction entries</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 uppercase tracking-wider text-muted-foreground text-[10px] font-semibold">
                <tr>
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">Payment Type</th>
                  <th className="px-6 py-4">Gateway</th>
                  <th className="px-6 py-4">Linked Target</th>
                  <th className="px-6 py-4">Date Initiated</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-muted-foreground">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-smooth">
                    <td className="px-6 py-4">
                      <div className="font-mono text-white text-[11px] select-all">{p.gatewayReference}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-white">
                        <Tag className="h-3 w-3 text-secondary" />
                        <span>{p.paymentType.replace("_", " ")}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 uppercase font-medium">{p.gateway}</td>
                    <td className="px-6 py-4">
                      {p.test ? (
                        <div>
                          <p className="text-white font-medium">To: {p.test.receiverName}</p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">"{p.test.questionText}"</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>{formatDate(p.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase ${
                        p.status === "SUCCESSFUL" ? "bg-accent/10 border-accent/20 text-accent" :
                        p.status === "PENDING" ? "bg-secondary/10 border-secondary/20 text-secondary" :
                        "bg-destructive/10 border-destructive/20 text-destructive"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-white text-sm">
                      {formatCurrency(p.amount)}
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
