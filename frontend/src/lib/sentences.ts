/** Divide um texto em frases (mesma regra do backend: separa em ". "),
 * devolvendo o ponto final em cada frase. */
export function sentencesOf(content: string): string[] {
  const parts = content.split('. ');
  return parts.map((p, i) => (i < parts.length - 1 ? p + '.' : p));
}
