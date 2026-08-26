import { useState } from 'react'
import { Link } from 'react-router-dom'

const ResponsiveHeroBanner = ({
  backgroundImageUrl = '/hero-bg.jpg',
  navLinks = [
    { label: 'Home', href: '/', isActive: true },
    { label: 'Features', href: '#features' },
    { label: 'Docs', href: '#' },
  ],
  ctaButtonText = 'Get Started',
  ctaButtonHref = '/register',
  badgeLabel = 'Beta',
  badgeText = 'Visual workflow automation for everyone',
  title = 'Automate Your',
  titleLine2 = 'Workflows Visually',
  description = 'Connect apps, trigger actions, and build powerful automations — all without writing a single line of code.',
  primaryButtonText = 'Create Free Account',
  primaryButtonHref = '/register',
  secondaryButtonText = 'Sign In',
  secondaryButtonHref = '/login',
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <section className="w-full isolate min-h-screen overflow-hidden relative">
      {/* Background image */}
      <img
        src={backgroundImageUrl}
        alt=""
        className="w-full h-full object-cover absolute top-0 right-0 bottom-0 left-0"
      />
      {/* Dark overlay for readability */}
      <div className="pointer-events-none absolute inset-0 bg-black/50" />
      <div className="pointer-events-none absolute inset-0 ring-1 ring-black/30" />

      {/* ── HEADER ── */}
      <header className="z-10 xl:top-4 relative">
        <div className="mx-6">
          <div className="flex items-center justify-between pt-4">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/40">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
              <span className="text-white font-bold text-xl tracking-tight" style={{ fontFamily: 'var(--font-sans)' }}>FlowForge</span>
            </Link>

            {/* Desktop nav pill */}
            <nav className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-white/5 px-1 py-1 ring-1 ring-white/10 backdrop-blur">
                {navLinks.map((link, index) => (
                  <Link
                    key={index}
                    to={link.href}
                    className={`px-3 py-2 text-sm font-medium hover:text-white transition-colors rounded-full ${link.isActive ? 'text-white/90' : 'text-white/70'}`}
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  to={ctaButtonHref}
                  className="ml-1 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-neutral-900 hover:bg-indigo-50 transition-colors"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  {ctaButtonText}
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 7h10v10" /><path d="M7 17 17 7" />
                  </svg>
                </Link>
              </div>
            </nav>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 backdrop-blur"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M4 5h16M4 12h16M4 19h16" />
              </svg>
            </button>
          </div>

          {/* Mobile dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-3 rounded-2xl bg-black/60 ring-1 ring-white/10 backdrop-blur-md p-4 space-y-1">
              {navLinks.map((link, i) => (
                <Link key={i} to={link.href} className="block px-4 py-2 text-sm text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition">
                  {link.label}
                </Link>
              ))}
              <hr className="border-white/10 my-2" />
              <Link to={secondaryButtonHref} className="block px-4 py-2 text-sm text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition">
                Sign In
              </Link>
              <Link to={primaryButtonHref} className="block px-4 py-2 text-sm font-semibold text-indigo-300 hover:text-white rounded-xl hover:bg-indigo-500/20 transition">
                Create Free Account →
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* ── HERO CONTENT ── */}
      <div className="z-10 relative">
        <div className="sm:pt-28 md:pt-32 lg:pt-40 max-w-7xl mx-auto pt-28 px-6 pb-16">
          <div className="mx-auto max-w-3xl text-center">

            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-white/10 px-2.5 py-2 ring-1 ring-white/15 backdrop-blur animate-fade-slide-in-1">
              <span className="inline-flex items-center text-xs font-semibold text-neutral-900 bg-white/90 rounded-full py-0.5 px-2.5" style={{ fontFamily: 'var(--font-sans)' }}>
                {badgeLabel}
              </span>
              <span className="text-sm font-medium text-white/90" style={{ fontFamily: 'var(--font-sans)' }}>
                {badgeText}
              </span>
            </div>

            {/* Headline — Instrument Serif large */}
            <h1
              className="sm:text-5xl md:text-6xl lg:text-7xl leading-tight text-4xl text-white tracking-tight font-normal animate-fade-slide-in-2"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {title}
              <br className="hidden sm:block" />
              {titleLine2}
            </h1>

            {/* Description */}
            <p className="sm:text-lg animate-fade-slide-in-3 text-base text-white/80 max-w-2xl mt-6 mx-auto" style={{ fontFamily: 'var(--font-sans)' }}>
              {description}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row sm:gap-4 mt-10 gap-3 items-center justify-center animate-fade-slide-in-4">
              <Link
                to={primaryButtonHref}
                className="inline-flex items-center gap-2 hover:bg-white/15 text-sm font-medium text-white bg-white/10 ring-white/15 ring-1 rounded-full py-3 px-5 transition-colors"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                {primaryButtonText}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
              <Link
                to={secondaryButtonHref}
                className="inline-flex items-center gap-2 rounded-full bg-transparent px-5 py-3 text-sm font-medium text-white/90 hover:text-white transition-colors"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                {secondaryButtonText}
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Feature highlights row */}
          <div className="mx-auto mt-24 max-w-4xl animate-fade-slide-in-2">
            <p className="text-sm text-white/50 text-center mb-6" style={{ fontFamily: 'var(--font-sans)' }}>
              Everything you need to automate your processes
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: '⚡', label: 'Visual workflow builder' },
                { icon: '📊', label: 'Real-time execution logs' },
                { icon: '🔒', label: 'Secure JWT authentication' },
              ].map((f) => (
                <div
                  key={f.label}
                  className="flex items-center gap-3 rounded-2xl bg-white/5 ring-1 ring-white/10 backdrop-blur px-5 py-4"
                >
                  <span className="text-lg">{f.icon}</span>
                  <span className="text-white/80 text-sm font-medium" style={{ fontFamily: 'var(--font-sans)' }}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ResponsiveHeroBanner
