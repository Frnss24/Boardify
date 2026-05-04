"use client";

import { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Bell,
  TrendingUp,
  Clock,
  LogOut,
  ShieldAlert,
  BarChart3,
  Building2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

type DashboardTask = {
  id: string;
  title: string;
  status: string;
  assignee_id: string | null;
  created_at?: string | null;
};

type DashboardUser = {
  id: string;
  name: string | null;
  email: string;
};

type DashboardReport = {
  id: string;
  reporter_email: string;
  title: string;
  message: string;
  status: 'open' | 'in_review' | 'resolved';
  decision_note: string | null;
  created_at: string;
};

type TaskTrend = {
  date: string;
  created: number;
  completed: number;
};

type SignupTrend = {
  weekStart: string;
  signups: number;
};

type DashboardResponse = {
  tasks: DashboardTask[];
  users: DashboardUser[];
  reports: DashboardReport[];
  metrics: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    activeWorkspaces: number;
  };
  taskTrends: TaskTrend[];
  growth: {
    signupTrend: SignupTrend[];
    retentionRate30d: number;
  };
};

export default function DashboardPage() {
  const router = useRouter();
  const [recentTasks, setRecentTasks] = useState<DashboardTask[]>([]);
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [reports, setReports] = useState<DashboardReport[]>([]);
  const [taskTrends, setTaskTrends] = useState<TaskTrend[]>([]);
  const [signupTrend, setSignupTrend] = useState<SignupTrend[]>([]);
  const [metrics, setMetrics] = useState({
    dailyActiveUsers: 0,
    weeklyActiveUsers: 0,
    activeWorkspaces: 0,
  });
  const [retentionRate30d, setRetentionRate30d] = useState(0);
  const [reportDrafts, setReportDrafts] = useState<Record<string, { status: DashboardReport['status']; decision_note: string }>>({});
  const [isSavingReport, setIsSavingReport] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      setIsLoading(true);

      const response = await fetch('/api/admin/overview');
      const data = (await response.json()) as DashboardResponse | { error?: string };

      if (!isMounted) return;

      if (!response.ok) {
        console.error('Failed to load admin overview:', 'error' in data ? data.error : response.statusText);
        setRecentTasks([]);
        setUsers([]);
        setReports([]);
        setTaskTrends([]);
        setSignupTrend([]);
      } else {
        const parsed = data as DashboardResponse;
        setRecentTasks(parsed.tasks ?? []);
        setUsers(parsed.users ?? []);
        setReports(parsed.reports ?? []);
        setTaskTrends(parsed.taskTrends ?? []);
        setSignupTrend(parsed.growth?.signupTrend ?? []);
        setMetrics(parsed.metrics ?? { dailyActiveUsers: 0, weeklyActiveUsers: 0, activeWorkspaces: 0 });
        setRetentionRate30d(parsed.growth?.retentionRate30d ?? 0);
        setReportDrafts(
          Object.fromEntries(
            (parsed.reports ?? []).map((item) => [
              item.id,
              {
                status: item.status,
                decision_note: item.decision_note ?? '',
              },
            ])
          )
        );
      }

      setIsLoading(false);
    }

    void loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    const response = await fetch('/api/auth/signout', { method: 'POST' });
    if (!response.ok) {
      console.error('Sign out failed');
    }

    router.push('/login');
    router.refresh();
  };

  const handleSaveReport = async (reportId: string) => {
    const draft = reportDrafts[reportId];
    if (!draft) return;

    setIsSavingReport((prev) => ({ ...prev, [reportId]: true }));

    const response = await fetch(`/api/admin/reports/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      console.error('Failed to update report:', body.error || response.statusText);
      setIsSavingReport((prev) => ({ ...prev, [reportId]: false }));
      return;
    }

    setReports((prev) =>
      prev.map((item) =>
        item.id === reportId
          ? { ...item, status: draft.status, decision_note: draft.decision_note }
          : item
      )
    );

    setIsSavingReport((prev) => ({ ...prev, [reportId]: false }));
  };

  const maxSignup = signupTrend.length
    ? Math.max(...signupTrend.map((item) => item.signups), 1)
    : 1;

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Admin Overview</h1>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button className="p-2 bg-white border rounded-full text-gray-500 hover:text-blue-600 shadow-sm">
            <Bell size={20} />
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-100 rounded-full text-red-600 font-medium transition-colors shadow-sm"
          >
            <LogOut size={18} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { label: 'Daily Active Users', value: metrics.dailyActiveUsers.toString(), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100', trend: '24h', IconTrend: TrendingUp, trendColor: 'text-indigo-600 bg-indigo-50' },
          { label: 'Weekly Active Users', value: metrics.weeklyActiveUsers.toString(), icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-100', trend: '7d', IconTrend: TrendingUp, trendColor: 'text-blue-600 bg-blue-50' },
          { label: 'Active Workspaces', value: metrics.activeWorkspaces.toString(), icon: Building2, color: 'text-purple-600', bg: 'bg-purple-100', trend: 'live', IconTrend: TrendingUp, trendColor: 'text-purple-600 bg-purple-50' },
          { label: 'Retention (30d)', value: `${retentionRate30d}%`, icon: ShieldAlert, color: 'text-emerald-600', bg: 'bg-emerald-100', trend: 'light', IconTrend: TrendingUp, trendColor: 'text-emerald-600 bg-emerald-50' },
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-lg ${item.bg} ${item.color} group-hover:bg-opacity-80 transition-colors`}><item.icon size={24} /></div>
              <span className={`text-xs font-bold flex items-center px-2 py-1 rounded ${item.trendColor}`}>
                {item.trend} <item.IconTrend size={12} className="ml-1" />
              </span>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900">{item.value}</h3>
              <p className="text-sm font-medium text-gray-500 mt-1">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-800">Task Created vs Completed (7 days)</h3>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-6 text-sm text-gray-500">Loading task trends...</div>
            ) : taskTrends.length === 0 ? (
              <div className="p-6 text-sm text-gray-500">No trend data available.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-gray-100 text-sm text-gray-500">
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold">Created</th>
                    <th className="p-4 font-semibold">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {taskTrends.map((item) => (
                    <tr key={item.date} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm text-gray-700">{item.date}</td>
                      <td className="p-4 text-sm font-semibold text-blue-700">{item.created}</td>
                      <td className="p-4 text-sm font-semibold text-green-700">{item.completed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Signup Growth (8 weeks)</h3>

          <div className="flex-1 flex flex-col gap-3">
            {isLoading ? (
              <div className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                Loading growth data...
              </div>
            ) : signupTrend.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                No signup data yet.
              </div>
            ) : (
              signupTrend.map((point) => (
                <div key={point.weekStart}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{point.weekStart}</span>
                    <span>{point.signups} signups</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-indigo-500"
                      style={{ width: `${Math.max(8, (point.signups / maxSignup) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span className="flex items-center gap-1"><Clock size={14} /> Retention (30d)</span>
              <span>{retentionRate30d}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">Reports & Moderation</h3>
          <span className="text-sm text-gray-500">Open / In Review / Resolved</span>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6 text-sm text-gray-500">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No reports submitted yet.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-100 text-sm text-gray-500">
                  <th className="p-4 font-semibold">Reporter</th>
                  <th className="p-4 font-semibold">Title</th>
                  <th className="p-4 font-semibold">Message</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Decision Note</th>
                  <th className="p-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors align-top">
                    <td className="p-4 text-sm text-gray-700">{report.reporter_email}</td>
                    <td className="p-4 text-sm font-medium text-gray-900">{report.title}</td>
                    <td className="p-4 text-sm text-gray-700 max-w-[280px]">{report.message}</td>
                    <td className="p-4">
                      <select
                        value={reportDrafts[report.id]?.status ?? report.status}
                        onChange={(event) =>
                          setReportDrafts((prev) => ({
                            ...prev,
                            [report.id]: {
                              status: event.target.value as DashboardReport['status'],
                              decision_note: prev[report.id]?.decision_note ?? report.decision_note ?? '',
                            },
                          }))
                        }
                        className="border rounded-md px-2 py-1 text-sm"
                      >
                        <option value="open">open</option>
                        <option value="in_review">in_review</option>
                        <option value="resolved">resolved</option>
                      </select>
                    </td>
                    <td className="p-4 min-w-[250px]">
                      <textarea
                        value={reportDrafts[report.id]?.decision_note ?? report.decision_note ?? ''}
                        onChange={(event) =>
                          setReportDrafts((prev) => ({
                            ...prev,
                            [report.id]: {
                              status: prev[report.id]?.status ?? report.status,
                              decision_note: event.target.value,
                            },
                          }))
                        }
                        placeholder="Tambah catatan keputusan admin"
                        className="w-full border rounded-md px-3 py-2 text-sm min-h-[80px]"
                      />
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => void handleSaveReport(report.id)}
                        disabled={Boolean(isSavingReport[report.id])}
                        className="px-3 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300"
                      >
                        {isSavingReport[report.id] ? 'Saving...' : 'Save'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}