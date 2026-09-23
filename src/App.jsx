import ChatBot from "./components/chatbot/ChatBot";
import { ShieldCheck, BookOpen, Clock, HeartHandshake, MessageCircle, FileText, ExternalLink } from "lucide-react";
import { getPolicyPdfUrl } from "./services/chatService";

export default function App() {
  const pdfUrl = getPolicyPdfUrl();

  const handleOpenChat = () => {
    window.dispatchEvent(new CustomEvent("open-policy-chat"));
  };

  const handleOpenHandbook = () => {
    window.dispatchEvent(new CustomEvent("open-policy-handbook", { detail: { page: 1 } }));
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100/70 text-slate-900 px-4 select-none">
      <div className="text-center max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/80 text-slate-700 text-xs font-semibold mb-4 border border-slate-300/60">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>WorkPilot Enterprise Knowledge Base</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
          Company Policy AI Assistant
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
          Ask questions about working hours, remote work, PTO & leave policies, expense limits, insurance, and company guidelines.
        </p>

        {/* Prominent Quick Action CTAs */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleOpenChat}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm shadow-md hover:bg-slate-800 transition cursor-pointer flex items-center gap-2 hover:scale-[1.02]"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Open Policy Assistant</span>
          </button>
          <button
            type="button"
            onClick={handleOpenHandbook}
            className="px-5 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900 border border-indigo-200 font-semibold text-sm shadow-xs transition cursor-pointer flex items-center gap-2 hover:scale-[1.02]"
          >
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>View Policy Handbook (PDF)</span>
          </button>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2.5 rounded-xl bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 font-medium text-xs shadow-2xs transition cursor-pointer flex items-center gap-1.5"
            title="Open raw PDF in new browser tab"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Open Raw PDF</span>
          </a>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
            <Clock className="w-5 h-5 text-indigo-600 mb-1.5" />
            <h3 className="text-xs font-bold text-slate-900">Hours & Remote Work</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Core hours, hybrid model, and $500 home office stipend.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
            <HeartHandshake className="w-5 h-5 text-emerald-600 mb-1.5" />
            <h3 className="text-xs font-bold text-slate-900">Leaves & Health</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">18 PTO, 12 sick leaves, maternity, and $50k family cover.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
            <BookOpen className="w-5 h-5 text-violet-600 mb-1.5" />
            <h3 className="text-xs font-bold text-slate-900">Grounded RAG</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Strictly answers only from verified company documentation.</p>
          </div>
        </div>
      </div>

      {/* Floating Chatbot Widget */}
      <ChatBot />
    </main>
  );
}
