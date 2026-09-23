import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import PolicyHandbookModal from "./PolicyHandbookModal";
import { sendMessage } from "../../services/chatService";

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Handbook Viewer Modal State
  const [isHandbookOpen, setIsHandbookOpen] = useState(false);
  const [handbookPage, setHandbookPage] = useState(1);
  const [handbookHighlight, setHandbookHighlight] = useState("");

  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const handleOpenHandbook = (page = 1, highlight = "") => {
    setHandbookPage(page || 1);
    setHandbookHighlight(highlight || "");
    setIsHandbookOpen(true);
  };

  // Listen for global custom events to open handbook or chat from anywhere
  useEffect(() => {
    const handleOpenHandbookEvent = (e) => {
      const page = e.detail?.page || 1;
      const highlight = e.detail?.highlight || "";
      handleOpenHandbook(page, highlight);
    };
    const handleOpenChatEvent = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };
    window.addEventListener("open-policy-handbook", handleOpenHandbookEvent);
    window.addEventListener("open-policy-chat", handleOpenChatEvent);
    return () => {
      window.removeEventListener("open-policy-handbook", handleOpenHandbookEvent);
      window.removeEventListener("open-policy-chat", handleOpenChatEvent);
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
      const response = await sendMessage(text, historyPayload);
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
        "Failed to connect to the Company Policy backend server.";
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
          aria-label="Open Company Policy AI assistant"
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
                isSending={isSending}
                isMaximized={isMaximized}
              />
            </>
          )}
        </div>
      )}

      {/* Policy Handbook & PDF Viewer Modal */}
      <PolicyHandbookModal
        isOpen={isHandbookOpen}
        onClose={() => setIsHandbookOpen(false)}
        initialPage={handbookPage}
        highlightText={handbookHighlight}
      />
    </>
  );
}
