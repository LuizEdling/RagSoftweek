import { useState } from 'react';
import EmbeddingMap from './EmbeddingMap';
import ScoreBanner from './ScoreBanner';
import { ActionRow, CodeReveal, DoneNote, MissionCard } from './MissionParts';
import type { MissionProps } from './MissionParts';
import { EMBED_HIT_RADIUS, distance, nearest, scenarioFor } from '../../data/practiceScenarios';

type XY = { x: number; y: number };

export default function EmbedMission({ question, alreadyDone, onComplete }: MissionProps) {
  const scenario = scenarioFor(question);
  const [pin, setPin] = useState<XY | null>(null);
  const [checked, setChecked] = useState(false);

  const dist = pin ? distance(pin, scenario.pin) : null;
  const hit = dist !== null && dist <= EMBED_HIT_RADIUS;
  const yourNear = pin ? nearest(pin, 2).map((n) => n.label) : [];
  const realNear = nearest(scenario.pin, 2).map((n) => n.label);

  function check() {
    if (!pin) return;
    setChecked(true);
    onComplete(hit ? 1 : 0, 1);
  }

  function giveUp() {
    setPin(null);
    setChecked(true);
    onComplete(0, 1);
  }

  function retry() {
    setPin(null);
    setChecked(false);
  }

  return (
    <div className="space-y-4">
      <MissionCard
        role="o modelo de embeddings"
        fn="embed(texto) → coordenadas"
        receive={<>a pergunta <strong>"{question}"</strong></>}
        task="Clique no mapa para colocar a pergunta perto dos documentos que falam do mesmo assunto que ela. Os nomes dos documentos ficam escondidos até você verificar — só as regiões por assunto aparecem como pista."
        scoring="1 ponto se a pergunta cair dentro da zona verde da posição real."
      />
      <DoneNote show={alreadyDone && !checked} />

      <p className="text-sm text-slate-400">
        {pin ? 'Pronto! Pode clicar de novo para mover a pergunta.' : 'Clique em qualquer ponto do mapa.'}
      </p>

      <EmbeddingMap
        pin={pin}
        truthPin={checked ? scenario.pin : null}
        truthRadius={checked ? EMBED_HIT_RADIUS : undefined}
        onPlace={checked ? undefined : (x, y) => setPin({ x, y })}
        hideDocLabels={!checked}
      />

      <ActionRow
        canCheck={pin !== null}
        checked={checked}
        onCheck={check}
        onGiveUp={giveUp}
        hint="Coloque a pergunta no mapa primeiro."
      />

      {checked && (
        <div className="space-y-3">
          <ScoreBanner
            score={hit ? 1 : 0}
            max={1}
            message={
              pin === null
                ? `A pergunta cai perto de ${realNear.join(' e ')}: são os documentos que falam do mesmo assunto.`
                : hit
                  ? `Acertou! A pergunta cai perto de ${realNear.join(' e ')} — o mesmo assunto.`
                  : `Ficou longe: a sua posição está mais perto de ${yourNear.join(' e ')}. A real fica perto de ${realNear.join(' e ')}.`
            }
            onRetry={retry}
          />
          <p className="text-sm leading-relaxed text-slate-400">
            Foi isso que o embedding fez: transformou texto em <strong>coordenadas</strong>, e textos com
            significado parecido ficam perto. No RAG real são 768 números em vez de 2 — mas a ideia é
            a mesma.
          </p>
          <CodeReveal file="backend/app/services/embedding_service.py (trecho)">
            {`def embed(self, text: str) -> list[float]:
    # manda o texto para o modelo de embeddings (Cohere, OpenAI...)
    resp = httpx.post(url, json={"texts": [text], ...})
    # e recebe de volta os números: as "coordenadas" do texto
    return resp.json()["embeddings"][0]   # ex.: [0.47, -0.48, ..., 0.95]  (768 valores)`}
          </CodeReveal>
        </div>
      )}
    </div>
  );
}
