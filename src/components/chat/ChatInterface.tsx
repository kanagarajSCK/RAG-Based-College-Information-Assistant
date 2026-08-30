import React, { useState, useEffect, useRef } from "react";
import apiClient from "../../services/api.ts";
import { Conversation, Message, ApiResponse, SourceReference } from "../../types/index.ts";
import { useToast } from "../../context/ToastContext.tsx";
import { ConfirmationModal } from "../common/ConfirmationModal.tsx";
import {
  Plus,
  Search,
  MessageSquare,
  Send,
  Trash2,
  Edit2,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  FileText,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Menu,
  X,
  Clock,
  Sparkles,
} from "lucide-react";

interface ChatInterfaceProps {
  initialConversationId?: string | null;
  initialPrompt?: string | null;
  onClearInitialPrompt?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  initialConversationId,
  initialPrompt,
  onClearInitialPrompt,
}) => {
  const { showToast } = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(initialConversationId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");

  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Rename modal / inline state
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Delete modal state
  const [convToDelete, setConvToDelete] = useState<Conversation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Copied state tracking
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Expanded sources tracking
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of message list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Load conversations on mount
  const loadConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const res = await apiClient.get<ApiResponse<Conversation[]>>("/conversations");
      if (res.data.success && res.data.data) {
        setConversations(res.data.data);
      }
    } catch (err) {
      console.error("[Chat] Error fetching conversations:", err);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when activeConversationId changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        setIsLoadingMessages(true);
        const res = await apiClient.get<ApiResponse<{ conversation: Conversation; messages: Message[] }>>(
          `/conversations/${activeConversationId}`
        );
        if (res.data.success && res.data.data) {
          setMessages(res.data.data.messages);
        }
      } catch (err) {
        console.error("[Chat] Error loading conversation messages:", err);
        showToast("Could not load conversation history.", "error");
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [activeConversationId]);

  // Handle initial prompt trigger (e.g. from suggested questions)
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendMessage(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt]);

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const content = textToSend !== undefined ? textToSend.trim() : inputValue.trim();
    if (!content || isSending) return;

    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Optimistic UI for user message
    const tempUserMsg: Message = {
      id: `temp_${Date.now()}`,
      conversationId: activeConversationId || "pending",
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsSending(true);

    try {
      const res = await apiClient.post<
        ApiResponse<{
          conversation: Conversation;
          userMessage: Message;
          assistantMessage: Message;
        }>
      >("/chat", {
        conversationId: activeConversationId || undefined,
        message: content,
      });

      if (res.data.success && res.data.data) {
        const { conversation, userMessage, assistantMessage } = res.data.data;

        // If new conversation was created
        if (!activeConversationId) {
          setActiveConversationId(conversation.id);
          setConversations((prev) => [conversation, ...prev.filter((c) => c.id !== conversation.id)]);
        } else {
          // Update conversation in list to reflect new updatedAt
          setConversations((prev) =>
            prev.map((c) => (c.id === conversation.id ? { ...c, updatedAt: conversation.updatedAt } : c))
          );
        }

        // Replace temp message with server confirmed messages
        setMessages((prev) => [...prev.filter((m) => m.id !== tempUserMsg.id), userMessage, assistantMessage]);
      }
    } catch (err: any) {
      console.error("[Chat] Send message error:", err);
      showToast(err?.response?.data?.message || "Failed to send message.", "error");

      // Add failure notice
      const errorAssistantMsg: Message = {
        id: `err_${Date.now()}`,
        conversationId: activeConversationId || "error",
        role: "assistant",
        content: "Sorry, I encountered an error while processing your request. Please try asking again.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorAssistantMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setInputValue("");
    setIsMobileSidebarOpen(false);
  };

  const handleStartRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConvId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = async (convId: string) => {
    if (!editTitle.trim()) {
      setEditingConvId(null);
      return;
    }

    try {
      const res = await apiClient.patch<ApiResponse<Conversation>>(`/conversations/${convId}`, {
        title: editTitle.trim(),
      });

      if (res.data.success && res.data.data) {
        setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, title: editTitle.trim() } : c)));
        showToast("Conversation renamed.", "success");
      }
    } catch (err) {
      showToast("Failed to rename conversation.", "error");
    } finally {
      setEditingConvId(null);
    }
  };

  const handleDeleteConversation = async () => {
    if (!convToDelete) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/conversations/${convToDelete.id}`);
      setConversations((prev) => prev.filter((c) => c.id !== convToDelete.id));

      if (activeConversationId === convToDelete.id) {
        setActiveConversationId(null);
        setMessages([]);
      }
      showToast("Conversation deleted.", "info");
    } catch (err) {
      showToast("Failed to delete conversation.", "error");
    } finally {
      setIsDeleting(false);
      setConvToDelete(null);
    }
  };

  const handleCopyText = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    showToast("Answer copied to clipboard.", "success");
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const toggleSourceExpansion = (msgId: string) => {
    setExpandedSources((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  return (
    <div className="h-[calc(100dvh-5.5rem)] sm:h-[calc(100vh-6.5rem)] min-h-[480px] flex bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden relative">
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!convToDelete}
        title="Delete Conversation"
        message={`Are you sure you want to delete "${convToDelete?.title}"? This conversation history will be permanently deleted.`}
        confirmLabel="Delete"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConversation}
        onCancel={() => setConvToDelete(null)}
      />

      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* LEFT CONVERSATION SIDEBAR */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 lg:w-64 xl:w-72 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Top Action Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Conversations</span>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-white rounded"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleStartNewChat}
            className="w-full py-2 sm:py-2.5 px-3 sm:px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold tracking-wide transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>

          {/* Search Filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history..."
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-md focus:outline-none focus:border-blue-500 text-slate-200 placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Recent History
          </div>

          {isLoadingConversations ? (
            <div className="p-2 space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 bg-slate-800/60 rounded animate-pulse" />
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 px-3 text-xs text-slate-500">
              {searchQuery ? "No matching history." : "No saved conversations."}
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              const isEditing = conv.id === editingConvId;

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    if (!isEditing) {
                      setActiveConversationId(conv.id);
                      setIsMobileSidebarOpen(false);
                    }
                  }}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-md text-xs cursor-pointer transition-colors ${
                    isActive
                      ? "bg-slate-800 text-white font-medium shadow-xs"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 mr-1">
                    <MessageSquare
                      className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-blue-400" : "text-slate-500"}`}
                    />
                    {isEditing ? (
                      <input
                        type="text"
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleSaveRename(conv.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveRename(conv.id);
                          if (e.key === "Escape") setEditingConvId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-1.5 py-0.5 bg-slate-950 border border-blue-500 rounded text-xs text-white focus:outline-none"
                      />
                    ) : (
                      <span className="truncate">{conv.title}</span>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => handleStartRename(conv, e)}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700"
                        title="Rename title"
                        aria-label="Rename conversation"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConvToDelete(conv);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-700"
                        title="Delete conversation"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Grounding Badge Footer */}
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950/60">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
            <span>Strict Zero-Hallucination</span>
          </div>
          <p className="mt-0.5 text-[10px] text-slate-500">Verified institutional references</p>
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col bg-slate-50/50 overflow-hidden min-w-0">
        {/* Chat Header */}
        <div className="h-14 sm:h-16 px-3 sm:px-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 shrink-0"
              aria-label="Open conversation history drawer"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[160px] sm:max-w-md">
                  {activeConv ? activeConv.title : "Academic Inquiries"}
                </h2>
                <span className="px-1.5 sm:px-2 py-0.5 bg-green-100 text-green-700 text-[9px] sm:text-[10px] font-bold rounded uppercase tracking-wider shrink-0 hidden xs:inline-block">
                  Active
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate hidden sm:block">
                Grounded in official college circulars & regulations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleStartNewChat}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors border border-slate-200"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Conversation</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-xl mx-auto text-center py-4 sm:py-8 px-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-base sm:text-lg font-bold mb-3 sm:mb-4 shadow-sm">
                IQ
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
                Good day! I am CampusIQ
              </h3>
              <p className="text-xs text-slate-500 mb-4 sm:mb-6 leading-relaxed max-w-md">
                Your college assistant grounded in verified documents. Ask anything regarding hostel rules, examination schedules, attendance rules, scholarships, or admissions.
              </p>

              {/* Sample Starters */}
              <div className="w-full space-y-2 text-left">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest px-1">
                  Suggested topics:
                </p>
                {[
                  "What are the primary library timings during the examination period?",
                  "What is the minimum attendance requirement to appear in semester exams?",
                  "What are the hostel curfew timings and guest visit regulations?",
                  "Are Merit-cum-Means (MCM) scholarships available for students?",
                ].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="w-full p-2.5 sm:p-3 text-xs text-left font-medium text-slate-700 bg-white hover:bg-blue-50 hover:text-blue-900 rounded-xl border border-slate-200 hover:border-blue-300 transition-all flex items-center justify-between shadow-2xs group"
                  >
                    <span className="line-clamp-2 sm:line-clamp-1 pr-2">"{prompt}"</span>
                    <span className="text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity shrink-0">Ask →</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isAssistant = msg.role === "assistant";
              const hasSources = msg.sources && msg.sources.length > 0;
              const isSourceExpanded = expandedSources[msg.id];

              return (
                <div
                  key={msg.id || index}
                  className={`flex ${isAssistant ? "justify-start w-full max-w-3xl" : "justify-end w-full"}`}
                >
                  {isAssistant ? (
                    <div className="flex gap-2.5 sm:gap-3.5 w-full min-w-0">
                      {/* Avatar */}
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs shadow-xs mt-1">
                        IQ
                      </div>

                      {/* Content Column */}
                      <div className="space-y-2.5 sm:space-y-3 flex-1 min-w-0">
                        {/* Card */}
                        <div className="bg-white border border-slate-200 p-3.5 sm:p-5 rounded-xl shadow-sm leading-relaxed text-slate-700 text-xs sm:text-sm overflow-hidden">
                          <div className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</div>

                          <div className="flex items-center justify-between mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>

                            <button
                              onClick={() => handleCopyText(msg.content, msg.id)}
                              className="hover:text-slate-700 flex items-center gap-1 p-1 rounded hover:bg-slate-50 transition-colors"
                              title="Copy answer"
                              aria-label="Copy message text"
                            >
                              {copiedMsgId === msg.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-[10px] sm:text-[11px] text-emerald-700 font-medium">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span className="text-[10px] sm:text-[11px]">Copy Answer</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Grounded Document Sources */}
                        {hasSources && (
                          <div className="space-y-1.5 sm:space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                                Document Sources ({msg.sources?.length})
                              </p>
                              <button
                                onClick={() => toggleSourceExpansion(msg.id)}
                                className="text-[10px] sm:text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                              >
                                {isSourceExpanded ? "Hide Details" : "Show Snippets"}
                              </button>
                            </div>

                            <div className="flex flex-wrap gap-1.5 sm:gap-2.5">
                              {msg.sources?.map((src, sIdx) => (
                                <div
                                  key={sIdx}
                                  className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-slate-100 border border-slate-200 rounded-md flex items-center gap-1.5 sm:gap-2 cursor-default text-[11px] sm:text-xs max-w-full"
                                >
                                  <span className="text-red-500 text-[10px] sm:text-xs font-bold shrink-0">PDF</span>
                                  <span className="font-medium text-slate-700 truncate max-w-[120px] sm:max-w-[200px]">
                                    {src.documentName}
                                  </span>
                                  <span className="text-[9px] sm:text-[10px] text-slate-500 px-1 sm:px-1.5 py-0.5 bg-slate-200 rounded font-medium shrink-0">
                                    {src.pageNumber ? `P. ${src.pageNumber}` : `Sec ${src.chunkIndex || 1}`}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {isSourceExpanded && (
                              <div className="mt-2 space-y-2 animate-in fade-in duration-150">
                                {msg.sources?.map((src, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className="p-2.5 sm:p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 space-y-1 shadow-2xs"
                                  >
                                    <div className="flex items-center justify-between font-semibold text-slate-800">
                                      <span className="truncate pr-2">{src.documentName}</span>
                                      <span className="text-[10px] text-slate-400 shrink-0">
                                        Page {src.pageNumber || 1}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100 leading-snug">
                                      "{src.snippet}"
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* User Message Bubble */
                    <div className="max-w-[85%] sm:max-w-2xl bg-blue-600 text-white p-3 sm:p-4 rounded-xl shadow-md text-xs sm:text-sm leading-relaxed">
                      <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                      <div className="text-right text-[9px] sm:text-[10px] text-blue-200 mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Typing / Loading indicator */}
          {isSending && (
            <div className="flex justify-start w-full max-w-3xl">
              <div className="flex gap-2.5 sm:gap-3.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs shadow-xs animate-pulse">
                  IQ
                </div>
                <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-xl shadow-sm flex items-center gap-2.5 text-xs text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "300ms" }} />
                  <span className="ml-1 text-[10px] sm:text-[11px] font-medium text-slate-500">
                    Retrieving verified college circulars & drafting answer...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Sleek Chat Input Area */}
        <div className="p-3 sm:p-5 bg-white border-t border-slate-200 shrink-0">
          <div className="max-w-3xl mx-auto">
            {/* Quick Suggestions Chips */}
            <div className="mb-2 sm:mb-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:flex-wrap">
              <span className="text-[10px] sm:text-xs text-slate-400 font-medium py-0.5 shrink-0">Suggestions:</span>
              {[
                "Hostel curfew time?",
                "Scholarship deadlines?",
                "Attendance policy?",
                "Library hours?",
              ].map((sug, sIdx) => (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => handleSendMessage(sug)}
                  className="text-[11px] sm:text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 sm:px-3 py-1 rounded-full transition-colors border border-slate-200 shrink-0 whitespace-nowrap"
                >
                  {sug}
                </button>
              ))}
            </div>

            {/* Input Row */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isSending}
                placeholder="Ask about rules, exams, or policies..."
                className="w-full pl-3.5 sm:pl-4 pr-16 sm:pr-20 py-2.5 sm:py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-xs sm:text-sm transition-all shadow-sm text-slate-900 bg-white"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isSending}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 sm:px-4 bg-slate-900 text-white text-[10px] sm:text-xs font-bold rounded-md hover:bg-slate-800 disabled:bg-slate-300 transition-colors uppercase tracking-wider flex items-center justify-center"
              >
                {isSending ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Send"
                )}
              </button>
            </form>

            <p className="text-[9px] sm:text-[10px] text-center mt-2 sm:mt-2.5 text-slate-400 uppercase tracking-tight font-medium">
              Answers are strictly grounded in verified college documentation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
