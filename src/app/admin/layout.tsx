// src/app/admin/layout.tsx
import { LayoutDashboard, Users, Settings } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import boardifyLogo from '../../../asset/Boardify.png';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col z-10 border-r border-slate-100">
        <div className="p-6 border-b border-slate-50">
          
          {/* Logo Section */}
          <div className="flex items-center gap-2 mb-1">
            <Image 
              src={boardifyLogo}
              alt="Boardify Logo" 
              width={32} 
              height={32} 
              className="object-contain"
              priority // Memastikan logo dimuat lebih cepat
            />
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Boardify
            </h1>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold ml-10">
            Admin Panel
          </p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link 
            href="/admin" 
            className="flex items-center gap-3 p-3 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all duration-200 group"
          >
            <LayoutDashboard size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-medium">Dashboard</span>
          </Link>
          
          <Link 
            href="/admin/users" 
            className="flex items-center gap-3 p-3 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all duration-200 group"
          >
            <Users size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-medium">Users</span>
          </Link>
          
          <Link 
            href="/admin/settings" 
            className="flex items-center gap-3 p-3 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all duration-200 group"
          >
            <Settings size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-medium">Settings</span>
          </Link>
        </nav>

        {/* User Info Placeholder di Sidebar (Opsional) */}
        <div className="p-4 border-t border-slate-50 mt-auto">
          <div className="flex items-center gap-3 p-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
              JS
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Jamie S.</span>
              <span className="text-[10px] text-slate-400">Project Admin</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}