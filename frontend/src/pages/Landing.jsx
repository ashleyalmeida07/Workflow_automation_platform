import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

// ── Scroll-reveal hook ────────────────────────────────────────────────────────
function useScrollReveal(options = {}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px', ...options }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return [ref, visible]
}

// ── Reveal wrapper ────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = '' }) {
  const [ref, visible] = useScrollReveal()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

// ── Hero Section ──────────────────────────────────────────────────────────────
function Hero() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { label: 'Home', href: '/', isActive: true },
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
  ]

  return (
    <section className="w-full isolate min-h-screen overflow-hidden relative">
      {/* Background image — a.png */}
      <img src="/a.png" alt="" className="w-full h-full object-cover absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-black/55" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#0a0a0a]" />

      {/* Nav */}
      <header className="relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between pt-5">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
              <span className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: 'var(--font-sans)' }}>FlowForge</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 rounded-full bg-white/5 px-1 py-1 ring-1 ring-white/10 backdrop-blur">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={`px-4 py-2 text-sm font-medium hover:text-white transition-colors rounded-full ${link.isActive ? 'text-white/90' : 'text-white/60 hover:bg-white/5'}`}
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  {link.label}
                </a>
              ))}
              <Link
                to="/register"
                className="ml-1 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-orange-50 transition-colors"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                Get Started
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M7 7h10v10" /><path d="M7 17 17 7" />
                </svg>
              </Link>
            </nav>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 backdrop-blur"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M4 5h16M4 12h16M4 19h16" />
              </svg>
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden mt-3 rounded-2xl bg-black/80 ring-1 ring-white/10 backdrop-blur-md p-4 space-y-1">
              {navLinks.map(link => (
                <a key={link.label} href={link.href} className="block px-4 py-2 text-sm text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition">{link.label}</a>
              ))}
              <hr className="border-white/10 my-2" />
              <Link to="/login" className="block px-4 py-2 text-sm text-white/60 hover:text-white rounded-xl hover:bg-white/5 transition">Sign In</Link>
              <Link to="/register" className="block px-4 py-2 text-sm font-semibold text-orange-400 rounded-xl hover:bg-orange-500/10 transition">Get Started →</Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero content — shifted up with less top padding */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24 sm:pt-20 lg:pt-28 text-center">

        {/* Badge */}
        <div className="mb-5 inline-flex items-center gap-3 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15 backdrop-blur animate-fade-slide-in-1">
          <span className="text-xs font-semibold text-neutral-900 bg-white/90 rounded-full py-0.5 px-2.5" style={{ fontFamily: 'var(--font-sans)' }}>Beta</span>
          <span className="text-sm font-medium text-white/80" style={{ fontFamily: 'var(--font-sans)' }}>Visual workflow automation for everyone</span>
        </div>

        {/* Headline */}
        <h1
          className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-white leading-[1.0] tracking-tight font-medium animate-fade-slide-in-2 mb-6"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          Automate Your<br />
          <span className="text-orange-400">Workflows</span> Visually
        </h1>

        {/* Description */}
        <p className="text-lg sm:text-xl text-white/55 max-w-xl mx-auto leading-relaxed animate-fade-slide-in-3 mb-10" style={{ fontFamily: 'var(--font-sans)' }}>
          Connect apps, trigger actions, and build powerful automations — all without writing a single line of code.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-slide-in-4">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-full text-sm font-semibold text-white bg-[#1c1c1c] hover:bg-[#2a2a2a] border border-white/10 px-6 py-3.5 transition-colors"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Start for free
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-full text-sm font-medium text-white/55 hover:text-white px-6 py-3.5 transition-colors"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Sign in
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
            </svg>
          </Link>
        </div>

        {/* Feature pills */}
        <div className="mt-16 flex flex-wrap justify-center gap-3 animate-fade-slide-in-4">
          {[
            { icon: '⚡', label: 'Visual workflow builder' },
            { icon: '📊', label: 'Real-time execution logs' },
            { icon: '🔒', label: 'Secure JWT authentication' },
            { icon: '🔌', label: 'API & webhook support' },
          ].map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-2 rounded-full bg-white/[0.06] ring-1 ring-white/[0.08] backdrop-blur px-4 py-2"
            >
              <span className="text-sm">{f.icon}</span>
              <span className="text-white/60 text-[13px] font-medium" style={{ fontFamily: 'var(--font-sans)' }}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Features Section ──────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><path d="M17.5 14.5v6M14.5 17.5h6" /></svg>,
    title: 'Visual Workflow Builder',
    desc: 'Drag, drop, and connect nodes to design complex automations on an intuitive canvas — no code required.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
    title: 'Real-Time Execution',
    desc: 'Watch every step run in real time with live logs, status indicators, and detailed execution history.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    title: 'Secure by Default',
    desc: 'JWT-based authentication, encrypted credentials, and role-based access control built in from day one.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.8"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
    title: 'Instant Triggers',
    desc: 'Kick off workflows on a schedule, via webhook, or on any event — with millisecond response times.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></svg>,
    title: 'API & Webhooks',
    desc: 'Connect anything with our REST API and webhook support. Integrate with any service in minutes.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.8"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>,
    title: 'Modular Architecture',
    desc: 'Every workflow is a reusable building block. Compose, fork, and share automations across your team.',
  },
]

