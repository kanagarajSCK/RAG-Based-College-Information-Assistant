import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.tsx";
import { ToastProvider } from "./context/ToastContext.tsx";
import { AuthPage } from "./components/auth/AuthPage.tsx";
import { Navbar } from "./components/layout/Navbar.tsx";
import { Sidebar } from "./components/layout/Sidebar.tsx";
import { StudentDashboard } from "./components/student/StudentDashboard.tsx";
import { ChatInterface } from "./components/chat/ChatInterface.tsx";
import { ChatHistoryView } from "./components/chat/ChatHistoryView.tsx";
import { KnowledgeBaseView } from "./components/knowledge/KnowledgeBaseView.tsx";
import { AdminDashboard } from "./components/admin/AdminDashboard.tsx";
import { ProfileView } from "./components/profile/ProfileView.tsx";

const MainLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Chat coordination state
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-700">Loading CampusIQ...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleStartChatWithPrompt = (prompt: string) => {
    setSelectedConversationId(null);
    setPendingPrompt(prompt);
    setActiveTab("chat");
  };

  const handleSelectConversation = (convId: string) => {
    setSelectedConversationId(convId);
    setPendingPrompt(null);
    setActiveTab("chat");
  };

  const handleStartNewChat = () => {
    setSelectedConversationId(null);
    setPendingPrompt(null);
    setActiveTab("chat");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Body Area */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto p-2.5 sm:p-4 md:p-6 gap-4 lg:gap-6 min-w-0">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onStartNewChat={handleStartNewChat}
        />

        {/* Dynamic Content Views */}
        <main className="flex-1 min-w-0 w-full overflow-hidden">
          {activeTab === "dashboard" && (
            <StudentDashboard
              onStartChatWithPrompt={handleStartChatWithPrompt}
              onNavigateTab={setActiveTab}
              onSelectConversation={handleSelectConversation}
            />
          )}

          {activeTab === "chat" && (
            <ChatInterface
              initialConversationId={selectedConversationId}
              initialPrompt={pendingPrompt}
              onClearInitialPrompt={() => setPendingPrompt(null)}
            />
          )}

          {activeTab === "history" && (
            <ChatHistoryView
              onSelectConversation={handleSelectConversation}
              onStartNewChat={handleStartNewChat}
            />
          )}

          {activeTab === "knowledge" && (
            <KnowledgeBaseView onAskAboutDocument={handleStartChatWithPrompt} />
          )}

          {(activeTab === "admin" || activeTab === "admin-docs") && (
            <AdminDashboard />
          )}

          {activeTab === "profile" && <ProfileView />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ToastProvider>
  );
}
