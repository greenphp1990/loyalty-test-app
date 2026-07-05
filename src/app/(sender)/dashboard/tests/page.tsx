"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, ArrowLeft, ClipboardList, Loader2, Copy, Check, ExternalLink, Calendar, Search } from "lucide-react";

interface LoyaltyTest {
  id: string;
  receiverName: string;
  receiverPhone: string;
  questionText: string;
  giftType: string;
  giftAmount: number;
  testStatus: string;
  resultStatus: string | null;
  matchScore: number | null;
  createdAt: string;
  testToken: string;
  reminderSentAt?: string | null;
  paymentStatus: string;
  serviceFee: number;
  totalAmount: number;
}

export default function LoyaltyTestsPage() {
  const [tests, setTests] = useState<LoyaltyTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED" | "ARCHIVED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Reminder states
  const [reminderModalTest, setReminderModalTest] = useState<LoyaltyTest | null>(null);
  const [reminderMethod, setReminderMethod] = useState<"SMS" | "WHATSAPP">("WHATSAPP");
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderSuccess, setReminderSuccess] = useState<string | null>(null);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [reminderDebug, setReminderDebug] = useState<any | null>(null);

  // Payment states
  const [paymentModalTest, setPaymentModalTest] = useState<LoyaltyTest | null>(null);
  const [funding, setFunding] = useState(false);
  const [fundingError, setFundingError] = useState<string | null>(null);

  // Fetch settings map
  const [senderSettings, setSenderSettings] = useState<any | null>(null);

  const isWhatsAppConfigured = senderSettings?.messagingConfig?.whatsappConfigured ?? true;
  const isWhatsAppSendingEnabled = senderSettings?.featureFlags?.whatsappSending ?? true;
  const isWhatsAppSelectable = isWhatsAppConfigured && isWhatsAppSendingEnabled;

  const isSmsConfigured = senderSettings?.messagingConfig?.smsConfigured ?? true;
  const isSmsSendingEnabled = senderSettings?.featureFlags?.smsSending ?? false;
  const isSmsSelectable = isSmsConfigured && isSmsSendingEnabled;

  const openReminderModal = (test: LoyaltyTest) => {
    setReminderModalTest(test);
    if (isWhatsAppSelectable) {
      setReminderMethod("WHATSAPP");
    } else {
      setReminderMethod("SMS");
    }
  };

  const closeReminderModal = () => {
    if (sendingReminder) return;
    setReminderModalTest(null);
    setReminderSuccess(null);
    setReminderError(null);
    setReminderDebug(null);
  };

  const handleSendReminder = async () => {
    if (!reminderModalTest) return;
    setSendingReminder(true);
    setReminderError(null);
    setReminderSuccess(null);
    setReminderDebug(null);

    try {
      const isWhatsApp = reminderMethod === "WHATSAPP";
      const endpoint = `/api/v1/sender/tests/${reminderModalTest.id}/send-message`;
      const payload = { channel: reminderMethod };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        if (isWhatsApp) {
          setReminderDebug(data.debug || null);
        }
        throw new Error(data.error || data.message || "Failed to send message reminder.");
      }

      // Update tests state
      setTests((prev) =>
        prev.map((t) =>
          t.id === reminderModalTest.id ? { ...t, reminderSentAt: new Date().toISOString() } : t
        )
      );

      setReminderSuccess(
        isWhatsApp 
          ? "WhatsApp message submitted successfully." 
          : (data.message || "Reminder sent successfully!")
      );

      setTimeout(() => {
        closeReminderModal();
      }, 2200);
    } catch (err: any) {
      console.error("Reminder error:", err);
      setReminderError(err.message || "An unexpected error occurred.");
    } finally {
      setSendingReminder(false);
    }
  };

  const handleFundTest = async (testId: string, gateway: "WALLET" | "PAYSTACK") => {
    setFunding(true);
    setFundingError(null);
    try {
      if (gateway === "WALLET") {
        const res = await fetch(`/api/v1/sender/tests/${testId}/pay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gateway })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Payment transaction failed.");
        }

        // Update tests list in state
        setTests((prev) =>
          prev.map((t) =>
            t.id === testId ? { ...t, paymentStatus: "SUCCESSFUL" } : t
          )
        );
        setPaymentModalTest(null);
      } else {
        // PAYSTACK
        const res = await fetch("/api/v1/payments/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentType: "TEST_FUNDING",
            testId
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
      setFundingError(err.message || "An unexpected payment error occurred.");
    } finally {
      setFunding(false);
    }
  };



  useEffect(() => {
    const fetchTestsAndSettings = async () => {
      try {
        setLoading(true);
        const [testsRes, settingsRes] = await Promise.all([
          fetch("/api/v1/sender/tests"),
          fetch("/api/v1/sender/settings")
        ]);

        if (!testsRes.ok) throw new Error("Failed to fetch loyalty tests.");
        const testsData = await testsRes.json();
        setTests(testsData.tests || []);

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setSenderSettings(settingsData);
        }
      } catch (err: any) {
        console.error("Fetch tests and settings error:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchTestsAndSettings();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleCopyLink = (token: string) => {
    const origin = window.location.origin;
    const testUrl = `${origin}/t/${token}`;
    navigator.clipboard.writeText(testUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const filteredTests = tests.filter((t) => {
    // Apply search filter
    const matchesSearch = 
      t.receiverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.receiverPhone.includes(searchQuery) ||
      t.questionText.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // Apply status filter
    if (filter === "ALL") return true;
    if (filter === "ACTIVE") return t.testStatus === "ACTIVE";
    if (filter === "COMPLETED") return t.testStatus === "COMPLETED";
    if (filter === "ARCHIVED") return ["EXPIRED", "DECLINED", "REPORTED"].includes(t.testStatus);
    return true;
  });

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading loyalty tests...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center space-x-3">
          <Link href="/dashboard" className="rounded-xl border border-white/5 bg-white/5 p-2 text-muted-foreground hover:text-white transition-smooth">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              <span>Loyalty Tests</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">View and manage all your active and historical testing links.</p>
          </div>
        </div>
        <div>
          <Link
            href="/dashboard/tests/create"
            className="glow-primary inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary px-4 text-xs font-semibold text-white transition-smooth"
          >
            <Plus className="mr-1 h-4 w-4" />
            <span>Create New Test</span>
          </Link>
        </div>
      </div>

      {error ? (
        <div className="glass-panel p-8 rounded-3xl border border-destructive/20 text-center space-y-4 max-w-md mx-auto">
          <p className="text-xs text-destructive">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full h-10 rounded-xl bg-white/5 border border-white/10 text-xs text-white hover:bg-white/10"
          >
            Retry Loading
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
            {/* Status Filter Tab Pills */}
            <div className="flex bg-black/25 p-1 rounded-xl border border-white/5">
              {(["ALL", "ACTIVE", "COMPLETED", "ARCHIVED"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-smooth ${
                    filter === tab
                      ? "bg-primary text-white shadow-md"
                      : "text-muted-foreground hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
              <input
                type="text"
                placeholder="Search receiver or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/25 border border-white/5 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-primary/40 placeholder-muted-foreground/45"
              />
            </div>
          </div>

          {/* Tests Grid */}
          {filteredTests.length === 0 ? (
            <div className="glass-panel p-12 rounded-3xl border border-white/5 text-center space-y-4">
              <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground/35" />
              <div>
                <p className="text-xs font-bold text-white">No Matching Tests</p>
                <p className="text-[10px] text-muted-foreground">Try modifying your filter/search query, or create a new test.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTests.map((test) => {
                const isCopied = copiedToken === test.testToken;
                const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/test/${test.testToken}` : "";
                
                return (
                  <div
                    key={test.id}
                    className="glass-panel p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-smooth flex flex-col justify-between space-y-6 relative overflow-hidden group"
                  >
                    {/* Top row */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-bold text-white">{test.receiverName}</h3>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{test.receiverPhone}</p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold border uppercase ${
                          test.paymentStatus === "PENDING" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                          test.testStatus === "COMPLETED" ? "bg-white/5 border-white/10 text-muted-foreground" :
                          test.testStatus === "ACTIVE" ? "bg-secondary/10 border-secondary/20 text-secondary" :
                          test.testStatus === "EXPIRED" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                          test.testStatus === "DECLINED" ? "bg-destructive/10 border-destructive/20 text-destructive" :
                          "bg-destructive/10 border-destructive/20 text-destructive"
                        }`}>
                          {test.paymentStatus === "PENDING" ? "Awaiting Payment" : test.testStatus}
                        </span>
                      </div>

                      {/* Question Text */}
                      <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Question Set</p>
                        <p className="text-xs text-white/90 font-medium italic line-clamp-2">"{test.questionText}"</p>
                      </div>
                    </div>

                    {/* Meta info & Action buttons */}
                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <p className="text-muted-foreground">Reward Value</p>
                          <p className="font-bold text-white mt-0.5">
                            {formatCurrency(test.giftAmount)} {test.giftType}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Created</span>
                          </p>
                          <p className="font-bold text-white mt-0.5">{formatDate(test.createdAt)}</p>
                        </div>
                      </div>

                      {/* Result status */}
                      {test.testStatus === "COMPLETED" && (
                        <div className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-xl border border-white/5 text-[10px]">
                          <span className="text-muted-foreground">Test Result</span>
                          <span className={`font-bold flex items-center gap-1 ${
                            test.resultStatus === "PASSED" ? "text-accent" :
                            test.resultStatus === "PARTIAL_PASS" ? "text-amber-400" :
                            "text-destructive"
                          }`}>
                            {test.resultStatus} 
                            {test.matchScore !== null && ` (${test.matchScore}%)`}
                          </span>
                        </div>
                      )}

                      {/* URL Copy Button */}
                      {test.testStatus === "ACTIVE" && (
                        <div className="space-y-2">
                          {test.paymentStatus === "PENDING" ? (
                            <button
                              onClick={() => setPaymentModalTest(test)}
                              className="w-full inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-[10px] font-bold text-white hover:opacity-95 transition-smooth cursor-pointer"
                            >
                              <span>Complete Payment</span>
                            </button>
                          ) : (
                            <>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleCopyLink(test.testToken)}
                                  className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-white hover:bg-white/10 transition-smooth cursor-pointer"
                                >
                                  {isCopied ? (
                                    <>
                                      <Check className="h-3.5 w-3.5 text-accent" />
                                      <span className="text-accent">Copied Link!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3.5 w-3.5" />
                                      <span>Copy Link</span>
                                    </>
                                  )}
                                </button>
                                <a
                                  href={`/t/${test.testToken}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-smooth"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </div>

                              {/* Reminder button */}
                              <div className="pt-2 border-t border-white/5 flex gap-2">
                                {test.reminderSentAt ? (
                                  <div className="w-full flex h-9 items-center justify-center gap-1.5 rounded-xl bg-white/5 text-[9px] font-bold text-muted-foreground/50 uppercase border border-white/5">
                                    <span>Reminder Sent</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => openReminderModal(test)}
                                    className="w-full inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-secondary/15 border border-secondary/20 hover:bg-secondary/25 text-[10px] font-bold text-secondary transition-smooth cursor-pointer"
                                  >
                                    <span>Remind Partner</span>
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* GORGEOUS PREMIUM GLASSMORPHIC REMINDER MODAL */}
      {reminderModalTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in">
          {/* Backdrop */}
          <div 
            onClick={closeReminderModal}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Dialog Panel */}
          <div className="relative w-full max-w-md bg-[#0c0f14]/90 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 z-10 animate-scale-in">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Send Test Reminder</h3>
              <p className="text-[10px] text-muted-foreground">
                Remind {reminderModalTest.receiverName} to complete their loyalty test verification. Limit: exactly **one** reminder.
              </p>
            </div>

            {reminderSuccess && (
              <div className="p-3.5 rounded-xl bg-accent/15 border border-accent/25 text-xs text-accent">
                {reminderSuccess}
              </div>
            )}

            {reminderError && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-destructive/15 border border-destructive/25 text-xs text-destructive">
                  {reminderError}
                </div>
                
                {/* Developer debug panel */}
                {reminderDebug && (
                  <div className="bg-black/45 p-4 rounded-2xl border border-white/10 text-[10px] space-y-2 text-muted-foreground">
                    <p className="font-bold text-white uppercase tracking-wider text-xs border-b border-white/5 pb-1">Provider Debug Information</p>
                    <div className="grid grid-cols-2 gap-2 font-mono">
                      <div>Provider:</div>
                      <div className="text-white">
                        {reminderDebug.endpoint && (reminderDebug.endpoint.includes("wasenderapi") || reminderDebug.endpoint.includes("send-message")) ? "wasenderapi" : "brevo"}
                      </div>
                      <div>HTTP Status:</div>
                      <div className="text-white">{reminderDebug.httpStatus || "N/A"}</div>
                      <div>Stage:</div>
                      <div className="text-yellow-400 font-semibold">{reminderDebug.stage || "N/A"}</div>
                      <div>Recipient Format:</div>
                      <div className="text-white">{reminderDebug.recipientFormat || "N/A"}</div>
                      
                      {/* WasenderAPI specific session status */}
                      {(reminderDebug.providerResponse?.data?.status || reminderDebug.providerResponse?.status) && (
                        <>
                          <div>Session Status / JID:</div>
                          <div className="text-white">
                            {reminderDebug.providerResponse?.data?.status || reminderDebug.providerResponse?.status || "N/A"} 
                            {reminderDebug.providerResponse?.data?.jid ? ` (${reminderDebug.providerResponse.data.jid})` : ""}
                          </div>
                        </>
                      )}

                      {/* Raw Provider Response */}
                      <div>Response Payload:</div>
                      <div className="text-white max-h-24 overflow-y-auto col-span-2 bg-black/30 p-1.5 rounded border border-white/5 whitespace-pre-wrap">
                        {JSON.stringify(reminderDebug.providerResponse || reminderDebug.brevoResponse || reminderDebug, null, 2)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!reminderSuccess && (
              <>
                {/* Method selector options */}
                <div className="space-y-3">
                  <label className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block">Reminder Method</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* WhatsApp option */}
                    <button
                      type="button"
                      disabled={!isWhatsAppSelectable}
                      onClick={() => setReminderMethod("WHATSAPP")}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-smooth gap-1 text-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        reminderMethod === "WHATSAPP" && isWhatsAppSelectable
                          ? "bg-primary/10 border-primary text-white"
                          : "border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10"
                      }`}
                    >
                      <span className="text-xs font-bold text-white">WhatsApp Direct</span>
                      <span className="text-[9px] text-muted-foreground/60">Generate free link</span>
                      {!isWhatsAppSelectable && (
                        <span className="text-[8px] text-destructive/80 font-medium mt-1">
                          {!isWhatsAppConfigured ? "WhatsApp provider not configured." : "WhatsApp sending disabled."}
                        </span>
                      )}
                    </button>

                    {/* SMS option */}
                    <button
                      type="button"
                      disabled={!isSmsSelectable}
                      onClick={() => setReminderMethod("SMS")}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-smooth gap-1 text-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        reminderMethod === "SMS" && isSmsSelectable
                          ? "bg-primary/10 border-primary text-white"
                          : "border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10"
                      }`}
                    >
                      <span className="text-xs font-bold text-white">Direct Carrier SMS</span>
                      <span className="text-[9px] text-accent font-medium">Costs ₦15 (Wallet)</span>
                      {!isSmsSelectable && (
                        <span className="text-[8px] text-destructive/80 font-medium mt-1">
                          {!isSmsConfigured ? "SMS provider not configured." : "SMS sending disabled."}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 text-[9px] text-muted-foreground">
                  Your receiver number: <strong className="text-white font-mono">{reminderModalTest.receiverPhone}</strong>.
                  Once sent, the link state remains locked until answered.
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    disabled={sendingReminder}
                    onClick={closeReminderModal}
                    className="flex-1 h-10 rounded-xl border border-white/5 bg-white/5 text-xs text-white hover:bg-white/10 transition-smooth disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={sendingReminder}
                    onClick={handleSendReminder}
                    className="flex-1 h-10 rounded-xl bg-gradient-to-r from-primary to-secondary text-xs font-bold text-white hover:opacity-95 transition-smooth disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {sendingReminder ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <span>Confirm &amp; Send</span>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* GORGEOUS PREMIUM GLASSMORPHIC PAYMENT MODAL */}
      {paymentModalTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in">
          {/* Backdrop */}
          <div 
            onClick={() => !funding && setPaymentModalTest(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Dialog Panel */}
          <div className="relative w-full max-w-md bg-[#0c0f14]/90 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 z-10 animate-scale-in">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Fund Verification Link</h3>
              <p className="text-[10px] text-muted-foreground">
                Fund the escrow gift of {formatCurrency(paymentModalTest.giftAmount)} + service fee of {formatCurrency(paymentModalTest.serviceFee)}.
              </p>
            </div>

            {fundingError && (
              <div className="p-3.5 rounded-xl bg-destructive/15 border border-destructive/25 text-xs text-destructive">
                {fundingError}
              </div>
            )}

            <div className="bg-black/35 rounded-2xl border border-white/5 p-4 flex justify-between items-center text-xs">
              <div>
                <p className="text-muted-foreground text-[10px] uppercase font-semibold">Total Invoice Amount</p>
                <p className="text-white text-lg font-extrabold mt-0.5">{formatCurrency(paymentModalTest.totalAmount)}</p>
              </div>
              <span className="text-[10px] bg-secondary/15 border border-secondary/20 text-secondary px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                Awaiting Payment
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleFundTest(paymentModalTest.id, "PAYSTACK")}
                disabled={funding}
                className="flex flex-col items-center justify-center p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-smooth gap-2 text-center cursor-pointer disabled:opacity-50"
              >
                <span className="text-xs font-bold text-white">Pay via Paystack</span>
                <span className="text-[9px] text-muted-foreground/60">Card, bank, or transfer</span>
              </button>
              <button
                onClick={() => handleFundTest(paymentModalTest.id, "WALLET")}
                disabled={funding}
                className="flex flex-col items-center justify-center p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-smooth gap-2 text-center cursor-pointer disabled:opacity-50"
              >
                <span className="text-xs font-bold text-white">Use Wallet Balance</span>
                <span className="text-[9px] text-muted-foreground/60">Deduct from your credits</span>
              </button>
            </div>

            {funding && (
              <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground py-2 animate-pulse">
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
                <span>Processing payment transaction...</span>
              </div>
            )}

            {/* Cancel Actions */}
            <div className="flex gap-3 pt-2">
              <button
                disabled={funding}
                onClick={() => setPaymentModalTest(null)}
                className="w-full h-10 rounded-xl border border-white/5 bg-white/5 text-xs text-white hover:bg-white/10 transition-smooth disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
