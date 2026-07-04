"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Check, AlertCircle, Copy, ExternalLink, ArrowRight, CheckCircle2 } from "lucide-react";

function CheckoutVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || "";
  const simulated = searchParams.get("simulated") || "";

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [statusMsg, setStatusMsg] = useState("Verifying payment transaction status...");
  const [testToken, setTestToken] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) {
      setError("No transaction reference provided in the callback URL.");
      setLoading(false);
      return;
    }

    let attempts = 0;
    const maxAttempts = 5;

    const verifyPayment = async () => {
      try {
        const res = await fetch("/api/v1/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference })
        });
        
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to verify payment status.");
        }

        if (data.paymentStatus === "SUCCESSFUL") {
          setSuccess(true);
          setTestToken(data.testToken);
          setAmount(data.amount);
          setLoading(false);
        } else {
          // If not successful yet, retry after 2.5 seconds up to maxAttempts (handling potential webhook latency)
          if (attempts < maxAttempts) {
            attempts++;
            setStatusMsg(`Re-checking payment confirmation (${attempts}/${maxAttempts})...`);
            setTimeout(verifyPayment, 2500);
          } else {
            setError("We couldn't confirm your payment from the gateway. If you debited, please check your wallet logs shortly as the webhook is processed.");
            setLoading(false);
          }
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        setError(err.message || "An unexpected error occurred during verification.");
        setLoading(false);
      }
    };

    // Give the webhook a tiny headstart, then verify
    const delay = simulated === "success" ? 100 : 1000;
    const timer = setTimeout(verifyPayment, delay);
    return () => clearTimeout(timer);
  }, [reference, simulated]);

  const handleCopyLink = () => {
    if (!testToken) return;
    const shareUrl = `${window.location.origin}/t/${testToken}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">{statusMsg}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="glass-panel p-8 rounded-3xl border border-destructive/20 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold text-white">Verification Failed</h2>
          <p className="text-xs text-muted-foreground">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-primary to-secondary text-xs font-bold text-white transition-smooth"
            >
              Retry Verification
            </button>
            <Link
              href="/dashboard"
              className="flex-1 h-11 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white flex items-center justify-center hover:bg-white/10 transition-smooth"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const shareLinkUrl = testToken ? `${window.location.origin}/t/${testToken}` : "";

  return (
    <div className="mx-auto max-w-xl px-4 py-16 space-y-8 animate-fade-in">
      <div className="glass-panel p-8 rounded-3xl border border-white/5 space-y-6 text-center">
        {testToken ? (
          // Test Funding Success
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent border border-accent/25 animate-bounce-slow">
              <Check className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Payment Verified!</h2>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Your escrow transaction of {amount ? formatCurrency(amount) : "funds"} is confirmed. The relationship test is now active.
              </p>
            </div>

            {/* Link copy widget */}
            <div className="space-y-2 text-left pt-2">
              <label className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block">Receiver Verification Link</label>
              <div className="flex bg-black/40 rounded-xl border border-white/5 overflow-hidden">
                <input
                  type="text"
                  readOnly
                  value={shareLinkUrl}
                  className="flex-1 bg-transparent px-3.5 py-2.5 text-xs text-white focus:outline-none select-all font-mono"
                />
                <button
                  onClick={handleCopyLink}
                  className="bg-white/5 border-l border-white/5 px-4 py-2.5 hover:bg-white/10 transition-smooth flex items-center justify-center shrink-0 cursor-pointer"
                >
                  {copied ? (
                    <span className="text-accent text-[10px] font-bold">Copied!</span>
                  ) : (
                    <Copy className="h-4 w-4 text-white" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground/60">Share this secure link with your partner. The reward is locked until they answer correctly.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
              <Link
                href="/dashboard/tests"
                className="flex-1 inline-flex h-11 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-xs font-semibold text-white hover:bg-white/10 transition-smooth"
              >
                Manage Tests
              </Link>
              <a
                href={`/t/${testToken}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary text-xs font-semibold text-white hover:bg-primary-light transition-smooth"
              >
                <span>Preview Link</span>
                <ExternalLink className="h-4.5 w-4.5" />
              </a>
            </div>
          </>
        ) : (
          // Wallet Funding Success
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent border border-accent/25 animate-bounce-slow">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Wallet Funded!</h2>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Your deposit of {amount ? formatCurrency(amount) : "funds"} was received and credited to your wallet balance.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-6 border-t border-white/5">
              <Link
                href="/dashboard/wallet"
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-xs font-bold text-white hover:opacity-95 transition-smooth"
              >
                <span>Go to Wallet</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-xs font-semibold text-white hover:bg-white/10 transition-smooth"
              >
                Go to Dashboard
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function CheckoutVerifyPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Initializing verification...</p>
      </div>
    }>
      <CheckoutVerifyContent />
    </Suspense>
  );
}
