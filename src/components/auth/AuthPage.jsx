import { useState, useMemo, useEffect } from "react";
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  FileText,
  Cpu,
  Layers,
  Bot,
  Database,
  Scan,
  Check,
  X,
  Sun,
  Moon,
  Sparkles,
} from "lucide-react";
import { loginUser, signupUser } from "../../services/authService";

export default function AuthPage({ onAuthSuccess, currentTheme, onToggleTheme }) {
  // Theme state: "dark" | "light"
  const [internalTheme, setInternalTheme] = useState(() => {
    if (currentTheme) return currentTheme;
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("ai_theme") || localStorage.getItem("ai_auth_theme");
      if (savedTheme === "light" || savedTheme === "dark") {
        return savedTheme;
      }
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
        return "light";
      }
    }
    return "dark";
  });

  const theme = currentTheme || internalTheme;

  // Apply theme to document element
  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (theme === "dark") {
        root.classList.add("dark");
        root.setAttribute("data-theme", "dark");
      } else {
        root.classList.remove("dark");
        root.setAttribute("data-theme", "light");
      }
      localStorage.setItem("ai_theme", theme);
      localStorage.setItem("ai_auth_theme", theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    if (onToggleTheme) {
      onToggleTheme();
    } else {
      setInternalTheme((prev) => (prev === "dark" ? "light" : "dark"));
    }
  };

  const isDark = theme === "dark";

  const [mode, setMode] = useState("login"); // "login" | "signup"

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // Signup form state (Original Authenticated User)
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Password visibility
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  // Password criteria matching backend validation (backend/src/utils/helper.py)
  const passwordCriteria = useMemo(() => {
    return {
      minLen: signupPassword.length >= 8 && signupPassword.length <= 128,
      hasLower: /[a-z]/.test(signupPassword),
      hasUpper: /[A-Z]/.test(signupPassword),
      hasNumber: /[0-9]/.test(signupPassword),
      hasSpecial: /[^A-Za-z0-9\s]/.test(signupPassword),
      noWhitespaceEnds: signupPassword.length > 0 && signupPassword === signupPassword.trim(),
    };
  }, [signupPassword]);

  const strength = useMemo(() => {
    if (!signupPassword) {
      return {
        score: 0,
        label: "Empty",
        color: isDark ? "bg-slate-700" : "bg-slate-300",
        text: isDark ? "text-slate-500" : "text-slate-400",
        percent: 0,
      };
    }
    let score = 0;
    if (passwordCriteria.minLen) score += 1;
    if (passwordCriteria.hasLower) score += 1;
    if (passwordCriteria.hasUpper) score += 1;
    if (passwordCriteria.hasNumber) score += 1;
    if (passwordCriteria.hasSpecial) score += 1;

    if (score <= 2) {
      return {
        score,
        label: "Weak",
        color: "bg-rose-500",
        text: isDark ? "text-rose-400" : "text-rose-600",
        percent: 25,
      };
    }
    if (score === 3) {
      return {
        score,
        label: "Fair",
        color: "bg-amber-500",
        text: isDark ? "text-amber-400" : "text-amber-600",
        percent: 50,
      };
    }
    if (score === 4) {
      return {
        score,
        label: "Good",
        color: "bg-blue-500",
        text: isDark ? "text-blue-400" : "text-blue-600",
        percent: 75,
      };
    }
    return {
      score,
      label: "Strong",
      color: "bg-emerald-500",
      text: isDark ? "text-emerald-400" : "text-emerald-600",
      percent: 100,
    };
  }, [signupPassword, passwordCriteria, isDark]);

  const isPasswordValid = useMemo(() => {
    return (
      passwordCriteria.minLen &&
      passwordCriteria.hasLower &&
      passwordCriteria.hasUpper &&
      passwordCriteria.hasNumber &&
      passwordCriteria.hasSpecial &&
      passwordCriteria.noWhitespaceEnds
    );
  }, [passwordCriteria]);

  const passwordsMatch = useMemo(() => {
    if (!signupConfirmPassword) return null;
    return signupPassword === signupConfirmPassword;
  }, [signupPassword, signupConfirmPassword]);

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const cleanEmail = loginEmail.trim();
    if (!cleanEmail) {
      setErrorMessage("Please enter your registered email address.");
      return;
    }
    if (!loginPassword) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      const user = await loginUser({
        email: cleanEmail,
        password: loginPassword,
        remember: rememberMe,
      });
      setSuccessMessage(`Welcome back, ${user.name || user.email}!`);
      setTimeout(() => {
        if (onAuthSuccess) onAuthSuccess(user);
      }, 400);
    } catch (err) {
      setErrorMessage(err.message || "Invalid email address or password.");
      setIsLoading(false);
    }
  };

  // Handle Signup Submit (Original Authenticated User)
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!signupName.trim()) {
      setErrorMessage("Please enter your full legal name.");
      return;
    }

    if (!signupEmail.trim() || !signupEmail.includes("@")) {
      setErrorMessage("Please enter a valid corporate email address.");
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage(
        "Password must be 8-128 characters, include uppercase, lowercase, number, and a special character."
      );
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setErrorMessage("Passwords do not match. Please verify both fields.");
      return;
    }

    if (!agreeTerms) {
      setErrorMessage("Please accept the terms to proceed.");
      return;
    }

    setIsLoading(true);

    try {
      const user = await signupUser({
        name: signupName.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
        phone_number: signupPhone.trim() || null,
      });
      setSuccessMessage(`Account created successfully! Authenticating ${user.name || user.email}...`);
      setTimeout(() => {
        if (onAuthSuccess) onAuthSuccess(user);
      }, 500);
    } catch (err) {
      setErrorMessage(err.message || "Failed to create account.");
      setIsLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes("@")) {
      return;
    }
    setForgotSent(true);
  };

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans transition-colors duration-300 ${
        isDark ? "bg-zinc-950 text-zinc-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Top Right Corner Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-40 flex items-center gap-2">
        <button
          type="button"
          id="auth-theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={`Switch to ${isDark ? "Light" : "Dark"} mode`}
          title={`Switch to ${isDark ? "Light" : "Dark"} mode`}
          className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer backdrop-blur-md shadow-xs select-none ${
            isDark
              ? "bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 shadow-zinc-950/40"
              : "bg-white/95 hover:bg-white text-slate-700 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 shadow-slate-200/50"
          }`}
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
              <span className="font-medium text-zinc-300">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600 group-hover:-rotate-12 transition-transform duration-300" />
              <span className="font-medium text-slate-700">Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Decorative Minimal Background Grids */}
      {isDark ? (
        <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:28px_28px] opacity-40 pointer-events-none" />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:26px_26px] opacity-40 pointer-events-none" />
      )}

      {/* Main Enterprise Container Card */}
      <div
        className={`w-full max-w-5xl rounded-3xl border shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col lg:flex-row relative z-10 transition-all duration-300 ${
          isDark
            ? "bg-zinc-900 border-zinc-800 shadow-black/60"
            : "bg-white/95 border-slate-200/90 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.12)]"
        }`}
      >
        {/* ========================================================================= */}
        {/* LEFT PANEL: Enterprise Product Showcase & Trust Signals                   */}
        {/* ========================================================================= */}
        <div
          className={`lg:w-5/12 p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r relative transition-colors duration-300 ${
            isDark
              ? "bg-zinc-900 border-zinc-800"
              : "bg-gradient-to-br from-slate-50/90 via-indigo-50/30 to-violet-50/20 border-slate-200/80"
          }`}
        >
          <div>
            {/* Top Status Pill matching Dashboard */}
            <div className="flex items-center justify-between mb-6">
              <span
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold shadow-2xs border ${
                  isDark
                    ? "bg-zinc-800/80 text-zinc-300 border-zinc-700/80"
                    : "bg-white text-slate-700 border-slate-200"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Enterprise AI Platform</span>
                <span className={`w-1 h-1 rounded-full ${isDark ? "bg-zinc-700" : "bg-slate-400"}`} />
                <span className={`font-normal ${isDark ? "text-zinc-400" : "text-slate-500"}`}>Agents • RAG • OCR • Gen AI</span>
              </span>

            </div>

            {/* Brand Header matching Dashboard */}
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 border border-indigo-400/30">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1
                    className={`text-2xl font-bold tracking-tight ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    AI Assistant
                  </h1>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${
                      isDark
                        ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                        : "bg-indigo-50 text-indigo-700 border-indigo-200"
                    }`}
                  >
                    Enterprise
                  </span>
                </div>
                <p className={`text-xs font-medium flex items-center gap-1.5 ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Enterprise AI Platform • Multi-Agent & RAG Core
                </p>
              </div>
            </div>

            {/* Value Proposition Statement matching Dashboard */}
            <p
              className={`text-xs sm:text-sm font-normal leading-relaxed ${
                isDark ? "text-zinc-300" : "text-slate-600"
              }`}
            >
              Unified enterprise AI platform powering intelligent agents, grounded knowledge retrieval, optical document vision, project workflows, and generative AI.
            </p>

            {/* Enterprise Capabilities Grid matching Dashboard */}
            <div className="mt-5 space-y-2.5">
              {/* 1. Autonomous Agents */}
              <div
                className={`flex items-start gap-3 p-3 rounded-2xl border transition ${
                  isDark
                    ? "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
                    : "bg-white/90 border-slate-200/90 hover:border-indigo-200 hover:shadow-2xs"
                }`}
              >
                <div className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${isDark ? "bg-indigo-950/70 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}>
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${isDark ? "text-zinc-200" : "text-slate-900"}`}>
                    Autonomous Agents
                  </h4>
                  <p className={`text-[11px] mt-0.5 leading-relaxed ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                    Goal-oriented multi-agent workflows, tool execution, and dynamic task automation.
                  </p>
                </div>
              </div>

              {/* 2. Enterprise RAG */}
              <div
                className={`flex items-start gap-3 p-3 rounded-2xl border transition ${
                  isDark
                    ? "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
                    : "bg-white/90 border-slate-200/90 hover:border-indigo-200 hover:shadow-2xs"
                }`}
              >
                <div className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${isDark ? "bg-emerald-950/70 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${isDark ? "text-zinc-200" : "text-slate-900"}`}>
                    Enterprise RAG
                  </h4>
                  <p className={`text-[11px] mt-0.5 leading-relaxed ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                    Hybrid dense and lexical vector retrieval grounded in official corporate knowledge.
                  </p>
                </div>
              </div>

              {/* 3. OCR Document Vision */}
              <div
                className={`flex items-start gap-3 p-3 rounded-2xl border transition ${
                  isDark
                    ? "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
                    : "bg-white/90 border-slate-200/90 hover:border-indigo-200 hover:shadow-2xs"
                }`}
              >
                <div className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${isDark ? "bg-amber-950/70 text-amber-400" : "bg-amber-50 text-amber-600"}`}>
                  <Scan className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${isDark ? "text-zinc-200" : "text-slate-900"}`}>
                    OCR Document Vision
                  </h4>
                  <p className={`text-[11px] mt-0.5 leading-relaxed ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                    Optical transcription of embedded ER diagrams, screenshots, flowcharts, and tables.
                  </p>
                </div>
              </div>

              {/* 4. Projects & Gen AI */}
              <div
                className={`flex items-start gap-3 p-3 rounded-2xl border transition ${
                  isDark
                    ? "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
                    : "bg-white/90 border-slate-200/90 hover:border-indigo-200 hover:shadow-2xs"
                }`}
              >
                <div className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${isDark ? "bg-violet-950/70 text-violet-400" : "bg-violet-50 text-violet-600"}`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${isDark ? "text-zinc-200" : "text-slate-900"}`}>
                    Projects & Gen AI
                  </h4>
                  <p className={`text-[11px] mt-0.5 leading-relaxed ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                    Project workspace integration, user-story intelligence, synthesis, and creative reasoning.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Trust Metrics Strip matching Dashboard & Security */}
          <div className={`mt-6 pt-5 border-t ${isDark ? "border-zinc-800" : "border-slate-200/80"}`}>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div
                className={`p-2 rounded-xl border ${
                  isDark ? "bg-zinc-950/60 border-zinc-800" : "bg-white/90 border-slate-200/80 shadow-2xs"
                }`}
              >
                <p className={`text-xs sm:text-sm font-extrabold ${isDark ? "text-white" : "text-slate-900"}`}>
                  Autonomous
                </p>
                <p className={`text-[10px] font-medium ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                  Multi-Agent
                </p>
              </div>
              <div
                className={`p-2 rounded-xl border ${
                  isDark ? "bg-zinc-950/60 border-zinc-800" : "bg-white/90 border-slate-200/80 shadow-2xs"
                }`}
              >
                <p className="text-xs sm:text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                  Hybrid RAG
                </p>
                <p className={`text-[10px] font-medium ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                  Vector + Lexical
                </p>
              </div>
              <div
                className={`p-2 rounded-xl border ${
                  isDark ? "bg-zinc-950/60 border-zinc-800" : "bg-white/90 border-slate-200/80 shadow-2xs"
                }`}
              >
                <p className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                  OCR Vision
                </p>
                <p className={`text-[10px] font-medium ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                  Document AI
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT PANEL: Enterprise Authentication Forms                              */}
        {/* ========================================================================= */}
        <div
          className={`lg:w-7/12 p-8 sm:p-10 flex flex-col justify-center transition-colors duration-300 ${
            isDark ? "bg-zinc-900" : "bg-white/85"
          }`}
        >
          <div className="max-w-md w-full mx-auto">
            {/* Form Header matching Dashboard */}
            <div className="mb-5 text-left">
              <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                {mode === "login" ? "Sign In to AI Assistant" : "Create Workspace Account"}
              </h2>
              <p className={`text-xs mt-1 leading-relaxed ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                {mode === "login"
                  ? "Access your enterprise workspace, multi-agent workflows, and RAG intelligence."
                  : "Join your organization's authenticated AI assistant platform."}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div
              className={`flex rounded-2xl p-1 mb-6 border transition-colors ${
                isDark ? "bg-zinc-950 border-zinc-800" : "bg-slate-100/90 border-slate-200"
              }`}
            >
              <button
                type="button"
                id="tab-sign-in"
                onClick={() => {
                  setMode("login");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 select-none ${
                  mode === "login"
                    ? isDark
                      ? "bg-zinc-800 text-white shadow-xs border border-zinc-700/80"
                      : "bg-white text-slate-900 shadow-xs border border-slate-200/70"
                    : isDark
                    ? "text-zinc-400 hover:text-zinc-200"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Lock className={`w-3.5 h-3.5 ${isDark ? "text-zinc-300" : "text-indigo-600"}`} />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                id="tab-create-account"
                onClick={() => {
                  setMode("signup");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 select-none ${
                  mode === "signup"
                    ? isDark
                      ? "bg-zinc-800 text-white shadow-xs border border-zinc-700/80"
                      : "bg-white text-slate-900 shadow-xs border border-slate-200/70"
                    : isDark
                    ? "text-zinc-400 hover:text-zinc-200"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <User className={`w-3.5 h-3.5 ${isDark ? "text-zinc-300" : "text-indigo-600"}`} />
                <span>Create Account</span>
              </button>
            </div>

            {/* Error Feedback Banner */}
            {errorMessage && (
              <div
                className={`mb-5 p-3.5 rounded-2xl text-xs flex items-start gap-2.5 border transition animate-fadeIn ${
                  isDark
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-300"
                    : "bg-rose-50 border-rose-200 text-rose-700"
                }`}
              >
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="flex-1 leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Success Feedback Banner */}
            {successMessage && (
              <div
                className={`mb-5 p-3.5 rounded-2xl text-xs flex items-start gap-2.5 border transition animate-fadeIn ${
                  isDark
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                    : "bg-emerald-50 border-emerald-200 text-emerald-700"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="flex-1 leading-relaxed">{successMessage}</span>
              </div>
            )}

            {/* =============================================================== */}
            {/* MODE 1: LOGIN FORM                                              */}
            {/* Note: explicit auth-input classes and colorScheme prevent       */}
            {/* browser autofill from turning inputs stark white unexpectedly.  */}
            {/* =============================================================== */}
            {mode === "login" && (
              <form onSubmit={handleLoginSubmit} className="space-y-4" style={{ colorScheme: isDark ? "dark" : "light" }}>
                <div>
                  <label
                    className={`block text-xs font-semibold mb-1.5 ${
                      isDark ? "text-zinc-300" : "text-slate-700"
                    }`}
                    htmlFor="login-email"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div
                      className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${
                        isDark ? "text-zinc-500" : "text-slate-400"
                      }`}
                    >
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="name@company.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition focus:outline-none ${
                        isDark
                          ? "bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700/40 auth-input-dark"
                          : "bg-slate-50/70 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-3 focus:ring-indigo-500/15 auth-input-light shadow-2xs"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      className={`block text-xs font-semibold ${
                        isDark ? "text-zinc-300" : "text-slate-700"
                      }`}
                      htmlFor="login-password"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(loginEmail);
                        setShowForgotModal(true);
                      }}
                      className={`text-[11px] font-medium transition cursor-pointer hover:underline ${
                        isDark ? "text-zinc-400 hover:text-white" : "text-indigo-600 hover:text-indigo-700"
                      }`}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <div
                      className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${
                        isDark ? "text-zinc-500" : "text-slate-400"
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="login-password"
                      name="password"
                      type={showLoginPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      placeholder="••••••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-sm transition focus:outline-none ${
                        isDark
                          ? "bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700/40 auth-input-dark"
                          : "bg-slate-50/70 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-3 focus:ring-indigo-500/15 auth-input-light shadow-2xs"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className={`absolute inset-y-0 right-0 pr-3.5 flex items-center cursor-pointer transition ${
                        isDark ? "text-zinc-500 hover:text-zinc-300" : "text-slate-400 hover:text-slate-700"
                      }`}
                      title={showLoginPassword ? "Hide password" : "Show password"}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label
                    className={`flex items-center gap-2 cursor-pointer select-none font-medium ${
                      isDark ? "text-zinc-400 hover:text-zinc-300" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className={`w-4 h-4 rounded cursor-pointer ${
                        isDark ? "border-zinc-700 bg-zinc-800 text-white focus:ring-zinc-600" : "border-slate-300 bg-white text-indigo-600 focus:ring-indigo-500"
                      }`}
                    />
                    <span>Remember this session</span>
                  </label>
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  id="submit-login-btn"
                  className={`w-full mt-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.008] active:scale-[0.99] ${
                    isDark
                      ? "bg-white hover:bg-zinc-100 text-zinc-950 shadow-md shadow-white/5"
                      : "bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/15"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <span className={`w-4 h-4 border-2 rounded-full animate-spin ${isDark ? "border-zinc-400 border-t-zinc-950" : "border-white/30 border-t-white"}`} />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Platform</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* =============================================================== */}
            {/* MODE 2: SIGN UP FORM (ORIGINAL AUTHENTICATED USER)             */}
            {/* =============================================================== */}
            {mode === "signup" && (
              <form onSubmit={handleSignupSubmit} className="space-y-3.5" style={{ colorScheme: isDark ? "dark" : "light" }}>
                <div>
                  <label
                    className={`block text-xs font-semibold mb-1 ${
                      isDark ? "text-zinc-300" : "text-slate-700"
                    }`}
                    htmlFor="signup-name"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <div
                      className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${
                        isDark ? "text-zinc-500" : "text-slate-400"
                      }`}
                    >
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      placeholder="User Name"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm transition focus:outline-none ${
                        isDark
                          ? "bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700/40 auth-input-dark"
                          : "bg-slate-50/70 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-3 focus:ring-indigo-500/15 auth-input-light shadow-2xs"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label
                    className={`block text-xs font-semibold mb-1 ${
                      isDark ? "text-zinc-300" : "text-slate-700"
                    }`}
                    htmlFor="signup-email"
                  >
                    Work Email Address
                  </label>
                  <div className="relative">
                    <div
                      className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${
                        isDark ? "text-zinc-500" : "text-slate-400"
                      }`}
                    >
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="name@company.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm transition focus:outline-none ${
                        isDark
                          ? "bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700/40 auth-input-dark"
                          : "bg-slate-50/70 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-3 focus:ring-indigo-500/15 auth-input-light shadow-2xs"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label
                    className={`block text-xs font-semibold mb-1 ${
                      isDark ? "text-zinc-300" : "text-slate-700"
                    }`}
                    htmlFor="signup-phone"
                  >
                    Mobile Number <span className={isDark ? "text-zinc-500 font-normal" : "text-slate-400 font-normal"}>(optional)</span>
                  </label>
                  <div className="relative">
                    <div
                      className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${
                        isDark ? "text-zinc-500" : "text-slate-400"
                      }`}
                    >
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-phone"
                      name="tel"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+91 9876543210"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm transition focus:outline-none ${
                        isDark
                          ? "bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700/40 auth-input-dark"
                          : "bg-slate-50/70 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-3 focus:ring-indigo-500/15 auth-input-light shadow-2xs"
                      }`}
                    />
                  </div>
                </div>

                {/* Password field */}
                <div>
                  <label
                    className={`block text-xs font-semibold mb-1 ${
                      isDark ? "text-zinc-300" : "text-slate-700"
                    }`}
                    htmlFor="signup-password"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div
                      className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${
                        isDark ? "text-zinc-500" : "text-slate-400"
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-password"
                      name="new-password"
                      type={showSignupPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      placeholder="8+ characters, upper, lower, number, symbol"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className={`w-full pl-10 pr-10 py-2 rounded-xl text-sm transition focus:outline-none ${
                        isDark
                          ? "bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700/40 auth-input-dark"
                          : "bg-slate-50/70 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-3 focus:ring-indigo-500/15 auth-input-light shadow-2xs"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className={`absolute inset-y-0 right-0 pr-3.5 flex items-center cursor-pointer transition ${
                        isDark ? "text-zinc-500 hover:text-zinc-300" : "text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Checklist & Bar */}
                  {signupPassword && (
                    <div
                      className={`mt-2.5 p-3 rounded-2xl border space-y-2 transition-all ${
                        isDark ? "bg-zinc-950/80 border-zinc-800" : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={isDark ? "text-zinc-400" : "text-slate-500"}>
                          Password strength:
                        </span>
                        <span className={`font-semibold ${strength.text}`}>{strength.label}</span>
                      </div>
                      <div
                        className={`w-full h-1.5 rounded-full overflow-hidden ${
                          isDark ? "bg-zinc-800" : "bg-slate-200"
                        }`}
                      >
                        <div
                          className={`h-full transition-all duration-300 ${strength.color}`}
                          style={{ width: `${strength.percent}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                        <span
                          className={`flex items-center gap-1 font-medium ${
                            passwordCriteria.minLen
                              ? isDark ? "text-emerald-400" : "text-emerald-600"
                              : isDark ? "text-zinc-500" : "text-slate-400"
                          }`}
                        >
                          {passwordCriteria.minLen ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          8-128 characters
                        </span>
                        <span
                          className={`flex items-center gap-1 font-medium ${
                            passwordCriteria.hasUpper
                              ? isDark ? "text-emerald-400" : "text-emerald-600"
                              : isDark ? "text-zinc-500" : "text-slate-400"
                          }`}
                        >
                          {passwordCriteria.hasUpper ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          Uppercase letter
                        </span>
                        <span
                          className={`flex items-center gap-1 font-medium ${
                            passwordCriteria.hasLower
                              ? isDark ? "text-emerald-400" : "text-emerald-600"
                              : isDark ? "text-zinc-500" : "text-slate-400"
                          }`}
                        >
                          {passwordCriteria.hasLower ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          Lowercase letter
                        </span>
                        <span
                          className={`flex items-center gap-1 font-medium ${
                            passwordCriteria.hasNumber
                              ? isDark ? "text-emerald-400" : "text-emerald-600"
                              : isDark ? "text-zinc-500" : "text-slate-400"
                          }`}
                        >
                          {passwordCriteria.hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          Number (0-9)
                        </span>
                        <span
                          className={`flex items-center gap-1 font-medium ${
                            passwordCriteria.hasSpecial
                              ? isDark ? "text-emerald-400" : "text-emerald-600"
                              : isDark ? "text-zinc-500" : "text-slate-400"
                          }`}
                        >
                          {passwordCriteria.hasSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          Special symbol (!@#$)
                        </span>
                        <span
                          className={`flex items-center gap-1 font-medium ${
                            passwordCriteria.noWhitespaceEnds
                              ? isDark ? "text-emerald-400" : "text-emerald-600"
                              : isDark ? "text-zinc-500" : "text-slate-400"
                          }`}
                        >
                          {passwordCriteria.noWhitespaceEnds ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          No end spaces
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      className={`block text-xs font-semibold ${
                        isDark ? "text-zinc-300" : "text-slate-700"
                      }`}
                      htmlFor="signup-confirm-password"
                    >
                      Confirm Password
                    </label>
                    {passwordsMatch !== null && (
                      <span
                        className={`text-[10px] font-semibold flex items-center gap-1 ${
                          passwordsMatch
                            ? isDark ? "text-emerald-400" : "text-emerald-600"
                            : isDark ? "text-rose-400" : "text-rose-600"
                        }`}
                      >
                        {passwordsMatch ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {passwordsMatch ? "Passwords match" : "Mismatch"}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div
                      className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${
                        isDark ? "text-zinc-500" : "text-slate-400"
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-confirm-password"
                      name="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      placeholder="Re-enter your password"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      className={`w-full pl-10 pr-10 py-2 rounded-xl text-sm transition focus:outline-none ${
                        passwordsMatch === false
                          ? isDark
                            ? "bg-zinc-950 border border-rose-500/80 text-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 auth-input-dark"
                            : "bg-slate-50/70 border border-rose-400 text-slate-900 focus:bg-white focus:border-rose-600 focus:ring-3 focus:ring-rose-500/15 auth-input-light shadow-2xs"
                          : isDark
                          ? "bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700/40 auth-input-dark"
                          : "bg-slate-50/70 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-3 focus:ring-indigo-500/15 auth-input-light shadow-2xs"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={`absolute inset-y-0 right-0 pr-3.5 flex items-center cursor-pointer transition ${
                        isDark ? "text-zinc-500 hover:text-zinc-300" : "text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Terms agreement */}
                <div className="pt-1">
                  <label
                    className={`flex items-start gap-2.5 text-xs cursor-pointer select-none font-medium ${
                      isDark ? "text-zinc-400 hover:text-zinc-300" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className={`mt-0.5 w-4 h-4 rounded cursor-pointer shrink-0 ${
                        isDark ? "border-zinc-700 bg-zinc-800 text-white focus:ring-zinc-600" : "border-slate-300 bg-white text-indigo-600 focus:ring-indigo-500"
                      }`}
                    />
                    <span>
                      I agree to the <span className="text-indigo-600 dark:text-zinc-300 font-semibold hover:underline">Security Policy</span> and{" "}
                      <span className="text-indigo-600 dark:text-zinc-300 font-semibold hover:underline">Terms of Service</span>.
                    </span>
                  </label>
                </div>

                {/* Submit Signup Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  id="submit-signup-btn"
                  className={`w-full mt-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.008] active:scale-[0.99] ${
                    isDark
                      ? "bg-white hover:bg-zinc-100 text-zinc-950 shadow-md shadow-white/5"
                      : "bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/15"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <span className={`w-4 h-4 border-2 rounded-full animate-spin ${isDark ? "border-zinc-400 border-t-zinc-950" : "border-white/30 border-t-white"}`} />
                      <span>Creating Profile...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account & Get Started</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Bottom Security Assurance Note matching Dashboard */}
            <div className={`mt-8 pt-5 border-t text-center ${isDark ? "border-zinc-800" : "border-slate-200/80"}`}>
              <p className={`text-[11px] font-medium flex items-center justify-center gap-1.5 ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>© 2026 AI Assistant Platform • Centralized JWT Security</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FORGOT PASSWORD MODAL (Full Light & Dark Mode Support)                    */}
      {/* ========================================================================= */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div
            className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border transition-all duration-200 ${
              isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3.5 border ${
                isDark
                  ? "bg-zinc-800 border-zinc-700 text-zinc-200"
                  : "bg-indigo-50 border-indigo-200 text-indigo-600"
              }`}
            >
              <KeyRound className="w-5 h-5" />
            </div>

            <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              Reset Account Password
            </h3>
            <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
              Enter your email address below to receive password reset instructions.
            </p>

            {forgotSent ? (
              <div
                className={`mt-4 p-3.5 rounded-2xl text-xs border ${
                  isDark
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                    : "bg-emerald-50 border-emerald-200 text-emerald-700"
                }`}
              >
                <p className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Request received!</span>
                </p>
                <p className={`mt-1 text-[11px] ${isDark ? "text-zinc-400" : "text-slate-600"}`}>
                  Instructions have been sent to <span className="font-semibold">{forgotEmail}</span> if registered.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSent(false);
                  }}
                  className={`w-full mt-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isDark
                      ? "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200"
                  }`}
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="mt-4 space-y-3" style={{ colorScheme: isDark ? "dark" : "light" }}>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs transition focus:outline-none ${
                    isDark
                      ? "bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-700 auth-input-dark"
                      : "bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 auth-input-light shadow-2xs"
                  }`}
                />

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      isDark
                        ? "bg-white hover:bg-zinc-100 text-zinc-950 shadow-xs"
                        : "bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                    }`}
                  >
                    Send Reset Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                      isDark
                        ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
