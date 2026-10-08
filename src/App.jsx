import { useState, useEffect } from "react";
import ChatBot from "./components/chatbot/ChatBot";
import AuthPage from "./components/auth/AuthPage";
import {
  ShieldCheck,
  BookOpen,
  Clock,
  HeartHandshake,
  MessageCircle,
  FileText,
  ExternalLink,
  Upload,
  LogOut,
  User,
  Sparkles,
  Cpu,
  ChevronDown,
} from "lucide-react";
import { getPolicyPdfUrl } from "./services/chatService";
import { getCurrentUser, logoutUser } from "./services/authService";

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleUnauthorized = () => {
      setCurrentUser(null);
      setShowUserMenu(false);
    };
    window.addEventListener("ai-assistant-unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("ai-assistant-unauthorized", handleUnauthorized);
    };
  }, []);

  const pdfUrl = getPolicyPdfUrl();

  const handleOpenChat = () => {
    window.dispatchEvent(new CustomEvent("open-policy-chat"));
  };

  const handleOpenHandbook = () => {
    window.dispatchEvent(new CustomEvent("open-policy-handbook", { detail: { page: 1 } }));
  };

  const handleOpenUpload = () => {
    window.dispatchEvent(new CustomEvent("open-document-upload"));
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setShowUserMenu(false);
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setShowUserMenu(false);
  };

  // Strictly enforce authentication: no guest access
  if (!currentUser) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-slate-100/50 to-slate-200/60 text-slate-900 select-none">
      
      {/* Top Enterprise Header Bar */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-8 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Brand & System Status */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <Cpu className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-sm sm:text-base">
                  AI Assistant
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Enterprise
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Grounded RAG • OCR Optical Engine</span>
              </div>
            </div>
          </div>

          {/* Right Header Navigation & Authenticated Profile */}
          <div className="flex items-center gap-3">
            
            {/* Quick Link to Handbook */}
            <button
              type="button"
              onClick={handleOpenHandbook}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Handbook</span>
            </button>

            {/* Upload Docs Trigger */}
            <button
              type="button"
              onClick={handleOpenUpload}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span>Upload Docs</span>
            </button>

            {/* Authenticated User Menu */}
            <div className="relative">
              <button
                type="button"
                id="user-profile-menu-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200/70 border border-slate-200 transition cursor-pointer"
              >
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover border border-slate-300"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    {currentUser.role || "Member"}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-fadeIn">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                    <div className="mt-1.5 inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {currentUser.role || "Member"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Switch Account</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Hero & Dashboard Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center max-w-3xl w-full">
          
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 text-slate-700 text-xs font-semibold mb-5 border border-slate-200 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Enterprise Knowledge Intelligence</span>
            <span className="w-1 h-1 rounded-full bg-slate-400" />
            <span className="text-slate-500 font-normal">Grounded OCR v2.4</span>
          </div>

          {/* Personalized Greeting */}
          <div className="mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Signed In as {currentUser.role || "Enterprise Member"} • {currentUser.department || "Operations"}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
              Welcome, {currentUser.name}
            </h1>
          </div>

          <p className="mt-3 text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
            Instant answers grounded in company documents, handbook policies, and optical OCR image extractions.
          </p>

          {/* Quick Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              id="hero-open-chat-btn"
              onClick={handleOpenChat}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm shadow-md hover:bg-slate-800 transition cursor-pointer flex items-center gap-2 hover:scale-[1.02]"
            >
              <MessageCircle className="w-4 h-4 text-indigo-300" />
              <span>Launch AI Assistant</span>
            </button>

            <button
              type="button"
              id="hero-open-handbook-btn"
              onClick={handleOpenHandbook}
              className="px-4 py-2.5 rounded-xl bg-white text-slate-800 hover:text-indigo-700 hover:bg-indigo-50/60 border border-slate-300/80 font-semibold text-sm shadow-xs transition cursor-pointer flex items-center gap-2 hover:scale-[1.02]"
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Handbook Viewer</span>
            </button>

            <button
              type="button"
              id="hero-open-upload-btn"
              onClick={handleOpenUpload}
              className="px-4 py-2.5 rounded-xl bg-white text-slate-800 hover:text-emerald-700 hover:bg-emerald-50/60 border border-slate-300/80 font-semibold text-sm shadow-xs transition cursor-pointer flex items-center gap-2 hover:scale-[1.02]"
            >
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Upload PDF / MD</span>
            </button>

            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 rounded-xl bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 border border-transparent font-medium text-xs transition cursor-pointer flex items-center gap-1.5"
              title="Open raw PDF file in new browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Raw PDF</span>
            </a>
          </div>

          {/* Executive Feature Highlights Grid */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition">
              <Clock className="w-5 h-5 text-indigo-600 mb-2" />
              <h3 className="text-xs font-bold text-slate-900">Hours & Hybrid Policy</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Core hours, flexible remote options, and $500 home office setup reimbursement.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition">
              <HeartHandshake className="w-5 h-5 text-emerald-600 mb-2" />
              <h3 className="text-xs font-bold text-slate-900">Leaves & Health Cover</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                18 PTO days, 12 sick leaves, comprehensive parental leave, and $50k medical cover.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition">
              <BookOpen className="w-5 h-5 text-violet-600 mb-2" />
              <h3 className="text-xs font-bold text-slate-900">OCR & Document RAG</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Optical OCR extracts text from embedded images and diagrams into verified vector chunks.
              </p>
            </div>
          </div>
        </div>

        {/* Floating Chatbot Assistant Widget */}
        <ChatBot />
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 py-4 text-center text-xs text-slate-500 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 AI Assistant. All company policy documents protected.</span>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-slate-500">Authenticated Session Active</span>
            <span>•</span>
            <span className="text-slate-400">Zero Backend Auth Footprint</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
