import { Zap } from 'lucide-react'

const LINKS = {
  Protocolo: ['Whitepaper', 'Tokenomics', 'Roadmap', 'Auditoría'],
  DApp:      ['Dashboard', 'Staking', 'Inversiones', 'Gobernanza'],
  Empresa:   ['Equipo', 'Partners', 'Legal', 'Contacto'],
  Comunidad: ['Telegram', 'Discord', 'Twitter/X', 'Blog'],
}

export function Footer() {
  return (
    <footer className="border-t border-fuel-border bg-fuel-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-fuel-cyan/10 border border-fuel-cyan/30 flex items-center justify-center">
                <Zap className="w-4 h-4 text-fuel-cyan" />
              </div>
              <span className="font-display font-bold text-white">fuel<span className="text-fuel-cyan">Link</span></span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Tokenizando el consumo de combustible y democratizando la inversión en estaciones de servicio.
            </p>
            <div className="text-xs text-slate-600 font-mono">$FUEL · Polygon PoS</div>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([section, items]) => (
            <div key={section}>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">{section}</h4>
              <ul className="space-y-2">
                {items.map(item => (
                  <li key={item}>
                    <a href="#" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-fuel-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">© 2026 FuelLink INC. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            {['Política de privacidad', 'Términos de uso', 'Disclaimer'].map(t => (
              <a key={t} href="#" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">{t}</a>
            ))}
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-700 text-center max-w-2xl mx-auto">
          Este sitio no constituye asesoramiento financiero. Los tokens digitales implican riesgos. Consulte asesoría profesional antes de invertir.
        </p>
      </div>
    </footer>
  )
}
