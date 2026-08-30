import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.tsx";
import apiClient from "../../services/api.ts";
import { Conversation, CollegeDocument, ApiResponse } from "../../types/index.ts";
import {
  MessageSquare,
  BookOpen,
  History,
  ArrowRight,
  Sparkles,
  FileText,
  Clock,
  ChevronRight,
  ShieldCheck,
  Building2,
  Calendar,
  Award,
  GraduationCap,
  Briefcase,
  HelpCircle,
} from "lucide-react";

interface StudentDashboardProps {
  onStartChatWithPrompt: (prompt: string) => void;
  onNavigateTab: (tab: string) => void;
  onSelectConversation: (convId: string) => void;
}

const suggestedQuestions = [
  {
    category: "Hostel & Residence",
    icon: Building2,
    question: "What are the hostel admission requirements?",
  },
  {
    category: "Examinations",
    icon: Calendar,
    question: "When is the next semester examination?",
  },
  {
    category: "Admissions",
    icon: FileText,
    question: "What documents are required for admission?",
  },
  {
    category: "Central Library",
    icon: BookOpen,
    question: "What are the library timings?",
  },
  {
    category: "Financial Aid",
    icon: Award,
    question: "Are scholarships available for students?",
  },
  {
    category: "Academics",
    icon: GraduationCap,
    question: "What is the attendance requirement?",
  },
];

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onStartChatWithPrompt,
  onNavigateTab,
  onSelectConversation,
}) => {
  const { user } = useAuth();
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);
  const [documents, setDocuments] = useState<CollegeDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [convRes, docRes] = await Promise.all([
          apiClient.get<ApiResponse<Conversation[]>>("/conversations"),
          apiClient.get<ApiResponse<CollegeDocument[]>>("/documents"),
        ]);

        if (convRes.data.success && convRes.data.data) {
          setRecentConversations(convRes.data.data.slice(0, 4));
        }
        if (docRes.data.success && docRes.data.data) {
          setDocuments(docRes.data.data.slice(0, 5));
        }
      } catch (err) {
        console.error("[Dashboard] Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Verified College Information Assistant
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              {getGreeting()}, {user?.name || "Student"}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Ask any question regarding college rules, academic regulations, examination schedules, hostel guidelines, or scholarships. All answers are grounded in official verified documents.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={() => onNavigateTab("chat")}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <MessageSquare className="w-4 h-4" />
              Ask a Question
            </button>
            <button
              onClick={() => onNavigateTab("knowledge")}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 border border-slate-200"
            >
              <BookOpen className="w-4 h-4 text-slate-600" />
              Browse Documents
            </button>
          </div>
        </div>
      </div>

      {/* Suggested Inquiries (Click to Ask) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Suggested Questions</h2>
            <p className="text-xs text-slate-500">Select any official topic to launch instant grounded retrieval</p>
          </div>
          <span className="text-xs font-medium text-slate-400">6 topics available</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {suggestedQuestions.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => onStartChatWithPrompt(item.question)}
                className="text-left p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all group flex flex-col justify-between shadow-2xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                    <Icon className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-slate-700">{item.category}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                    "{item.question}"
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-semibold uppercase tracking-wider">
                  <span>Ask CampusIQ</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Two Column Section: Recent Chats & Available Official Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Conversations */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-900">Recent Conversations</h3>
              </div>
              <button
                onClick={() => onNavigateTab("history")}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                View all
              </button>
            </div>

            {loading ? (
              <div className="space-y-3 py-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentConversations.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-medium text-slate-700">No conversations yet</p>
                <p className="text-slate-400 mt-1">Ask your first question about college policies.</p>
                <button
                  onClick={() => onNavigateTab("chat")}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700"
                >
                  Start Chat
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => {
                      onSelectConversation(conv.id);
                      onNavigateTab("chat");
                    }}
                    className="w-full p-2.5 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-between text-left transition-colors group"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-600">
                        {conv.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(conv.updatedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Conversations are securely saved</span>
            <button
              onClick={() => onNavigateTab("chat")}
              className="text-blue-600 font-semibold hover:underline"
            >
              + New chat
            </button>
          </div>
        </div>

        {/* Indexed College Documents Knowledge Preview */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Indexed Knowledge Documents</h3>
              </div>
              <button
                onClick={() => onNavigateTab("knowledge")}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Browse directory
              </button>
            </div>

            {loading ? (
              <div className="space-y-3 py-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-medium text-slate-700">No documents in knowledge base yet</p>
                <p className="text-slate-400 mt-1">Check back once administrators upload circulars.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-2.5 rounded-lg border border-slate-100 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-red-500 text-[10px] font-bold px-1.5 py-0.5 bg-red-50 rounded border border-red-200">
                          PDF
                        </span>
                        <p className="text-xs font-semibold text-slate-800 truncate">{doc.name}</p>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {doc.pageCount ? `${doc.pageCount} Pages • ` : ""}
                        {doc.chunkCount} indexed chunks • {doc.uploadedByName || "Administration"}
                      </p>
                    </div>
                    <button
                      onClick={() => onStartChatWithPrompt(`Tell me the main policies covered in ${doc.name}`)}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md shrink-0 transition-colors"
                      title="Ask question based on this document"
                    >
                      Inquire
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 text-green-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              All documents fully indexed
            </span>
            <button
              onClick={() => onNavigateTab("knowledge")}
              className="text-blue-600 font-semibold hover:underline"
            >
              Explore all documents →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
