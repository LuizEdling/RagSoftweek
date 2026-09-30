import { CLUSTERS, MAP_POINTS } from '../../data/practiceScenarios';

export type Mark = 'hit' | 'miss' | 'missed';

interface XY {
  x: number;
  y: number;
}

const MARK_COLOR: Record<Mark, string> = {
  hit: '#22c55e',
  miss: '#ef4444',
  missed: '#f59e0b',
};

function Star({ x, y, r, fill }: XY & { r: number; fill: string }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    return `${(x + rad * Math.cos(angle)).toFixed(2)},${(y + rad * Math.sin(angle)).toFixed(2)}`;
  }).join(' ');
  return <polygon points={pts} fill={fill} stroke="#fff" strokeWidth={0.4} />;
}

/** Mapa 2D dos documentos: versão didática dos embeddings, onde "significado
 * parecido" vira "pontos próximos". */
export default function EmbeddingMap({
  pin,
  pinLabel = 'pergunta',
  truthPin,
  truthRadius,
  ring,
  selected = [],
  marks = {},
  distances = {},
  onSelect,
  onPlace,
}: {
  /** Ponto da pergunta (do aluno, ou o "real" quando fixo). */
  pin?: XY | null;
  pinLabel?: string;
  /** Posição real do embedding, mostrada depois de verificar. */
  truthPin?: XY | null;
  truthRadius?: number;
  /** Círculo que envolve os K vizinhos mais próximos. */
  ring?: { x: number; y: number; r: number } | null;
  selected?: string[];
  marks?: Record<string, Mark>;
  distances?: Record<string, number>;
  onSelect?: (file: string) => void;
  onPlace?: (x: number, y: number) => void;
}) {
  function handlePlace(e: React.MouseEvent<SVGSVGElement>) {
    if (!onPlace) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onPlace(Math.max(2, Math.min(98, x)), Math.max(2, Math.min(98, y)));
  }

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label="Mapa dos documentos: quanto mais perto no mapa, mais parecido o significado"
      onClick={handlePlace}
      className={`mx-auto block w-full max-w-[560px] select-none rounded-xl border border-white/10 bg-navy-950/70 ${
        onPlace ? 'cursor-crosshair' : ''
      }`}
    >
      {/* grade sutil, para lembrar que são coordenadas */}
      {[20, 40, 60, 80].map((v) => (
        <g key={v} stroke="#ffffff" strokeOpacity={0.04} strokeWidth={0.3}>
          <line x1={v} y1={0} x2={v} y2={100} />
          <line x1={0} y1={v} x2={100} y2={v} />
        </g>
      ))}

      {/* regiões por assunto */}
      {CLUSTERS.map((c) => {
        const pts = MAP_POINTS.filter((p) => p.cluster === c.id);
        const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
        const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
        const r = Math.max(...pts.map((p) => Math.hypot(p.x - cx, p.y - cy))) + 9;
        return (
          <g key={c.id}>
            <circle cx={cx} cy={cy} r={r} fill={c.color} fillOpacity={0.06} />
            <text
              x={c.x}
              y={c.y}
              textAnchor="middle"
              fontSize={2.6}
              fontWeight={600}
              fill={c.color}
              fillOpacity={0.85}
              style={{ pointerEvents: 'none' }}
            >
              {c.label}
            </text>
          </g>
        );
      })}

      {ring && (
        <circle
          cx={ring.x}
          cy={ring.y}
          r={ring.r}
          fill="#22c55e"
          fillOpacity={0.07}
          stroke="#22c55e"
          strokeOpacity={0.6}
          strokeWidth={0.4}
          strokeDasharray="1.5 1"
        />
      )}
      {truthPin && truthRadius && (
        <circle
          cx={truthPin.x}
          cy={truthPin.y}
          r={truthRadius}
          fill="#22c55e"
          fillOpacity={0.07}
          stroke="#22c55e"
          strokeOpacity={0.6}
          strokeWidth={0.4}
          strokeDasharray="1.5 1"
        />
      )}
      {pin && truthPin && (
        <line
          x1={pin.x}
          y1={pin.y}
          x2={truthPin.x}
          y2={truthPin.y}
          stroke="#f59e0b"
          strokeWidth={0.5}
          strokeDasharray="1.2 1"
        />
      )}

      {/* linhas de distância dos selecionados até a pergunta */}
      {pin &&
        MAP_POINTS.filter((p) => selected.includes(p.file) || distances[p.file] !== undefined).map(
          (p) => (
            <line
              key={`l-${p.file}`}
              x1={pin.x}
              y1={pin.y}
              x2={p.x}
              y2={p.y}
              stroke="#7ea0ff"
              strokeOpacity={0.45}
              strokeWidth={0.35}
              strokeDasharray="1 1"
            />
          ),
        )}

      {/* documentos */}
      {MAP_POINTS.map((p) => {
        const cluster = CLUSTERS.find((c) => c.id === p.cluster)!;
        const isSelected = selected.includes(p.file);
        const mark = marks[p.file];
        const d = distances[p.file];
        const interactive = Boolean(onSelect);
        return (
          <g
            key={p.file}
            onClick={(e) => {
              if (!onSelect) return;
              e.stopPropagation();
              onSelect(p.file);
            }}
            onKeyDown={(e) => {
              if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onSelect(p.file);
              }
            }}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={interactive ? `${isSelected ? 'Desmarcar' : 'Marcar'} ${p.label}` : undefined}
            aria-pressed={interactive ? isSelected : undefined}
            style={{ cursor: interactive ? 'pointer' : undefined, outline: 'none' }}
          >
            <circle cx={p.x} cy={p.y} r={4.2} fill="transparent" />
            {(isSelected || mark) && (
              <circle
                cx={p.x}
                cy={p.y}
                r={3.3}
                fill="none"
                stroke={mark ? MARK_COLOR[mark] : '#ffffff'}
                strokeWidth={0.7}
                strokeDasharray={mark === 'missed' ? '1 0.8' : undefined}
              />
            )}
            <circle cx={p.x} cy={p.y} r={1.9} fill={cluster.color} />
            <text
              x={p.x}
              y={p.y + 5.6}
              textAnchor="middle"
              fontSize={2.5}
              fill="#cbd5e1"
              style={{ pointerEvents: 'none' }}
            >
              {p.label}
            </text>
            {d !== undefined && (
              <text
                x={p.x}
                y={p.y - 3.8}
                textAnchor="middle"
                fontSize={2.6}
                fontWeight={700}
                fill="#7ea0ff"
                style={{ pointerEvents: 'none' }}
              >
                {d.toFixed(1)}
              </text>
            )}
          </g>
        );
      })}

      {truthPin && <Star x={truthPin.x} y={truthPin.y} r={3.4} fill="#22c55e" />}
      {truthPin && (
        <text
          x={truthPin.x}
          y={truthPin.y - 4.6}
          textAnchor="middle"
          fontSize={2.6}
          fontWeight={700}
          fill="#22c55e"
          stroke="#05060f"
          strokeWidth={1}
          paintOrder="stroke"
          style={{ pointerEvents: 'none' }}
        >
          posição real
        </text>
      )}
      {pin && (
        <g style={{ pointerEvents: 'none' }}>
          <circle cx={pin.x} cy={pin.y} r={2.6} fill="#0049ff" stroke="#fff" strokeWidth={0.6} />
          <text
            x={pin.x}
            y={pin.y + 6.2}
            textAnchor="middle"
            fontSize={2.7}
            fontWeight={700}
            fill="#ffffff"
            stroke="#05060f"
            strokeWidth={1}
            paintOrder="stroke"
          >
            {pinLabel}
          </text>
        </g>
      )}
    </svg>
  );
}
