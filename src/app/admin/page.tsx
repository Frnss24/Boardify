"use client"; 

import { 
  Users, CheckCircle2, ListTodo, Search, Bell, 
  TrendingUp, TrendingDown, MoreHorizontal, Clock, LogOut 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { hapusDataPermanen } from '../../lib/api';

// Data sementara 
const recentTasks: any[] = [];

export default function DashboardPage() {
  const router = useRouter();

  // inisialisasi supabase buat jalanin fungsi Logout
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // function logout
  const handleLogout = async () => {
    // Hapus cookie demo auth
    document.cookie = 'boardify_demo_auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    
    await supabase.auth.signOut();
    
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
          
          {/* TOMBOL TESTING JOBDESK 12 */}
          <button 
            onClick={() => hapusDataPermanen(1)} 
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-full text-white font-medium transition-colors shadow-sm"
          >
            <span className="text-sm">Test Hapus ID 1</span>
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
          { label: 'Total Tasks', value: '1,248', icon: ListTodo, color: 'text-blue-600', bg: 'bg-blue-100', trend: '+12%', IconTrend: TrendingUp, trendColor: 'text-green-600 bg-green-50' },
          { label: 'Completed', value: '892', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100', trend: '-2%', IconTrend: TrendingDown, trendColor: 'text-red-600 bg-red-50' },
          { label: 'Active Users', value: '156', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100', trend: '+18%', IconTrend: TrendingUp, trendColor: 'text-green-600 bg-green-50' },
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
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-100 text-sm text-gray-500">
                  <th className="p-4 font-semibold">Task ID</th>
                  <th className="p-4 font-semibold">Title</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Priority</th>
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
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${task.priority === 'High' ? 'border-red-200 text-red-700 bg-red-50' : 
                          task.priority === 'Medium' ? 'border-orange-200 text-orange-700 bg-orange-50' : 
                          'border-blue-200 text-blue-700 bg-blue-50'}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                        {task.assignee.charAt(0)}
                      </div>
                      {task.assignee}
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
          </div>
        </div>

        {/* Workload Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Workload Distribution</h3>
          
          <div className="flex-1 flex flex-col gap-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">Frontend Team</span>
                <span className="text-gray-500">65%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">Backend Team</span>
                <span className="text-gray-500">40%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">Design Team</span>
                <span className="text-gray-500">85%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
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