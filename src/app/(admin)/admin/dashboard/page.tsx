"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Shield, 
  Users, 
  CreditCard, 
  Play, 
  FileText, 
  ToggleLeft, 
  Settings as SettingsIcon, 
  Award, 
  RefreshCw, 
  Check, 
  X, 
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  HelpCircle
} from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: any;
  createdAt: string;
  admin: {
    fullName: string;
    email: string;
  };
}

interface PlatformSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
}

interface FeatureFlag {
  id: string;
  featureName: string;
  enabled: boolean;
}

interface AbuseReport {
  id: string;
  testId: string;
  receiverPhone: string;
  reason: string;
  comment: string | null;
  status: string;
  createdAt: string;
  test: {
    receiverName: string;
    giftType: string;
    giftAmount: number;
    testStatus: string;
    giftStatus: string;
    sender: {
      fullName: string;
      email: string;
    };
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalSenders: 0,
    platformRevenue: 0,
    activeEscrows: 0,
    abuseFlagged: 0,
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [abuseReports, setAbuseReports] = useState<AbuseReport[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editSettingKey, setEditSettingKey] = useState<string | null>(null);
  const [editSettingValue, setEditSettingValue] = useState("");
  const [savingSettingKey, setSavingSettingKey] = useState<string | null>(null);
  const [togglingFlagName, setTogglingFlagName] = useState<string | null>(null);
  const [resolvingReportId, setResolvingReportId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setErrorMsg("");
    try {
      const [statsRes, settingsRes, flagsRes, reportsRes] = await Promise.all([
        fetch("/api/v1/admin/stats"),
        fetch("/api/v1/admin/settings"),
        fetch("/api/v1/admin/feature-flags"),
        fetch("/api/v1/admin/abuse-reports")
      ]);

      if (!statsRes.ok || !settingsRes.ok || !flagsRes.ok || !reportsRes.ok) {
        throw new Error("Failed to fetch dashboard data. Please check authorization.");
      }

      const statsData = await statsRes.json();
      const settingsData = await settingsRes.json();
      const flagsData = await flagsRes.json();
      const reportsData = await reportsRes.json();

      setStats({
        totalSenders: statsData.totalSenders,
        platformRevenue: statsData.platformRevenue,
        activeEscrows: statsData.activeEscrows,
        abuseFlagged: statsData.abuseFlagged,
      });
      setAuditLogs(statsData.recentAuditLogs);
      setSettings(settingsData.settings);
      setFeatureFlags(flagsData.flags);
      setAbuseReports(reportsData.reports);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleFlag = async (featureName: string, currentStatus: boolean) => {
    setTogglingFlagName(featureName);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/v1/admin/feature-flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featureName, enabled: !currentStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update feature flag.");
      }

      setSuccessMsg(`Feature flag "${featureName}" successfully updated.`);
      await loadData(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Error toggling feature flag.");
    } finally {
      setTogglingFlagName(null);
    }
  };

  const handleSaveSetting = async (key: string) => {
    setSavingSettingKey(key);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/v1/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: editSettingValue }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save setting.");
      }

      setSuccessMsg(`Setting "${key}" updated to "${editSettingValue}".`);
      setEditSettingKey(null);
      await loadData(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Error updating setting.");
    } finally {
      setSavingSettingKey(null);
    }
  };

