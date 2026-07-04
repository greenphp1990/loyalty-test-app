import React from "react";
import { ShieldCheck, UserX, AlertTriangle, Scale } from "lucide-react";

export default function TermsAndConditions() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-12">
      
      {/* Header */}
      <div className="text-center space-y-4 border-b border-white/5 pb-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Scale className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Terms and Conditions
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Last Updated: June 9, 2026. Effective immediately.
        </p>
      </div>

      {/* Body Content */}
      <div className="space-y-8 text-xs text-muted-foreground leading-relaxed">
        
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <UserX className="h-4.5 w-4.5 text-primary" />
            <span>1. Strict Anti-Harassment & Stalking Policy</span>
          </h2>
          <p>
            Loyalty Test is designed exclusively as a fun, mutual relationship-testing and gift-giving platform. We strictly prohibit utilizing the service for harassment, public shaming, blackmail, spying, or stalking. Senders are prohibited from creating tests containing abusive, threatening, or degrading custom questions. Violations will result in immediate permanent account suspension and freezing of active wallet balances.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <ShieldCheck className="h-4.5 w-4.5 text-secondary" />
            <span>2. Abuse Reports & Account Freezes</span>
          </h2>
          <p>
            Any Receiver has the right to block all future requests or flag a test as abusive. If multiple abuse reports are logged against a Sender, the system will automatically freeze the Sender&apos;s account and hold all pending escrow values. Frozen accounts are subject to manual audit by the Super Admin team, whose decisions are final and binding.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <AlertTriangle className="h-4.5 w-4.5 text-accent" />
            <span>3. Escrow, Fees & Refund Rules</span>
          </h2>
          <p>
            All test funds are kept in escrow until the Receiver answers the test, declines the link, or the link expires. If the test is unsuccessful (wrong answer, declined, or expired), the gift value is refunded to the Sender&apos;s wallet. The platform service fee (Basic: ₦500, Premium: ₦1,000) is consumed upon link generation to cover routing expenses and is non-refundable.
          </p>
        </section>

        <section className="space-y-3 bg-white/5 border border-white/5 rounded-2xl p-5">
          <h3 className="font-bold text-white text-xs mb-1">Acceptable Questions Limit</h3>
          <p className="text-[11px] text-muted-foreground">
            Custom questions must conform strictly to acceptable personal trivia parameters (first names, meeting locations, nicknames). Questions asking for OTP codes, card credentials, credentials, PINs, or financial secrets violate international security regulations and will be automatically flagged for law enforcement reporting.
          </p>
        </section>

      </div>

    </div>
  );
}
