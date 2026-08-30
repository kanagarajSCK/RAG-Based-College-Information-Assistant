import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext.tsx";
import { GraduationCap, ShieldCheck, ArrowRight, Lock, Mail, User, AlertCircle } from "lucide-react";
import { UserRole } from "../../types/index.ts";

export const AuthPage: React.FC = () => {
  const { login, signup, switchQuickAccount } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<UserRole>("student");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(name, email, password, role);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Authentication failed. Please verify credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoRole: "student" | "admin") => {
    setError(null);
    setIsLoading(true);
    try {
      await switchQuickAccount(demoRole);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Demo login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-md">
            <GraduationCap className="w-6 h-6 text-blue-400" />
          </div>
        </div>
        <h1 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          CampusIQ
        </h1>
        <p className="mt-1 text-center text-xs text-slate-500 uppercase font-semibold tracking-wider">
          Official College Information & RAG Assistant
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-xl sm:px-10">
          {/* Fast Demo Account Selector */}
          <div className="mb-6 pb-6 border-b border-slate-200">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              Quick One-Click Demo Access
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleDemoLogin("student")}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 p-2.5 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin("admin")}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 p-2.5 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Admin</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              Student: Kanagaraj | Admin: Dr. Vance
            </p>
          </div>

          {/* Form Tabs */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-colors ${
                mode === "login"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-colors ${
                mode === "signup"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-md bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Henderson"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Account Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    <label
                      className={`flex items-center justify-center p-2 rounded-md border text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all ${
                        role === "student"
                          ? "bg-blue-50 border-blue-600 text-blue-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="student"
                        checked={role === "student"}
                        onChange={() => setRole("student")}
                        className="sr-only"
                      />
                      Student
                    </label>
                    <label
                      className={`flex items-center justify-center p-2 rounded-md border text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all ${
                        role === "admin"
                          ? "bg-amber-50 border-amber-600 text-amber-800"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="admin"
                        checked={role === "admin"}
                        onChange={() => setRole("admin")}
                        className="sr-only"
                      />
                      Administrator
                    </label>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">College Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@campusiq.edu"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === "login" ? "Sign In to Portal" : "Create My Account"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
