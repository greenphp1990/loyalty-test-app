import React from "react";
import { Shield, Eye, Lock, FileText } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-12">
      
      {/* Header */}
      <div className="text-center space-y-4 border-b border-white/5 pb-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Shield className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Last Updated: June 9, 2026. Effective immediately.
        </p>
      </div>

      {/* Body Content */}
      <div className="space-y-8 text-xs text-muted-foreground leading-relaxed">
        
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Eye className="h-4.5 w-4.5 text-primary" />
            <span>1. Data Minimization Principles</span>
          </h2>
          <p>
            At Loyalty Test, we value data minimization. We only collect details that are essential for processing the secure test. For Senders, we collect name, email, verified phone number, and password hash. For Receivers, we do not require registration and do not collect contact lists, SMS logs, call logs, exact location coordinates, private photos, or banking credentials.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Lock className="h-4.5 w-4.5 text-secondary" />
            <span>2. Answer Encryption & Phone Masking</span>
          </h2>
          <p>
            To prevent leaks, expected answers are encrypted using cryptographically strong keys before storage. Expected answers are never returned via public APIs or rendered directly in the browser source. Furthermore, all phone numbers rendered in dashboards or result logs are masked (e.g. <code>080****5678</code>) to protect user identity from unauthorized viewers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Shield className="h-4.5 w-4.5 text-accent" />
            <span>3. No Contact Mining or Tracking</span>
          </h2>
          <p>
            We strictly enforce that our web application and future APK wrappers do not request sensitive device permissions. We never download or access your mobile contact lists, read your location, inspect storage files, or use tracking pixels to gather marketing data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <FileText className="h-4.5 w-4.5 text-primary" />
            <span>4. Data Retention & Erasure</span>
          </h2>
          <p>
            You have the absolute right to delete your account. Senders can click the &ldquo;Delete Account&rdquo; option in their profile settings. This action initiates a cascade delete that permanently wipes account profiles, wallets, and transaction ledgers from active databases, leaving only anonymized audit counts where required by financial compliance regulators.
          </p>
        </section>

        <section className="space-y-3 bg-white/5 border border-white/5 rounded-2xl p-5">
          <h3 className="font-bold text-white text-xs mb-1">Nigerian Data Protection Regulation (NDPR)</h3>
          <p className="text-[11px] text-muted-foreground">
            Our data processing operations are governed under NDPR compliance rules. If you have inquiries regarding how your personal information is stored or wish to submit a data rectification request, please email our Data Protection Officer at <code>dpo@loyaltytest.app</code>.
          </p>
        </section>

      </div>

    </div>
  );
}
