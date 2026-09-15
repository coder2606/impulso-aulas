/**
 * Contrato das aulas da Impulso.
 *
 * TypeScript puro, sem uma unica dependencia de execucao. E essa ausencia que
 * lhe permite correr nos tres sitios onde e preciso: no telemovel sobre Hermes,
 * no servidor da Next, e no browser de quem monta a aula.
 */

export type {
  MediaRef,
  BlocoVideo,
  CartaoCarrossel,
  BlocoCarrossel,
  Passo,
  BlocoPassos,
  BlocoDesafio,
  ItemChecklist,
  BlocoChecklist,
  SlideAudio,
  BlocoAudioSlides,
  BlocoTabela,
  PerguntaAutoavaliacao,
  BlocoAutoavaliacao,
  OpcaoQuiz,
  PerguntaQuiz,
  BlocoQuiz,
  CampoFormulario,
  BlocoFormulario,
  NomeDeFerramenta,
  BlocoFerramenta,
  NomeDeJogo,
  GrupoSeparar,
  CartaoSeparar,
  DadosSeparar,
  OpcaoDecidir,
  RondaDecidir,
  DadosDecidir,
  OpcaoEscada,
  DegrauEscada,
  DadosEscada,
  PassoOrdenar,
  DadosOrdenar,
  ItemCena,
  DadosAcharErro,
  BlocoJogoSeparar,
  BlocoJogoDecidir,
  BlocoJogoEscada,
  BlocoJogoOrdenar,
  BlocoJogoAcharErro,
  BlocoJogo,
  BlocoRecompensa,
  Bloco,
  ConteudoAula,
  ErroValidacao,
  ResultadoValidacao,
} from "./blocos";

export { NOMES_DE_FERRAMENTA, NOMES_DE_JOGO } from "./blocos";

export { validarAula, blocosObrigatorios, mediaPorChave } from "./validar";

export type { ResultadoJogo, Colocacoes, Escolhas, Ordem } from "./jogos";
export {
  cartaoCerto,
  corrigirSeparar,
  corrigirDecidir,
  corrigirEscada,
  passoCerto,
  corrigirOrdenar,
  baralharPassos,
  errosDaCena,
  corrigirAcharErro,
  bancaDaEscada,
  xpDoJogo,
  aberturaDoJogo,
  REGRA_DO_MOMENTO,
} from "./jogos";

export type { PedacoNarravel } from "./narracao";
export { pedacosNarraveis, definirNarracao, idDaLinhaDaTabela } from "./narracao";

/**
 * Versao do formato de `aulas.conteudo`.
 * Sobe quando o formato deixar de ser compativel com o anterior, e nao quando
 * se acrescenta um tipo de bloco novo.
 */
export function versaoDoContrato(): number {
  return 1;
}
