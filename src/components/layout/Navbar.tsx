import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.tsx";
import {
  GraduationCap,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Menu,
  BookOpen,
  MessageSquare,
  ArrowRightLeft,
  Activity,
} from "lucide-react";

interface NavbarProps {
  onOpenMobileMenu?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileMenu, activeTab, setActiveTab }) => {
  const { user, logout, switchQuickAccount } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRoleToggle = async () => {
    if (user?.role === "admin") {
      await switchQuickAccount("student");
    } else {
      await switchQuickAccount("admin");
    }
  };

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case "chat":
        return "Academic Inquiries";
      case "knowledge":
        return "Verified Document Repository";
      case "history":
        return "Saved Conversations";
      case "admin":
      case "admin-docs":
        return "Administrative Knowledge Operations";
      case "profile":
        return "User Profile & Access";
      default:
        return user?.role === "admin" ? "Institutional Overview" : "Student Dashboard";
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 bg-white shrink-0 sticky top-0 z-30">
      {/* Left: Mobile hamburger & Sleek Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
          <span className="text-slate-400">CampusIQ</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800 uppercase tracking-wide font-semibold truncate max-w-[200px] sm:max-w-none">
            {getBreadcrumbTitle()}
          </span>
        </div>
      </div>

      {/* Right: System Status & User Control */}
      <div className="flex items-center gap-3">
        {/* Sleek System Active Badge from Design */}
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase tracking-wider hidden sm:inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            System Active
          </span>
        </div>

        {/* Role Switcher Pill */}
        <button
          onClick={handleRoleToggle}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors shadow-2xs"
          title={`Switch to ${user?.role === "admin" ? "Student" : "Admin"}`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
          <span>Switch to {user?.role === "admin" ? "Student" : "Admin"}</span>
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors focus:outline-none"
            aria-expanded={dropdownOpen}
            aria-label="User menu"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : "K"}
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-xs font-semibold text-slate-900 leading-tight">{user?.name || "Kanagaraj"}</p>
              <p className="text-[10px] text-slate-500 leading-tight capitalize">{user?.role || "Student"}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in duration-100">
              <div className="px-3.5 py-2.5 border-b border-slate-100">
                <p className="font-semibold text-slate-900 text-xs truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                  {user?.role === "admin" ? "College Administrator" : "Enrolled Student"}
                </span>
              </div>

              <button
                onClick={() => {
                  setActiveTab("profile");
                  setDropdownOpen(false);
                }}
                className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                Account Profile
              </button>

              <button
                onClick={() => {
                  handleRoleToggle();
                  setDropdownOpen(false);
                }}
                className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 md:hidden"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                Switch to {user?.role === "admin" ? "Student" : "Admin"}
              </button>

              <div className="border-t border-slate-100 my-1"></div>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full px-3.5 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
