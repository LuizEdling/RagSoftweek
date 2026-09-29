// Valida os dados autorados do Modo Prática (rodar com `npm run validate:practice`).
import { documents } from '../src/data/documents';
import { SUGGESTED_QUESTIONS, mockKeywordSearch, tokenize } from '../src/lib/mockRag';
import {
  DUEL_ROUNDS,
  MAP_POINTS,
  SCENARIOS,
  SEARCH_K,
  distance,
  nearest,
  pointFor,
} from '../src/data/practiceScenarios';

const errors: string[] = [];
const fail = (msg: string) => errors.push(msg);
const sentencesOf = (content: string) => content.split('. ');

// 1. perguntas
if (SCENARIOS.map((s) => s.question).join('|') !== SUGGESTED_QUESTIONS.join('|')) {
  fail('SCENARIOS não corresponde a SUGGESTED_QUESTIONS (mesma ordem e texto).');
}

// 2. mapa
const files = new Set(documents.map((d) => d.filename));
for (const p of MAP_POINTS) if (!files.has(p.file)) fail(`Ponto sem documento: ${p.file}`);
for (const f of files) if (!MAP_POINTS.some((p) => p.file === f)) fail(`Documento sem ponto: ${f}`);
let minGap = Infinity;
for (const a of MAP_POINTS)
  for (const b of MAP_POINTS) if (a !== b) minGap = Math.min(minGap, distance(a, b));
console.log(`menor distância entre dois pontos do mapa: ${minGap.toFixed(1)}`);
if (minGap < 9) fail(`Pontos muito próximos no mapa (${minGap.toFixed(1)} < 9): rótulos vão se sobrepor.`);

// 3. cenários
for (const s of SCENARIOS) {
  const tag = `[${s.question}]`;
  const near = nearest(s.pin, SEARCH_K + 1);
  const top = near.slice(0, SEARCH_K).map((n) => n.file).sort().join(',');
  const want = s.retrieved.map((r) => r.file).sort().join(',');
  const margin = near[SEARCH_K].dist - near[SEARCH_K - 1].dist;
  console.log(
    `${tag} ${near.map((n) => `${n.label} ${n.dist.toFixed(1)}`).join(' | ')} (margem ${margin.toFixed(1)})`,
  );
  if (top !== want) fail(`${tag} os ${SEARCH_K} mais próximos no mapa (${top}) ≠ retrieved (${want}).`);
  if (margin < 3) fail(`${tag} margem entre o ${SEARCH_K}º e o ${SEARCH_K + 1}º é ${margin.toFixed(1)} (< 3).`);
  if (s.retrieved.length !== SEARCH_K) fail(`${tag} retrieved deve ter ${SEARCH_K} itens.`);
  if (s.retrieved.filter((r) => r.verdict === 'answers').length !== 1) fail(`${tag} precisa de exatamente 1 "answers".`);
  if (s.retrieved.find((r) => r.file === s.answerFile)?.verdict !== 'answers') fail(`${tag} answerFile não é o "answers".`);

  const doc = documents.find((d) => d.filename === s.answerFile);
  if (!doc) { fail(`${tag} answerFile inexistente.`); continue; }
  const sents = sentencesOf(doc.content);
  if (sents.length !== s.contextWhy.length) fail(`${tag} contextWhy tem ${s.contextWhy.length} itens, documento tem ${sents.length} frases.`);
  for (const i of s.contextKeep) if (i < 0 || i >= sents.length) fail(`${tag} contextKeep fora do intervalo.`);
  s.contextWhy.forEach((w, i) => {
    const keep = s.contextKeep.includes(i);
    if (keep !== w.startsWith('Essencial')) fail(`${tag} contextWhy[${i}] ("${w.slice(0, 30)}…") não bate com contextKeep.`);
  });
  if (s.llmOptions.length !== 3 || s.llmOptions.filter((o) => o.correct).length !== 1) fail(`${tag} llmOptions precisa de 3 opções, 1 correta.`);
  if (doc.content.includes(s.invented.text)) fail(`${tag} a frase inventada aparece no documento!`);
  for (const r of s.retrieved) if (!files.has(r.file)) fail(`${tag} retrieved com arquivo inexistente: ${r.file}`);
}

// 4. duelo
for (const [i, r] of DUEL_ROUNDS.entries()) {
  const tag = `[duelo ${i + 1}]`;
  const all = [r.target, ...r.distractors];
  if (new Set(all).size !== 4) fail(`${tag} documentos repetidos.`);
  for (const f of all) if (!files.has(f)) fail(`${tag} arquivo inexistente: ${f}`);
  const robot = mockKeywordSearch(r.question, 1)[0];
  const tgt = documents.find((d) => d.filename === r.target)!;
  const shared = tokenize(r.question).filter((t) => new Set(tokenize(tgt.title + ' ' + tgt.content + ' ' + tgt.tags.join(' '))).has(t));
  console.log(`${tag} robô escolhe: ${robot ? robot.filename : '(nada)'}; palavras em comum com o alvo: ${shared.join(', ') || '(nenhuma)'}`);
  if (robot?.filename === r.target) fail(`${tag} o robô acertaria pela palavra-chave.`);
  if (shared.length > 0) fail(`${tag} a pergunta compartilha palavras com o documento-alvo: ${shared.join(', ')}`);
}
void pointFor;

if (errors.length) {
  console.error('\nFALHAS:\n- ' + errors.join('\n- '));
  process.exit(1);
}
console.log('\nOK: dados do Modo Prática consistentes.');
