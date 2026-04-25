// Spark AZ — System architecture diagram
import { useLocale } from "@/lib/i18n";

export function ArchitectureDiagram() {
  const { locale } = useLocale();
  const L = (en: string, es: string) => (locale === "es" ? es : en);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox="0 0 940 380"
        className="w-full min-w-[760px] h-auto"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={L("Spark AZ system architecture", "Arquitectura del sistema Spark AZ")}
      >
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L10,5 L0,10 Z" fill="hsl(var(--primary))" />
          </marker>
          <linearGradient id="g-data" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="hsl(var(--earth) / 0.18)" />
            <stop offset="1" stopColor="hsl(var(--earth) / 0.05)" />
          </linearGradient>
          <linearGradient id="g-feat" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="hsl(var(--vector) / 0.18)" />
            <stop offset="1" stopColor="hsl(var(--vector) / 0.05)" />
          </linearGradient>
          <linearGradient id="g-score" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="hsl(var(--primary) / 0.22)" />
            <stop offset="1" stopColor="hsl(var(--primary) / 0.06)" />
          </linearGradient>
          <linearGradient id="g-xai" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="hsl(var(--spark) / 0.22)" />
            <stop offset="1" stopColor="hsl(var(--spark) / 0.06)" />
          </linearGradient>
          <linearGradient id="g-hitl" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="hsl(var(--risk-elevated) / 0.22)" />
            <stop offset="1" stopColor="hsl(var(--risk-elevated) / 0.06)" />
          </linearGradient>
        </defs>

        {/* Stage 1: Data inputs */}
        <g>
          <rect x="20" y="40" width="160" height="300" rx="14" fill="url(#g-data)" stroke="hsl(var(--earth) / 0.5)" />
          <text x="100" y="64" textAnchor="middle" fontSize="11" fontWeight="700" fill="hsl(var(--earth))" letterSpacing="2">
            {L("DATA", "DATOS")}
          </text>
          {[
            L("👤 Self check-ins", "👤 Reportes propios"),
            L("🐄 Animal signs", "🐄 Signos animales"),
            L("🌫️ Env signals", "🌫️ Señales ambientales"),
            L("🌡️ Open-Meteo wx", "🌡️ Clima Open-Meteo"),
            L("💨 AQI / dust", "💨 AQI / polvo"),
            L("✈️ OpenSky arrivals", "✈️ Llegadas OpenSky"),
            L("🌍 EpiCore feed", "🌍 Feed EpiCore"),
            L("🏛️ ADHS / CDC bg", "🏛️ ADHS / CDC base"),
          ].map((label, i) => (
            <g key={i}>
              <rect x="36" y={84 + i * 30} width="128" height="22" rx="6" fill="hsl(var(--card))" stroke="hsl(var(--border))" />
              <text x="100" y={99 + i * 30} textAnchor="middle" fontSize="10" fill="hsl(var(--foreground))">
                {label}
              </text>
            </g>
          ))}
        </g>

        {/* Stage 2: Features */}
        <g>
          <rect x="210" y="80" width="160" height="220" rx="14" fill="url(#g-feat)" stroke="hsl(var(--vector) / 0.5)" />
          <text x="290" y="104" textAnchor="middle" fontSize="11" fontWeight="700" fill="hsl(var(--vector))" letterSpacing="2">
            {L("FEATURES", "CARACTERÍSTICAS")}
          </text>
          {[
            L("Symptom vectors", "Vectores de síntomas"),
            L("County aggregator", "Agregador por condado"),
            L("k-means clusters", "Clústeres k-means"),
            L("Persona modifiers", "Modificadores persona"),
            L("Chronic adjusters", "Ajustes crónicos"),
            L("Travel-import score", "Puntaje importación"),
          ].map((label, i) => (
            <g key={i}>
              <rect x="226" y={124 + i * 28} width="128" height="22" rx="6" fill="hsl(var(--card))" stroke="hsl(var(--border))" />
              <text x="290" y={139 + i * 28} textAnchor="middle" fontSize="10" fill="hsl(var(--foreground))">
                {label}
              </text>
            </g>
          ))}
        </g>

        {/* Stage 3: Scoring */}
        <g>
          <rect x="400" y="100" width="160" height="180" rx="14" fill="url(#g-score)" stroke="hsl(var(--primary) / 0.55)" />
          <text x="480" y="124" textAnchor="middle" fontSize="11" fontWeight="700" fill="hsl(var(--primary))" letterSpacing="2">
            {L("SCORE v0.1", "PUNTAJE v0.1")}
          </text>
          <text x="480" y="156" textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))" fontWeight="600">
            Human · 0.45
          </text>
          <text x="480" y="174" textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))" fontWeight="600">
            Animal · 0.20
          </text>
          <text x="480" y="192" textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))" fontWeight="600">
            Vector · 0.15
          </text>
          <text x="480" y="210" textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))" fontWeight="600">
            Env · 0.20
          </text>
          <line x1="430" y1="226" x2="530" y2="226" stroke="hsl(var(--border))" strokeWidth="1" />
          <text x="480" y="250" textAnchor="middle" fontSize="13" fill="hsl(var(--primary))" fontWeight="700">
            {L("Composite 0–100", "Compuesto 0–100")}
          </text>
          <text x="480" y="266" textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">
            Low · Mod · Elev · High
          </text>
        </g>

        {/* Stage 4: XAI + AI narrative */}
        <g>
          <rect x="590" y="80" width="160" height="220" rx="14" fill="url(#g-xai)" stroke="hsl(var(--spark) / 0.55)" />
          <text x="670" y="104" textAnchor="middle" fontSize="11" fontWeight="700" fill="hsl(var(--spark))" letterSpacing="2">
            {L("EXPLAIN", "EXPLICAR")}
          </text>
          {[
            L("Driver bars (XAI)", "Barras de impulsores"),
            L("Per-driver tooltips", "Tooltips por impulsor"),
            L("Sub-score grid", "Cuadrícula de sub-puntajes"),
            L("Gemini 2.5 narrative", "Narrativa Gemini 2.5"),
            L("EN / ES bilingual", "Bilingüe EN / ES"),
            L("Source citations", "Citas de fuentes"),
          ].map((label, i) => (
            <g key={i}>
              <rect x="606" y={124 + i * 28} width="128" height="22" rx="6" fill="hsl(var(--card))" stroke="hsl(var(--border))" />
              <text x="670" y={139 + i * 28} textAnchor="middle" fontSize="10" fill="hsl(var(--foreground))">
                {label}
              </text>
            </g>
          ))}
        </g>

        {/* Stage 5: HITL */}
        <g>
          <rect x="780" y="100" width="140" height="180" rx="14" fill="url(#g-hitl)" stroke="hsl(var(--risk-elevated) / 0.55)" />
          <text x="850" y="124" textAnchor="middle" fontSize="11" fontWeight="700" fill="hsl(var(--risk-elevated))" letterSpacing="2">
            HITL
          </text>
          {[
            L("Pending alert", "Alerta pendiente"),
            L("Analyst review", "Revisión analista"),
            L("Approve / Edit", "Aprobar / Editar"),
            L("Reject", "Rechazar"),
            L("Audit log", "Registro de auditoría"),
            L("→ Public", "→ Público"),
          ].map((label, i) => (
            <g key={i}>
              <rect x="794" y={140 + i * 22} width="112" height="18" rx="5" fill="hsl(var(--card))" stroke="hsl(var(--border))" />
              <text x="850" y={153 + i * 22} textAnchor="middle" fontSize="10" fill="hsl(var(--foreground))">
                {label}
              </text>
            </g>
          ))}
        </g>

        {/* Arrows */}
        <g stroke="hsl(var(--primary))" strokeWidth="1.6" fill="none" markerEnd="url(#arrow)">
          <line x1="180" y1="190" x2="208" y2="190" />
          <line x1="370" y1="190" x2="398" y2="190" />
          <line x1="560" y1="190" x2="588" y2="190" />
          <line x1="750" y1="190" x2="778" y2="190" />
        </g>

        {/* Footer caption */}
        <text x="470" y="370" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">
          {L(
            "Open data + crowd signals → features → composite score → explanation → human review → public alert",
            "Datos abiertos + señales ciudadanas → características → puntaje → explicación → revisión humana → alerta pública"
          )}
        </text>
      </svg>
    </div>
  );
}
