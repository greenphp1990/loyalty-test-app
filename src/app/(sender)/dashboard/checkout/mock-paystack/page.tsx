"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, Landmark, ShieldCheck, Loader2, AlertCircle, Sparkles } from "lucide-react";

function MockPaystackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || "";

  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedMethod, setSelectedMethod] = useState<"card" | "transfer">("card");
  const [cardNumber, setCardNumber] = useState("4084 0800 0000 0000");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvv, setCardCvv] = useState("123");
  const [processing, setProcessing] = useState(false);
  const [simType, setSimType] = useState<"success" | "failure" | null>(null);

  // Fetch payment information on load
  useEffect(() => {
    if (!reference) {
      setError("Missing transaction reference.");
      setLoading(false);
      return;
    }

    const fetchPaymentInfo = async () => {
      try {
        // We can check backend for this reference
        const res = await fetch(`/api/v1/payments/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference })
        });
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to locate transaction.");
        }
        
        // Fetch metadata/payment information
        // Since verify doesn't return full details if pending, let's fetch from general source or query database.
        // Wait, verify returns status and type. Let's just store reference and check amount from local storage/meta if needed,
        // or we can add amount to API response or fetch it.
        // Let's call verify and fetch info. Wait, we can get amount by checking the payment table directly if we want to build a custom endpoint,
        // or verify can be updated to return the amount. Let's look at verify endpoint: it has the full payment model loaded!
        // Let's modify verify API or just retrieve the payment amount from database if we want to display it.
        // Wait, let's look at verify endpoint, it returns:
        // paymentStatus, testToken, etc.
        // Let's make a quick fetch from a custom route or let verify return amount. We can just update `/api/v1/payments/verify` to return the amount and description!
        // Actually, returning amount and type from verify is extremely helpful. Let's do that!
        
        setPayment(data);
      } catch (err: any) {
        console.error("Fetch transaction error:", err);
        setError(err.message || "Failed to load transaction details.");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentInfo();
  }, [reference]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSimulatePayment = async (status: "success" | "failure") => {
    if (!reference) return;
    setProcessing(true);
    setSimType(status);

    try {
      if (status === "success") {
        // 1. Fire Webhook in background with mock signature header to test real webhook flow
        const webhookAmountKobo = (payment?.amount || 1000) * 100;
        await fetch("/api/v1/payments/paystack/webhook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-mock-signature": "super-secret-mock-token",
          },
          body: JSON.stringify({
            event: "charge.success",
            data: {
              reference,
              amount: webhookAmountKobo,
              status: "success",
            },
          }),
        });

        // Small timeout to simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      // Redirect to verification callback page
      router.push(`/dashboard/checkout/verify?reference=${reference}&simulated=${status}`);
    } catch (err) {
      console.error("Mock checkout simulation error:", err);
      // Fallback redirect even on failure
      router.push(`/dashboard/checkout/verify?reference=${reference}`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Connecting to secure checkout gateway...</p>
      </div>
    );
  }

  if (error || !reference) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="glass-panel p-8 rounded-3xl border border-destructive/20 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold text-white font-display">Gateway Error</h2>
          <p className="text-xs text-muted-foreground">{error || "Missing transaction details."}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full h-11 rounded-xl bg-white/5 border border-white/10 text-xs text-white hover:bg-white/10 transition-smooth"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const invoiceAmount = payment?.amount || 2500;

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10 font-sans">
      <div className="w-full max-w-2xl bg-[#090b0e] border border-[#161a22] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
        
        {/* Left Sidebar - Order summary */}
        <div className="w-full md:w-5/12 bg-[#0c0f14] p-6 border-b md:border-b-0 md:border-r border-[#161a22] flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Paystack Sandbox</span>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Paying Merchant</p>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1">
                <span>Loyalty Test App</span>
                <Sparkles className="h-3.5 w-3.5 text-secondary" />
              </h3>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Reference</p>
              <p className="text-[10px] text-white/70 font-mono break-all bg-black/40 p-2 rounded-lg">{reference}</p>
            </div>
          </div>

          <div className="bg-[#12161f] p-4 rounded-2xl border border-white/5 space-y-1 mt-auto">
            <p className="text-[9px] uppercase font-bold text-muted-foreground">Amount Due</p>
            <p className="text-2xl font-extrabold text-white">{formatCurrency(invoiceAmount)}</p>
          </div>
        </div>

        {/* Right Content - Payment Form */}
        <div className="w-full md:w-7/12 p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#161a22]">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Payment Method</h4>
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
            </div>

            {/* Payment Method tabs */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedMethod("card")}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-[10px] font-bold uppercase transition-smooth ${
                  selectedMethod === "card"
                    ? "bg-primary/10 border-primary text-primary"
                    : "border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
              >
                <CreditCard className="h-4.5 w-4.5" />
                <span>Card</span>
              </button>
              <button
                onClick={() => setSelectedMethod("transfer")}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-[10px] font-bold uppercase transition-smooth ${
                  selectedMethod === "transfer"
                    ? "bg-primary/10 border-primary text-primary"
                    : "border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
              >
                <Landmark className="h-4.5 w-4.5" />
                <span>Transfer</span>
              </button>
            </div>

            {/* Method Details */}
            {selectedMethod === "card" ? (
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-muted-foreground uppercase">Card Number</label>
                  <input
                    type="text"
                    disabled
                    value={cardNumber}
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white/50 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-semibold text-muted-foreground uppercase">Expiry Date</label>
                    <input
                      type="text"
                      disabled
                      value={cardExpiry}
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white/50 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-semibold text-muted-foreground uppercase">CVV</label>
                    <input
                      type="text"
                      disabled
                      value={cardCvv}
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white/50 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2 text-xs text-muted-foreground">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2">
                  <p className="text-[9px] uppercase font-bold text-primary">Simulated Bank Details</p>
                  <div className="flex justify-between">
                    <span>Bank:</span>
                    <span className="font-bold text-white">WEMA Bank (Paystack Sandbox)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Account Number:</span>
                    <span className="font-bold text-white font-mono">9920192830</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Simulation buttons */}
          <div className="space-y-2 pt-4 border-t border-[#161a22]">
            {processing ? (
              <div className="flex flex-col items-center justify-center py-2 space-y-2">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
                <span className="text-[10px] text-muted-foreground animate-pulse">
                  {simType === "success" 
                    ? "Authorizing card payment & dispatching webhook..." 
                    : "Cancelling checkout authorization..."}
                </span>
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleSimulatePayment("success")}
                  className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white flex items-center justify-center gap-1.5 transition-smooth"
                >
                  <span>Simulate Success Payment</span>
                </button>
                <button
                  onClick={() => handleSimulatePayment("failure")}
                  className="w-full h-11 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-bold text-xs text-white/70 flex items-center justify-center transition-smooth"
                >
                  Simulate Cancel/Failure
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function MockPaystackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading secure checkout...</p>
      </div>
    }>
      <MockPaystackContent />
    </Suspense>
  );
}
