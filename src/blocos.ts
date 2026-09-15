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
  /**
   * O video esta encomendado e ainda nao existe.
   *
   * A aula declara-o na mesma, com a chave que vai usar e a duracao prevista, e
   * o leitor mostra um aviso no lugar dele. Serve para o jovem perceber que ali
   * vai haver uma historia, em vez de a aula parecer que salta um passo, e
   * serve para quem monta nao se esquecer de qual e o buraco.
   *
   * Com isto ligado, a chave nao precisa de ter entrada em `media`: e o unico
   * caso em que uma chave pode nao apontar para ficheiro nenhum.
   */
  em_breve?: boolean;
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

/**
 * Os jogos que ESTE contrato conhece.
 *
 * A lista cresce quando uma mecânica for construída, e nunca antes: um nome
 * aqui é a promessa de que existe um leitor que o sabe desenhar. O catálogo das
 * mecânicas por fazer vive na especificação, não aqui.
 */
export const NOMES_DE_JOGO = [
  'separar',
  'decidir',
  'escada',
  'ordenar',
  'achar-erro',
  'frase',
  'sopa',
] as const;
export type NomeDeJogo = (typeof NOMES_DE_JOGO)[number];

export type GrupoSeparar = { id: string; rotulo: string };
/** A `narracao` é a chave do clipe que se ouve quando esta carta chega à frente. */
export type CartaoSeparar = { id: string; texto: string; grupo: string; narracao?: string };
export type DadosSeparar = {
  grupos: GrupoSeparar[];
  cartoes: CartaoSeparar[];
  /** Porque é que cada cartão pertence ao seu grupo. Só se mostra depois da lição. */
  porque?: Record<string, string>;
};

export type OpcaoDecidir = {
  id: string;
  rotulo: string;
  /** O que sobra ao fim do dia com esta escolha, escrito por quem faz a aula. */
  resultado: number;
  explicacao: string;
};
export type RondaDecidir = {
  id: string;
  situacao: string;
  pergunta: string;
  opcoes: OpcaoDecidir[];
  melhor: string;
  /** O clipe que lê a situação e a pergunta, quando a ronda abre. */
  narracao?: string;
};
export type DadosDecidir = { unidade: string; rondas: RondaDecidir[] };

export type OpcaoEscada = {
  id: string;
  rotulo: string;
  /** Porque é que esta resposta está certa ou errada. Lê-se depois de responder. */
  explicacao: string;
};
export type DegrauEscada = {
  id: string;
  pergunta: string;
  opcoes: OpcaoEscada[];
  /** O `id` da opção certa. */
  certa: string;
  /** Quanto passa a valer a banca ao chegar aqui. */
  premio: number;
  /**
   * Patamar seguro: quem passa por aqui nunca desce abaixo deste prémio.
   *
   * É o que permite errar sem perder tudo. Sem patamares, uma pergunta falhada
   * no fim apagava o jogo inteiro, e quem está a aprender desiste aí.
   */
  seguro?: boolean;
  /** O clipe que lê a pergunta e as opções, quando o degrau abre. */
  narracao?: string;
};
export type DadosEscada = {
  /** A moeda da banca, escrita como se mostra. Por exemplo, `MT`. */
  unidade: string;
  degraus: DegrauEscada[];
  /** Dá direito a cortar duas respostas erradas, uma vez em todo o jogo. */
  ajuda?: boolean;
};

export type PassoOrdenar = {
  id: string;
  texto: string;
  /** Porque é que este passo vem neste lugar. Só se lê depois da lição. */
  porque?: string;
  /** O clipe que lê este passo, quando se toca na carta. */
  narracao?: string;
};
export type DadosOrdenar = {
  /**
   * Os passos pela ordem certa, que é a ordem por que estão escritos aqui.
   *
   * Não há campo de posição, de propósito: dois sítios a dizer a mesma coisa
   * acabam a discordar, e quem escreve a aula escreve uma receita de cima para
   * baixo, não uma lista com números ao lado. Baralhar é trabalho do leitor,
   * e é o contrato que o faz — ver `baralharPassos`.
   */
  passos: PassoOrdenar[];
  /** O que a fila representa de ponta a ponta. Por exemplo, «Do bom dia ao dinheiro na mão». */
  fio?: string;
};

type BlocoJogoBase = {
  id: string;
  tipo: 'jogo';
  /**
   * Antes da lição é diagnóstico: uma tentativa, sem correcção, e o erro cria a
   * pergunta a que a aula responde a seguir. Depois é treino: tenta até acertar,
   * com o porquê. É o mesmo componente com duas vozes.
   */
  momento: 'antes' | 'depois';
  titulo: string;
  instrucao?: string;
  /**
   * Como se joga, em linhas curtas.
   *
   * Sem isto o jogo abria com o nome e a historia e mandava jogar, e quem
   * nunca jogou aquilo ficava a adivinhar a mecanica com o tabuleiro ja a
   * frente. As regras sao conteudo e nao ecra: mudam de jogo para jogo, e
   * quem escreve a aula tem de as poder escrever sem tocar em codigo.
   *
   * Uma linha por regra, pela ordem por que se joga. Entram no aviso de
   * abertura e sao lidas em voz alta a seguir a historia.
   */
  regras?: string[];
  narracao?: string;
  /** Ganha-se por terminar, mesmo errando tudo. */
  xp: number;
  /** Junta-se ao anterior para quem acaba sem falhas. */
  xp_extra: number;
};

