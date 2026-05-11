"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Bell, Plus, ChevronDown, LogOut, Settings, Folder, CheckCircle2, MessageSquare, X, LayoutGrid, ChartNoAxesGantt, Users, History } from "lucide-react";
import { BoardMembers } from "./BoardMembers";
import { createBrowserClient } from "@supabase/ssr";
import boardifyLogo from "../../../asset/Boardify.png";
import { isInvalidRefreshTokenError } from "@/lib/auth-utils";

export type UserView = "board" | "timeline" | "reports" | "report-history";

interface NavBarProps {
  onNewTask: () => void;
  activeView: UserView;
  onViewChange: (view: UserView) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  // Props Baru untuk fitur Board
  boards: any[];
  currentBoardId: string | null;
  onSwitchBoard: (id: string, name: string) => void;
  onCreateBoard: (name: string) => void;
}

export function NavBar({ onNewTask, activeView, onViewChange, searchQuery, onSearchChange, boards, currentBoardId, onSwitchBoard, onCreateBoard }: NavBarProps) {
  const router = useRouter();
  const [searchFocused, setSearchFocused] = useState(false);
  const [userName, setUserName] = useState("Loading...");
  const [userEmail, setUserEmail] = useState("");
  const [userInitials, setUserInitials] = useState("--");

  const [activeDropdown, setActiveDropdown] = useState<"projects" | "notifications" | "profile" | "members" | null>(null);
  
  // State untuk buat board baru secara inline
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const createInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
        setSearchFocused(false);
        setIsCreatingBoard(false);
        setNewBoardName("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isCreatingBoard && createInputRef.current) {
      createInputRef.current.focus();
    }
  }, [isCreatingBoard]);

  useEffect(() => {
    async function fetchUser() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserEmail(session.user.email || "");
          const { data: user } = await supabase
            .from('users')
            .select('name')
            .eq('id', session.user.id)
            .single();
          if (user?.name) {
            setUserName(user.name);
            const names = user.name.trim().split(' ');
            const initials = names.length > 1
              ? `${names[0][0]}${names[names.length - 1][0]}`
              : names[0].substring(0, 2);
            setUserInitials(initials.toUpperCase());
          } else {
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
        if (isInvalidRefreshTokenError(error)) {
          const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );
          await supabase.auth.signOut();
          router.push('/login');
          router.refresh();
          return;
        }
        setUserName("User");
        setUserInitials("U");
      }
    }
    fetchUser();
  }, []);

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const toggleDropdown = (name: "projects" | "notifications" | "profile" | "members", e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeDropdown === name) {
      setActiveDropdown(null);
      setIsCreatingBoard(false);
    } else {
      setActiveDropdown(name);
      setSearchFocused(false);
    }
  };

  const submitNewBoard = () => {
    if (newBoardName.trim().length > 0) {
      onCreateBoard(newBoardName.trim());
      setIsCreatingBoard(false);
      setNewBoardName("");
      setActiveDropdown(null);
    }
  };

  return (
    <nav className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4 sticky top-0 z-50" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }} ref={dropdownRef}>
      <div className="flex items-center min-w-fit">
        <Image src={boardifyLogo} alt="Boardify logo" className="h-9 w-auto" priority />
      </div>

      <div className="relative ml-2">
        <div
          onClick={(e) => toggleDropdown("projects", e)}
          className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
        >
          <span className="text-sm text-gray-500 font-medium">My Projects</span>
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${activeDropdown === 'projects' ? 'rotate-180' : ''}`} />
        </div>
        
        {activeDropdown === "projects" && (
          <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Your Boards</div>
            
            <div className="max-h-[250px] overflow-y-auto">
              {boards.map((board) => (
                <button 
                  key={board.id}
                  onClick={() => {
                    onSwitchBoard(board.id, board.name);
                    setActiveDropdown(null);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-3 transition-colors ${
                    currentBoardId === board.id 
                    ? "bg-indigo-50 text-indigo-700 font-medium" 
                    : "text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Folder size={16} className={currentBoardId === board.id ? "text-indigo-500" : "text-gray-400"} /> 
                    <span className="truncate max-w-[140px]">{board.name}</span>
                  </div>
                  {currentBoardId === board.id && <CheckCircle2 size={14} className="text-indigo-600" />}
                </button>
              ))}
            </div>

            <div className="h-px bg-gray-100 my-1"></div>
            
            {isCreatingBoard ? (
              <div className="px-4 py-2">
                <input
                  ref={createInputRef}
                  type="text"
                  placeholder="Board name..."
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitNewBoard();
                    if (e.key === "Escape") setIsCreatingBoard(false);
                  }}
                  className="w-full px-3 py-1.5 text-sm border border-indigo-300 rounded-md outline-none focus:ring-2 focus:ring-indigo-100 mb-2"
                />
                <div className="flex gap-2">
                  <button onClick={submitNewBoard} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 flex-1">Save</button>
                  <button onClick={() => setIsCreatingBoard(false)} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 flex-1">Cancel</button>
                </div>
              </div>
            ) : (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCreatingBoard(true);
                }} 
                className="w-full text-left px-4 py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 flex items-center gap-2 transition-colors"
              >
                <Plus size={16} /> Create New Board
              </button>
            )}
          </div>
        )}
      </div>

      <div className="hidden md:block w-px h-5 bg-gray-200 mx-1" />

      <div className="hidden lg:flex items-center gap-1 rounded-xl p-1" style={{ background: "#f5f6fa" }}>
        {[
          { key: "board" as const, label: "Board", icon: LayoutGrid },
          { key: "timeline" as const, label: "Timeline", icon: ChartNoAxesGantt },
          { key: "reports" as const, label: "Reports", icon: null },
          { key: "report-history" as const, label: "History", icon: History },
        ].map((item) => {
          const isActive = activeView === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onViewChange(item.key)}
              className={`flex items-center ${item.icon ? "gap-1.5" : "gap-0"} px-3 py-1.5 rounded-lg text-sm transition-colors`}
              style={{
                background: isActive ? "white" : "transparent",
                color: isActive ? "#4f46e5" : "#6b7280",
                boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                fontWeight: isActive ? 600 : 500,
              }}
            >
              {item.icon ? <item.icon size={14} /> : null}
              {item.label}
            </button>
          );
        })}
      </div>

      <div className={`relative flex-1 max-w-sm transition-all duration-200 ${searchFocused ? "max-w-md" : ""}`}>
        <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${searchFocused ? 'text-indigo-500' : 'text-gray-400'}`} />
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
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
          <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <div className="relative">
          <button
            onClick={(e) => toggleDropdown("members", e)}
            className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${activeDropdown === 'members' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-50 text-gray-500'}`}
          >
            <Users size={18} />
          </button>
          {activeDropdown === "members" && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-3 z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-3">
                {/* find current board data and pass to BoardMembers */}
                {(() => {
                  const current = boards.find((b) => b.id === currentBoardId);
                  const boardName = current?.name || "Untitled";
                  const ownerId = current?.owner_id || null;
                  const members = current?.members || [];
                  return (
                    <BoardMembers boardId={currentBoardId} boardName={boardName} ownerId={ownerId} members={members} />
                  );
                })()}
              </div>
            </div>
          )}
        </div>

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
          {activeDropdown === "profile" && (
            <div className="absolute top-full right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 py-3 border-b border-gray-50 mb-1">
                <p className="text-sm font-bold text-gray-800">{userName}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{userEmail || "user@boardify.com"}</p>
              </div>
              <button onClick={() => router.push('/admin/settings')} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                <Settings size={16} className="text-gray-400" /> Account Settings
              </button>
              <div className="h-px bg-gray-100 my-1"></div>
              <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-600 font-medium hover:bg-red-50 flex items-center gap-3 transition-colors">
                <LogOut size={16} className="text-red-500" /> Sign Out
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onNewTask}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ml-2"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 2px 8px rgba(99,102,241,0.35)" }}
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New Task</span>
        </button>
      </div>
    </nav>
  );
}