import { useState } from 'react'
import { Link } from 'react-router-dom'

const ResponsiveHeroBanner = ({
  backgroundImageUrl = '/a.png',
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
      {/* Full-screen background */}
      <img
        src={backgroundImageUrl}
        alt=""
        className="w-full h-full object-cover absolute top-0 right-0 bottom-0 left-0"
      />
      {/* Dark overlay */}
      <div className="pointer-events-none absolute inset-0 bg-black/55" />
      <div className="pointer-events-none absolute inset-0 ring-1 ring-black/30" />

      {/* ── HEADER ── */}
      <header className="z-10 relative">
        <div className="mx-6">
          <div className="flex items-center justify-between pt-5">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo.png" className="w-8 h-8 rounded-lg object-cover shadow-lg shadow-orange-500/40" alt="Logo" />
              <span className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: 'var(--font-sans)' }}>FlowForge</span>
            </Link>

            {/* Desktop nav pill — matches reference exactly */}
            <nav className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-white/5 px-1 py-1 ring-1 ring-white/10 backdrop-blur">
                {navLinks.map((link, index) => (
                  <Link
                    key={index}
                    to={link.href}
                    className={`px-3 py-2 text-sm font-medium hover:text-white transition-colors ${link.isActive ? 'text-white/90' : 'text-white/70'}`}
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  to={ctaButtonHref}
                  className="ml-1 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-neutral-900 hover:bg-orange-50 transition-colors"
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
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 5h16" /><path d="M4 12h16" /><path d="M4 19h16" />
              </svg>
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-3 rounded-2xl bg-black/70 ring-1 ring-white/10 backdrop-blur-md p-4 space-y-1">
              {navLinks.map((link, i) => (
                <Link key={i} to={link.href} className="block px-4 py-2 text-sm text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition">
                  {link.label}
                </Link>
              ))}
              <hr className="border-white/10 my-2" />
              <Link to={secondaryButtonHref} className="block px-4 py-2 text-sm text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition">Sign In</Link>
              <Link to={primaryButtonHref} className="block px-4 py-2 text-sm font-semibold text-orange-400 hover:text-white rounded-xl hover:bg-orange-500/20 transition">Get Started →</Link>
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
              <span className="inline-flex items-center text-xs font-semibold text-neutral-900 bg-white/90 rounded-full py-0.5 px-2" style={{ fontFamily: 'var(--font-sans)' }}>
                {badgeLabel}
              </span>
              <span className="text-sm font-medium text-white/90" style={{ fontFamily: 'var(--font-sans)' }}>
                {badgeText}
              </span>
            </div>

            {/* Headline — Instrument Serif, large */}
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

            {/* CTA Buttons — match reference */}
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
                  <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Feature pills */}
          <div className="mx-auto mt-20 max-w-3xl animate-fade-slide-in-2">
            <p className="text-xs text-white/40 text-center mb-2 uppercase tracking-widest" style={{ fontFamily: 'var(--font-sans)' }}>
              Everything you need to automate
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { icon: '⚡', label: 'Visual workflow builder' },
                { icon: '📊', label: 'Real-time execution logs' },
                { icon: '🔒', label: 'Secure JWT authentication' },
                { icon: '🔌', label: 'API & webhook support' },
              ].map((f) => (
                <div
                  key={f.label}
                  className="flex items-center gap-2 rounded-full bg-white/5 ring-1 ring-white/10 backdrop-blur px-4 py-2"
                >
                  <span className="text-sm">{f.icon}</span>
                  <span className="text-white/70 text-[13px] font-medium" style={{ fontFamily: 'var(--font-sans)' }}>{f.label}</span>
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
