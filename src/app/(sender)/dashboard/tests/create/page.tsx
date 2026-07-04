"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, User, Phone, MessageSquare, Gift, Sparkles, 
  ShieldCheck, Loader2, Check, AlertCircle, Copy, ExternalLink, 
  ArrowRight, ShieldAlert, CreditCard, Wallet 
} from "lucide-react";

interface QuestionTemplate {
  id: string;
  category: string;
  questionText: string;
  answerType: string;
}

interface PlatformSettings {
  featureFlags: {
    airtimeGifts: boolean;
    dataGifts: boolean;
    cashGifts: boolean;
    customQuestions: boolean;
  };
  settings: {
    minimumGiftAmount: number;
    maximumGiftAmount: number;
    basicTestFee: number;
  };
}

export default function CreateTestPage() {
  const router = useRouter();

  // Multi-step Stepper
  const [currentStep, setCurrentStep] = useState(1);
  const steps = [
    "Receiver Details",
    "Select Question",
    "Expected Answer",
    "Lock Gift",
    "Review Details",
    "Fund Link"
  ];

  // API Config settings
  const [templates, setTemplates] = useState<QuestionTemplate[]>([]);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [errorConfig, setErrorConfig] = useState<string | null>(null);

  // Form Fields State
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [optionalMessage, setOptionalMessage] = useState("");
  
  const [questionType, setQuestionType] = useState<"TEMPLATE" | "CUSTOM">("TEMPLATE");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [customQuestionText, setCustomQuestionText] = useState("");
  
  const [expectedAnswer, setExpectedAnswer] = useState("");
  
  const [giftType, setGiftType] = useState("AIRTIME");
  const [giftAmount, setGiftAmount] = useState(1000);
  const [expiresHours, setExpiresHours] = useState(24);

  // Operation States
  const [creating, setCreating] = useState(false);
  const [createdTest, setCreatedTest] = useState<{ id: string; token: string; amount: number } | null>(null);
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch Templates and Platform settings on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoadingConfig(true);
        // Fetch Settings
        const settingsRes = await fetch("/api/v1/sender/settings");
        if (!settingsRes.ok) throw new Error("Failed to load platform configuration settings.");
        const settingsData = await settingsRes.json();
        setSettings(settingsData);

        // Fetch Templates
        const templatesRes = await fetch("/api/v1/sender/questions/templates");
        if (!templatesRes.ok) throw new Error("Failed to load question templates.");
        const templatesData = await templatesRes.json();
        setTemplates(templatesData.templates || []);

        if (templatesData.templates?.length > 0) {
          setSelectedTemplateId(templatesData.templates[0].questionText);
        }
      } catch (err: any) {
        console.error("Config fetch error:", err);
        setErrorConfig(err.message || "An unexpected error occurred.");
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchConfig();
  }, []);

  const selectedQuestionText = questionType === "TEMPLATE" 
    ? selectedTemplateId 
    : customQuestionText;

  // Check if current question involves phone digits
  const isPhoneDigitsQuestion = selectedQuestionText.toLowerCase().includes("digits") || 
                                selectedQuestionText.toLowerCase().includes("phone number");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Stepper Validations
  const validateStep = () => {
    setErrorMessage(null);
    if (currentStep === 1) {
      if (!receiverName.trim()) {
        setErrorMessage("Please enter the receiver's name.");
        return false;
      }
      // Nigerian Phone validation regex: starts with E.164 (+234), 0, or raw 803...
      const phoneRegex = /^(?:\+?234|0)?([789][01]\d{8})$/;
      if (!phoneRegex.test(receiverPhone.replace(/\s+/g, ""))) {
        setErrorMessage("Please enter a valid Nigerian phone number (e.g. 08031234567).");
        return false;
      }
    }
    if (currentStep === 2) {
      if (questionType === "CUSTOM" && !customQuestionText.trim()) {
        setErrorMessage("Please enter your custom question.");
        return false;
      }
    }
    if (currentStep === 3) {
      if (!expectedAnswer.trim()) {
        setErrorMessage("Please enter the expected answer.");
        return false;
      }
      if (isPhoneDigitsQuestion) {
        // Enforce exactly 4 digits logic
        if (!/^\d{4}$/.test(expectedAnswer.trim())) {
          setErrorMessage("This question requires last 4 digits logic. Enter exactly 4 digits.");
          return false;
        }
      }
    }
    if (currentStep === 4) {
      const min = settings?.settings.minimumGiftAmount || 100;
      const max = settings?.settings.maximumGiftAmount || 50000;
      if (giftAmount < min || giftAmount > max) {
        setErrorMessage(`Escrow gift value must be between ₦${min.toLocaleString()} and ₦${max.toLocaleString()}.`);
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  // Submit step: POST save as awaiting payment
  const handleCreateTest = async () => {
    setCreating(true);
    setErrorMessage(null);
    try {
      const payload = {
        receiverName,
        receiverPhone,
        optionalMessage: optionalMessage || null,
        questionType,
        questionText: selectedQuestionText,
        expectedAnswer,
        giftType,
        giftAmount,
        expiresHours
      };

      const res = await fetch("/api/v1/sender/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create loyalty test link.");
      }

      setCreatedTest({
        id: data.testId,
        token: data.testToken,
        amount: data.totalAmount
      });
      setCurrentStep(6);
    } catch (err: any) {
      console.error("Test creation error:", err);
      setErrorMessage(err.message || "An unexpected server error occurred.");
    } finally {
      setCreating(false);
    }
  };

  // Pay Step: Fund the test link via Wallet or Paystack
  const handleFundTest = async (gateway: "WALLET" | "PAYSTACK") => {
    if (!createdTest) return;
    setPaying(true);
    setErrorMessage(null);
    try {
      if (gateway === "WALLET") {
        const res = await fetch(`/api/v1/sender/tests/${createdTest.id}/pay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gateway })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Payment transaction failed.");
        }

        setPaymentSuccess(true);
      } else {
        // PAYSTACK
        const res = await fetch("/api/v1/payments/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentType: "TEST_FUNDING",
            testId: createdTest.id
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to initialize Paystack payment.");
        }

        if (data.authorizationUrl) {
          window.location.href = data.authorizationUrl;
        } else {
          throw new Error("No authorization URL returned from payment gateway.");
        }
      }
    } catch (err: any) {
      console.error("Fund test error:", err);
      setErrorMessage(err.message || "An unexpected payment error occurred.");
    } finally {
      setPaying(false);
    }
  };

  const handleCopyLink = () => {
    if (!createdTest) return;
    const shareUrl = `${window.location.origin}/t/${createdTest.token}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loadingConfig) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Initializing creation settings...</p>
      </div>
    );
  }

  if (errorConfig) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <div className="glass-panel p-8 rounded-3xl border border-destructive/20 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold text-white">Initialization Error</h2>
          <p className="text-xs text-muted-foreground">{errorConfig}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full h-11 rounded-xl bg-white/5 border border-white/10 text-xs text-white hover:bg-white/10"
          >
            Retry Config Load
          </button>
        </div>
      </div>
    );
  }

  const basicFee = settings?.settings.basicTestFee || 500;
  const totalCharge = giftAmount + basicFee;
  const shareLinkUrl = createdTest ? `${window.location.origin}/t/${createdTest.token}` : "";

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-white/5 pb-6">
        <Link href="/dashboard" className="rounded-xl border border-white/5 bg-white/5 p-2 text-muted-foreground hover:text-white transition-smooth">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Create Loyalty Test</h1>
          <p className="text-xs text-muted-foreground">Setup an anonymous verification link and lock a reward.</p>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      {!paymentSuccess && (
        <div className="space-y-3">
          <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <span>Step {currentStep} of {steps.length}</span>
            <span className="text-white">{steps[currentStep - 1]}</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden flex">
            {steps.map((_, idx) => (
              <div 
                key={idx}
                className={`h-full flex-1 transition-smooth ${
                  idx + 1 <= currentStep ? "bg-gradient-to-r from-primary to-secondary" : ""
                } ${idx > 0 ? "border-l border-background" : ""}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Error Message Box */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start space-x-3">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: RECEIVER DETAILS */}
      {currentStep === 1 && (
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-5 animate-slide-up">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>1. Enter Receiver Information</span>
              <Sparkles className="h-4 w-4 text-secondary" />
            </h2>
            <p className="text-[10px] text-muted-foreground">Provide details about the partner you want to test verification for.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Receiver Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <input
                  type="text"
                  placeholder="e.g. Bisi"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 focus:border-primary/40 rounded-xl pl-10 pr-3 py-3 text-xs text-white placeholder-muted-foreground/40 focus:outline-none transition-smooth"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Receiver Phone</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <input
                  type="tel"
                  placeholder="e.g. 08031234567"
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 focus:border-primary/40 rounded-xl pl-10 pr-3 py-3 text-xs text-white placeholder-muted-foreground/40 focus:outline-none transition-smooth"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Optional Sweet Note (Anonymous)</label>
            <div className="relative">
              <MessageSquare className="absolute left-3.5 top-4 h-4 w-4 text-muted-foreground/60" />
              <textarea
                rows={3}
                placeholder="Attach a сладкий note (e.g. 'For my favorite person, answer this correctly to unlock a gift...')"
                value={optionalMessage}
                onChange={(e) => setOptionalMessage(e.target.value)}
                className="w-full bg-white/5 border border-white/5 focus:border-primary/40 rounded-xl pl-10 pr-3 py-3 text-xs text-white placeholder-muted-foreground/40 focus:outline-none transition-smooth resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-white/5">
            <button
              onClick={handleNext}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary px-6 text-xs font-bold text-white hover:opacity-95 transition-smooth"
            >
              <span>Next Step</span>
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: QUESTION SELECTION */}
      {currentStep === 2 && (
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-6 animate-slide-up">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white">2. Select Relationship Question</h2>
            <p className="text-[10px] text-muted-foreground">Select a safe template, or build your own custom question if permitted.</p>
          </div>

          {/* Toggle Type pills */}
          {settings?.featureFlags.customQuestions && (
            <div className="flex bg-black/25 p-1 rounded-xl border border-white/5 w-fit">
              <button
                onClick={() => setQuestionType("TEMPLATE")}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-smooth ${
                  questionType === "TEMPLATE" ? "bg-primary text-white" : "text-muted-foreground"
                }`}
              >
                Use Template
              </button>
              <button
                onClick={() => setQuestionType("CUSTOM")}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-smooth ${
                  questionType === "CUSTOM" ? "bg-primary text-white" : "text-muted-foreground"
                }`}
              >
                Custom Question
              </button>
            </div>
          )}

          {questionType === "TEMPLATE" ? (
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Choose Safe Template</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-3 text-xs text-white focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/40"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.questionText} className="bg-background text-white py-2">
                    ({t.category.replace("_", " ")}) - {t.questionText}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Enter Custom Question</label>
                <input
                  type="text"
                  placeholder="e.g. What is the nickname of my sister?"
                  value={customQuestionText}
                  onChange={(e) => setCustomQuestionText(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 focus:border-primary/40 rounded-xl px-4 py-3 text-xs text-white placeholder-muted-foreground/40 focus:outline-none transition-smooth"
                />
              </div>

              <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-[10px] text-muted-foreground flex items-start space-x-2">
                <ShieldAlert className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <span>
                  Custom questions undergo automated safety filters. Phishing for passwords, full phone numbers, PINs, card numbers, or government IDs is strictly prohibited and blocked automatically.
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-white/5">
            <button
              onClick={handleBack}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/5 bg-white/5 px-5 text-xs text-white hover:bg-white/10 transition-smooth"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary px-6 text-xs font-bold text-white hover:opacity-95 transition-smooth"
            >
              <span>Next Step</span>
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: EXPECTED ANSWER */}
      {currentStep === 3 && (
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-6 animate-slide-up">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white">3. Provide Expected Answer</h2>
            <p className="text-[10px] text-muted-foreground">The receiver must match this answer to unlock the reward.</p>
          </div>

          <div className="space-y-4">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-xs space-y-1">
              <span className="text-[9px] uppercase font-bold text-primary">Verification Question</span>
              <p className="text-white italic">"{selectedQuestionText}"</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Expected Answer</label>
              <input
                type="text"
                placeholder={isPhoneDigitsQuestion ? "e.g. 5678 (4 digits only)" : "e.g. Abel"}
                value={expectedAnswer}
                onChange={(e) => setExpectedAnswer(e.target.value)}
                maxLength={isPhoneDigitsQuestion ? 4 : undefined}
                className="w-full bg-white/5 border border-white/5 focus:border-primary/40 rounded-xl px-4 py-3 text-xs text-white placeholder-muted-foreground/40 focus:outline-none transition-smooth"
              />
            </div>

            {isPhoneDigitsQuestion && (
              <div className="rounded-xl bg-accent/10 border border-accent/20 p-3 text-[10px] text-accent flex items-start space-x-2">
                <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Last 4 Digits Logic Enabled:</strong> Since the question asks for digits or a phone number, the expected answer is restricted to exactly the last 4 digits of the phone number.
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-white/5">
            <button
              onClick={handleBack}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/5 bg-white/5 px-5 text-xs text-white hover:bg-white/10 transition-smooth"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary px-6 text-xs font-bold text-white hover:opacity-95 transition-smooth"
            >
              <span>Next Step</span>
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: GIFT SELECTION */}
      {currentStep === 4 && (
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-6 animate-slide-up">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white">4. Lock a Payout Reward</h2>
            <p className="text-[10px] text-muted-foreground">Select a reward type and value. The gift remains in secure escrow until answered.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Reward Type</label>
              <select
                value={giftType}
                onChange={(e) => setGiftType(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-3 text-xs text-white focus:outline-none focus:border-primary/40"
              >
                {settings?.featureFlags.airtimeGifts && (
                  <option value="AIRTIME">Mobile Airtime Payout</option>
                )}
                {settings?.featureFlags.dataGifts && (
                  <option value="DATA">Mobile Data Payout</option>
                )}
                {settings?.featureFlags.cashGifts && (
                  <option value="CASH">Cash Bank Payout</option>
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Amount (NGN)</label>
              <input
                type="number"
                value={giftAmount}
                onChange={(e) => setGiftAmount(Number(e.target.value))}
                min={settings?.settings.minimumGiftAmount || 100}
                max={settings?.settings.maximumGiftAmount || 50000}
                className="w-full bg-white/5 border border-white/5 focus:border-primary/40 rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-smooth"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Link Expiry Duration</label>
              <select
                value={expiresHours}
                onChange={(e) => setExpiresHours(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-3 text-xs text-white focus:outline-none"
              >
                <option value={1}>1 Hour</option>
                <option value={6}>6 Hours</option>
                <option value={24}>24 Hours (Recommended)</option>
                <option value={48}>48 Hours</option>
                <option value={72}>72 Hours</option>
              </select>
            </div>
            <div className="flex items-end text-[10px] text-muted-foreground pb-2">
              If unanswered after expiry, the gift amount is refunded to your wallet.
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-white/5">
            <button
              onClick={handleBack}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/5 bg-white/5 px-5 text-xs text-white hover:bg-white/10 transition-smooth"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary px-6 text-xs font-bold text-white hover:opacity-95 transition-smooth"
            >
              <span>Next Step</span>
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: REVIEW DETAILS */}
      {currentStep === 5 && (
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-6 animate-slide-up">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white">5. Review Test Parameters</h2>
            <p className="text-[10px] text-muted-foreground">Verify details before creating the test link. The test will save as awaiting payment.</p>
          </div>

          <div className="divide-y divide-white/5 text-xs">
            <div className="flex justify-between py-3">
              <span className="text-muted-foreground">Receiver Partner</span>
              <span className="font-semibold text-white">{receiverName} ({receiverPhone})</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-muted-foreground">Verification Question</span>
              <span className="font-semibold text-white max-w-[200px] truncate text-right">"{selectedQuestionText}"</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-muted-foreground">Expected Answer</span>
              <span className="font-semibold text-white">•••••••• (Hidden)</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-muted-foreground">Locked Gift Escrow</span>
              <span className="font-semibold text-white">{formatCurrency(giftAmount)} {giftType}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-muted-foreground">Link Expiry</span>
              <span className="font-semibold text-white">{expiresHours} Hours</span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-3">
            <h3 className="text-[10px] uppercase tracking-wider font-bold text-white">Cost Breakdown</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Service Fee</span>
                <span className="font-semibold text-white">{formatCurrency(basicFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Locked Escrow Gift</span>
                <span className="font-semibold text-white">{formatCurrency(giftAmount)}</span>
              </div>
              <div className="h-px bg-white/10 my-2" />
              <div className="flex justify-between text-sm font-bold">
                <span className="text-white">Total Charge</span>
                <span className="text-primary">{formatCurrency(totalCharge)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-white/5">
            <button
              onClick={handleBack}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/5 bg-white/5 px-5 text-xs text-white hover:bg-white/10 transition-smooth"
            >
              Back
            </button>
            <button
              onClick={handleCreateTest}
              disabled={creating}
              className="glow-primary inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary px-6 text-xs font-bold text-white hover:opacity-95 transition-smooth disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  <span>Saving Test...</span>
                </>
              ) : (
                <span>Confirm &amp; Save Test</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: FUND TEST LINK */}
      {currentStep === 6 && createdTest && (
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-6 animate-slide-up">
          
          {!paymentSuccess ? (
            <>
              <div className="text-center space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/15 text-secondary border border-secondary/20">
                  <CreditCard className="h-6 w-6 animate-pulse" />
                </div>
                <h2 className="text-lg font-bold text-white">Fund Verification Test Link</h2>
                <p className="text-xs text-muted-foreground">
                  Fund the locked escrow gift of {formatCurrency(giftAmount)} + service fee. Senders cannot generate links until payment is verified.
                </p>
              </div>

              <div className="bg-black/35 rounded-2xl border border-white/5 p-4 flex justify-between items-center text-xs">
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase font-semibold">Total Invoice Amount</p>
                  <p className="text-white text-lg font-extrabold mt-0.5">{formatCurrency(createdTest.amount)}</p>
                </div>
                <span className="text-[10px] bg-secondary/15 border border-secondary/20 text-secondary px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                  Awaiting Payment
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                
                {/* Paystack mock */}
                <button
                  onClick={() => handleFundTest("PAYSTACK")}
                  disabled={paying}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-smooth gap-3 group text-center cursor-pointer"
                >
                  <CreditCard className="h-6 w-6 text-secondary group-hover:scale-105 transition-transform" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Pay via Paystack</h4>
                    <p className="text-[9px] text-muted-foreground mt-0.5">Fund using card, bank, or transfer</p>
                  </div>
                </button>

                {/* Wallet Balance */}
                <button
                  onClick={() => handleFundTest("WALLET")}
                  disabled={paying}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-smooth gap-3 group text-center cursor-pointer"
                >
                  <Wallet className="h-6 w-6 text-primary group-hover:scale-105 transition-transform" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Use Wallet Balance</h4>
                    <p className="text-[9px] text-muted-foreground mt-0.5">Deduct from your pre-funded credits</p>
                  </div>
                </button>

              </div>

              {paying && (
                <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground py-2 animate-pulse">
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  <span>Verifying payment transaction...</span>
                </div>
              )}
            </>
          ) : (
            // Success Verification Screen
            <div className="text-center space-y-6 py-4 animate-scale-in">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent border border-accent/25 animate-bounce-slow">
                <Check className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">Verification Link Funded &amp; Active!</h2>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  The {formatCurrency(giftAmount)} {giftType} payout is securely locked in escrow. Share this anonymous link with {receiverName}.
                </p>
              </div>

              {/* Link copy widget */}
              <div className="space-y-2 max-w-md mx-auto">
                <label className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block text-left">Receiver Verification Link</label>
                <div className="flex bg-black/40 rounded-xl border border-white/5 overflow-hidden">
                  <input
                    type="text"
                    readOnly
                    value={shareLinkUrl}
                    className="flex-1 bg-transparent px-3 py-2 text-xs text-white focus:outline-none select-all font-mono"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="bg-white/5 border-l border-white/5 px-3 py-2 hover:bg-white/10 transition-smooth flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    {copied ? (
                      <span className="text-accent text-[10px] font-bold">Copied!</span>
                    ) : (
                      <Copy className="h-4 w-4 text-white" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-4 border-t border-white/5">
                <Link
                  href="/dashboard/tests"
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-white/5 bg-white/5 px-5 text-xs font-semibold text-white hover:bg-white/10 transition-smooth"
                >
                  Manage Tests
                </Link>
                <a
                  href={`/t/${createdTest.token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 text-xs font-semibold text-white hover:bg-primary-light transition-smooth"
                >
                  <span>Preview Link</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
