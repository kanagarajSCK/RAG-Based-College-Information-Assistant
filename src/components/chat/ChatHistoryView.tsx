import React, { useState, useEffect } from "react";
import apiClient from "../../services/api.ts";
import { Conversation, ApiResponse } from "../../types/index.ts";
import { useToast } from "../../context/ToastContext.tsx";
import { ConfirmationModal } from "../common/ConfirmationModal.tsx";
import {
  History,
  MessageSquare,
  Search,
  Trash2,
  Edit2,
  ChevronRight,
  Clock,
  Plus,
} from "lucide-react";

interface ChatHistoryViewProps {
  onSelectConversation: (convId: string) => void;
  onStartNewChat: () => void;
}

export const ChatHistoryView: React.FC<ChatHistoryViewProps> = ({
  onSelectConversation,
  onStartNewChat,
}) => {
  const { showToast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [convToDelete, setConvToDelete] = useState<Conversation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<ApiResponse<Conversation[]>>("/conversations");
      if (res.data.success && res.data.data) {
        setConversations(res.data.data);
      }
    } catch (err) {
      console.error("[History] Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async () => {
    if (!convToDelete) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/conversations/${convToDelete.id}`);
      setConversations((prev) => prev.filter((c) => c.id !== convToDelete.id));
      showToast("Conversation deleted from history.", "info");
    } catch (err) {
      showToast("Failed to delete conversation.", "error");
    } finally {
      setIsDeleting(false);
      setConvToDelete(null);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <ConfirmationModal
        isOpen={!!convToDelete}
        title="Delete Conversation Record"
        message={`Are you sure you want to delete "${convToDelete?.title}"? This conversation history will be permanently deleted.`}
        confirmLabel="Delete"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setConvToDelete(null)}
      />

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 mb-1.5">
            <History className="w-3.5 h-3.5" />
            Personal Inquiry Log
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Chat & Inquiry History</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review previous answers and revisit grounded explanations.
          </p>
        </div>

        <button
          onClick={onStartNewChat}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Ask New Question
        </button>
      </div>

      {/* Filter and List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chat history..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 text-slate-900"
            />
          </div>

          <span className="text-xs text-slate-400 font-medium">
            {filteredConversations.length} saved conversations
          </span>
        </div>

        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700 text-sm">No conversations found</p>
            <p className="mt-1">
              {searchQuery ? "Try a different search keyword." : "You have not started any conversations yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70 p-2 rounded-lg transition-colors group"
              >
                <div
                  onClick={() => onSelectConversation(conv.id)}
                  className="min-w-0 flex-1 cursor-pointer"
                >
                  <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                    {conv.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(conv.updatedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onSelectConversation(conv.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors flex items-center gap-1"
                  >
                    <span>Resume</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setConvToDelete(conv)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                    title="Delete conversation"
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
