import { useState } from 'react';
import { FileText, Database } from 'lucide-react';
import { documents, UNIVERSITY_NAME } from '../data/documents';
import { mockVectorStore } from '../lib/mockRag';
import { Badge, Explainer, CodeBlock } from '../components/ui';

export default function BaseConhecimento() {
  const [tab, setTab] = useState<'documentos' | 'vetorial'>('documentos');
  const [openDoc, setOpenDoc] = useState<string | null>(null);
  const vectorRecords = mockVectorStore();

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-center text-3xl font-bold text-white">Base de Conhecimento</h1>
      <p className="mb-8 text-center text-slate-400">
        Documentos fictícios do {UNIVERSITY_NAME}, usados como base para as respostas do RAG.
      </p>

      <div className="mx-auto mb-8 flex w-fit rounded-lg border border-white/10 bg-navy-800/50 p-1">
        <button
          onClick={() => setTab('documentos')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'documentos' ? 'bg-blue-primary text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="h-4 w-4" /> Documentos
        </button>
        <button
          onClick={() => setTab('vetorial')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'vetorial' ? 'bg-blue-primary text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="h-4 w-4" /> Banco Vetorial
        </button>
      </div>

      {tab === 'documentos' && (
        <div className="space-y-2.5">
          {documents.map((doc) => (
            <div key={doc.id} className="overflow-hidden rounded-lg border border-white/10 bg-navy-800/60">
              <button
                onClick={() => setOpenDoc(openDoc === doc.id ? null : doc.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/[0.03]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-slate-500">#{doc.id}</span>
                    <span className="font-medium text-white">{doc.title}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{doc.filename}</p>
                </div>
                <Badge tone="neutral">{doc.category}</Badge>
              </button>
              {openDoc === doc.id && (
                <div className="fade-in-up space-y-3 border-t border-white/5 px-4 py-4">
                  <p className="text-sm leading-relaxed text-slate-300">{doc.content}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {doc.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'vetorial' && (
        <div className="space-y-5">
          <Explainer>
            O banco vetorial armazena representações numéricas dos documentos e permite
            realizar buscas por similaridade.
          </Explainer>
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-navy-800/60 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Documento</th>
                  <th className="px-4 py-3">Vector (preview)</th>
                  <th className="px-4 py-3">Dimensão</th>
                  <th className="px-4 py-3">Categoria</th>
                </tr>
              </thead>
              <tbody>
                {vectorRecords.map((rec) => (
                  <tr key={rec.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono text-slate-400">{rec.id}</td>
                    <td className="px-4 py-3 text-slate-200">{rec.filename}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      [{rec.vectorPreview.map((v) => v.toFixed(2)).join(', ')}, …]
                    </td>
                    <td className="px-4 py-3 text-slate-400">{rec.dimensions}</td>
                    <td className="px-4 py-3">
                      <Badge tone="neutral">{rec.category}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <p className="mb-1.5 text-xs uppercase tracking-wide text-slate-500">
              Exemplo de registro completo
            </p>
            <CodeBlock>
{`ID: ${vectorRecords[0].id}
Documento: ${vectorRecords[0].filename}
Vector: [${vectorRecords[0].vectorPreview.map((v) => v.toFixed(2)).join(', ')}, ...]
Dimensão: ${vectorRecords[0].dimensions}
Categoria: ${vectorRecords[0].category}`}
            </CodeBlock>
          </div>
        </div>
      )}
    </div>
  );
}
