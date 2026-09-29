import { MissionCard } from './MissionParts';
import ParamsExplorer from './ParamsExplorer';

/** Bônus: sem pontos, só exploração dos parâmetros do pipeline. */
export default function ParamsMission({ question }: { question: string }) {
  return (
    <div className="space-y-4">
      <MissionCard
        role="a pessoa que configura o pipeline"
        fn="configurar(top_k, manter) → resultados"
        receive={
          <>
            a pergunta <strong>"{question}"</strong> e dois botões que normalmente ficam fixos no código
          </>
        }
        task="Mexa no Top-K (quantos documentos a busca traz) e no “manter” (quantos o reranker deixa passar) e observe o que muda."
        scoring="Sem pontos — é um bônus para explorar. Pergunte-se: o que acontece com K muito pequeno? E muito grande?"
      />
      <ParamsExplorer question={question} />
    </div>
  );
}
