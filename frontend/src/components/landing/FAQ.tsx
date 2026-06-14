'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  { q: '¿Qué es $FUEL?', a: '$FUEL es el token de utilidad ERC-20 de FuelLink desplegado en Polygon PoS. Se obtiene como recompensa al consumir combustible en estaciones afiliadas, al comprarlo directamente en la DApp, o mediante staking. Tiene un suministro fijo de 12,752,901,000 tokens.' },
  { q: '¿Cómo gano $FUEL consumiendo combustible?', a: 'Al recargar en una estación afiliada, el control volumétrico off-chain registra tu consumo. Ese dato se tokeniza on-chain y recibes $FUEL automáticamente en tu wallet conectada. A más consumo, más tokens y mayor nivel de tier.' },
  { q: '¿Qué es una STO y cómo invierto?', a: 'Una STO (Security Token Offering) es la tokenización de una gasolinera real. Compras fracciones con USDT/$FUEL y recibes rendimientos en USDT proporcionales a la operación de la estación. Es inversión fraccionada en activos reales (RWA).' },
  { q: '¿Qué diferencia hay entre $FUEL y $FUELx?', a: '$FUEL es el token de utilidad circulante. $FUELx se obtiene al hacer staking de $FUEL: representa tu poder de gobernanza en la DAO. A más tiempo bloqueado y más cantidad, más $FUELx y mayor influencia en las decisiones del protocolo.' },
  { q: '¿En qué red blockchain opera FuelLink?', a: 'FuelLink opera en Polygon PoS, elegida por sus bajas comisiones de transacción (fracciones de centavo), alta velocidad de confirmación (~2 segundos) y amplia adopción en DeFi. Esto garantiza que los usuarios cotidianos puedan interactuar sin costos prohibitivos.' },
  { q: '¿Es seguro el protocolo?', a: 'Los contratos inteligentes están diseñados siguiendo los estándares de OpenZeppelin y serán auditados antes del lanzamiento mainnet. La arquitectura híbrida off-chain/on-chain separa el cumplimiento regulatorio (SAT, CRE, ASEA) de la lógica tokenizada, minimizando la superficie de ataque.' },
  { q: '¿Cómo funciona la gobernanza DAO?', a: 'Los holders de $FUELx votan mediante votación cuadrática (el costo en $FUELx crece cuadráticamente para evitar concentración de poder). Cualquier holder puede proponer mejoras. Para aprobar, se requiere 75% de votos afirmativos en 7 días de debate + 7 días de votación.' },
]

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-fuel-cyan/30 bg-fuel-cyan/5 text-fuel-cyan text-xs font-semibold mb-4">
            FAQ
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-white">Preguntas frecuentes</h2>
        </motion.div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl border border-fuel-border overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/2 transition-colors"
              >
                <span className="font-medium text-white text-sm pr-4">{faq.q}</span>
                <motion.div animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-4 h-4 text-fuel-cyan flex-shrink-0" />
                </motion.div>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-4 text-sm text-slate-400 leading-relaxed border-t border-fuel-border/50 pt-3">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
