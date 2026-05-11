"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Clock, Mail, Loader2, Empty } from "lucide-react";
import { motion } from "motion/react";

interface Report {
  id: string;
  title: string;
  message: string;
  status: "open" | "in_review" | "resolved";
  decision_note: string | null;
  created_at: string;
  updated_at: string;
}

interface ReportHistoryProps {
  userId: string | null;
}

export function ReportHistory({ userId }: ReportHistoryProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchReports = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/reports/user?reporter_id=${userId}`);
        const data = await response.json();
        
        if (!response.ok) {
          const errorMsg = data.error || `HTTP ${response.status}`;
          throw new Error(errorMsg);
        }
        
        setReports(data.reports || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Terjadi kesalahan saat mengambil report";
        console.error('Fetch reports error:', err);
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchReports();
  }, [userId]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "resolved":
        return {
          icon: CheckCircle2,
          label: "Resolved",
          color: "#10b981",
          bgColor: "#ecfdf5",
          textColor: "#065f46",
        };
      case "in_review":
        return {
          icon: Clock,
          label: "In Review",
          color: "#f59e0b",
          bgColor: "#fffbeb",
          textColor: "#92400e",
        };
      case "open":
      default:
        return {
          icon: AlertCircle,
          label: "Open",
          color: "#ef4444",
          bgColor: "#fef2f2",
          textColor: "#7f1d1d",
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateDaysSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Hari ini";
    if (days === 1) return "Kemarin";
    if (days < 7) return `${days} hari lalu`;
    if (days < 30) return `${Math.floor(days / 7)} minggu lalu`;
    return `${Math.floor(days / 30)} bulan lalu`;
  };

  const statusStats = {
    open: reports.filter((r) => r.status === "open").length,
    in_review: reports.filter((r) => r.status === "in_review").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-indigo-600 animate-spin" />
          <p className="text-gray-500">Mengambil report history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 border border-red-200 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={20} />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
        <Mail size={48} className="mx-auto text-gray-300 mb-3" />
        <h3 className="text-gray-900 font-semibold mb-1">Belum ada report</h3>
        <p className="text-gray-500 text-sm">
          Laporan yang Anda kirim ke admin akan ditampilkan di sini beserta feedback mereka.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Section */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl bg-gradient-to-br from-red-50 to-red-100 p-4 border border-red-200">
          <div className="text-2xl font-bold text-red-600">{statusStats.open}</div>
          <div className="text-xs text-red-700 font-medium">Open</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 p-4 border border-amber-200">
          <div className="text-2xl font-bold text-amber-600">{statusStats.in_review}</div>
          <div className="text-xs text-amber-700 font-medium">In Review</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-4 border border-green-200">
          <div className="text-2xl font-bold text-green-600">{statusStats.resolved}</div>
          <div className="text-xs text-green-700 font-medium">Resolved</div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {reports.map((report, index) => {
          const statusConfig = getStatusConfig(report.status);
          const StatusIcon = statusConfig.icon;
          const isExpanded = expandedReportId === report.id;

          return (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow"
            >
              <button
                onClick={() =>
                  setExpandedReportId(isExpanded ? null : report.id)
                }
                className="w-full px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 flex items-start gap-3">
                    <div
                      className="p-2.5 rounded-lg flex-shrink-0 mt-1"
                      style={{ background: statusConfig.bgColor }}
                    >
                      <StatusIcon
                        size={18}
                        style={{ color: statusConfig.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {report.title}
                        </h3>
                        <span
                          className="px-2 py-1 rounded text-xs font-medium whitespace-nowrap"
                          style={{
                            background: statusConfig.bgColor,
                            color: statusConfig.textColor,
                          }}
                        >
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {report.message}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>{formatDate(report.created_at)}</span>
                        <span>•</span>
                        <span>{calculateDaysSince(report.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`flex-shrink-0 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-gray-400"
                    >
                      <path d="M7 8l3 3 3-3" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                          Issue Details
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                          {report.message}
                        </p>
                      </div>

                      {report.decision_note && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                            Admin Response
                          </h4>
                          <div
                            className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-900"
                          >
                            {report.decision_note}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Created</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(report.created_at)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(report.updated_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
