"use client"; 

import { useEffect, useState } from 'react';
import { 
  Users, CheckCircle2, ListTodo, Search, Bell, 
  TrendingUp, TrendingDown, MoreHorizontal, Clock, LogOut 
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

export default function DashboardPage() {
  const router = useRouter();
  const [recentTasks, setRecentTasks] = useState<DashboardTask[]>([]);
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      setIsLoading(true);

      const response = await fetch('/api/admin/overview');
      const data = await response.json();

      if (!isMounted) return;

      if (!response.ok) {
        console.error('Failed to load admin overview:', data.error || response.statusText);
        setRecentTasks([]);
        setUsers([]);
      } else {
        setRecentTasks(data.tasks ?? []);
        setUsers(data.users ?? []);
      }

      setIsLoading(false);
    }

    void loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  // function logout
  const handleLogout = async () => {
    const response = await fetch('/api/auth/signout', { method: 'POST' });
    if (!response.ok) {
      console.error('Sign out failed');
    }
    
    router.push('/login');
    
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto p-6">
      
      {/* Top Header */}
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

          {/* TOMBOL LOGOUT BARU */}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-100 rounded-full text-red-600 font-medium transition-colors shadow-sm"
          >
            <LogOut size={18} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Tasks', value: recentTasks.length.toString(), icon: ListTodo, color: 'text-blue-600', bg: 'bg-blue-100', trend: '+', IconTrend: TrendingUp, trendColor: 'text-green-600 bg-green-50' },
          { label: 'Completed', value: recentTasks.filter((task) => String(task.status).toLowerCase() === 'done').length.toString(), icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100', trend: '+', IconTrend: TrendingUp, trendColor: 'text-green-600 bg-green-50' },
          { label: 'Active Users', value: users.length.toString(), icon: Users, color: 'text-purple-600', bg: 'bg-purple-100', trend: '+', IconTrend: TrendingUp, trendColor: 'text-green-600 bg-green-50' },
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

      {/* Main Content Grid (Table + Workload) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Data Table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-800">Recent Task Activity</h3>
            <button className="text-sm text-blue-600 font-medium hover:text-blue-800">View All</button>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-6 text-sm text-gray-500">Loading task activity...</div>
            ) : recentTasks.length === 0 ? (
              <div className="p-6 text-sm text-gray-500">No recent task activity yet.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-gray-100 text-sm text-gray-500">
                    <th className="p-4 font-semibold">Task ID</th>
                    <th className="p-4 font-semibold">Title</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Assignee</th>
                    <th className="p-4 font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="p-4 text-sm font-medium text-gray-900">{task.id}</td>
                      <td className="p-4 text-sm text-gray-700 font-medium">{task.title}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${task.status === 'Done' ? 'bg-green-100 text-green-800' : 
                            task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 
                            'bg-gray-100 text-gray-800'}`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                          {task.assignee_id ? task.assignee_id.charAt(0) : '?'}
                        </div>
                        {task.assignee_id ?? 'Unassigned'}
                      </td>
                      <td className="p-4 text-right">
                        <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Workload Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Workload Distribution</h3>
          
          <div className="flex-1 flex flex-col gap-6">
            <div className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500">
              {isLoading ? 'Loading workload data...' : 'Workload data is not mapped yet.'}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span className="flex items-center gap-1"><Clock size={14} /> Last updated</span>
              <span>Just now</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}