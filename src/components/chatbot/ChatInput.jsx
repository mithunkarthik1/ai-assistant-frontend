import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";

export default function ChatInput({ onSendMessage, isSending, isMaximized }) {
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
    <div className="p-3 sm:p-4 border-t border-slate-200 bg-white">
      <div className={`mx-auto w-full ${isMaximized ? "max-w-3xl" : "max-w-full"}`}>
        <div className="flex items-end gap-2 border border-slate-200 rounded-2xl p-1.5 focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-900/5 transition bg-slate-50/50 shadow-xs">
          {/* Textarea Input - Always enabled to keep cursor in place */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about policies, projects, or any general question..."
            rows={1}
            className="flex-1 max-h-36 resize-none bg-transparent py-2 px-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none leading-relaxed select-text"
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!text.trim() || isSending}
            aria-label="Send message"
            className="p-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0 shadow-xs active:scale-95 flex items-center justify-center"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-slate-400 text-center mt-1.5">
          Policy answers are grounded in the handbook; project answers use the Project API.
        </p>
      </div>
    </div>
  );
}
