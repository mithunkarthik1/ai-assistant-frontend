import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import PolicyHandbookModal from "./PolicyHandbookModal";
import DocumentUploadModal from "./DocumentUploadModal";
import { sendMessage } from "../../services/chatService";

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Handbook Viewer Modal State
  const [isHandbookOpen, setIsHandbookOpen] = useState(false);
  const [handbookPage, setHandbookPage] = useState(1);
  const [handbookHighlight, setHandbookHighlight] = useState("");
  const [handbookDocInfo, setHandbookDocInfo] = useState({
    documentId: "00000000-0000-0000-0000-000000000002",
    documentName: "WorkPilot_Company_Policy.pdf",
    isDefault: true,
    targetSection: null,
    targetTopic: null,
  });

  // Document Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId] = useState(() => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  });

  const handleOpenHandbook = (page = 1, docInfoOrHighlight = null) => {
    setHandbookPage(page || 1);
    if (docInfoOrHighlight && typeof docInfoOrHighlight === "object" && docInfoOrHighlight.documentId) {
      setHandbookDocInfo({
        documentId: docInfoOrHighlight.documentId,
        documentName: docInfoOrHighlight.documentName || "Document",
        isDefault: Boolean(docInfoOrHighlight.isDefault),
        targetSection: docInfoOrHighlight.targetSection || null,
        targetTopic: docInfoOrHighlight.targetTopic || null,
      });
      setHandbookHighlight(docInfoOrHighlight.highlightText || "");
    } else if (typeof docInfoOrHighlight === "string") {
      setHandbookHighlight(docInfoOrHighlight);
    } else {
      setHandbookDocInfo({
        documentId: "00000000-0000-0000-0000-000000000002",
        documentName: "WorkPilot_Company_Policy.pdf",
        isDefault: true,
        targetSection: null,
        targetTopic: null,
      });
      setHandbookHighlight("");
    }
    setIsHandbookOpen(true);
  };

  const handleOpenUploadModal = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setIsUploadModalOpen(true);
  };

  const handleUploadSuccess = (result) => {
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `📄 **${result.file_name}** indexed successfully into knowledge base!\n\n` +
          `* **Status:** \`${result.status}\`\n` +
          `* **Total Chunks:** ${result.total_chunks}\n` +
          `* **Added:** ${result.chunks_added} | **Re-embedded:** ${result.chunks_updated} | **Skipped (0 cost):** ${result.chunks_skipped} | **Deleted:** ${result.chunks_deleted}\n\n` +
          `You can now ask questions about the contents of **${result.file_name}**!`,
      },
    ]);
  };

  // Listen for global custom events to open handbook, chat, or upload from anywhere
  useEffect(() => {
    const handleOpenHandbookEvent = (e) => {
      const page = e.detail?.page || 1;
      const highlight = e.detail?.highlight || "";
      const docInfo = e.detail?.docInfo || null;
      handleOpenHandbook(page, docInfo || highlight);
    };
    const handleOpenChatEvent = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };
    const handleOpenUploadEvent = () => {
      handleOpenUploadModal();
    };
    window.addEventListener("open-policy-handbook", handleOpenHandbookEvent);
    window.addEventListener("open-policy-chat", handleOpenChatEvent);
    window.addEventListener("open-document-upload", handleOpenUploadEvent);
    return () => {
      window.removeEventListener("open-policy-handbook", handleOpenHandbookEvent);
      window.removeEventListener("open-policy-chat", handleOpenChatEvent);
      window.removeEventListener("open-document-upload", handleOpenUploadEvent);
    };
  }, []);


  // Keyboard shortcut: Escape to restore or exit maximize
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isMaximized) {
          setIsMaximized(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMaximized]);

  // Window state toggles
  const handleToggleMinimize = () => {
    setIsMinimized((prev) => !prev);
  };

  const handleToggleMaximize = () => {
    setIsMinimized(false);
    setIsMaximized((prev) => !prev);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setIsMaximized(false);
  };

  // Send message handler (Live Backend API)
  const handleSendMessage = async (text) => {
    setError(null);
    const historyPayload = messages.slice(-8).map((m) => ({
      role: m.role,
      content: m.content,
    }));
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    setIsSending(true);
    try {
      const response = await sendMessage(text, historyPayload, sessionId);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.answer,
          sources: response.sources || [],
          show_pdf: Boolean(response.show_pdf),
        },
      ]);
    } catch (err) {
      const detail =
        err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        "Failed to connect to the AI assistant backend server.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Error: ${detail}`,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // Dynamic window classes based on state
  const windowClasses = isMinimized
    ? "fixed z-50 right-4 bottom-4 sm:right-6 sm:bottom-6 w-72 sm:w-84 h-14 rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden transition-all duration-300 ease-in-out hover:border-slate-600"
    : isMaximized
    ? "fixed z-50 inset-2 sm:inset-6 md:inset-8 lg:inset-10 flex flex-col rounded-2xl border border-slate-200/90 bg-white shadow-2xl overflow-hidden transition-all duration-300 ease-in-out"
    : "fixed z-50 inset-3 sm:inset-auto sm:right-6 sm:bottom-24 sm:w-[440px] sm:h-[640px] flex flex-col rounded-2xl border border-slate-200/90 bg-white shadow-2xl overflow-hidden transition-all duration-300 ease-in-out";

  return (
    <>
      {/* Floating Chatbot Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          aria-label="Open AI Assistant"
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xl hover:bg-slate-800 hover:scale-105 transition duration-200 cursor-pointer z-50 focus:outline-none focus:ring-4 focus:ring-slate-900/20"
        >
          <MessageCircle className="w-7 h-7" />
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div className={windowClasses}>
          {/* Header with Minimize / Maximize / Close */}
          <ChatHeader
            onClose={handleClose}
            onMinimize={handleToggleMinimize}
            onToggleMaximize={handleToggleMaximize}
            onOpenHandbook={handleOpenHandbook}
            isMinimized={isMinimized}
            isMaximized={isMaximized}
            messageCount={messages.length}
          />

          {/* Body and Input (Hidden when minimized) */}
          {!isMinimized && (
            <>
              {/* Message Thread */}
              <ChatMessages
                messages={messages}
                isSending={isSending}
                error={error}
                onPromptClick={handleSendMessage}
                onOpenHandbook={handleOpenHandbook}
                isMaximized={isMaximized}
              />

              {/* Input Footer */}
              <ChatInput
                onSendMessage={handleSendMessage}
                onOpenUploadModal={handleOpenUploadModal}
                isSending={isSending}
                isMaximized={isMaximized}
              />
            </>
          )}
        </div>
      )}

      {/* Policy Handbook & Document Viewer Modal */}
      <PolicyHandbookModal
        isOpen={isHandbookOpen}
        onClose={() => setIsHandbookOpen(false)}
        initialPage={handbookPage}
        highlightText={handbookHighlight}
        targetSection={handbookDocInfo.targetSection}
        targetTopic={handbookDocInfo.targetTopic}
        documentId={handbookDocInfo.documentId}
        documentName={handbookDocInfo.documentName}
        isDefault={handbookDocInfo.isDefault}
      />

      {/* Incremental Document Upload & Knowledge Base Modal */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </>
  );
}
