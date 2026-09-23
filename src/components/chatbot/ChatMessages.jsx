import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Sparkles, X } from "lucide-react";
import ChatMessage from "./ChatMessage";

export default function ChatMessages({ messages, isSending, error, onPromptClick, isMaximized, onOpenHandbook }) {
  const bottomRef = useRef(null);

  const [isPromptDismissed, setIsPromptDismissed] = useState(() => {
    try {
      return localStorage.getItem("workpilot_dismiss_handbook_prompt") === "true";
    } catch {
      return false;
    }
  });

  const handleDismissPrompt = () => {
    setIsPromptDismissed(true);
    try {
      localStorage.setItem("workpilot_dismiss_handbook_prompt", "true");
    } catch (e) {
      console.error("Failed to save dismissal to localStorage", e);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending, error]);

  const sampleQuestions = [
    "What is the remote work policy?",
    "How many annual PTO & sick leaves do we get?",
    "What is the expense reimbursement limit for meals?",
    "What are the password security requirements?",
    "What is the standard notice period?",
  ];

  const userQueryCount = messages.filter((m) => m.role === "user").length;

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-50/70">
      <div className={`mx-auto w-full space-y-4 ${isMaximized ? "max-w-3xl" : "max-w-full"}`}>
        {/* Initial Welcome Greeting if no messages */}
        {messages.length === 0 && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs shrink-0 mt-0.5 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="rounded-2xl rounded-tl-sm px-4 py-3.5 bg-white border border-slate-200/80 text-slate-800 text-sm shadow-xs leading-relaxed max-w-[90%]">
              <p className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                <span>Welcome to WorkPilot HR & Policy Assistant</span>
                <span className="text-base">👋</span>
              </p>
              <p className="text-slate-600">
                I provide instant, grounded answers based exclusively on our official <strong>Company Policy & Employee Handbook</strong>.
              </p>
              <div className="mt-3.5 pt-3 border-t border-slate-100">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Frequently Asked Policy Questions:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {sampleQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onPromptClick && onPromptClick(q)}
                      className="text-left text-xs bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-200/60 transition cursor-pointer flex items-center gap-1.5 group"
                    >
                      <span className="text-indigo-500 group-hover:translate-x-0.5 transition-transform">👉</span>
                      <span className="truncate">{q}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Render Message Thread */}
        {messages.map((msg, index) => (
          <ChatMessage
            key={index}
            message={msg}
            onOpenHandbook={onOpenHandbook}
          />
        ))}

        {/* Smart Assistance Trigger after 2+ queries (dismissable) */}
        {userQueryCount >= 2 && !isSending && !isPromptDismissed && (
          <div className="relative mx-auto bg-gradient-to-r from-indigo-50/90 via-slate-50 to-indigo-50/50 border border-indigo-100/90 rounded-xl p-3 pl-3.5 pr-8 shadow-xs text-xs text-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-2">
              <span className="text-base shrink-0">💡</span>
              <p className="text-slate-700 leading-snug">
                Need more details or prefer searching directly? You can browse the verified <strong>Policy Handbook (PDF)</strong>.
              </p>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => onOpenHandbook && onOpenHandbook(1)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-[11px] whitespace-nowrap shadow-xs transition-all cursor-pointer hover:shadow-sm"
              >
                Open Handbook (PDF)
              </button>
            </div>
            {/* Cancel / Dismiss Button */}
            <button
              type="button"
              onClick={handleDismissPrompt}
              aria-label="Dismiss and do not show again"
              title="Don't show this again"
              className="absolute top-2 right-2 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Thinking / LLM Generating State */}
        {isSending && (
          <div className="flex items-center gap-2.5 text-slate-500 text-xs pl-1">
            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-slate-200/80 px-3 py-2 rounded-2xl rounded-tl-sm shadow-xs text-slate-600">
              <Sparkles className="w-3 h-3 text-indigo-500 animate-spin" />
              <span className="font-medium text-xs">Consulting company policies...</span>
            </div>
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        {/* Auto-scroll target */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
