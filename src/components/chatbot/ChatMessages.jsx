import { useEffect, useRef, useState } from "react";
import { Bot, Sparkles, Search, Layers, CheckCircle2 } from "lucide-react";
import ChatMessage from "./ChatMessage";

function ThinkingIndicator() {
  const [stageIndex, setStageIndex] = useState(0);

  const stages = [
    { text: "Thinking...", detail: "Analyzing your request", icon: Sparkles, color: "text-indigo-500" },
    { text: "Searching knowledge base...", detail: "Checking documents", icon: Search, color: "text-blue-500" },
    { text: "Consolidating...", detail: "Synthesizing answer", icon: Layers, color: "text-violet-500" },
    { text: "Almost finished...", detail: "Finalizing response", icon: CheckCircle2, color: "text-emerald-500" },
  ];

  useEffect(() => {
    const t1 = setTimeout(() => setStageIndex(1), 2200);
    const t2 = setTimeout(() => setStageIndex(2), 5000);
    const t3 = setTimeout(() => setStageIndex(3), 8500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const currentStage = stages[stageIndex];
  const IconComponent = currentStage.icon;

  return (
    <div className="flex items-start gap-2.5 text-slate-500 text-xs pl-1 animate-in fade-in duration-300">
      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
        <Bot className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
      </div>
      <div className="flex flex-col gap-1 max-w-[320px]">
        <div className="flex items-center gap-2.5 bg-white border border-slate-200/90 px-3.5 py-2.5 rounded-2xl rounded-tl-sm shadow-xs text-slate-700 transition-all duration-300">
          <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
            <IconComponent className={`w-3.5 h-3.5 ${currentStage.color} animate-spin`} style={{ animationDuration: '3s' }} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-xs text-slate-800 transition-all duration-300 truncate">
              {currentStage.text}
            </span>
            <span className="text-[10px] text-slate-400 font-normal truncate">
              {currentStage.detail}
            </span>
          </div>
          <div className="ml-auto pl-1 flex items-center gap-1 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

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
              <Bot className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="rounded-2xl rounded-tl-sm px-4 py-3.5 bg-white border border-slate-200/80 text-slate-800 text-sm shadow-xs leading-relaxed max-w-[90%]">
              <p className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                <span>Welcome to AI Assistant</span>
                <span className="text-base">👋</span>
              </p>
              <p className="text-slate-600">
                I can answer questions from your uploaded documents, company knowledge base, and projects.
              </p>
              <div className="mt-3.5 pt-3 border-t border-slate-100">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Frequently Asked Questions:
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
            previousMessage={index > 0 ? messages[index - 1] : null}
            onOpenHandbook={onOpenHandbook}
          />
        ))}

        {/* Dynamic Multi-Stage Thinking State */}
        {isSending && <ThinkingIndicator />}

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
