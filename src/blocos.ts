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
  narracao?: string;
};
export type BlocoCarrossel = {
  id: string;
  tipo: 'carrossel';
  titulo: string;
  cartoes: CartaoCarrossel[];
};

export type Passo = { id: string; titulo: string; texto: string; imagem?: string; narracao?: string };
export type BlocoPassos = { id: string; tipo: 'passos'; titulo: string; passos: Passo[] };

export type BlocoDesafio = {
  id: string;
  tipo: 'desafio';
  titulo: string;
  instrucao: string;
  prazo_dias: number;
  rotulo_resultado: string;
  obrigatorio_para_concluir?: boolean;
  narracao?: string;
};

export type ItemChecklist = { id: string; texto: string; narracao?: string };
export type BlocoChecklist = {
  id: string;
  tipo: 'checklist';
  titulo: string;
  itens: ItemChecklist[];
  obrigatorio_para_concluir?: boolean;
  narracao?: string;
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
  narracao?: string;
  /**
   * O áudio de cada linha, identificada por `l1`, `l2`, e assim por diante.
   *
   * As linhas são listas de células e não têm id próprio, por isso a chave sai
   * da posição. Um mapa e não uma lista em paralelo: assim só há entradas para
   * as linhas que têm clipe, e o guião apaga uma sem deixar buracos no meio.
   */
  narracao_linhas?: Record<string, string>;
};

/**
 * A `narracao` e uma chave da lista `media` da aula, tal como a `imagem`.
 *
 * Um clipe por pedaco, e nao um audio unico com marcas de tempo: assim quem
 * escreve a aula nunca tem de anotar segundos, e trocar uma alternativa so
 * obriga a regravar essa. O leitor toca os clipes em fila e acende a borda de
 * quem estiver a ser narrado.
 */
export type PerguntaAutoavaliacao = {
  id: string;
  enunciado: string;
  imagem?: string;
  narracao?: string;
  opcoes: { id: string; texto: string; imagem?: string; narracao?: string }[];
};
export type BlocoAutoavaliacao = {
  id: string;
  tipo: 'autoavaliacao';
  titulo: string;
  /** O que fazer depois de ouvir as alternativas. Fecha a narracao. */
  instrucao?: string;
  narracao_instrucao?: string;
  perguntas: PerguntaAutoavaliacao[];
  obrigatorio_para_concluir?: boolean;
};

export type OpcaoQuiz = { id: string; texto: string; imagem?: string; narracao?: string };
export type PerguntaQuiz = {
  id: string;
  enunciado: string;
  imagem?: string;
  narracao?: string;
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
  /** O que fazer depois de ouvir as alternativas. Fecha a narracao. */
  instrucao?: string;
  narracao_instrucao?: string;
  perguntas: PerguntaQuiz[];
};

export type CampoFormulario = {
  id: string;
  rotulo: string;
  tipo: 'texto' | 'numero';
  obrigatorio: boolean;
  max_carateres: number;
  narracao?: string;
};
export type BlocoFormulario = {
  id: string;
  tipo: 'formulario';
  titulo: string;
  instrucao: string;
  obrigatorio_para_concluir: boolean;
  campos: CampoFormulario[];
  narracao?: string;
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
  narracao?: string;
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
