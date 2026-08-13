/**
 * As formas das aulas.
 *
 * Cada tipo de bloco declarado aqui tem de ter três coisas do outro lado: uma
 * entrada no validador, um desenhador no leitor, e um editor no construtor.
 * Acrescentar um tipo novo não toca nos outros.
 */

export type MediaRef = { chave: string; url: string; bytes: number };

export type BlocoVideo = {
  id: string;
  tipo: 'video';
  fonte: { chave: string; duracao_seg: number };
  poster?: string;
  legenda?: string;
};

export type CartaoCarrossel = {
  id: string;
  titulo: string;
  texto: string;
  imagem?: string;
  meta?: { rotulo: string; valor: string }[];
};
export type BlocoCarrossel = {
  id: string;
  tipo: 'carrossel';
  titulo: string;
  cartoes: CartaoCarrossel[];
};

export type Passo = { id: string; titulo: string; texto: string; imagem?: string };
export type BlocoPassos = { id: string; tipo: 'passos'; titulo: string; passos: Passo[] };

export type BlocoDesafio = {
  id: string;
  tipo: 'desafio';
  titulo: string;
  instrucao: string;
  prazo_dias: number;
  rotulo_resultado: string;
  obrigatorio_para_concluir?: boolean;
};

export type ItemChecklist = { id: string; texto: string };
export type BlocoChecklist = {
  id: string;
  tipo: 'checklist';
  titulo: string;
  itens: ItemChecklist[];
  obrigatorio_para_concluir?: boolean;
};

export type SlideAudio = { chave: string; ate_seg: number; legenda?: string };
export type BlocoAudioSlides = {
  id: string;
  tipo: 'audio_slides';
  titulo: string;
  fonte: { chave: string; duracao_seg: number };
  slides: SlideAudio[];
};

export type BlocoTabela = {
  id: string;
  tipo: 'tabela';
  titulo: string;
  colunas: string[];
  linhas: string[][];
};

export type PerguntaAutoavaliacao = {
  id: string;
  enunciado: string;
  imagem?: string;
  opcoes: { id: string; texto: string; imagem?: string }[];
};
export type BlocoAutoavaliacao = {
  id: string;
  tipo: 'autoavaliacao';
  titulo: string;
  perguntas: PerguntaAutoavaliacao[];
  obrigatorio_para_concluir?: boolean;
};

export type OpcaoQuiz = { id: string; texto: string; imagem?: string };
export type PerguntaQuiz = {
  id: string;
  enunciado: string;
  imagem?: string;
  opcoes: OpcaoQuiz[];
  correcta: string;
  explicacao: string;
};
export type BlocoQuiz = {
  id: string;
  tipo: 'quiz';
  vidas: number;
  tempo_seg: number;
  xp_por_certa: number;
  perguntas: PerguntaQuiz[];
};

export type CampoFormulario = {
  id: string;
  rotulo: string;
  tipo: 'texto' | 'numero';
  obrigatorio: boolean;
  max_carateres: number;
};
export type BlocoFormulario = {
  id: string;
  tipo: 'formulario';
  titulo: string;
  instrucao: string;
  obrigatorio_para_concluir: boolean;
  campos: CampoFormulario[];
};

/**
 * As ferramentas nativas que uma aula pode invocar.
 *
 * Lista fechada de propósito. O construtor mostra-a como escolha e o validador
 * recusa tudo o que não esteja aqui, para nunca se publicar uma aula que chama
 * uma ferramenta inexistente. Com texto livre, o erro só aparecia no telemóvel
 * de um jovem, em forma de ecrã em branco.
 */
export const NOMES_DE_FERRAMENTA = [
  'calc-custo-preco',
  'caderno-contas',
  'calc-orcamento',
  'calc-desconto',
  'calc-credito',
  'catalogo-ideias',
  'plano-pdf',
  'vitrine',
] as const;

export type NomeDeFerramenta = (typeof NOMES_DE_FERRAMENTA)[number];

export type BlocoFerramenta = {
  id: string;
  tipo: 'ferramenta';
  ferramenta: NomeDeFerramenta;
  titulo: string;
  instrucao?: string;
  /** Valores com que a ferramenta abre, para o jovem substituir pelos dele. */
  parametros?: Record<string, string | number>;
};

export type BlocoRecompensa = {
  id: string;
  tipo: 'recompensa';
  medalha: string;
  partilhavel: boolean;
};

export type Bloco =
  | BlocoVideo
  | BlocoCarrossel
  | BlocoPassos
  | BlocoDesafio
  | BlocoChecklist
  | BlocoAudioSlides
  | BlocoTabela
  | BlocoAutoavaliacao
  | BlocoQuiz
  | BlocoFormulario
  | BlocoFerramenta
  | BlocoRecompensa;

export type ConteudoAula = {
  versao: 1;
  sessao: string;
  titulo: string;
  duracao_min: number;
  media: MediaRef[];
  blocos: Bloco[];
};

export type ErroValidacao = { caminho: string; mensagem: string };
export type ResultadoValidacao = { ok: true; aula: ConteudoAula } | { ok: false; erros: ErroValidacao[] };
