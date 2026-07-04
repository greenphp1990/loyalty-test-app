import React from "react";
import Link from "next/link";
import { Heart, Lock, Shield, Sparkles, Send, Gift, RefreshCw, Smartphone } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden md:pt-32 md:pb-36 flex flex-col justify-center">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          {/* Badge */}
          <div className="mx-auto mb-6 inline-flex items-center space-x-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary animate-pulse-slow">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Now Live in Nigeria</span>
          </div>

          {/* Heading */}
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="text-white block">Lock a Gift. Ask a Question.</span>
            <span className="text-gradient-rose-violet block mt-2">Reveal the Connection.</span>
          </h1>

          {/* Description */}
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Verify relationship trust anonymously and reward connection securely. 
            Choose a safe relationship question, lock airtime, data, or cash, and send a secure tokenized link. 
            Receiver gets the gift instantly if they answer correctly.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              href="/register"
              className="glow-primary w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary px-8 text-base font-semibold text-white transition-smooth hover:scale-[1.02] active:scale-[0.98]"
            >
              Create a Loyalty Test
            </Link>
            <Link
              href="/how-it-works"
              className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-8 text-base font-semibold text-white hover:bg-white/10 hover:border-white/20 transition-smooth"
            >
              See How It Works
            </Link>
          </div>

        </div>

        {/* Visual Mockup Section */}
        <div className="mx-auto mt-16 max-w-md px-4 sm:px-6 relative animate-float">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/25 to-secondary/25 blur-[50px] -z-10 rounded-full" />
          
          {/* Glass Phone Mockup */}
          <div className="glass-panel rounded-3xl p-6 shadow-2xl border border-white/10">
            {/* Phone header indicator */}
            <div className="flex justify-between items-center mb-6 text-muted-foreground/60 text-xs">
              <span className="font-semibold">Loyalty Link</span>
              <Smartphone className="h-4 w-4" />
            </div>

            {/* Locked Reward Card */}
            <div className="bg-black/40 rounded-2xl p-4 border border-white/5 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">₦1,000 MTN Airtime</h3>
                  <p className="text-[10px] text-muted-foreground">Locked & Secured in Escrow</p>
                </div>
              </div>
              
              <div className="h-px bg-white/5" />
              
              <p className="text-xs text-muted-foreground italic leading-relaxed">
                &ldquo;Someone close to you has locked a gift for you. Answer one relationship question correctly to unlock it.&rdquo;
              </p>
            </div>

            {/* Sample Question Input */}
            <div className="mt-5 space-y-3">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Relationship Question
              </label>
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white">
                What is the name of your boyfriend?
              </div>
              <input
                type="text"
                disabled
                placeholder="Type expected answer..."
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-muted-foreground/50 cursor-not-allowed"
              />
              <button
                disabled
                className="w-full bg-gradient-to-r from-primary/80 to-secondary/80 text-white rounded-xl py-3 text-xs font-semibold uppercase tracking-wider cursor-not-allowed opacity-80"
              >
                Submit & Unlock Gift
              </button>
            </div>
            
            <div className="mt-4 text-[10px] text-center text-muted-foreground/60 flex items-center justify-center space-x-1">
              <Lock className="h-3 w-3 text-accent" />
              <span>Full identity and data protection active</span>
            </div>
          </div>
        </div>

      </section>

      {/* Core Features Grid */}
      <section className="py-20 bg-black/20 border-y border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              Built with Safety, Privacy & Fun at the Core
            </h2>
            <p className="mt-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
              We design features that guarantee anonymity for the Sender while protecting the Receiver from any data mining, scams, or malicious interactions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">100% Secure Anonymity</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sender identity, expected answers, account details, and full database IDs are never exposed to the public or the Receiver. The test is hosted on a unique, random token link.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Question Safety Filters</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Our multi-layer Question Safety Engine blocks password requests, PIN requests, BVNs, card numbers, OTPs, or exact locations. Rejects malicious social engineering.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <RefreshCw className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Escrow & Wallet Refunds</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All locked rewards are secured in escrow. If the Receiver declines, fails the test, or the test link expires (1-72h), the gift value is instantly refunded to your internal wallet.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Interactive Process / How it Works Steps */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              Four Easy Steps
            </h2>
            <p className="mt-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
              Verify connection, lock a prize, and share a link. No download required for the Receiver.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            
            {/* Step 1 */}
            <div className="relative space-y-4">
              <div className="text-5xl font-extrabold text-white/5 absolute -top-6 left-0">01</div>
              <h3 className="text-base font-bold text-white pt-2">Set Up the Test</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Log in and choose a safe relationship template or input your own. Set the expected answer.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative space-y-4">
              <div className="text-5xl font-extrabold text-white/5 absolute -top-6 left-0">02</div>
              <h3 className="text-base font-bold text-white pt-2">Fund the Reward</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Select your reward type (MTN, Airtel, Glo, 9mobile airtime/data) and pay securely via Paystack.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative space-y-4">
              <div className="text-5xl font-extrabold text-white/5 absolute -top-6 left-0">03</div>
              <h3 className="text-base font-bold text-white pt-2">Share Anonymously</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generate a secure, tokenized anonymous link and share it directly via WhatsApp, SMS, or copy link.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative space-y-4">
              <div className="text-5xl font-extrabold text-white/5 absolute -top-6 left-0">04</div>
              <h3 className="text-base font-bold text-white pt-2">Get Results & Cashout</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If they match the answer, they unlock the gift. If they fail or ignore it, get your refund in your wallet.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-transparent to-black/60 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 blur-[120px] pointer-events-none -z-10 rounded-full" />
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center glass-panel rounded-3xl p-10 md:p-16 border border-white/5">
          <Heart className="h-10 w-10 text-primary mx-auto mb-6 fill-current animate-pulse-slow" />
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl tracking-tight">
            Ready to test relationship chemistry?
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-muted-foreground text-sm sm:text-base leading-relaxed">
            Create your account today, fund a locked gift, and share the secure link. Instant verification in under 2 minutes.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              href="/register"
              className="glow-primary w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary px-8 text-base font-semibold text-white transition-smooth hover:opacity-95"
            >
              Get Started Now
            </Link>
            <Link
              href="/pricing"
              className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-xl border border-white/10 px-8 text-base font-semibold text-white hover:bg-white/5 transition-smooth"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
