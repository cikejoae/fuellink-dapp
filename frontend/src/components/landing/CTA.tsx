'use client'
import { motion } from 'framer-motion'
import { ArrowRight, Fuel } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function CTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-fuel-cyan/8 via-fuel-purple/8 to-fuel-orange/8" />
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-50" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass rounded-3xl p-12 border border-fuel-cyan/20"
        >
          <div className="w-16 h-16 rounded-2xl bg-fuel-cyan/10 border border-fuel-cyan/30 flex items-center justify-center mx-auto mb-6">
            <Fuel className="w-8 h-8 text-fuel-cyan" />
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
            every drop <span className="gradient-text">counts</span>
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
            Únete al protocolo que convierte cada litro de combustible en oportunidad financiera. Preventa activa.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="primary" size="lg" href="/dapp">
              Abrir DApp <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="secondary" size="lg" href="#tokenomics">
              Ver Tokenomics
            </Button>
          </div>
          <p className="mt-6 text-xs text-slate-600">
            Precio de preventa: <span className="text-fuel-cyan font-semibold">$0.0010 USD/FUEL</span> · Red: Polygon PoS
          </p>
        </motion.div>
      </div>
    </section>
  )
}
