/**
 * As formas das aulas.
 *
 * Cada tipo de bloco declarado aqui tem de ter três coisas do outro lado: uma
 * entrada no validador, um desenhador no leitor, e um editor no construtor.
 * Acrescentar um tipo novo não toca nos outros.
 */
type MediaRef = {
    chave: string;
    url: string;
    bytes: number;
};
type BlocoVideo = {
    id: string;
    tipo: 'video';
    fonte: {
        chave: string;
        duracao_seg: number;
    };
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
type CartaoCarrossel = {
    id: string;
    titulo: string;
    texto: string;
    imagem?: string;
    meta?: {
        rotulo: string;
        valor: string;
    }[];
    narracao?: string;
};
type BlocoCarrossel = {
    id: string;
    tipo: 'carrossel';
    titulo: string;
    cartoes: CartaoCarrossel[];
};
type Passo = {
    id: string;
    titulo: string;
    texto: string;
    imagem?: string;
    narracao?: string;
};
type BlocoPassos = {
    id: string;
    tipo: 'passos';
    titulo: string;
    passos: Passo[];
};
type BlocoDesafio = {
    id: string;
    tipo: 'desafio';
    titulo: string;
    instrucao: string;
    prazo_dias: number;
    rotulo_resultado: string;
    obrigatorio_para_concluir?: boolean;
    narracao?: string;
};
type ItemChecklist = {
    id: string;
    texto: string;
    narracao?: string;
};
type BlocoChecklist = {
    id: string;
    tipo: 'checklist';
    titulo: string;
    itens: ItemChecklist[];
    obrigatorio_para_concluir?: boolean;
    narracao?: string;
};
type SlideAudio = {
    chave: string;
    ate_seg: number;
    legenda?: string;
};
type BlocoAudioSlides = {
    id: string;
    tipo: 'audio_slides';
    titulo: string;
    fonte: {
        chave: string;
        duracao_seg: number;
    };
    slides: SlideAudio[];
};
type BlocoTabela = {
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
type PerguntaAutoavaliacao = {
    id: string;
    enunciado: string;
    imagem?: string;
    narracao?: string;
    opcoes: {
        id: string;
        texto: string;
        imagem?: string;
        narracao?: string;
    }[];
};
type BlocoAutoavaliacao = {
    id: string;
    tipo: 'autoavaliacao';
    titulo: string;
    /** O que fazer depois de ouvir as alternativas. Fecha a narracao. */
    instrucao?: string;
    narracao_instrucao?: string;
    perguntas: PerguntaAutoavaliacao[];
    obrigatorio_para_concluir?: boolean;
};
type OpcaoQuiz = {
    id: string;
    texto: string;
    imagem?: string;
    narracao?: string;
};
type PerguntaQuiz = {
    id: string;
    enunciado: string;
    imagem?: string;
    narracao?: string;
    opcoes: OpcaoQuiz[];
    correcta: string;
    explicacao: string;
};
type BlocoQuiz = {
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
type CampoFormulario = {
    id: string;
    rotulo: string;
    tipo: 'texto' | 'numero';
    obrigatorio: boolean;
    max_carateres: number;
    narracao?: string;
};
type BlocoFormulario = {
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
declare const NOMES_DE_FERRAMENTA: readonly ["calc-custo-preco", "caderno-contas", "calc-orcamento", "calc-desconto", "calc-credito", "catalogo-ideias", "plano-pdf", "vitrine"];
type NomeDeFerramenta = (typeof NOMES_DE_FERRAMENTA)[number];
type BlocoFerramenta = {
    id: string;
    tipo: 'ferramenta';
    ferramenta: NomeDeFerramenta;
    titulo: string;
    instrucao?: string;
    /** Valores com que a ferramenta abre, para o jovem substituir pelos dele. */
    parametros?: Record<string, string | number>;
    narracao?: string;
};
type BlocoRecompensa = {
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
declare const NOMES_DE_JOGO: readonly ["separar", "decidir", "escada", "ordenar"];
type NomeDeJogo = (typeof NOMES_DE_JOGO)[number];
type GrupoSeparar = {
    id: string;
    rotulo: string;
};
/** A `narracao` é a chave do clipe que se ouve quando esta carta chega à frente. */
type CartaoSeparar = {
    id: string;
    texto: string;
    grupo: string;
    narracao?: string;
};
type DadosSeparar = {
    grupos: GrupoSeparar[];
    cartoes: CartaoSeparar[];
    /** Porque é que cada cartão pertence ao seu grupo. Só se mostra depois da lição. */
    porque?: Record<string, string>;
};
type OpcaoDecidir = {
    id: string;
    rotulo: string;
    /** O que sobra ao fim do dia com esta escolha, escrito por quem faz a aula. */
    resultado: number;
    explicacao: string;
};
type RondaDecidir = {
    id: string;
    situacao: string;
    pergunta: string;
    opcoes: OpcaoDecidir[];
    melhor: string;
    /** O clipe que lê a situação e a pergunta, quando a ronda abre. */
    narracao?: string;
};
type DadosDecidir = {
    unidade: string;
    rondas: RondaDecidir[];
};
type OpcaoEscada = {
    id: string;
    rotulo: string;
    /** Porque é que esta resposta está certa ou errada. Lê-se depois de responder. */
    explicacao: string;
};
type DegrauEscada = {
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
type DadosEscada = {
    /** A moeda da banca, escrita como se mostra. Por exemplo, `MT`. */
    unidade: string;
    degraus: DegrauEscada[];
    /** Dá direito a cortar duas respostas erradas, uma vez em todo o jogo. */
    ajuda?: boolean;
};
type PassoOrdenar = {
    id: string;
    texto: string;
    /** Porque é que este passo vem neste lugar. Só se lê depois da lição. */
    porque?: string;
    /** O clipe que lê este passo, quando se toca na carta. */
    narracao?: string;
};
type DadosOrdenar = {
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
type BlocoJogoSeparar = BlocoJogoBase & {
    jogo: 'separar';
    dados: DadosSeparar;
};
type BlocoJogoDecidir = BlocoJogoBase & {
    jogo: 'decidir';
    dados: DadosDecidir;
};
type BlocoJogoEscada = BlocoJogoBase & {
    jogo: 'escada';
    dados: DadosEscada;
};
type BlocoJogoOrdenar = BlocoJogoBase & {
    jogo: 'ordenar';
    dados: DadosOrdenar;
};
type BlocoJogo = BlocoJogoSeparar | BlocoJogoDecidir | BlocoJogoEscada | BlocoJogoOrdenar;
type Bloco = BlocoVideo | BlocoCarrossel | BlocoPassos | BlocoDesafio | BlocoChecklist | BlocoAudioSlides | BlocoTabela | BlocoAutoavaliacao | BlocoQuiz | BlocoFormulario | BlocoFerramenta | BlocoJogo | BlocoRecompensa;
type ConteudoAula = {
    versao: 1;
    sessao: string;
    titulo: string;
    duracao_min: number;
    media: MediaRef[];
    blocos: Bloco[];
};
type ErroValidacao = {
    caminho: string;
    mensagem: string;
};
type ResultadoValidacao = {
    ok: true;
    aula: ConteudoAula;
} | {
    ok: false;
    erros: ErroValidacao[];
};

/**
 * As regras que dizem se uma aula é aceitável.
 *
 * Devolvem a lista completa de erros e não só o primeiro, porque quem monta uma
 * aula prefere corrigir tudo de uma vez a descobrir um problema de cada vez.
 */

/** Valida o JSON de uma aula e devolve-o tipado, ou a lista completa de erros. */
declare function validarAula(valor: unknown): ResultadoValidacao;
/**
 * Ids dos blocos cuja resposta é condição para a aula poder ser concluída.
 * Qualquer tipo de bloco pode carregar a marca. É a mesma leitura que a função
 * `concluir_aula` faz do lado da base de dados, e as duas têm de concordar.
 */
declare function blocosObrigatorios(aula: ConteudoAula): string[];
/** Indexa a media da aula pela chave, para os blocos resolverem os seus ficheiros. */
declare function mediaPorChave(aula: ConteudoAula): Map<string, MediaRef>;

/**
 * A regra que mais confunde, dita pelo proprio jogo.
 *
 * O jogo de antes da licao nao corrige nada, de proposito: os dois jogos da
 * mesma aula usam os mesmos cartoes, e se o primeiro revelasse as respostas o
 * segundo passava a medir memoria de cinco minutos em vez de compreensao. So
 * que um jogo que aceita tudo em silencio nao se le como «este e as cegas»,
 * le-se como avariado -- foi o que aconteceu ao cliente no primeiro teste. A
 * regra deixa de estar escondida no codigo e passa a ser dita ao jogador, na
 * abertura e no fim.
 *
 * Fica no contrato e nao em cada leitor porque e a mesma frase na aplicacao, na
 * web e no clipe gravado: com tres copias, bastava mexer numa para o jovem
 * ouvir uma promessa e ler outra.
 */
declare const REGRA_DO_MOMENTO: Record<'antes' | 'depois', string>;
/**
 * O que se diz quando um jogo abre, por esta ordem: que e um jogo, como se
 * chama, de que trata, como se joga, e o que acontece quando se erra.
 *
 * Antes disto a abertura era o titulo mais a historia, e mais nada. Quem nunca
 * tinha jogado aquilo chegava ao tabuleiro sem saber a mecanica e descobria-a a
 * tentar. Serve o ecra e o clipe gravado ao mesmo tempo, para nao haver duas
 * versoes da mesma apresentacao.
 */
declare function aberturaDoJogo(bloco: BlocoJogo): string;
/**
 * A conta de um jogo, feita uma vez e usada nos dois leitores.
 *
 * Vive no contrato, e nao em cada aplicacao, pela mesma razao que o validador:
 * duas implementacoes da mesma conta acabam a dar numeros diferentes, e aqui a
 * diferenca seria XP a mais ou a menos no bolso de alguem.
 *
 * Os `erros` entram de fora porque sao historia, nao estado final: sao as
 * tentativas falhadas pelo caminho, que o leitor conta enquanto se joga.
 */
type ResultadoJogo = {
    acertos: number;
    total: number;
    erros: number;
    semFalhas: boolean;
};
/** Onde o jovem pos cada cartao: id do cartao para id do grupo. */
type Colocacoes = Record<string, string>;
/** O que o jovem escolheu em cada ronda: id da ronda para id da opcao. */
type Escolhas = Record<string, string>;
declare function cartaoCerto(dados: DadosSeparar, cartaoId: string, grupoId: string): boolean;
declare function corrigirSeparar(dados: DadosSeparar, colocacoes: Colocacoes, erros: number): ResultadoJogo;
declare function corrigirDecidir(dados: DadosDecidir, escolhas: Escolhas, erros: number): ResultadoJogo;
declare function corrigirEscada(dados: DadosEscada, respostas: Escolhas, erros: number): ResultadoJogo;
/** A fila que o jovem montou: os ids dos passos, do primeiro ao ultimo. */
type Ordem = string[];
/** Este passo e mesmo o que falta nesta posicao da fila? */
declare function passoCerto(dados: DadosOrdenar, posicao: number, passoId: string): boolean;
declare function corrigirOrdenar(dados: DadosOrdenar, ordem: Ordem, erros: number): ResultadoJogo;
/**
 * As cartas por colocar, fora da ordem.
 *
 * Baralhar vive aqui e nao em cada leitor por uma razao pratica: o jogo tem de
 * comecar sempre errado. Um baralho que por sorte sai na ordem certa da a
 * vitoria de graca e faz o jogo parecer avariado, e com tres passos isso
 * acontece uma vez em cada seis. Depois de baralhar, se calhou a ordem
 * escrita, roda-se uma posicao: continua baralhado e deixa de estar resolvido.
 *
 * A fonte de sorte entra de fora para os testes poderem fixa-la. Em producao
 * nao se passa nada e usa-se o `Math.random`.
 */
declare function baralharPassos(dados: DadosOrdenar, sorte?: () => number): PassoOrdenar[];
/**
 * Com quanto se fica na banca, subindo a escada com estas respostas.
 *
 * A regra e a do jogo de televisao, com uma diferenca de proposito: aqui uma
 * resposta errada nao acaba o jogo, faz cair ao ultimo patamar seguro e a
 * escada continua. Numa aula, mandar alguem embora a primeira pergunta falhada
 * seria tirar-lhe as outras, que sao as que ele ainda podia aprender.
 *
 * Um degrau por responder nao conta nem como certo nem como errado: quem parou
 * a meio fica com o que ja tinha.
 */
declare function bancaDaEscada(dados: DadosEscada, respostas: Escolhas): number;
/**
 * Quanto vale este jogo.
 *
 * O servidor faz esta mesma conta antes de somar, e e a dele que manda. Aqui
 * serve para o leitor poder dizer ao jovem o que ganhou sem esperar pela rede.
 */
declare function xpDoJogo(bloco: BlocoJogo, resultado: ResultadoJogo): number;

/**
 * Onde e que uma aula leva voz.
 *
 * Vive no contrato, e nao no guiao que grava nem no construtor do dashboard,
 * porque os dois precisam da mesma resposta: quais sao os pedacos, por que
 * ordem se ouvem, e com que nome fica cada ficheiro. Com duas copias desta
 * lista, um clipe gravado pelo guiao deixava de ser encontrado pelo painel na
 * primeira vez que alguem mexesse num dos lados.
 */

type PedacoNarravel = {
    /** O nome que o ficheiro deve ter, derivado de onde o pedaco vive. */
    chave: string;
    /** Onde vive, escrito para uma pessoa: «Pergunta 2, resposta B». */
    rotulo: string;
    /** O que ha para dizer em voz alta. */
    texto: string;
    /** A chave ja atribuida, quando este pedaco ja tem audio. */
    narracao?: string;
};
/**
 * A linha de uma tabela nao tem id, so posicao. E daqui que sai o nome dela.
 *
 * Exportado porque o leitor tambem precisa dele: e por este nome que ele vai
 * buscar o clipe de cada linha ao mapa `narracao_linhas`. Com a conta feita
 * dos dois lados, bastava um deles comecar em zero para a tabela toda passar a
 * ler a linha errada em voz alta, e sem erro nenhum a assinalar.
 */
declare function idDaLinhaDaTabela(indice: number): string;
/** Tudo o que numa aula pode ser lido em voz alta, pela ordem em que se ouve. */
declare function pedacosNarraveis(aula: ConteudoAula): PedacoNarravel[];
/**
 * Prende, ou solta, o audio de um pedaco.
 *
 * Encontra o pedaco pela chave, que e unica dentro de uma aula porque vem do id
 * do bloco e do que la esta dentro. Devolve uma aula nova: quem chama isto e
 * quase sempre um ecra a reagir a um clique, e mudar o objecto por baixo dele
 * daria um ecra que nao se redesenha.
 */
declare function definirNarracao(aula: ConteudoAula, chave: string, valor: string | undefined): ConteudoAula;

/**
 * Contrato das aulas da Impulso.
 *
 * TypeScript puro, sem uma unica dependencia de execucao. E essa ausencia que
 * lhe permite correr nos tres sitios onde e preciso: no telemovel sobre Hermes,
 * no servidor da Next, e no browser de quem monta a aula.
 */

/**
 * Versao do formato de `aulas.conteudo`.
 * Sobe quando o formato deixar de ser compativel com o anterior, e nao quando
 * se acrescenta um tipo de bloco novo.
 */
declare function versaoDoContrato(): number;

export { type Bloco, type BlocoAudioSlides, type BlocoAutoavaliacao, type BlocoCarrossel, type BlocoChecklist, type BlocoDesafio, type BlocoFerramenta, type BlocoFormulario, type BlocoJogo, type BlocoJogoDecidir, type BlocoJogoEscada, type BlocoJogoOrdenar, type BlocoJogoSeparar, type BlocoPassos, type BlocoQuiz, type BlocoRecompensa, type BlocoTabela, type BlocoVideo, type CampoFormulario, type CartaoCarrossel, type CartaoSeparar, type Colocacoes, type ConteudoAula, type DadosDecidir, type DadosEscada, type DadosOrdenar, type DadosSeparar, type DegrauEscada, type ErroValidacao, type Escolhas, type GrupoSeparar, type ItemChecklist, type MediaRef, NOMES_DE_FERRAMENTA, NOMES_DE_JOGO, type NomeDeFerramenta, type NomeDeJogo, type OpcaoDecidir, type OpcaoEscada, type OpcaoQuiz, type Ordem, type Passo, type PassoOrdenar, type PedacoNarravel, type PerguntaAutoavaliacao, type PerguntaQuiz, REGRA_DO_MOMENTO, type ResultadoJogo, type ResultadoValidacao, type RondaDecidir, type SlideAudio, aberturaDoJogo, bancaDaEscada, baralharPassos, blocosObrigatorios, cartaoCerto, corrigirDecidir, corrigirEscada, corrigirOrdenar, corrigirSeparar, definirNarracao, idDaLinhaDaTabela, mediaPorChave, passoCerto, pedacosNarraveis, validarAula, versaoDoContrato, xpDoJogo };