function Features() {
  return (
    <section id="features" className="bg-[#0a0a0a] py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-16">
          <span className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-4 block" style={{ fontFamily: 'var(--font-sans)' }}>Features</span>
          <h2 className="text-4xl sm:text-5xl text-white font-medium leading-tight" style={{ fontFamily: 'var(--font-serif)' }}>
            Everything you need to<br />automate at scale
          </h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto mt-4" style={{ fontFamily: 'var(--font-sans)' }}>
            A complete automation platform built for developers and teams who move fast.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 80}>
              <div className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-orange-500/20 rounded-2xl p-7 transition-all duration-300 h-full">
                <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-5 group-hover:bg-orange-500/15 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-white font-semibold text-base mb-2" style={{ fontFamily: 'var(--font-sans)' }}>{f.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed" style={{ fontFamily: 'var(--font-sans)' }}>{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── How It Works ──────────────────────────────────────────────────────────────
const STEPS = [
  { num: '01', title: 'Create a workflow', desc: 'Open the visual editor and drag in nodes for triggers, actions, and conditions. No code needed.' },
  { num: '02', title: 'Connect your apps', desc: 'Link your services via API keys or webhooks. FlowForge handles authentication and retries.' },
  { num: '03', title: 'Activate & monitor', desc: 'Enable your workflow with one click. Watch live execution logs and get notified on failures.' },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#0c0c0c] py-28 px-6 border-y border-white/[0.04]">
      <div className="max-w-5xl mx-auto">
        <Reveal className="text-center mb-16">
          <span className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-4 block" style={{ fontFamily: 'var(--font-sans)' }}>How It Works</span>
          <h2 className="text-4xl sm:text-5xl text-white font-semibold" style={{ fontFamily: 'var(--font-serif)' }}>
            Up and running in minutes
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <Reveal key={step.num} delay={i * 120}>
              <div className="flex flex-col">
                <div className="text-6xl font-bold text-orange-500/10 mb-4 leading-none" style={{ fontFamily: 'var(--font-serif)' }}>{step.num}</div>
                <div className="w-px h-6 bg-orange-500/30 ml-1 mb-4" />
                <h3 className="text-white font-semibold text-lg mb-2" style={{ fontFamily: 'var(--font-sans)' }}>{step.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed" style={{ fontFamily: 'var(--font-sans)' }}>{step.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Pricing ───────────────────────────────────────────────────────────────────
const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'Perfect for getting started.',
    features: ['5 active workflows', '100 executions/month', 'Visual workflow builder', 'Community support'],
    cta: 'Get started free',
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: 'per month',
    desc: 'For teams that move fast.',
    features: ['Unlimited workflows', '10,000 executions/month', 'Real-time execution logs', 'Webhooks & API access', 'Priority support'],
    cta: 'Start free trial',
    href: '/register',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    desc: 'For large-scale deployments.',
    features: ['Unlimited everything', 'Custom SLA & uptime', 'SSO & SAML', 'Dedicated support', 'On-premise option'],
    cta: 'Contact sales',
    href: '/register',
    highlighted: false,
  },
]

function Pricing() {
  return (
    <section id="pricing" className="bg-[#0a0a0a] py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <Reveal className="text-center mb-16">
          <span className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-4 block" style={{ fontFamily: 'var(--font-sans)' }}>Pricing</span>
          <h2 className="text-4xl sm:text-5xl text-white font-medium" style={{ fontFamily: 'var(--font-serif)' }}>Simple, transparent pricing</h2>
          <p className="text-white/40 text-lg mt-4" style={{ fontFamily: 'var(--font-sans)' }}>No hidden fees. Cancel anytime.</p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 100}>
              <div
                className={`rounded-2xl p-7 flex flex-col h-full relative transition-all duration-200 ${
                  plan.highlighted
                    ? 'bg-orange-500/10 border border-orange-500/30 ring-1 ring-orange-500/20'
                    : 'bg-white/[0.02] border border-white/[0.06] hover:border-white/10'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full" style={{ fontFamily: 'var(--font-sans)' }}>Most Popular</span>
                  </div>
                )}
                <div className="mb-6">
                  <p className="text-white/50 text-sm font-medium mb-1" style={{ fontFamily: 'var(--font-sans)' }}>{plan.name}</p>
                  <div className="flex items-end gap-1.5 mb-1">
                    <span className="text-4xl font-bold text-white" style={{ fontFamily: 'var(--font-sans)' }}>{plan.price}</span>
                    <span className="text-white/30 text-sm mb-1" style={{ fontFamily: 'var(--font-sans)' }}>{plan.period}</span>
                  </div>
                  <p className="text-white/30 text-sm" style={{ fontFamily: 'var(--font-sans)' }}>{plan.desc}</p>
                </div>
                <div className="flex flex-col gap-3 flex-1 mb-8">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                      <span className="text-white/60 text-sm" style={{ fontFamily: 'var(--font-sans)' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link
                  to={plan.href}
                  className={`w-full text-center py-3 rounded-xl text-sm font-semibold transition-colors ${
                    plan.highlighted
                      ? 'bg-orange-500 hover:bg-orange-400 text-white'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/[0.08]'
                  }`}
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  {plan.cta}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── CTA Banner ────────────────────────────────────────────────────────────────
function CTABanner() {
  return (
    <section className="bg-[#0c0c0c] border-t border-white/[0.04] py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <Reveal>
          <h2 className="text-4xl sm:text-5xl text-white font-medium mb-5 leading-tight" style={{ fontFamily: 'var(--font-serif)' }}>
            Ready to automate<br />your first workflow?
          </h2>
          <p className="text-white/40 text-lg mb-10" style={{ fontFamily: 'var(--font-sans)' }}>
            Join teams already building with FlowForge. Free forever, no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full text-sm font-semibold text-white bg-[#1c1c1c] hover:bg-[#262626] border border-white/10 px-7 py-4 transition-colors"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Create free account
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full text-sm font-medium text-white/40 hover:text-white/70 px-7 py-4 transition-colors"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Already have an account? Sign in →
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/[0.04] py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
          <span className="text-white font-bold" style={{ fontFamily: 'var(--font-sans)' }}>FlowForge</span>
        </div>
        <div className="flex items-center gap-6">
          {['Features', 'How It Works', 'Pricing'].map(link => (
            <a key={link} href={`#${link.toLowerCase().replace(/ /g, '-')}`} className="text-white/30 text-sm hover:text-white/60 transition" style={{ fontFamily: 'var(--font-sans)' }}>
              {link}
            </a>
          ))}
          <Link to="/login" className="text-white/30 text-sm hover:text-white/60 transition" style={{ fontFamily: 'var(--font-sans)' }}>Sign In</Link>
        </div>
        <p className="text-white/20 text-xs" style={{ fontFamily: 'var(--font-sans)' }}>© 2026 FlowForge. All rights reserved.</p>
      </div>
    </footer>
  )
}

// ── Landing Page ──────────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <div className="bg-[#0a0a0a]">
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <CTABanner />
      <Footer />
    </div>
  )
}
