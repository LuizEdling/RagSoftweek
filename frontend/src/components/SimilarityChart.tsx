import type { RetrievalItem } from '../types/rag';

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

interface Props {
  question: string;
  items: RetrievalItem[];
}

// Projeção 2D puramente didática: documentos mais similares à pergunta
// aparecem mais próximos do ponto da pergunta. Não representa o espaço
// vetorial real de 768 dimensões.
export default function SimilarityChart({ question, items }: Props) {
  const width = 480;
  const height = 300;
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.min(width, height) / 2 - 40;

  const points = items.map((item, idx) => {
    const angle = ((hashString(item.filename) % 360) * Math.PI) / 180;
    const distance = (1 - item.similarity) * maxRadius + 18;
    const x = cx + Math.cos(angle + idx) * distance;
    const y = cy + Math.sin(angle + idx) * distance;
    return { ...item, x, y };
  });

  return (
    <div className="rounded-lg border border-white/10 bg-navy-950/60 p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {points.map((p) => (
          <line
            key={`line-${p.documentId}`}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="rgba(77,123,255,0.25)"
            strokeWidth={1}
          />
        ))}

        {points.map((p) => (
          <g key={p.documentId}>
            <circle cx={p.x} cy={p.y} r={7} fill="#4d7bff" stroke="#0a0d1f" strokeWidth={2} />
            <text
              x={p.x}
              y={p.y - 12}
              textAnchor="middle"
              fontSize={11}
              fill="#a3b3e0"
              fontFamily="var(--font-mono)"
            >
              {p.filename}
            </text>
          </g>
        ))}

        <circle cx={cx} cy={cy} r={9} fill="#0049ff" stroke="white" strokeWidth={2} />
        <text
          x={cx}
          y={cy + 24}
          textAnchor="middle"
          fontSize={12}
          fontWeight={600}
          fill="white"
        >
          pergunta
        </text>
      </svg>
      <p className="mt-2 text-center text-xs text-slate-500" title={question}>
        Projeção 2D ilustrativa — não representa o espaço vetorial real de 768 dimensões.
      </p>
    </div>
  );
}
