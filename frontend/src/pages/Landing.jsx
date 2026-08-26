import ResponsiveHeroBanner from '../components/ui/responsive-hero-banner'

export default function Landing() {
  return (
    <ResponsiveHeroBanner
      backgroundImageUrl="/hero-bg.jpg"
      badgeLabel="Beta"
      badgeText="Visual workflow automation for everyone"
      title="Automate Your"
      titleLine2="Workflows Visually"
      description="Connect apps, trigger actions, and build powerful automations — all without writing a single line of code."
      primaryButtonText="Create Free Account"
      primaryButtonHref="/register"
      secondaryButtonText="Sign In"
      secondaryButtonHref="/login"
      ctaButtonText="Get Started"
      ctaButtonHref="/register"
      navLinks={[
        { label: 'Home', href: '/', isActive: true },
        { label: 'Features', href: '#features' },
        { label: 'Docs', href: '#' },
      ]}
    />
  )
}
