"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Shield, ShieldAlert, ShieldCheck, Trash2, Plus, 
  Loader2, AlertCircle, RefreshCw, Calendar, ArrowLeft 
} from "lucide-react";

interface BlockedKeyword {
  id: string;
  keyword: string;
  severity: string;
}

interface BlockedAttempt {
  id: string;
  questionText: string;
  reason: string;
  classification: string;
  createdAt: string;
  user: {
    fullName: string;
    email: string;
  };
}

export default function QuestionSafetyAdminPage() {
  const [keywords, setKeywords] = useState<BlockedKeyword[]>([]);
  const [attempts, setAttempts] = useState<BlockedAttempt[]>([]);
  const [customQuestionsEnabled, setCustomQuestionsEnabled] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<"settings" | "keywords" | "attempts">("settings");
  
  // New Keyword Form
  const [newKeyword, setNewKeyword] = useState("");
  const [newSeverity, setNewSeverity] = useState("HIGH");

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      
      // 1. Fetch settings (for custom question flag)
      const settingsRes = await fetch("/api/v1/sender/settings");
      if (!settingsRes.ok) throw new Error("Failed to load platform settings.");
      const settingsData = await settingsRes.json();
      setCustomQuestionsEnabled(settingsData.featureFlags.customQuestions);

      // 2. Fetch blocked keywords
      const keywordsRes = await fetch("/api/v1/admin/keywords");
      if (!keywordsRes.ok) throw new Error("Failed to load blocked keywords list.");
      const keywordsData = await keywordsRes.json();
      setKeywords(keywordsData.keywords || []);

      // 3. Fetch blocked attempts
      const attemptsRes = await fetch("/api/v1/admin/question-attempts");
      if (!attemptsRes.ok) throw new Error("Failed to load blocked attempts logs.");
      const attemptsData = await attemptsRes.json();
      setAttempts(attemptsData.attempts || []);

    } catch (err: any) {
      console.error("Fetch admin data error:", err);
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleCustomQuestions = async () => {
    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    const targetState = !customQuestionsEnabled;
    try {
      const res = await fetch("/api/v1/admin/feature-flags/custom-questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: targetState }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update feature flag.");
      setCustomQuestionsEnabled(targetState);
      setSuccessMessage(data.message);
    } catch (err: any) {
      setErrorMessage(err.message || "Could not update setting.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/v1/admin/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: newKeyword, severity: newSeverity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add keyword.");
      
      setKeywords(prev => [...prev, data.keyword].sort((a,b) => a.keyword.localeCompare(b.keyword)));
      setNewKeyword("");
      setSuccessMessage("Keyword added successfully.");
    } catch (err: any) {
      setErrorMessage(err.message || "Could not add keyword.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteKeyword = async (id: string) => {
    if (!confirm("Are you sure you want to remove this keyword from the blocklist?")) return;
    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(`/api/v1/admin/keywords?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete keyword.");
      
      setKeywords(prev => prev.filter(k => k.id !== id));
      setSuccessMessage(data.message);
    } catch (err: any) {
      setErrorMessage(err.message || "Could not delete keyword.");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading safety controls...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center space-x-3">
          <Link href="/admin/dashboard" className="rounded-xl border border-white/5 bg-white/5 p-2 text-muted-foreground hover:text-white transition-smooth">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span>Question Safety Engine</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Control phishing blocklists, toggle unrestricted builders, and review safety logs.</p>
          </div>
        </div>
        
        <button
          onClick={fetchData}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/5 text-muted-foreground hover:text-white transition-smooth"
          title="Refresh Data"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Success/Error Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start space-x-3">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 text-xs text-accent flex items-start space-x-3">
          <ShieldCheck className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 w-fit">
        <button
          onClick={() => { setActiveTab("settings"); setErrorMessage(null); setSuccessMessage(null); }}
          className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-smooth ${
            activeTab === "settings" ? "bg-primary text-white" : "text-muted-foreground hover:text-white"
          }`}
        >
          Feature Settings
        </button>
        <button
          onClick={() => { setActiveTab("keywords"); setErrorMessage(null); setSuccessMessage(null); }}
          className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-smooth ${
            activeTab === "keywords" ? "bg-primary text-white" : "text-muted-foreground hover:text-white"
          }`}
        >
          Manage Keywords ({keywords.length})
        </button>
        <button
          onClick={() => { setActiveTab("attempts"); setErrorMessage(null); setSuccessMessage(null); }}
          className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-smooth ${
            activeTab === "attempts" ? "bg-primary text-white" : "text-muted-foreground hover:text-white"
          }`}
        >
          Blocked Attempts ({attempts.length})
        </button>
      </div>

      {/* TAB 1: FEATURE SETTINGS */}
      {activeTab === "settings" && (
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-6 max-w-2xl animate-slide-up">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Safety Policy Flags</h3>
            <p className="text-[10px] text-muted-foreground">Toggle permission controls for the verification builder environment.</p>
          </div>

          <div className="flex justify-between items-center bg-black/20 p-5 rounded-2xl border border-white/5">
            <div>
              <h4 className="text-xs font-bold text-white">Unrestricted Custom Questions</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5 max-w-sm">
                Allow senders to compose free-form custom questions. When disabled, users are strictly restricted to safe seeded templates.
              </p>
            </div>
            
            <button
              onClick={handleToggleCustomQuestions}
              disabled={actionLoading}
              className={`flex h-11 items-center justify-between px-4 rounded-xl text-xs font-bold transition-smooth select-none cursor-pointer ${
                customQuestionsEnabled 
                  ? "bg-accent/15 border border-accent/30 text-accent" 
                  : "bg-destructive/15 border border-destructive/30 text-destructive"
              }`}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span>{customQuestionsEnabled ? "ENABLED (ON)" : "DISABLED (OFF)"}</span>
              )}
            </button>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-[10px] text-muted-foreground leading-normal flex items-start space-x-2.5">
            <ShieldAlert className="h-4.5 w-4.5 text-accent shrink-0 mt-0.5" />
            <span>
              By default, unrestricted questions should remain <strong>OFF</strong> for MVP to prevent phishing attacks. The safety classification engine runs even when custom questions are enabled.
            </span>
          </div>
        </div>
      )}

      {/* TAB 2: KEYWORD MANAGEMENT */}
      {activeTab === "keywords" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up">
          
          {/* Left Column: Form to Add */}
          <div className="lg:col-span-1 glass-panel p-6 rounded-3xl border border-white/5 space-y-4 h-fit">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Add Blocked Keyword</h3>
              <p className="text-[10px] text-muted-foreground">Add a new sensitive word or phrase to the safety filter.</p>
            </div>

            <form onSubmit={handleAddKeyword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-muted-foreground uppercase block">Keyword Term</label>
                <input
                  type="text"
                  placeholder="e.g. passphrase"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  disabled={actionLoading}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-muted-foreground/45 focus:outline-none focus:border-primary/50 disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-muted-foreground uppercase block">Risk Severity</label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value)}
                  disabled={actionLoading}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50"
                >
                  <option value="HIGH">HIGH (Block creation)</option>
                  <option value="MEDIUM">MEDIUM (Requires admin review)</option>
                  <option value="LOW">LOW (Risky warnings)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading || !newKeyword.trim()}
                className="glow-primary w-full inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary text-xs font-semibold text-white transition-smooth disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                ) : (
                  <>
                    <Plus className="mr-1.5 h-4 w-4" />
                    <span>Add to Blocklist</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Keywords List Table */}
          <div className="lg:col-span-2 glass-panel rounded-3xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-white/5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Currently Filtered Terms</h3>
            </div>

            {keywords.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                <ShieldCheck className="h-8 w-8 text-muted-foreground/45 mx-auto mb-2" />
                <p className="font-bold text-white">No Blocked Keywords</p>
                <p className="text-[10px]">Add a word to start filtering question contents.</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 uppercase tracking-wider text-muted-foreground text-[9px] font-semibold sticky top-0">
                    <tr>
                      <th className="px-6 py-4">Keyword</th>
                      <th className="px-6 py-4">Severity level</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-muted-foreground">
                    {keywords.map((k) => (
                      <tr key={k.id} className="hover:bg-white/5 transition-smooth">
                        <td className="px-6 py-4 font-mono font-bold text-white">{k.keyword}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-bold border uppercase ${
                            k.severity === "HIGH" ? "bg-destructive/10 border-destructive/20 text-destructive" :
                            k.severity === "MEDIUM" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                            "bg-secondary/10 border-secondary/20 text-secondary"
                          }`}>
                            {k.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteKeyword(k.id)}
                            disabled={actionLoading}
                            className="text-destructive hover:text-red-400 p-1.5 hover:bg-destructive/5 rounded-lg transition-smooth cursor-pointer disabled:opacity-50"
                            title="Delete Keyword"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BLOCKED ATTEMPTS AUDIT */}
      {activeTab === "attempts" && (
        <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden animate-slide-up">
          <div className="p-4 border-b border-white/5 bg-white/5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Question Safety Violations Log</h3>
          </div>

          {attempts.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              <ShieldCheck className="h-10 w-10 text-accent/60 mx-auto mb-2" />
              <p className="font-bold text-white">No Safety Violations Detected</p>
              <p className="text-[10px]">All custom questions created by senders have passed safety filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 uppercase tracking-wider text-muted-foreground text-[9px] font-semibold">
                  <tr>
                    <th className="px-6 py-4">Sender User</th>
                    <th className="px-6 py-4">Question Text</th>
                    <th className="px-6 py-4">Violation Details</th>
                    <th className="px-6 py-4">Result Action</th>
                    <th className="px-6 py-4">Attempt Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-muted-foreground">
                  {attempts.map((att) => (
                    <tr key={att.id} className="hover:bg-white/5 transition-smooth">
                      <td className="px-6 py-4">
                        <p className="font-bold text-white">{att.user.fullName}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{att.user.email}</p>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate font-medium text-white/95" title={att.questionText}>
                        "{att.questionText}"
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-destructive font-semibold">{att.reason}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-bold border uppercase ${
                          att.classification === "BLOCKED" ? "bg-destructive/10 border-destructive/20 text-destructive" :
                          att.classification === "REQUIRES_ADMIN_REVIEW" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                          "bg-secondary/10 border-secondary/20 text-secondary"
                        }`}>
                          {att.classification.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          <span>{formatDate(att.createdAt)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
