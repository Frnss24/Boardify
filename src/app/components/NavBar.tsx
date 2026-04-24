import { useState } from "react";
import Image from "next/image";
import { Search, Bell, Plus, ChevronDown } from "lucide-react";
import boardifyLogo from "../../../asset/Boardify.png";

interface NavBarProps {
  onNewTask: () => void;
}

export function NavBar({ onNewTask }: NavBarProps) {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <nav className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4 sticky top-0 z-50" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
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
      <div className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ml-2">
        <span className="text-sm text-gray-500">My Projects</span>
        <ChevronDown size={14} className="text-gray-400" />
      </div>

      {/* Divider */}
      <div className="hidden md:block w-px h-5 bg-gray-200 mx-1" />

      {/* Search */}
      <div className={`relative flex-1 max-w-sm transition-all duration-200 ${searchFocused ? "max-w-md" : ""}`}>
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search tasks..."
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none transition-all duration-200"
          style={{
            background: searchFocused ? "#fff" : "#f5f6fa",
            border: searchFocused ? "1.5px solid #6366f1" : "1.5px solid transparent",
            color: "#374151",
            boxShadow: searchFocused ? "0 0 0 3px rgba(99,102,241,0.1)" : "none",
          }}
        />
        {searchFocused && (
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">⌘K</kbd>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Notification bell */}
        <button className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors">
          <Bell size={18} className="text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "#6366f1" }} />
        </button>

        {/* Avatar */}
        <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-50 transition-colors">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ background: "linear-gradient(135deg, #818cf8, #6366f1)" }}>
            JS
          </div>
          <span className="hidden lg:block text-sm text-gray-700">Jamie S.</span>
          <ChevronDown size={13} className="hidden lg:block text-gray-400" />
        </button>

        {/* New Task Button */}
        <button
          onClick={onNewTask}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            boxShadow: "0 2px 8px rgba(99,102,241,0.35)",
          }}
        >
          <Plus size={16} />
          <span>New Task</span>
        </button>
      </div>
    </nav>
  );
}
