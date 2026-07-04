"use client";

import React, { useState, useEffect, Suspense, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, ShieldCheck, UserX, AlertOctagon, Loader2 } from "lucide-react";

interface TestDetails {
  receiverName: string;
  giftType: string;
  giftAmount: number;
  testStatus: string;
}

function ResultContent({ token }: { token: string }) {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") || "completed";
  const scoreStr = searchParams.get("score") || "0";
  const score = parseInt(scoreStr, 10);

  const [test, setTest] = useState<TestDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestDetails = async () => {
      try {
        const res = await fetch(`/api/v1/t/${token}`);
        if (res.ok) {
          const data = await res.json();
          setTest(data.test);
        }
      } catch (err) {
        console.error("Error loading test details on result page:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTestDetails();
  }, [token]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const giftValueStr = test 
    ? `${formatCurrency(test.giftAmount)} ${test.giftType.replace("_", " ")}`
    : "₦1,000 Airtime";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3 py-10">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground animate-pulse">Loading completion report...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6 glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl relative text-center">
      
      {/* 1. SUCCESS: Passed test */}
      {status === "completed" && score >= 90 && (
        <>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent border border-accent/20 animate-pulse-slow">
            <CheckCircle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Gift Unlocked!</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Congratulations! Your answer was correct. <strong>{giftValueStr}</strong> has been successfully recharged to your phone number.
            </p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/5 p-4 text-[10px] text-muted-foreground flex items-center justify-center space-x-1.5 mx-auto w-fit">
            <ShieldCheck className="h-4 w-4 text-accent shrink-0" />
            <span>Top-up delivered successfully via carrier.</span>
          </div>
        </>
      )}

      {/* 2. FAILURE: Failed match */}
      {status === "completed" && score < 90 && (
        <>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive border border-destructive/20">
            <XCircle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Verification Failed</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The answer you submitted did not match the expected answer (Match Score: {score}%). The locked reward value has been refunded to the Sender.
            </p>
          </div>
        </>
      )}

      {/* 3. DECLINED */}
      {status === "declined" && (
        <>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-muted-foreground/60 border border-white/5">
            <XCircle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Test Declined</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You have declined the loyalty verification test. The locked gift of <strong>{giftValueStr}</strong> has been refunded back to the Sender's wallet.
            </p>
          </div>
        </>
      )}

      {/* 4. REPORTED */}
      {status === "reported" && (
        <>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15 text-destructive border border-destructive/20">
            <AlertOctagon className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Abuse Reported</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The test has been flagged. The locked escrow reward is frozen and has been forwarded to our admin team for audit review.
            </p>
          </div>
        </>
      )}

      {/* 5. BLOCKED */}
      {status === "blocked" && (
        <>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15 text-destructive border border-destructive/20">
            <UserX className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Number Blocked</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your phone number has been opted out. Senders are now permanently prohibited from creating tests for your number.
            </p>
          </div>
        </>
      )}

      <div className="h-px bg-white/5 my-4" />

      <div>
        <Link
          href="/"
          className="glow-primary inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary px-6 text-xs font-semibold text-white transition-smooth"
        >
          Go to Home
        </Link>
      </div>

    </div>
  );
}

export default function TestResultPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  return (
    <div className="flex flex-1 items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={
        <div className="text-muted-foreground text-xs flex items-center">
          <Loader2 className="animate-spin mr-1.5 h-4 w-4" />
          <span>Loading result...</span>
        </div>
      }>
        <ResultContent token={token} />
      </Suspense>
    </div>
  );
}
