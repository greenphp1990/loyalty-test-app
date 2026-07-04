import React from "react";
import { HelpCircle, ShieldAlert, Lock, RefreshCw, EyeOff } from "lucide-react";

export default function FAQ() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-12">
      
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
          Everything you need to know about anonymity, payment escrow, safety boundaries, and refunds.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-6">
        
        {/* Q1 */}
        <details className="group glass-panel rounded-2xl border border-white/5 p-6 [&_summary::-webkit-details-marker]:hidden open:border-primary/20">
          <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-white">
            <h2 className="text-sm font-bold flex items-center space-x-2">
              <EyeOff className="h-4 w-4 text-primary shrink-0" />
              <span>Is my identity truly anonymous to the Receiver?</span>
            </h2>
            <span className="relative h-5 w-5 shrink-0">
              <span className="absolute inset-0 rounded-full bg-white/5 group-open:bg-primary/20" />
              <span className="absolute top-1/2 left-1/2 h-2.5 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-white transition-smooth group-open:rotate-90" />
              <span className="absolute top-1/2 left-1/2 h-0.5 w-2.5 -translate-x-1/2 -translate-y-1/2 bg-white transition-smooth group-open:rotate-90" />
            </span>
          </summary>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Yes. The platform generates a unique, cryptographically random link (e.g. <code>/t/abc123xyz</code>) that contains no identifiers of the Sender. We do not expose your email, name, wallet, or billing details. The Receiver only sees the locked gift card notice and the relationship question.
          </p>
        </details>

        {/* Q2 */}
        <details className="group glass-panel rounded-2xl border border-white/5 p-6 [&_summary::-webkit-details-marker]:hidden open:border-primary/20">
          <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-white">
            <h2 className="text-sm font-bold flex items-center space-x-2">
              <Lock className="h-4 w-4 text-secondary shrink-0" />
              <span>How does the Question Safety Engine protect users?</span>
            </h2>
            <span className="relative h-5 w-5 shrink-0">
              <span className="absolute inset-0 rounded-full bg-white/5 group-open:bg-primary/20" />
              <span className="absolute top-1/2 left-1/2 h-2.5 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-white transition-smooth group-open:rotate-90" />
              <span className="absolute top-1/2 left-1/2 h-0.5 w-2.5 -translate-x-1/2 -translate-y-1/2 bg-white transition-smooth group-open:rotate-90" />
            </span>
          </summary>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Safety is our core requirement. Senders cannot type unrestricted free-text questions without them passing through our safety engine. The engine uses automated keyword blocklists and regex pattern filters to prevent requests for passwords, bank PINs, card CVVs, BVNs, NINs, OTP codes, or full third-party phone numbers.
          </p>
        </details>

        {/* Q3 */}
        <details className="group glass-panel rounded-2xl border border-white/5 p-6 [&_summary::-webkit-details-marker]:hidden open:border-primary/20">
          <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-white">
            <h2 className="text-sm font-bold flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 text-accent shrink-0" />
              <span>What happens if the Receiver answers incorrectly or declines?</span>
            </h2>
            <span className="relative h-5 w-5 shrink-0">
              <span className="absolute inset-0 rounded-full bg-white/5 group-open:bg-primary/20" />
              <span className="absolute top-1/2 left-1/2 h-2.5 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-white transition-smooth group-open:rotate-90" />
              <span className="absolute top-1/2 left-1/2 h-0.5 w-2.5 -translate-x-1/2 -translate-y-1/2 bg-white transition-smooth group-open:rotate-90" />
            </span>
          </summary>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            If the Receiver types the wrong answer, declines the test link, or ignores it until it expires, the gift value is returned to the Sender&apos;s wallet. You can use this wallet credit to fund a new test or withdraw it (if withdrawals are enabled by the Super Admin). The platform service fee is non-refundable.
          </p>
        </details>

        {/* Q4 */}
        <details className="group glass-panel rounded-2xl border border-white/5 p-6 [&_summary::-webkit-details-marker]:hidden open:border-primary/20">
          <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-white">
            <h2 className="text-sm font-bold flex items-center space-x-2">
              <ShieldAlert className="h-4 w-4 text-primary shrink-0" />
              <span>What anti-harassment limits are in place?</span>
            </h2>
            <span className="relative h-5 w-5 shrink-0">
              <span className="absolute inset-0 rounded-full bg-white/5 group-open:bg-primary/20" />
              <span className="absolute top-1/2 left-1/2 h-2.5 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-white transition-smooth group-open:rotate-90" />
              <span className="absolute top-1/2 left-1/2 h-0.5 w-2.5 -translate-x-1/2 -translate-y-1/2 bg-white transition-smooth group-open:rotate-90" />
            </span>
          </summary>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            We strictly enforce anti-stalking rules. Senders can send a maximum of 5 tests per day, and a maximum of 2 tests to the same phone number per week. Senders can only send 1 automated reminder. Receivers have permanent options to block all future requests from the system or report abuse. Flagged tests freeze escrow funds immediately for admin audit.
          </p>
        </details>

        {/* Q5 */}
        <details id="abuse" className="group glass-panel rounded-2xl border border-white/5 p-6 [&_summary::-webkit-details-marker]:hidden open:border-primary/20">
          <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-white">
            <h2 className="text-sm font-bold flex items-center space-x-2">
              <HelpCircle className="h-4 w-4 text-secondary shrink-0" />
              <span>How do I contact customer support to report a violation?</span>
            </h2>
            <span className="relative h-5 w-5 shrink-0">
              <span className="absolute inset-0 rounded-full bg-white/5 group-open:bg-primary/20" />
              <span className="absolute top-1/2 left-1/2 h-2.5 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-white transition-smooth group-open:rotate-90" />
              <span className="absolute top-1/2 left-1/2 h-0.5 w-2.5 -translate-x-1/2 -translate-y-1/2 bg-white transition-smooth group-open:rotate-90" />
            </span>
          </summary>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            If you received a link that you believe violates our terms, or if you are experiencing harassment, please email us immediately at <code>support@loyaltytest.app</code>. Please include the token code from the URL. Our support admin reviews abuse logs 24/7 and suspends offending accounts instantly.
          </p>
        </details>

      </div>

    </div>
  );
}
