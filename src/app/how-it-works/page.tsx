import React from "react";
import Link from "next/link";
import { Send, Gift, CheckCircle, HelpCircle, Lock, RefreshCw, AlertCircle } from "lucide-react";

export default function HowItWorks() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-20">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          How Loyalty Test Works
        </h1>
        <p className="mt-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
          A fun, private, and secure way to verify connection and share locked rewards. 
          Here is exactly how the platform operates for both Senders and Receivers.
        </p>
      </div>

      {/* Grid of Roles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Sender Flow */}
        <div className="glass-panel p-8 rounded-3xl border border-white/5 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-24 w-24 bg-primary/10 rounded-bl-full -z-10" />
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Send className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-bold text-white">For Senders</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Create tests to see if your partner knows core relationship answers. You back the test with a real reward (airtime/data) to incentivize participation.
          </p>

          <ol className="space-y-4 text-xs text-muted-foreground">
            <li className="flex items-start space-x-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 font-bold text-white text-[10px]">1</span>
              <span>
                <strong className="text-white block mb-0.5">Select a Question</strong>
                Choose from pre-set relationship templates (partner nickname, first meeting location) or construct a custom question using the safe template builder.
              </span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 font-bold text-white text-[10px]">2</span>
              <span>
                <strong className="text-white block mb-0.5">Fund the Locked Gift</strong>
                Select airtime or data, enter the value (e.g. ₦1,000), and fund the test securely via Paystack/Flutterwave. The gift is held in escrow.
              </span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 font-bold text-white text-[10px]">3</span>
              <span>
                <strong className="text-white block mb-0.5">Send the Secure Link</strong>
                Generate the unique, random link. Share it anonymously via SMS, WhatsApp, or manual link copy. You can set an expiry timer (1 to 72 hours).
              </span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 font-bold text-white text-[10px]">4</span>
              <span>
                <strong className="text-white block mb-0.5">Get Notified</strong>
                We notify you immediately when they answer. If correct, the top-up completes. If incorrect, declined, or expired, the gift value is returned to your wallet.
              </span>
            </li>
          </ol>
        </div>

        {/* Receiver Flow */}
        <div className="glass-panel p-8 rounded-3xl border border-white/5 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-24 w-24 bg-secondary/10 rounded-bl-full -z-10" />
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/20 text-secondary">
              <Gift className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-bold text-white">For Receivers</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Receivers do not need to download an app or create an account. The process is completely frictionless and focuses on safety first.
          </p>

          <ol className="space-y-4 text-xs text-muted-foreground">
            <li className="flex items-start space-x-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 font-bold text-white text-[10px]">1</span>
              <span>
                <strong className="text-white block mb-0.5">Open the Secure Link</strong>
                Clicking the link opens a secure web page. You will see a notice stating that a locked reward (e.g. ₦1,000 Airtime) is waiting.
              </span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 font-bold text-white text-[10px]">2</span>
              <span>
                <strong className="text-white block mb-0.5">Read the Safety Notice</strong>
                We explicitly advise never entering passwords, OTPs, PINs, card numbers, or sensitive government credentials. The platform will never ask for them.
              </span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 font-bold text-white text-[10px]">3</span>
              <span>
                <strong className="text-white block mb-0.5">Answer or Decline</strong>
                Read the relationship question. Submit your answer if you wish, decline the test, or report abuse if you suspect harassment.
              </span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 font-bold text-white text-[10px]">4</span>
              <span>
                <strong className="text-white block mb-0.5">Instant Payout</strong>
                If your answer matches (processed by our smart typo-tolerant engine), your reward is sent directly to your phone number. No login required.
              </span>
            </li>
          </ol>
        </div>

      </div>

      {/* Safety and Refund Policy Details */}
      <div className="glass-panel p-8 rounded-3xl border border-white/5 space-y-6">
        <h3 className="text-xl font-bold text-white flex items-center space-x-2">
          <Lock className="h-5 w-5 text-accent animate-pulse-slow" />
          <span>Under the Hood: Trust & Mechanics</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-muted-foreground leading-relaxed">
          
          <div className="space-y-2">
            <h4 className="font-bold text-white flex items-center space-x-1">
              <RefreshCw className="h-4 w-4 text-primary" />
              <span>Wallet Escrow System</span>
            </h4>
            <p>
              When a Sender funds a test, the money leaves their payment account and goes into a secure escrow system. The system guarantees that a real reward is funded before the link is sent. No fake link claims are permitted.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white flex items-center space-x-1">
              <CheckCircle className="h-4 w-4 text-secondary" />
              <span>Intelligent Normalization</span>
            </h4>
            <p>
              Our matching algorithm handles lowercase conversions, deletes extra spaces, removes punctuation, ignores minor titles (Mr/Mrs), and permits name reversals. This ensures typo mistakes do not block legitimate payout releases.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white flex items-center space-x-1">
              <AlertCircle className="h-4 w-4 text-accent" />
              <span>Harassment Protection</span>
            </h4>
            <p>
              To protect Receivers, Senders are subject to daily limits (max 5 tests/day) and matching filters. Senders cannot spam the same phone number (max 2 tests/week). Receivers can block future requests with a single click.
            </p>
          </div>

        </div>

        <div className="text-center pt-4">
          <Link
            href="/register"
            className="glow-primary inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary px-6 text-sm font-semibold text-white transition-smooth"
          >
            Create Your First Test
          </Link>
        </div>
      </div>

    </div>
  );
}
