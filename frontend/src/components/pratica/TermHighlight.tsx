import { useMemo } from 'react';

function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Divide o texto em palavras/separadores, marcando as que batem com algum
 * token da pergunta. Reusa o mesmo `tokenize` do pipeline mock — os termos
 * já chegam normalizados e sem stopwords. */
function buildHighlight(text: string, questionTokens: string[]) {
  const tokenSet = new Set(questionTokens);
  const parts = text.split(/(\p{L}+)/u);
  const matched = new Set<string>();

  const nodes = parts.map((part, i) => {
    const normalized = normalizeWord(part);
    if (normalized && tokenSet.has(normalized)) {
      matched.add(normalized);
      return (
        <mark key={i} className="rounded bg-amber-400/25 px-0.5 text-amber-200">
          {part}
        </mark>
      );
    }
    return part;
  });

  return { nodes, matchCount: matched.size };
}

export default function TermHighlight({
  text,
  questionTokens,
  className,
  showBadge = true,
}: {
  text: string;
  questionTokens: string[];
  className?: string;
  showBadge?: boolean;
}) {
  const { nodes, matchCount } = useMemo(
    () => buildHighlight(text, questionTokens),
    [text, questionTokens],
  );

  return (
    <div className={className}>
      <p className="leading-relaxed">{nodes}</p>
      {showBadge && (
        <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wide text-amber-400/80">
          {matchCount} termo{matchCount !== 1 ? 's' : ''} da pergunta encontrado{matchCount !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
