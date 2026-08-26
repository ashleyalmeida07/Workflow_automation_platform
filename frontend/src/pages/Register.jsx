import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || 'Registration failed')
      } else {
        navigate('/login')
      }
    } catch {
      setError('Could not connect to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">

      {/* ── Left branding panel ── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a00 50%, #0a0a0a 100%)' }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'linear-gradient(rgba(249,115,22,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Glow blobs */}
        <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #f97316, transparent)' }} />
        <div className="absolute bottom-1/3 left-1/4 w-48 h-48 rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, #fb923c, transparent)' }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">FlowForge</span>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-6">
          <h2
            className="text-5xl text-white leading-tight"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Build workflows<br />
            in <span className="text-orange-400">minutes</span>
          </h2>
          <p className="text-white/40 text-base leading-relaxed max-w-sm" style={{ fontFamily: 'var(--font-sans)' }}>
            Automate your processes with FlowForge. No credit card required.
          </p>
          <div className="space-y-3 pt-2">
            {['Drag-and-drop workflow builder', 'Real-time execution logs', 'Secure JWT authentication'].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="text-white/60 text-sm" style={{ fontFamily: 'var(--font-sans)' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <p className="text-white/20 text-xs" style={{ fontFamily: 'var(--font-sans)' }}>
            © 2026 FlowForge. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#0a0a0a]">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-10 justify-center">
            <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg">FlowForge</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-sans)' }}>Create your account</h1>
            <p className="text-white/30 text-sm mt-1" style={{ fontFamily: 'var(--font-sans)' }}>Start building automations in under a minute.</p>
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-950/40 border border-red-800/50 text-red-400 text-sm rounded-xl px-4 py-3 mb-6">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-white/40 text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'var(--font-sans)' }}>Full Name</label>
              <input
                id="name" name="name" type="text" required
                value={form.name} onChange={handleChange}
                className="w-full bg-white/[0.04] text-white border border-white/[0.08] rounded-xl px-4 py-3 text-sm placeholder-white/20 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition"
                placeholder="Your full name"
                style={{ fontFamily: 'var(--font-sans)' }}
              />
            </div>

            <div>
              <label className="block text-white/40 text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'var(--font-sans)' }}>Email</label>
              <input
                id="email" name="email" type="email" required
                value={form.email} onChange={handleChange}
                className="w-full bg-white/[0.04] text-white border border-white/[0.08] rounded-xl px-4 py-3 text-sm placeholder-white/20 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition"
                placeholder="you@example.com"
                style={{ fontFamily: 'var(--font-sans)' }}
              />
            </div>

            <div>
              <label className="block text-white/40 text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'var(--font-sans)' }}>Password</label>
              <input
                id="password" name="password" type="password" required
                value={form.password} onChange={handleChange}
                className="w-full bg-white/[0.04] text-white border border-white/[0.08] rounded-xl px-4 py-3 text-sm placeholder-white/20 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition"
                placeholder="••••••••"
                style={{ fontFamily: 'var(--font-sans)' }}
              />
            </div>

            <button
              id="register-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-orange-500 hover:bg-orange-400 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-orange-500/20"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                  </svg>
                  Creating account...
                </span>
              ) : 'Create Account →'}
            </button>
          </form>

          <p className="text-white/25 text-sm text-center mt-8" style={{ fontFamily: 'var(--font-sans)' }}>
            By signing up you agree to our{' '}
            <span className="text-orange-400/70 cursor-pointer hover:text-orange-400 transition">Terms of Service</span>
            {' '}and{' '}
            <span className="text-orange-400/70 cursor-pointer hover:text-orange-400 transition">Privacy Policy</span>
          </p>

          <p className="text-white/25 text-sm text-center mt-4" style={{ fontFamily: 'var(--font-sans)' }}>
            Already have an account?{' '}
            <Link to="/login" className="text-orange-400 hover:text-orange-300 font-medium transition">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
