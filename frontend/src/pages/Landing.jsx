import { useState } from 'react'
import { Link } from 'react-router-dom'

// Background: deep space dark with a subtle animated gradient mesh
const BG_STYLE = {
  background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
}

const GRID_STYLE = {
  backgroundImage:
    'linear-gradient(rgba(99,102,241,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.15) 1px, transparent 1px)',
  backgroundSize: '48px 48px',
}

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M17.5 14.5v6M14.5 17.5h6" />
      </svg>
    ),
    title: 'Visual Workflow Builder',
    desc: 'Drag, drop, and connect nodes to build automations without writing a single line of code.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: 'Real-Time Execution Logs',
    desc: 'Watch every step of your workflow execute in real time with detailed logs and status.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: 'Secure & Private',
    desc: 'JWT-based auth with encrypted credentials. Your data stays yours.',
  },
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen overflow-hidden relative" style={BG_STYLE}>
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-100" style={GRID_STYLE} />

      {/* Glow blobs */}
      <div
        className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full blur-3xl opacity-25"
        style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }}
      />
      <div
        className="absolute bottom-[-150px] right-[-100px] w-[400px] h-[400px] rounded-full blur-3xl opacity-20"
        style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-10"
        style={{ background: 'radial-gradient(circle, #4f46e5, transparent)' }}
      />

      {/* ── NAV ── */}
      <header className="relative z-20">
        <div className="max-w-7xl mx-auto px-6 pt-5">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
              <span className="text-white font-bold text-xl tracking-tight">FlowForge</span>
            </div>

            {/* Desktop nav pill */}
            <nav className="hidden md:flex items-center gap-1 rounded-full bg-white/5 px-1.5 py-1.5 ring-1 ring-white/10 backdrop-blur-md">
              {['Home', 'Features', 'Docs'].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="px-4 py-1.5 text-sm font-medium text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10"
                >
                  {item}
                </a>
              ))}
              <Link
                to="/login"
                className="px-4 py-1.5 text-sm font-medium text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-indigo-100 transition-colors"
              >
                Get Started
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M7 7h10v10" /><path d="M7 17 17 7" />
                </svg>
              </Link>
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 backdrop-blur"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M4 5h16M4 12h16M4 19h16" />
              </svg>
            </button>
          </div>

          {/* Mobile dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-3 rounded-2xl bg-white/5 ring-1 ring-white/10 backdrop-blur-md p-4 space-y-1">
              {['Home', 'Features', 'Docs'].map((item) => (
                <a key={item} href="#" className="block px-4 py-2 text-sm text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition">
                  {item}
                </a>
              ))}
              <hr className="border-white/10 my-2" />
              <Link to="/login" className="block px-4 py-2 text-sm text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition">
                Sign In
              </Link>
              <Link to="/register" className="block px-4 py-2 text-sm font-semibold text-indigo-300 hover:text-white rounded-xl hover:bg-indigo-500/20 transition">
                Get Started →
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* ── HERO ── */}
      <main className="relative z-10">
        <div className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">

          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-3 rounded-full bg-white/10 px-3 py-2 ring-1 ring-white/15 backdrop-blur-md">
            <span className="inline-flex items-center text-xs font-semibold text-neutral-900 bg-white/90 rounded-full py-0.5 px-2.5">
              Beta
            </span>
            <span className="text-sm font-medium text-white/80">
              Build powerful automations visually
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6">
            Automate your
            <br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}>
              workflows visually
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed mb-10">
            Connect apps, trigger actions, and build powerful automations — all without writing a single line of code.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full text-sm font-semibold text-white px-6 py-3.5 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
            >
              Create Free Account
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full text-sm font-medium text-white/80 hover:text-white px-6 py-3.5 bg-white/5 ring-1 ring-white/10 hover:bg-white/10 backdrop-blur-md transition-all duration-200"
            >
              Sign In
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </Link>
          </div>
        </div>

        {/* ── FEATURES ── */}
        <div className="max-w-5xl mx-auto px-6 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl bg-white/5 ring-1 ring-white/10 backdrop-blur-md p-6 hover:bg-white/8 hover:ring-indigo-500/30 transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mb-4 group-hover:bg-indigo-500/25 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-white font-semibold text-base mb-2">{f.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Bottom sign-up prompt */}
          <div className="mt-16 text-center">
            <p className="text-white/40 text-sm">
              Ready to get started?{' '}
              <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Create your free account →
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
