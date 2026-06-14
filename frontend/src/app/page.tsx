import { Navbar }      from '@/components/ui/Navbar'
import { Hero }        from '@/components/landing/Hero'
import { Problem }     from '@/components/landing/Problem'
import { HowItWorks }  from '@/components/landing/HowItWorks'
import { Tokenomics }  from '@/components/landing/Tokenomics'
import { Roadmap }     from '@/components/landing/Roadmap'
import { Team }        from '@/components/landing/Team'
import { FAQ }         from '@/components/landing/FAQ'
import { CTA }         from '@/components/landing/CTA'
import { Footer }      from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-fuel-bg">
      <Navbar />
      <Hero />
      <Problem />
      <HowItWorks />
      <Tokenomics />
      <Roadmap />
      <Team />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  )
}
