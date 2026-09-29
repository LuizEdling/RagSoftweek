"""Camada de abstração para o LLM.

Recebe pergunta + contexto, retorna resposta + fontes utilizadas.
Trocar de provedor significa trocar LLM_PROVIDER no .env.
"""
from __future__ import annotations

import unicodedata

from app.core.config import Settings
from app.models.schemas import ContextChunk

SYSTEM_PROMPT = "Você é um assistente acadêmico."

# Respostas prontas para as perguntas sugeridas na interface, para que o
# modo mock funcione bem mesmo sem nenhuma chave de LLM configurada.
CANNED_ANSWERS: dict[str, str] = {
    "como faco meu tcc": (
        "Para iniciar o TCC, você precisa definir um orientador e ter o tema aprovado pela "
        "coordenação do curso, no início do penúltimo semestre. É necessário entregar um "
        "pré-projeto até a sexta semana letiva e passar por duas bancas: qualificação e "
        "defesa final. A formatação deve seguir as normas da ABNT disponíveis no Portal "
        "Acadêmico."
    ),
    "quantas faltas posso ter": (
        "A frequência mínima exigida é de 75% das aulas. Em uma disciplina de 80 horas, "
        "você pode faltar no máximo 20 horas, justificadas ou não. Ultrapassar esse limite "
        "leva à reprovação por frequência, mesmo com notas suficientes."
    ),
    "como funciona o estagio": (
        "O estágio obrigatório pode começar a partir do 5º período, em empresas conveniadas "
        "ou por convênio individual. É preciso ter um professor orientador de estágio, "
        "entregar relatórios bimestrais e um relatório final, além de assinar o contrato "
        "antes de iniciar as atividades — do contrário, as horas não são validadas."
    ),
    "como faco minha matricula": (
        "A matrícula é feita pelo Portal do Aluno entre os dias 10 e 20 do mês anterior ao "
        "início do semestre. Calouros fazem a matrícula presencialmente na Central de "
        "Atendimento com RG, CPF e histórico escolar; veteranos sem pendências são "
        "renovados automaticamente."
    ),
    "como posso conseguir uma bolsa": (
        "Existem bolsas de mérito acadêmico, bolsas socioeconômicas (mediante análise de "
        "renda) e bolsas de iniciação científica. As inscrições para bolsas "
        "socioeconômicas abrem no início de cada semestre no setor de Assistência "
        "Estudantil, exigindo comprovação de renda e documentação familiar."
    ),
    "como funciona a biblioteca": (
        "A Biblioteca Central funciona de segunda a sábado, das 7h às 22h. É possível pegar "
        "até 5 livros emprestados por até 14 dias, renováveis pelo Portal do Aluno. Atrasos "
        "geram bloqueio de novos empréstimos proporcional aos dias de atraso."
    ),
    "quando posso fazer uma prova substitutiva": (
        "A prova substitutiva pode ser solicitada em até 5 dias úteis após a avaliação "
        "original, caso a falta tenha sido justificada (atestado médico, óbito familiar ou "
        "convocação legal). Ela é única e cobre todo o conteúdo do semestre até a data de "
        "aplicação."
    ),
}


def _normalize(q: str) -> str:
    q = q.lower().strip().rstrip("?!.")
    q = "".join(c for c in unicodedata.normalize("NFD", q) if unicodedata.category(c) != "Mn")
    return q


class LLMService:
    def __init__(self, settings: Settings):
        self.settings = settings

    def generate(self, question: str, context: list[ContextChunk]) -> str:
        if self.settings.llm_provider == "mock":
            return self._mock_generate(question, context)
        if self.settings.llm_provider == "groq":
            return self._groq_generate(question, context)
        if self.settings.llm_provider == "openai":
            return self._openai_generate(question, context)
        raise ValueError(f"Provedor de LLM desconhecido: {self.settings.llm_provider}")

    def _mock_generate(self, question: str, context: list[ContextChunk]) -> str:
        canned = CANNED_ANSWERS.get(_normalize(question))
        if canned:
            return canned
        if not context:
            return (
                "Não encontrei documentos suficientemente relevantes na base de conhecimento "
                "para responder com segurança a essa pergunta. Tente reformular ou consulte "
                "a Central de Atendimento."
            )
        filenames = ", ".join(c.filename for c in context)
        excerpts = " ".join(c.excerpt for c in context)
        return f"Com base nos documentos recuperados ({filenames}), a resposta é: {excerpts}"

    def _build_prompt(self, question: str, context: list[ContextChunk]) -> tuple[str, str]:
        context_block = "\n".join(f"[{c.filename}] {c.excerpt}" for c in context)
        return SYSTEM_PROMPT, context_block

    def _groq_generate(self, question: str, context: list[ContextChunk]) -> str:
        if not self.settings.llm_api_key:
            raise RuntimeError("LLM_API_KEY não configurada para o provedor 'groq'.")
        import httpx

        system_prompt, context_block = self._build_prompt(question, context)
        model = self.settings.llm_model or "llama-3.1-8b-instant"
        resp = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {self.settings.llm_api_key}"},
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": f"CONTEXTO:\n{context_block}\n\nPERGUNTA:\n{question}\n\n"
                        "Responda utilizando o contexto fornecido.",
                    },
                ],
                "max_tokens": 400,
            },
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]

    def _openai_generate(self, question: str, context: list[ContextChunk]) -> str:
        if not self.settings.llm_api_key:
            raise RuntimeError("LLM_API_KEY não configurada para o provedor 'openai'.")
        import httpx

        system_prompt, context_block = self._build_prompt(question, context)
        model = self.settings.llm_model or "gpt-4o-mini"
        resp = httpx.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {self.settings.llm_api_key}"},
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": f"CONTEXTO:\n{context_block}\n\nPERGUNTA:\n{question}\n\n"
                        "Responda utilizando o contexto fornecido.",
                    },
                ],
                "max_tokens": 400,
            },
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]