  const handleActionReport = async (reportId: string, action: "RESOLVE" | "DISMISS", resolution?: "RELEASE" | "REFUND") => {
    setResolvingReportId(reportId);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/v1/admin/abuse-reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, action, resolution }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process abuse report.");
      }

      setSuccessMsg(`Abuse report processed successfully: ${action}.`);
      await loadData(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Error resolving abuse report.");
    } finally {
      setResolvingReportId(null);
    }
  };

  const getFriendlySettingName = (key: string) => {
    return key.replace(/_/g, " ").toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading admin dashboard data...</p>
      </div>
    );
  }

  const pendingReports = abuseReports.filter(r => r.status === "PENDING");
  const pastReports = abuseReports.filter(r => r.status !== "PENDING");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span>Super Admin Control Center</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Configure pricing, toggle platform feature flags, review safety filters, and resolve abuse flags.</p>
        </div>
        <div>
          <button 
            onClick={() => loadData(true)} 
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-smooth disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-xs flex items-start gap-2 animate-fadeIn">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl border border-accent/20 bg-accent/10 text-accent text-xs flex items-start gap-2 animate-fadeIn">
          <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid of Admin Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Senders</p>
          <p className="text-2xl font-extrabold text-white">{stats.totalSenders.toLocaleString()}</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Platform Revenue</p>
          <p className="text-2xl font-extrabold text-white">₦{stats.platformRevenue.toLocaleString()}</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Active Escrows</p>
          <p className="text-2xl font-extrabold text-white">₦{stats.activeEscrows.toLocaleString()}</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Abuse Reports Pending</p>
          <p className={`text-2xl font-extrabold ${pendingReports.length > 0 ? "text-destructive" : "text-white"}`}>
            {pendingReports.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Settings Configurations (Left 7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <SettingsIcon className="h-4.5 w-4.5 text-secondary" />
              <span>System &amp; Pricing Configs</span>
            </h2>
            <p className="text-xs text-muted-foreground">Edit dynamic system fees, locked thresholds, or wallet policies directly.</p>

            <div className="divide-y divide-white/5 border border-white/5 rounded-2xl overflow-hidden bg-black/10">
              {settings.map((setting) => (
                <div key={setting.id} className="p-4 space-y-2 hover:bg-white/5 transition-smooth">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-white tracking-wider">{getFriendlySettingName(setting.key)}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{setting.description || "No description provided."}</p>
                    </div>
                    
                    <div className="shrink-0 flex items-center gap-2">
                      {editSettingKey === setting.key ? (
                        <div className="flex items-center gap-1.5">
                          <input 
                            type="text" 
                            value={editSettingValue}
                            onChange={(e) => setEditSettingValue(e.target.value)}
                            className="bg-black/35 border border-white/10 text-white text-xs rounded-lg px-2.5 py-1 w-28 focus:outline-none focus:border-accent"
                          />
                          <button 
                            onClick={() => handleSaveSetting(setting.key)}
                            disabled={savingSettingKey === setting.key}
                            className="p-1 rounded bg-accent/25 hover:bg-accent/40 text-accent transition-smooth disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => setEditSettingKey(null)}
                            className="p-1 rounded bg-white/5 hover:bg-white/10 text-muted-foreground transition-smooth"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-white bg-white/5 px-2 py-0.5 rounded">
                            {setting.key.includes("fee") || setting.key.includes("amount") || setting.key.includes("commission")
                              ? `₦${Number(setting.value).toLocaleString()}` 
                              : setting.value}
                          </span>
                          <button 
                            onClick={() => {
                              setEditSettingKey(setting.key);
                              setEditSettingValue(setting.value);
                            }}
                            className="text-[10px] font-semibold text-accent hover:underline"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Flags (Right 5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <ToggleLeft className="h-4.5 w-4.5 text-primary" />
              <span>Platform Feature Flags</span>
            </h2>
            <p className="text-xs text-muted-foreground">Toggle platform modules globally to enable/disable features in real-time.</p>

            <div className="divide-y divide-white/5 border border-white/5 rounded-2xl overflow-hidden bg-black/10">
              {featureFlags.map((flag) => (
                <div key={flag.id} className="flex items-center justify-between p-3.5 hover:bg-white/5 transition-smooth text-xs">
                  <span className="font-bold text-white tracking-wide">{flag.featureName.replace(/_/g, " ").toUpperCase()}</span>
                  
                  <button
                    onClick={() => handleToggleFlag(flag.featureName, flag.enabled)}
                    disabled={togglingFlagName === flag.featureName}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      flag.enabled ? "bg-accent" : "bg-white/10"
                    } ${togglingFlagName === flag.featureName ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        flag.enabled ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Engines Link */}
          <Link href="/admin/question-safety" className="glass-panel p-5 rounded-3xl border border-white/5 hover:border-accent/35 hover:bg-white/5 transition-smooth block space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Award className="h-4.5 w-4.5 text-accent" />
                <span>Safety Engines</span>
              </h2>
              <span className="text-[10px] font-semibold text-accent">Manage &rarr;</span>
            </div>
            <p className="text-xs text-muted-foreground">View blocked keywords and audit reports of phishing questions.</p>
          </Link>
        </div>
      </div>

      {/* Abuse Reports Section */}
      <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
            <AlertTriangle className="h-4.5 w-4.5 text-destructive animate-pulse" />
            <span>Abuse Reports &amp; Escrow Resolution</span>
          </h2>
          <span className="text-[10px] text-muted-foreground">Manage flags</span>
        </div>

        <div className="p-6 space-y-6">
          {/* Pending Reports */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider text-muted-foreground">
              Pending Resolution ({pendingReports.length})
            </h3>
            
            {pendingReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed border-white/5 rounded-2xl bg-black/10 text-center">
                <CheckCircle className="h-8 w-8 text-accent/60 mb-2" />
                <p className="text-xs text-white font-semibold">No pending abuse reports!</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Escrow values are clean and secure.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingReports.map((report) => (
                  <div key={report.id} className="p-5 rounded-2xl border border-white/5 bg-black/20 space-y-4 text-xs">
                    <div className="flex justify-between items-start border-b border-white/5 pb-2">
                      <div>
                        <p className="font-bold text-white">Receiver: {report.test.receiverName}</p>
                        <p className="text-[10px] text-muted-foreground">{report.receiverPhone}</p>
                      </div>
                      <span className="bg-destructive/10 text-destructive text-[10px] font-semibold px-2 py-0.5 rounded-full border border-destructive/20">
                        PENDING REVIEW
                      </span>
                    </div>

                    <div className="space-y-1.5 text-muted-foreground">
                      <p><strong className="text-white">Reason:</strong> {report.reason}</p>
                      {report.comment && <p><strong className="text-white">Comment:</strong> {report.comment}</p>}
                      <p><strong className="text-white">Gift locked:</strong> {report.test.giftType} (₦{report.test.giftAmount.toLocaleString()})</p>
                      <p><strong className="text-white">Sender:</strong> {report.test.sender.fullName} ({report.test.sender.email})</p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                      <button
                        onClick={() => handleActionReport(report.id, "RESOLVE", "REFUND")}
                        disabled={resolvingReportId === report.id}
                        className="px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20 hover:bg-destructive/25 text-destructive text-[10px] font-bold transition-smooth"
                      >
                        Refund Sender
                      </button>
                      <button
                        onClick={() => handleActionReport(report.id, "RESOLVE", "RELEASE")}
                        disabled={resolvingReportId === report.id}
                        className="px-3 py-1.5 rounded-lg bg-accent/15 border border-accent/30 hover:bg-accent/25 text-accent text-[10px] font-bold transition-smooth"
                      >
                        Release Gift
                      </button>
                      <button
                        onClick={() => handleActionReport(report.id, "DISMISS")}
                        disabled={resolvingReportId === report.id}
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-bold transition-smooth"
                      >
                        Dismiss Report
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resolved Reports */}
          {pastReports.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-white/5">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider text-muted-foreground">
                Reviewed / Closed Reports
              </h3>
              
              <div className="overflow-x-auto border border-white/5 rounded-2xl">
                <table className="min-w-full divide-y divide-white/5 text-xs text-left bg-black/10">
                  <thead className="bg-black/35 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    <tr>
                      <th className="p-3">Receiver</th>
                      <th className="p-3">Reason</th>
                      <th className="p-3">Test Gift</th>
                      <th className="p-3">Reviewed At</th>
                      <th className="p-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-muted-foreground">
                    {pastReports.map((report) => (
                      <tr key={report.id} className="hover:bg-white/5 transition-smooth">
                        <td className="p-3">
                          <p className="font-bold text-white">{report.test.receiverName}</p>
                          <p className="text-[10px] text-muted-foreground">{report.receiverPhone}</p>
                        </td>
                        <td className="p-3 max-w-xs truncate">{report.reason}</td>
                        <td className="p-3">₦{report.test.giftAmount.toLocaleString()} {report.test.giftType}</td>
                        <td className="p-3">{new Date(report.createdAt).toLocaleDateString()}</td>
                        <td className="p-3 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            report.status === "RESOLVED" 
                              ? "bg-accent/10 border border-accent/20 text-accent" 
                              : "bg-white/5 border border-white/10 text-muted-foreground"
                          }`}>
                            {report.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin Audit Logs */}
      <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
            <FileText className="h-4.5 w-4.5 text-primary" />
            <span>Admin Audit Trails (Latest Activities)</span>
          </h2>
          <span className="text-[10px] text-muted-foreground">Immutable logs</span>
        </div>
        
        {auditLogs.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            No recent admin logs recorded.
          </div>
        ) : (
          <div className="divide-y divide-white/5 text-xs text-muted-foreground">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 hover:bg-white/5 transition-smooth">
                <div>
                  <p className="font-bold text-white">{log.action}</p>
                  <p className="text-[10px] text-muted-foreground/75 mt-0.5">
                    Target: <code>{log.entityId}</code> ({log.entityType}) &bull; Authorized by {log.admin?.fullName} ({log.admin?.email})
                  </p>
                  {log.metadata && (
                    <pre className="text-[9px] font-mono text-muted-foreground/60 mt-1 bg-black/20 p-2 rounded max-w-2xl overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground/60 shrink-0">
                  {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
