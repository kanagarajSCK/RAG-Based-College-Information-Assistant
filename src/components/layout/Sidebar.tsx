import React from "react";
import { useAuth } from "../../context/AuthContext.tsx";
import {
  LayoutDashboard,
  MessageSquare,
  History,
  BookOpen,
  User,
  ShieldCheck,
  FileText,
  LogOut,
  X,
  Plus,
  ArrowRightLeft,
  GraduationCap,
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onStartNewChat?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  onCloseMobile,
  onStartNewChat,
}) => {
  const { user, logout, switchQuickAccount } = useAuth();
  const isAdmin = user?.role === "admin";

  const navItems = isAdmin
    ? [
        { id: "admin", label: "Admin Dashboard", icon: LayoutDashboard },
        { id: "admin-docs", label: "Document Manager", icon: FileText },
        { id: "chat", label: "Conversations", icon: MessageSquare },
        { id: "knowledge", label: "Knowledge Base", icon: BookOpen },
        { id: "profile", label: "Account Profile", icon: User },
      ]
    : [
        { id: "dashboard", label: "Student Overview", icon: LayoutDashboard },
        { id: "chat", label: "Conversations", icon: MessageSquare },
        { id: "history", label: "Inquiry History", icon: History },
        { id: "knowledge", label: "Knowledge Base", icon: BookOpen },
        { id: "profile", label: "Account Profile", icon: User },
      ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    onCloseMobile();
  };

  const handleRoleToggle = async () => {
    if (isAdmin) {
      await switchQuickAccount("student");
    } else {
      await switchQuickAccount("admin");
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sleek Dark Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:z-10 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center font-bold text-white text-sm shadow-sm">
              C
            </div>
            <div>
              <h1 className="text-white font-semibold text-base tracking-tight leading-tight">CampusIQ</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">RAG Assistant</p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Button: New Question */}
        <div className="p-4 border-b border-slate-800/80">
          <button
            onClick={() => {
              if (onStartNewChat) onStartNewChat();
              setActiveTab("chat");
              onCloseMobile();
            }}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold tracking-wide transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
          <div className="space-y-1">
            <h3 className="text-slate-500 text-[11px] uppercase font-bold tracking-wider px-3 mb-2">
              {isAdmin ? "Administration" : "Menu"}
            </h3>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors text-left ${
                    isActive
                      ? "bg-slate-800 text-white font-semibold shadow-xs"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Grounding System Badge */}
          <div className="mx-1 p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
              <span className="text-[11px]">Strict RAG Grounding</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              All answers cite official verified circulars & documentation.
            </p>
          </div>
        </nav>

        {/* User Card & Role Switcher */}
        <div className="p-3 border-t border-slate-800 mt-auto bg-slate-900/90 space-y-2">
          <div
            onClick={() => setActiveTab("profile")}
            className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-200 text-xs font-bold shrink-0">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "CK"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name || "Kanagaraj"}</p>
              <p className="text-[10px] text-slate-400 truncate capitalize">
                {isAdmin ? "Administrator" : "Student Role"}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                logout();
              }}
              className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
              title="Sign Out"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Demo Role Switcher */}
          <button
            onClick={handleRoleToggle}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-md transition-colors border border-slate-700/50"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
            <span>Switch to {isAdmin ? "Student" : "Admin"}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
