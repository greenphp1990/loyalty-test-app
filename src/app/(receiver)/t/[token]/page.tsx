"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Gift, Lock, ShieldAlert, XOctagon, UserMinus, Loader2, AlertCircle } from "lucide-react";

interface PublicTestDetails {
  id: string;
  receiverName: string;
  questionText: string;
  giftType: string;
  giftAmount: number;
  testStatus: string;
  expiresAt: string;
  createdAt: string;
}

export default function ReceiverTestPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const { token } = use(params);
  
  const [test, setTest] = useState<PublicTestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [step, setStep] = useState<"greeting" | "question">("greeting");
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch public test details on load
  useEffect(() => {
    const fetchTestDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/t/${token}`);
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to load loyalty test link details.");
        }
        
        setTest(data.test);
      } catch (err: any) {
        console.error("Fetch test details error:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchTestDetails();
  }, [token]);

  const handleDecline = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/t/${token}/decline`, { method: "POST" });
      if (res.ok) {
        router.push(`/t/${token}/result?status=declined`);
      } else {
        const data = await res.json();
        alert(data.error || "Decline failed.");
      }
    } catch (err) {
      console.error("Decline error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/t/${token}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Unsolicited or harassing relationship test link" })
      });
      if (res.ok) {
        router.push(`/t/${token}/result?status=reported`);
      } else {
        const data = await res.json();
        alert(data.error || "Reporting failed.");
      }
    } catch (err) {
      console.error("Report error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBlock = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/t/${token}/block`, { method: "POST" });
      if (res.ok) {
        router.push(`/t/${token}/result?status=blocked`);
      } else {
        const data = await res.json();
        alert(data.error || "Block failed.");
      }
    } catch (err) {
      console.error("Block error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || submitting) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/v1/t/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Answer submission failed.");
      }

      router.push(`/t/${token}/result?status=completed&score=${data.score}`);
    } catch (err: any) {
      console.error("Submission error:", err);
      setError(err.message || "Connection error occurred.");
      setSubmitting(false);
    }
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading verification environment...</p>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="flex flex-1 items-center justify-center py-16 px-4">
        <div className="w-full max-w-md space-y-6 glass-panel p-8 rounded-3xl border border-destructive/25 text-center shadow-2xl">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto animate-bounce-slow" />
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Link Access Denied</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {error || "The link is invalid, expired, or has not been funded yet."}
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="w-full h-11 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white hover:bg-white/10 transition-smooth"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Check if test is active
  if (test.testStatus !== "ACTIVE") {
    return (
      <div className="flex flex-1 items-center justify-center py-16 px-4">
        <div className="w-full max-w-md space-y-6 glass-panel p-8 rounded-3xl border border-white/5 text-center">
          <XOctagon className="h-12 w-12 text-muted-foreground/60 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Verification Link Expired</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This verification link has already been completed, declined, or reported.
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="w-full h-11 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white hover:bg-white/10"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center py-16 px-4 sm:px-6 lg:px-8 animate-fade-in">
      
      {step === "greeting" && (
        <div className="w-full max-w-md space-y-6 glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden animate-float">
          <div className="absolute top-0 right-0 h-20 w-20 bg-primary/10 rounded-bl-full -z-10" />

          {/* Locked Reward Greeting */}
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-lg border border-primary/20">
              <Gift className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">You Have a Locked Gift!</h2>
              <p className="text-xs text-muted-foreground">Someone close to you has secured a surprise reward.</p>
            </div>
          </div>

          {/* Locked Amount Widget */}
          <div className="bg-black/40 border border-white/5 rounded-2xl p-4 text-center space-y-1.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Locked Reward</p>
            <p className="text-2xl font-extrabold text-gradient">{formatCurrency(test.giftAmount)} {test.giftType.replace("_", " ")}</p>
            <p className="text-[9px] text-accent font-medium">Secured in Escrow &bull; Verified Funded</p>
          </div>

          {/* Safety Notice block */}
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 space-y-2">
            <div className="flex items-center space-x-2 text-destructive">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Receiver Safety Notice</span>
            </div>
            <p className="text-[10px] leading-normal text-muted-foreground">
              This is a relationship validation question. **DO NOT** enter passwords, bank PINs, CVV codes, BVNs, NINs, OTP codes, or personal account credentials. We will never ask for them.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => setStep("question")}
              disabled={submitting}
              className="glow-primary w-full inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary text-xs font-bold uppercase tracking-wider text-white transition-smooth disabled:opacity-50"
            >
              Continue &amp; View Question
            </button>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDecline}
                disabled={submitting}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-xs text-muted-foreground hover:text-white transition-smooth disabled:opacity-50"
              >
                Decline Test
              </button>
              <button
                onClick={handleReport}
                disabled={submitting}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-smooth disabled:opacity-50"
              >
                Report Abuse
              </button>
            </div>
            
            <button
              onClick={handleBlock}
              disabled={submitting}
              className="w-full inline-flex h-9 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-xs text-muted-foreground hover:text-white transition-smooth disabled:opacity-50"
            >
              <UserMinus className="mr-1.5 h-3.5 w-3.5 text-destructive" />
              <span>Block Future Requests</span>
            </button>
          </div>
        </div>
      )}

      {step === "question" && (
        <div className="w-full max-w-md space-y-6 glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl relative">
          
          <div className="space-y-4">
            <span className="text-[10px] bg-secondary/15 border border-secondary/20 text-secondary font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Verification Mode
            </span>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white tracking-tight">Answer Relationship Question</h2>
              <p className="text-xs text-muted-foreground">Submit the correct answer to unlock the {formatCurrency(test.giftAmount)}.</p>
            </div>
          </div>

          {/* Locked Question display */}
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-semibold text-white leading-relaxed">
            {test.questionText}
          </div>

          {/* Form */}
          <form className="space-y-4 pt-2" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Your Answer
              </label>
              <input
                type="text"
                required
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type answer here..."
                disabled={submitting}
                className="w-full bg-white/5 border border-white/5 focus:border-primary/55 rounded-xl px-4 py-3 text-xs text-white placeholder-muted-foreground/45 transition-smooth focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-50"
              />
            </div>

            <div className="rounded-xl bg-white/5 p-3 border border-white/5 text-[9px] text-muted-foreground flex items-start space-x-2">
              <Lock className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <span>
                Your answer is compared using normalization matching. Capitalization, spelling typos, or reversed names are handled gracefully.
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="glow-primary w-full inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary text-xs font-bold uppercase tracking-wider text-white transition-smooth disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Unlocking Gift...</span>
                </>
              ) : (
                <span>Submit &amp; Unlock Gift</span>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={() => setStep("greeting")}
              disabled={submitting}
              className="text-[10px] text-muted-foreground hover:text-white transition-smooth"
            >
              &larr; Back to safety notice
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
