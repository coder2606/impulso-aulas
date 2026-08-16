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
};
type ItemChecklist = {
    id: string;
    texto: string;
};
type BlocoChecklist = {
    id: string;
    tipo: 'checklist';
    titulo: string;
    itens: ItemChecklist[];
    obrigatorio_para_concluir?: boolean;
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
};
type PerguntaAutoavaliacao = {
    id: string;
    enunciado: string;
    imagem?: string;
    opcoes: {
        id: string;
        texto: string;
        imagem?: string;
    }[];
};
type BlocoAutoavaliacao = {
    id: string;
    tipo: 'autoavaliacao';
    titulo: string;
    perguntas: PerguntaAutoavaliacao[];
    obrigatorio_para_concluir?: boolean;
};
type OpcaoQuiz = {
    id: string;
    texto: string;
    imagem?: string;
};
type PerguntaQuiz = {
    id: string;
    enunciado: string;
    imagem?: string;
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
    perguntas: PerguntaQuiz[];
};
type CampoFormulario = {
    id: string;
    rotulo: string;
    tipo: 'texto' | 'numero';
    obrigatorio: boolean;
    max_carateres: number;
};
type BlocoFormulario = {
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
};
type BlocoRecompensa = {
    id: string;
    tipo: 'recompensa';
    medalha: string;
    partilhavel: boolean;
};
type Bloco = BlocoVideo | BlocoCarrossel | BlocoPassos | BlocoDesafio | BlocoChecklist | BlocoAudioSlides | BlocoTabela | BlocoAutoavaliacao | BlocoQuiz | BlocoFormulario | BlocoFerramenta | BlocoRecompensa;
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

export { type Bloco, type BlocoAudioSlides, type BlocoAutoavaliacao, type BlocoCarrossel, type BlocoChecklist, type BlocoDesafio, type BlocoFerramenta, type BlocoFormulario, type BlocoPassos, type BlocoQuiz, type BlocoRecompensa, type BlocoTabela, type BlocoVideo, type CampoFormulario, type CartaoCarrossel, type ConteudoAula, type ErroValidacao, type ItemChecklist, type MediaRef, NOMES_DE_FERRAMENTA, type NomeDeFerramenta, type OpcaoQuiz, type Passo, type PerguntaAutoavaliacao, type PerguntaQuiz, type ResultadoValidacao, type SlideAudio, blocosObrigatorios, mediaPorChave, validarAula, versaoDoContrato };
