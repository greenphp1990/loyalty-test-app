import React from "react";
import Link from "next/link";
import { Check, Info, Shield, ShieldAlert, Sparkles, Heart } from "lucide-react";

export default function Pricing() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-16">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Simple, Transparent Pricing
        </h1>
        <p className="mt-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
          You only pay the platform service fee to create the test link, plus the value of the gift you lock. 
          If the test fails or expires, the gift value is returned to your wallet.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        
        {/* Basic Test */}
        <div className="glass-panel p-8 rounded-3xl border border-white/5 space-y-6 flex flex-col justify-between relative">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">Basic Test</span>
              <span className="text-xs bg-white/5 border border-white/5 text-muted-foreground px-2.5 py-1 rounded-full">Single Question</span>
            </div>
            <div className="flex items-baseline">
              <span className="text-4xl font-extrabold text-white">₦500</span>
              <span className="text-xs text-muted-foreground ml-2">/ service fee</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Perfect for checking key relationship details with a single targeted question. Recommended for quick check-ins.
            </p>
            
            <div className="h-px bg-white/5" />
            
            <ul className="space-y-3 text-xs text-muted-foreground">
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>1 Safe Relationship Question</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>Lock Airtime or Data Reward</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>1 Anonymous Reminder SMS/WhatsApp</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>Intelligent Answer Matching (Normal)</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>Full refund to wallet on expiration</span>
              </li>
            </ul>
          </div>
          
          <Link
            href="/register"
            className="w-full inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white hover:bg-white/10 transition-smooth mt-6"
          >
            Choose Basic
          </Link>
        </div>

        {/* Premium Test */}
        <div className="glass-panel p-8 rounded-3xl border border-primary/20 space-y-6 flex flex-col justify-between relative bg-gradient-to-b from-primary/5 to-transparent">
          <div className="absolute -top-3.5 right-6 inline-flex items-center space-x-1 rounded-full bg-gradient-to-r from-primary to-secondary px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
            <Sparkles className="h-3 w-3" />
            <span>Most Thorough</span>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-secondary uppercase tracking-wider">Premium Test</span>
              <span className="text-xs bg-secondary/15 border border-secondary/20 text-secondary px-2.5 py-1 rounded-full">Multi-Question</span>
            </div>
            <div className="flex items-baseline">
              <span className="text-4xl font-extrabold text-white">₦1,000</span>
              <span className="text-xs text-muted-foreground ml-2">/ service fee</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Permits multiple questions to verify matching memories and details. Higher verification rate.
            </p>
            
            <div className="h-px bg-white/5" />
            
            <ul className="space-y-3 text-xs text-muted-foreground">
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-secondary shrink-0" />
                <span>2 or 3 Safe Relationship Questions</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-secondary shrink-0" />
                <span>Lock Airtime, Data or Cash Reward</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-secondary shrink-0" />
                <span>Custom Question Template Builder</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-secondary shrink-0" />
                <span>Advanced Matching (Strict/Normal/Flexible)</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-secondary shrink-0" />
                <span>Urgency Timer customization (1h - 72h)</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-secondary shrink-0" />
                <span>Priority admin review & audit trail</span>
              </li>
            </ul>
          </div>
          
          <Link
            href="/register"
            className="glow-primary w-full inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary text-sm font-semibold text-white transition-smooth mt-6"
          >
            Choose Premium
          </Link>
        </div>

      </div>

      {/* Dynamic Example Calculator */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 max-w-2xl mx-auto space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Info className="h-4 w-4 text-accent" />
          <span>Payment Breakdown Example</span>
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your total payment consists of the <strong>Service Fee</strong> (keeps the platform servers, API gateways, and SMS services running) plus the <strong>Gift Value</strong> you wish to lock for your partner.
        </p>

        <div className="bg-black/20 rounded-2xl p-4 border border-white/5 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Basic Service Fee</span>
            <span className="font-semibold text-white">₦500</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">MTN Airtime Gift Value (Secured in Escrow)</span>
            <span className="font-semibold text-white">₦1,000</span>
          </div>
          <div className="h-px bg-white/5 my-2" />
          <div className="flex justify-between text-sm font-bold">
            <span className="text-white">Total Checkout Amount</span>
            <span className="text-primary">₦1,500</span>
          </div>
        </div>

        <div className="rounded-xl bg-white/5 p-4 border border-white/5 text-[11px] text-muted-foreground flex items-start space-x-2">
          <Shield className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <span>
            <strong>Refund Guarantee:</strong> If the Receiver types the wrong answer, declines the test, or ignores the link, the ₦1,000 gift value is instantly credited back to your internal wallet. The ₦500 service fee is non-refundable as it covers gateway transaction and SMS api distribution costs.
          </span>
        </div>
      </div>

    </div>
  );
}