export type BlocoJogoSeparar = BlocoJogoBase & { jogo: 'separar'; dados: DadosSeparar };
export type BlocoJogoDecidir = BlocoJogoBase & { jogo: 'decidir'; dados: DadosDecidir };
export type BlocoJogoEscada = BlocoJogoBase & { jogo: 'escada'; dados: DadosEscada };
export type ItemCena = {
  id: string;
  texto: string;
  /** Se esta linha da cena é das que estão mal. É o que o jovem tem de apanhar. */
  errado: boolean;
  /** O que está mal aqui, ou porque é que está bem. Só se lê depois da lição. */
  porque?: string;
  /** O clipe que lê esta linha, quando se toca nela. */
  narracao?: string;
};
export type DadosAcharErro = {
  /** O que se está a olhar. Por exemplo, «A página de segunda-feira do caderno da Nhelete». */
  cena: string;
  /**
   * As linhas da cena, pela ordem por que se leem.
   *
   * Tem de haver erradas e certas: uma cena só com erros treina a carregar em
   * tudo, e uma sem nenhum não tem jogo nenhum. O validador exige as duas.
   */
  itens: ItemCena[];
};

export type BlocoJogoOrdenar = BlocoJogoBase & { jogo: 'ordenar'; dados: DadosOrdenar };
export type BlocoJogoAcharErro = BlocoJogoBase & { jogo: 'achar-erro'; dados: DadosAcharErro };

export type OpcaoPalavra = {
  id: string;
  /** O pedaço que entra na frase, escrito tal e qual como vai aparecer. */
  texto: string;
  /** Porque é que este pedaço serve, ou não serve. Só se lê depois da lição. */
  porque?: string;
};
export type EncaixeFrase = {
  id: string;
  /** O que este encaixe pede: «O que é», «Como comprar». */
  rotulo: string;
  opcoes: OpcaoPalavra[];
  /** O `id` do pedaço que faz a frase funcionar. */
  melhor: string;
  /** O clipe que lê o encaixe e as suas opções. */
  narracao?: string;
};
export type DadosFrase = {
  /**
   * Onde a frase vai parar, escrito para o jovem.
   *
   * Por exemplo, «A tua publicação no WhatsApp». É o que faz o jogo não ser um
   * exercício de português: no fim há uma frase que se usa em sítio nenhum ou
   * uma frase que se publica, e a diferença está aqui.
   */
  suporte: string;
  /**
   * Os encaixes, pela ordem por que a frase se lê.
   *
   * A frase é a soma dos pedaços escolhidos, por esta ordem, separados por um
   * espaço. Não há moldes com buracos nem interpretador nenhum: quem escreve a
   * aula escreve cada pedaço inteiro, e o que se vê no ecrã é exactamente o que
   * ele escreveu.
   */
  encaixes: EncaixeFrase[];
};

export type BlocoJogoFrase = BlocoJogoBase & { jogo: 'frase'; dados: DadosFrase };

export type PalavraDaSopa = {
  id: string;
  /** A palavra como se escreve, com acentos. Na grelha entra sem eles. */
  texto: string;
  /** O que ela quer dizer. Aparece quando a palavra é achada. */
  significado?: string;
  /** O clipe que lê a palavra e o que ela quer dizer. */
  narracao?: string;
};
export type DadosSopa = {
  /**
   * As palavras a achar, entre três e oito.
   *
   * São palavras que a fase já ensinou: isto é revisão, e não vocabulário
   * novo. Uma palavra que o jovem nunca viu não se acha numa grelha, adivinha-se.
   */
  palavras: PalavraDaSopa[];
  /**
   * Quantas letras de lado. Entre oito e doze, e por omissão o contrato escolhe.
   *
   * Acima de doze as células ficam mais pequenas do que um dedo num telemóvel
   * de cinco polegadas, que é o que a maior parte deles tem.
   */
  lado?: number;
};

export type BlocoJogoSopa = BlocoJogoBase & { jogo: 'sopa'; dados: DadosSopa };
export type BlocoJogo =
  | BlocoJogoSeparar
  | BlocoJogoDecidir
  | BlocoJogoEscada
  | BlocoJogoOrdenar
  | BlocoJogoAcharErro
  | BlocoJogoFrase
  | BlocoJogoSopa;

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
  | BlocoJogo
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
