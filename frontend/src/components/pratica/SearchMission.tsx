import { useMemo, useState } from 'react';
import EmbeddingMap from './EmbeddingMap';
import type { Mark } from './EmbeddingMap';
import ScoreBanner from './ScoreBanner';
import { ActionRow, CodeReveal, DoneNote, MissionCard } from './MissionParts';
import type { MissionProps } from './MissionParts';
import { SEARCH_K, distance, nearest, pointFor, scenarioFor } from '../../data/practiceScenarios';

export default function SearchMission({ question, alreadyDone, onComplete }: MissionProps) {
  const scenario = scenarioFor(question);
  const [selected, setSelected] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);

  const truth = useMemo(() => nearest(scenario.pin, SEARCH_K), [scenario]);
  const truthFiles = truth.map((t) => t.file);
  const hits = selected.filter((f) => truthFiles.includes(f)).length;

  // Enquanto escolhe: mostra a distância só dos pontos selecionados. Depois de
  // verificar: mostra a dos K corretos e dos escolhidos.
  const distances: Record<string, number> = {};
  const shown = checked ? [...new Set([...selected, ...truthFiles])] : selected;
  for (const f of shown) distances[f] = distance(scenario.pin, pointFor(f));

  const marks: Record<string, Mark> = {};
  if (checked) {
    for (const f of selected) marks[f] = truthFiles.includes(f) ? 'hit' : 'miss';
    for (const f of truthFiles) if (!selected.includes(f)) marks[f] = 'missed';
  }

  function toggle(file: string) {
    if (checked) return;
    setSelected((prev) => {
      if (prev.includes(file)) return prev.filter((f) => f !== file);
      if (prev.length >= SEARCH_K) return prev;
      return [...prev, file];
    });
  }

  function check() {
    setChecked(true);
    onComplete(hits, SEARCH_K);
  }

  function giveUp() {
    setSelected([]);
    setChecked(true);
    onComplete(0, SEARCH_K);
  }

  function retry() {
    setSelected([]);
    setChecked(false);
  }

  return (
    <div className="space-y-4">
      <MissionCard
        role="o banco vetorial"
        fn={`buscar(vetor_da_pergunta, k=${SEARCH_K}) → os ${SEARCH_K} documentos mais próximos`}
        receive={
          <>
            a pergunta <strong>"{question}"</strong>, já convertida em coordenadas (o ponto azul do mapa)
          </>
        }
        task={`Clique nos ${SEARCH_K} documentos mais próximos do ponto azul. Os números mostram a distância de cada um.`}
        scoring={`1 ponto por documento certo (máximo ${SEARCH_K}).`}
      />
      <DoneNote show={alreadyDone && !checked} />

      <p className="text-sm text-slate-400">
        Selecionados: <strong className="text-slate-200">{selected.length}</strong>/{SEARCH_K}
      </p>

      <EmbeddingMap
        pin={scenario.pin}
        selected={selected}
        marks={marks}
        distances={distances}
        ring={
          checked
            ? { x: scenario.pin.x, y: scenario.pin.y, r: truth[SEARCH_K - 1].dist + 1.5 }
            : null
        }
        onSelect={checked ? undefined : toggle}
      />

      <ActionRow
        canCheck={selected.length === SEARCH_K}
        checked={checked}
        onCheck={check}
        onGiveUp={giveUp}
        hint={`Escolha ${SEARCH_K} documentos.`}
      />

      {checked && (
        <div className="space-y-3">
          <ScoreBanner
            score={hits}
            max={SEARCH_K}
            message={
              hits === SEARCH_K
                ? 'Perfeito! Você fez exatamente o que o banco vetorial faz: mediu distâncias e pegou os mais perto.'
                : 'O círculo verde envolve os vizinhos reais. Verde = você acertou, laranja = você perdeu, vermelho = não era vizinho.'
            }
            onRetry={retry}
          />
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Ranking real por distância
            </p>
            <ol className="space-y-0.5">
              {truth.map((t, i) => (
                <li key={t.file}>
                  {i + 1}. {t.label} <span className="font-mono text-slate-500">{t.dist.toFixed(1)}</span>
                </li>
              ))}
            </ol>
          </div>
          <p className="text-sm leading-relaxed text-slate-400">
            O <strong>K</strong> é quantos vizinhos o banco devolve. Esses {SEARCH_K} documentos são os
            candidatos — nem todos vão ajudar de verdade, e é por isso que existe a próxima etapa.
          </p>
          <CodeReveal file="backend/app/services/vector_store.py (trecho)">
            {`results = self._client.query_points(
    collection_name=self.settings.qdrant_collection,
    query=embedding,   # as coordenadas da pergunta (o ponto azul)
    limit=top_k,       # K: quantos vizinhos mais próximos devolver
).points
# o Qdrant compara o vetor com todos os documentos (similaridade de cosseno)
# e devolve os K de maior similaridade, já ordenados.`}
          </CodeReveal>
        </div>
      )}
    </div>
  );
}
