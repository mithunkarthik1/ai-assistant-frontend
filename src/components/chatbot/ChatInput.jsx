import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Paperclip } from "lucide-react";

export default function ChatInput({ onSendMessage, onOpenUploadModal, isSending, isMaximized, isDark }) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);


  // Auto-focus on initial mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Ensure cursor returns to and stays in the textarea whenever sending state finishes
  useEffect(() => {
    if (!isSending) {
      textareaRef.current?.focus();
    }
  }, [isSending]);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
      )}px`;
    }
  }, [text]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    onSendMessage(trimmed);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  };

  return (
    <div
      className={`p-3 sm:p-4 border-t transition-colors duration-300 ${
        isDark ? "border-zinc-800 bg-zinc-900" : "border-slate-200 bg-white"
      }`}
    >
      <div className={`mx-auto w-full ${isMaximized ? "max-w-3xl" : "max-w-full"}`}>
        <div
          className={`flex items-end gap-2 border rounded-2xl p-1.5 transition-all duration-300 shadow-xs ${
            isDark
              ? "border-zinc-800 bg-zinc-950 focus-within:border-zinc-700 focus-within:ring-2 focus-within:ring-zinc-800/40"
              : "border-slate-200 bg-slate-50/50 focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-900/5"
          }`}
        >
          {/* Document Upload / Attach Button */}
          {onOpenUploadModal && (
            <button
              type="button"
              onClick={onOpenUploadModal}
              title="Upload document to knowledge base (PDF, DOCX, TXT)"
              aria-label="Upload document"
              className={`p-2 rounded-xl transition cursor-pointer shrink-0 mb-0.5 ${
                isDark
                  ? "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/80"
              }`}
            >
              <Paperclip className="w-4 h-4" />
            </button>
          )}

          {/* Textarea Input - Always enabled to keep cursor in place */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about documents, projects..."
            rows={1}
            className={`flex-1 max-h-36 resize-none bg-transparent py-2 px-1 text-sm focus:outline-none leading-relaxed select-text ${
              isDark
                ? "text-zinc-100 placeholder:text-zinc-500"
                : "text-slate-800 placeholder:text-slate-400"
            }`}
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!text.trim() || isSending}
            aria-label="Send message"
            className={`p-2.5 rounded-xl transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0 shadow-xs active:scale-95 flex items-center justify-center ${
              isDark
                ? "bg-white hover:bg-zinc-100 text-zinc-950 font-semibold"
                : "bg-slate-900 hover:bg-slate-800 text-white"
            }`}
          >
            {isSending ? (
              <Loader2 className={`w-4 h-4 animate-spin ${isDark ? "text-zinc-600" : "text-slate-400"}`} />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p
          className={`text-[10px] text-center mt-1.5 transition-colors duration-300 ${
            isDark ? "text-zinc-500" : "text-slate-400"
          }`}
        >
          AI Assistant • Answers are grounded in your knowledge base and uploaded documents.
        </p>
      </div>
    </div>
  );
}
