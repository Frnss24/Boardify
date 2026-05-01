"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Bell, Plus, ChevronDown, LogOut, Settings, Folder, CheckCircle2, MessageSquare, X } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import boardifyLogo from "../../../asset/Boardify.png";

interface NavBarProps {
  onNewTask: () => void;
}

export function NavBar({ onNewTask }: NavBarProps) {
  const router = useRouter();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [userName, setUserName] = useState("Loading...");
  const [userEmail, setUserEmail] = useState("");
  const [userInitials, setUserInitials] = useState("--");

  const [activeDropdown, setActiveDropdown] = useState<"projects" | "notifications" | "profile" | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Click outside to close dropdowns
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchUser() {
      // 1. Cek apakah menggunakan akun demo (lewat cookie)
      const getDemoAuth = () => {
        const match = document.cookie.match(new RegExp('(^| )boardify_demo_auth=([^;]+)'));
        if (match) {
          try {
            return JSON.parse(decodeURIComponent(match[2]));
          } catch (e) {
            return null;
          }
        }
        return null;
      };

      const demoAuth = getDemoAuth();
      if (demoAuth) {
        setUserName(demoAuth.role === 'admin' ? "Demo Admin" : "Demo User");
        setUserEmail(demoAuth.email);
        setUserInitials(demoAuth.role === 'admin' ? "DA" : "DU");
        return;
      }

      // 2. Fetch data asli dari Supabase Backend
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUserEmail(session.user.email || "");
          // Ambil data nama profil dari tabel 'profiles'
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', session.user.id)
            .single();
          
          if (profile?.name) {
            setUserName(profile.name);
            // Buat inisial dari nama
            const names = profile.name.trim().split(' ');
            const initials = names.length > 1 
              ? `${names[0][0]}${names[names.length - 1][0]}` 
              : names[0].substring(0, 2);
            setUserInitials(initials.toUpperCase());
          } else {
            // Jika nama tidak ada, gunakan email sebagai fallback
            const emailName = session.user.email?.split('@')[0] || "User";
            setUserName(emailName);
            setUserInitials(emailName.substring(0, 2).toUpperCase());
          }
        } else {
          setUserName("Guest User");
          setUserInitials("GU");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUserName("User");
        setUserInitials("U");
      }
    }

    fetchUser();
  }, []);

  const handleLogout = async () => {
    // Hapus cookie demo auth
    document.cookie = 'boardify_demo_auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    
    router.push('/login');
    router.refresh();
  };

  const toggleDropdown = (name: "projects" | "notifications" | "profile", e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeDropdown === name) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(name);
      setSearchFocused(false);
    }
  };

  return (
    <nav className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4 sticky top-0 z-50" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }} ref={dropdownRef}>
      {/* Logo */}
      <div className="flex items-center min-w-fit">
        <Image
          src={boardifyLogo}
          alt="Boardify logo"
          className="h-9 w-auto"
          priority
        />
      </div>

      {/* Project selector */}
      <div className="relative ml-2">
        <div 
          onClick={(e) => toggleDropdown("projects", e)}
          className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
        >
          <span className="text-sm text-gray-500 font-medium">My Projects</span>
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${activeDropdown === 'projects' ? 'rotate-180' : ''}`} />
        </div>

        {/* Dropdown Projects */}
        {activeDropdown === "projects" && (
          <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Projects</div>
            <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3 transition-colors">
              <Folder size={16} /> Q2 Product Sprint
            </button>
            <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3 transition-colors">
              <Folder size={16} /> Marketing Website
            </button>
            <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3 transition-colors">
              <Folder size={16} /> Mobile App Redesign
            </button>
            <div className="h-px bg-gray-100 my-1"></div>
            <button className="w-full text-left px-4 py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 flex items-center gap-2 transition-colors">
              <Plus size={16} /> Create New Project
            </button>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="hidden md:block w-px h-5 bg-gray-200 mx-1" />

      {/* Search */}
      <div className={`relative flex-1 max-w-sm transition-all duration-200 ${searchFocused ? "max-w-md" : ""}`}>
        <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${searchFocused ? 'text-indigo-500' : 'text-gray-400'}`} />
        <input
          type="text"
          placeholder="Search tasks, projects, or people..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClick={(e) => {
            e.stopPropagation();
            setSearchFocused(true);
            setActiveDropdown(null);
          }}
          className="w-full pl-9 pr-8 py-2 rounded-xl text-sm outline-none transition-all duration-200"
          style={{
            background: searchFocused ? "#fff" : "#f5f6fa",
            border: searchFocused ? "1.5px solid #6366f1" : "1.5px solid transparent",
            color: "#374151",
            boxShadow: searchFocused ? "0 0 0 3px rgba(99,102,241,0.1)" : "none",
          }}
        />
        {searchQuery && searchFocused && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
        {!searchQuery && !searchFocused && (
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">⌘K</kbd>
        )}

        {/* Dropdown Search Results */}
        {searchFocused && searchQuery.length > 0 && (
          <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Search Results</div>
            <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer">
              <p className="text-sm font-medium text-gray-800">Implement {searchQuery} API</p>
              <p className="text-xs text-gray-500">In: Q2 Product Sprint &gt; Development</p>
            </div>
            <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer">
              <p className="text-sm font-medium text-gray-800">Design {searchQuery} UI Mockups</p>
              <p className="text-xs text-gray-500">In: Mobile App Redesign &gt; Design</p>
            </div>
            <div className="h-px bg-gray-100 my-1"></div>
            <div className="px-4 py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 cursor-pointer text-center">
              See all results for "{searchQuery}"
            </div>
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Notification bell */}
        <div className="relative">
          <button 
            onClick={(e) => toggleDropdown("notifications", e)}
            className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${activeDropdown === 'notifications' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-50 text-gray-500'}`}
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border border-white" style={{ background: "#ef4444" }} />
          </button>

          {/* Dropdown Notifications */}
          {activeDropdown === "notifications" && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 py-2 flex justify-between items-center border-b border-gray-50">
                <span className="text-sm font-bold text-gray-800">Notifications</span>
                <span className="text-xs text-indigo-600 font-medium cursor-pointer hover:underline">Mark all as read</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex gap-3 border-l-2 border-indigo-500 bg-indigo-50/30">
                  <div className="mt-0.5 bg-blue-100 p-1.5 rounded-full text-blue-600 shrink-0"><MessageSquare size={14} /></div>
                  <div>
                    <p className="text-sm text-gray-800"><span className="font-bold">Alex M.</span> commented on <span className="font-medium">Design landing page</span></p>
                    <p className="text-xs text-gray-500 mt-0.5">"Looks great! I'll start implementing this..."</p>
                    <p className="text-[10px] text-gray-400 mt-1">10 mins ago</p>
                  </div>
                </div>
                <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex gap-3">
                  <div className="mt-0.5 bg-green-100 p-1.5 rounded-full text-green-600 shrink-0"><CheckCircle2 size={14} /></div>
                  <div>
                    <p className="text-sm text-gray-800"><span className="font-bold">Sara K.</span> moved <span className="font-medium">Setup database</span> to Done</p>
                    <p className="text-[10px] text-gray-400 mt-1">2 hours ago</p>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-50 px-4 py-2 text-center text-xs text-gray-500 font-medium hover:text-gray-800 cursor-pointer transition-colors mt-1">
                View all notifications
              </div>
            </div>
          )}
        </div>

        {/* Avatar / Profile */}
        <div className="relative">
          <button 
            onClick={(e) => toggleDropdown("profile", e)}
            className={`flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl transition-colors ${activeDropdown === 'profile' ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-sm" style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)" }}>
              {userInitials}
            </div>
            <div className="hidden lg:flex flex-col items-start text-left">
              <span className="text-sm text-gray-800 font-bold leading-tight">{userName}</span>
              <span className="text-[10px] text-gray-500 font-medium leading-tight">Workspace Admin</span>
            </div>
            <ChevronDown size={14} className={`hidden lg:block text-gray-400 transition-transform ${activeDropdown === 'profile' ? 'rotate-180 text-indigo-500' : ''}`} />
          </button>

          {/* Dropdown Profile */}
          {activeDropdown === "profile" && (
            <div className="absolute top-full right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 py-3 border-b border-gray-50 mb-1">
                <p className="text-sm font-bold text-gray-800">{userName}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{userEmail || "user@boardify.com"}</p>
              </div>
              
              <button 
                onClick={() => router.push('/admin/settings')}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
              >
                <Settings size={16} className="text-gray-400" /> Account Settings
              </button>
              
              <div className="h-px bg-gray-100 my-1"></div>
              
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 font-medium hover:bg-red-50 flex items-center gap-3 transition-colors"
              >
                <LogOut size={16} className="text-red-500" /> Sign Out
              </button>
            </div>
          )}
        </div>

        {/* New Task Button */}
        <button
          onClick={onNewTask}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ml-2"
          style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            boxShadow: "0 2px 8px rgba(99,102,241,0.35)",
          }}
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New Task</span>
        </button>
      </div>
    </nav>
  );
}
