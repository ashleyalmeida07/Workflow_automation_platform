import React, { useState } from "react";
// We use React.useEffect via the default import
const import_react = React;
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";
import { useGoogleLogin } from '@react-oauth/google';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function AuthSectionThree({ mode = "register" }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(
    mode === "register"
      ? { firstName: "", lastName: "", email: "", password: "" }
      : { email: "", password: "" }
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset form when switching between login and register
  import_react.useEffect(() => {
    setForm(
      mode === "register"
        ? { firstName: "", lastName: "", email: "", password: "" }
        : { email: "", password: "" }
    );
    setError("");
  }, [mode]);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: tokenResponse.access_token }),
        });
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.detail || "Google login failed");
        } else {
          localStorage.setItem("token", data.access_token);
          if (data.name) localStorage.setItem("userName", data.name);
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Google Auth Error:", err);
        setError("Could not connect to server.");
      } finally {
        setLoading(false);
      }
    },
    onError: errorResponse => setError("Google login failed")
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "register" ? "/auth/register" : "/auth/login";
      const payload = mode === "register"
        ? { name: `${form.firstName} ${form.lastName}`.trim(), email: form.email, password: form.password }
        : { email: form.email, password: form.password };

      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Authentication failed");
      } else {
        // Both login AND register: store token and go straight to the dashboard.
        // For register the backend returns the user object; for login it returns {access_token}.
        // We handle both shapes here.
        const token = data.access_token;
        if (token) {
          localStorage.setItem("token", token);
          // Cache the name so the navbar shows it instantly without an API round-trip.
          if (data.name) localStorage.setItem("userName", data.name);
          navigate("/dashboard");
        } else if (mode === "register") {
          // If the register endpoint doesn't return a token, just send to login.
          navigate("/login");
        }
      }
    } catch (err) {
      console.error("Auth Error:", err);
      setError(err.message === "Failed to fetch" ? "Could not connect to server. Check CORS or server status." : err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-[#0a0a0a] p-3 text-white antialiased [font-synthesis:none]">
      <div className="grid min-h-[calc(100vh-1.5rem)] gap-6 lg:grid-cols-[0.94fr_1.06fr]">
        
        {/* Left Side - Auth Form */}
        <div className="flex min-h-[760px] items-center justify-center rounded-2xl border border-white/5 bg-[#0e0e0e] px-6 py-12 lg:min-h-0 lg:px-14 lg:py-20 xl:px-20">
          <div className="mx-auto w-full max-w-[460px]">
            
            {/* Mobile logo */}
            <div className="flex lg:hidden items-center gap-2.5 mb-8">
              <img src="/logo.png" className="h-8 w-auto object-contain" alt="Logo" />
            </div>

            <div>
              <h1 className="text-3xl font-medium tracking-tight sm:text-4xl text-white" style={{ fontFamily: 'var(--font-serif)' }}>
                {mode === "register" ? "Create an account" : "Sign in to your account"}
              </h1>
              <p className="mt-2 text-white/40 text-sm" style={{ fontFamily: 'var(--font-sans)' }}>
                {mode === "register" ? "Start building automations in under a minute." : "Welcome back. Enter your credentials to continue."}
              </p>
            </div>

            {/* Social Auth */}
            <div className="mt-8 grid gap-3 sm:grid-cols-1 sm:gap-4">
              <button
                type="button"
                onClick={() => handleGoogleLogin()}
                className="flex h-11 w-full min-w-0 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 text-sm font-medium text-white transition-colors hover:bg-white/10"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                <GoogleIcon />
                <span className="whitespace-nowrap">Continue with Google</span>
              </button>
            </div>

            <div className="my-6 flex items-center gap-4 text-xs font-medium text-white/30" style={{ fontFamily: 'var(--font-sans)' }}>
              <div className="h-px flex-1 bg-white/10" />
              or
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-red-950/40 border border-red-800/50 text-red-400 text-sm rounded-xl px-4 py-3 mb-6" style={{ fontFamily: 'var(--font-sans)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {mode === "register" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    label="First name"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="Jane"
                  />
                  <InputField
                    label="Last name"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                  />
                </div>
              )}

              <InputField
                label="Email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="email@example.com"
                type="email"
              />

              <InputField
                label="Password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
                type="password"
                showForgot={mode === "login"}
              />

              {mode === "register" && (
                <div className="space-y-3 pt-2 text-xs leading-5 text-white/40 sm:text-[13px]" style={{ fontFamily: 'var(--font-sans)' }}>
                  <CheckboxLine>
                    I don't want to receive emails about platform feature updates and best practices.
                  </CheckboxLine>
                  <CheckboxLine>
                    By creating an account, you agree to our{" "}
                    <a href="#" className="font-medium text-white/60 hover:text-white underline underline-offset-2">Terms of Service</a>
                    {" "}and{" "}
                    <a href="#" className="font-medium text-white/60 hover:text-white underline underline-offset-2">Privacy Policy</a>
                  </CheckboxLine>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-8 flex h-11 w-full items-center justify-center rounded-lg bg-orange-500 text-sm font-semibold text-white transition-colors hover:bg-orange-400 disabled:opacity-50"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                    </svg>
                    Please wait...
                  </span>
                ) : (
                  mode === "register" ? "Create Account" : "Sign In"
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-white/40" style={{ fontFamily: 'var(--font-sans)' }}>
              {mode === "register" ? "Already have an account? " : "Don't have an account? "}
              <Link 
                to={mode === "register" ? "/login" : "/register"} 
                className="font-medium text-orange-400 hover:text-orange-300 transition-colors"
              >
                {mode === "register" ? "Sign in" : "Sign up"}
              </Link>
            </p>
          </div>
        </div>

        {/* Right Side - Orange Branding Theme */}
        <div className="relative hidden lg:flex min-h-[720px] flex-col overflow-hidden rounded-2xl bg-[#0a0a0a] p-8 text-white sm:p-12 lg:min-h-0 lg:p-16 border border-white/5">
          
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: 'linear-gradient(rgba(249,115,22,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.5) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          
          {/* Glow blobs */}
          <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-[100px] opacity-20"
            style={{ background: 'radial-gradient(circle, #f97316, transparent)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full blur-[80px] opacity-15"
            style={{ background: 'radial-gradient(circle, #fb923c, transparent)' }} />

          <div className="relative z-10 flex flex-col h-full justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.png" className="h-10 w-auto object-contain drop-shadow-lg" alt="Logo" />
            </Link>

            {/* Content */}
            <div className="max-w-[460px]">
              <motion.h2 
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="text-4xl sm:text-5xl font-medium leading-tight text-white mb-6"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Automate your<br />
                <span className="text-orange-400">workflows</span> visually
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="text-white/40 text-lg leading-relaxed mb-10" 
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                Connect apps, trigger actions, and build powerful automations — all without writing a single line of code.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-4"
              >
                {[
                  'Drag-and-drop workflow builder', 
                  'Real-time execution logs', 
                  'Secure JWT authentication'
                ].map((f) => (
                  <div key={f} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span className="text-white/70 text-sm font-medium" style={{ fontFamily: 'var(--font-sans)' }}>{f}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Footer */}
            <div className="mt-12 text-white/20 text-xs" style={{ fontFamily: 'var(--font-sans)' }}>
              © 2026 FlowForge. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InputField({
  label,
  name,
  placeholder,
  type = "text",
  value,
  onChange,
  showForgot = false,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-1.5 text-left w-full" style={{ fontFamily: 'var(--font-sans)' }}>
      <div className="flex justify-between items-center">
        <label className="text-xs font-semibold text-white/60">
          {label}
        </label>
        {showForgot && (
          <span className="text-orange-400/80 text-xs cursor-pointer hover:text-orange-400 transition">Forgot password?</span>
        )}
      </div>
      <div className="relative flex h-11 items-center rounded-lg border border-white/10 bg-white/5 px-3.5 focus-within:border-orange-500/50 focus-within:ring-1 focus-within:ring-orange-500/50 transition-all">
        <input
          type={type === "password" ? (showPassword ? "text" : "password") : type}
          name={name}
          value={value}
          onChange={onChange}
          required
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20"
        />
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 text-white/40 hover:text-white cursor-pointer"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

function CheckboxLine({ children }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <span className="relative mt-0.5 size-4 shrink-0">
        <input
          type="checkbox"
          className="peer size-full cursor-pointer appearance-none rounded-[4px] border border-white/20 bg-white/5 checked:border-orange-500 checked:bg-orange-500 transition-colors"
        />
        <svg
          viewBox="0 0 12 12"
          className="pointer-events-none absolute inset-0 hidden size-full p-0.5 text-white peer-checked:block"
          fill="none"
        >
          <path d="M3 6.2 5 8.1 9 3.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span>{children}</span>
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853" />
      <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84Z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" fill="#EB4335" />
    </svg>
  );
}
