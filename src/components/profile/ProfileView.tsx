import React from "react";
import { useAuth } from "../../context/AuthContext.tsx";
import {
  User,
  ShieldCheck,
  GraduationCap,
  Mail,
  Calendar,
  KeyRound,
  LogOut,
  ArrowRightLeft,
  CheckCircle,
} from "lucide-react";

export const ProfileView: React.FC = () => {
  const { user, logout, switchQuickAccount } = useAuth();
  const isAdmin = user?.role === "admin";

  const handleRoleToggle = async () => {
    if (isAdmin) {
      await switchQuickAccount("student");
    } else {
      await switchQuickAccount("admin");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Profile Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-slate-900 text-white text-xl font-bold flex items-center justify-center shadow-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{user?.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  isAdmin
                    ? "bg-amber-50 text-amber-900 border border-amber-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                {isAdmin ? <ShieldCheck className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
                {isAdmin ? "College Administrator" : "Enrolled Student"}
              </span>
              <span className="text-xs text-slate-400">ID: {user?.id}</span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors border border-rose-200 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>

      {/* Account Info & Permissions Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Account Specifications
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> College Email
              </span>
              <span className="font-semibold text-slate-800">{user?.email}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Account Created
              </span>
              <span className="font-semibold text-slate-800">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Active"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" /> Authentication Type
              </span>
              <span className="font-semibold text-slate-800">JWT Bearer Token</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Active Role Capabilities
          </h2>

          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Query knowledge base with multi-turn chat memory</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>View full source citations with document name and page number</span>
            </div>
            {isAdmin ? (
              <>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>Upload official institutional circulars and regulations</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>Manage vector chunking pipelines and delete documents</span>
                </div>
              </>
            ) : (
              <div className="flex items-start gap-2 text-slate-400">
                <span className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] shrink-0">
                  —
                </span>
                <span>Administrative upload actions restricted to college staff</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Role Switcher Sandbox Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Demonstration Role Switcher</h3>
          <p className="text-slate-500 mt-0.5">
            Switch between Student and Admin viewpoints to test permissions, upload capabilities, and student chat.
          </p>
        </div>

        <button
          onClick={handleRoleToggle}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-semibold uppercase tracking-wider text-xs transition-colors flex items-center gap-2 shrink-0 shadow-sm"
        >
          <ArrowRightLeft className="w-4 h-4 text-blue-400" />
          <span>Switch to {isAdmin ? "Student" : "Admin"}</span>
        </button>
      </div>
    </div>
  );
};
