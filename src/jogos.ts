import type {
  BlocoJogo,
  DadosDecidir,
  DadosEscada,
  DadosOrdenar,
  DadosSeparar,
  PassoOrdenar,
} from './blocos';

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
export const REGRA_DO_MOMENTO: Record<'antes' | 'depois', string> = {
  antes:
    'Neste não te digo se acertaste. Quero ver o que já sabes. No fim da aula jogamos outra vez, e aí digo.',
  depois: 'Aqui digo-te logo o que está certo e o que não está.',
};

/** Uma regra sem ponto final sai colada à seguinte quando é lida em voz alta. */
function terminada(linha: string): string {
  return /[.!?]$/.test(linha.trim()) ? linha.trim() : `${linha.trim()}.`;
}

/**
 * O que se diz quando um jogo abre, por esta ordem: que e um jogo, como se
 * chama, de que trata, como se joga, e o que acontece quando se erra.
 *
 * Antes disto a abertura era o titulo mais a historia, e mais nada. Quem nunca
 * tinha jogado aquilo chegava ao tabuleiro sem saber a mecanica e descobria-a a
 * tentar. Serve o ecra e o clipe gravado ao mesmo tempo, para nao haver duas
 * versoes da mesma apresentacao.
 */
export function aberturaDoJogo(bloco: BlocoJogo): string {
  const partes = [`Agora vamos a um jogo. Chama-se ${terminada(bloco.titulo)}`];
  if (bloco.instrucao) partes.push(terminada(bloco.instrucao));
  if (bloco.regras && bloco.regras.length > 0) {
    partes.push(`Como se joga. ${bloco.regras.map(terminada).join(' ')}`);
  }
  partes.push(REGRA_DO_MOMENTO[bloco.momento]);
  return partes.join(' ');
}

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
export type ResultadoJogo = {
  acertos: number;
  total: number;
  erros: number;
  semFalhas: boolean;
};

/** Onde o jovem pos cada cartao: id do cartao para id do grupo. */
export type Colocacoes = Record<string, string>;

/** O que o jovem escolheu em cada ronda: id da ronda para id da opcao. */
export type Escolhas = Record<string, string>;

export function cartaoCerto(dados: DadosSeparar, cartaoId: string, grupoId: string): boolean {
  const cartao = dados.cartoes.find((c) => c.id === cartaoId);
  return cartao !== undefined && cartao.grupo === grupoId;
}

export function corrigirSeparar(
  dados: DadosSeparar,
  colocacoes: Colocacoes,
  erros: number,
): ResultadoJogo {
  const acertos = dados.cartoes.filter((c) => colocacoes[c.id] === c.grupo).length;
  return {
    acertos,
    total: dados.cartoes.length,
    erros,
    semFalhas: erros === 0 && acertos === dados.cartoes.length,
  };
}

export function corrigirDecidir(
  dados: DadosDecidir,
  escolhas: Escolhas,
  erros: number,
): ResultadoJogo {
  const acertos = dados.rondas.filter((r) => escolhas[r.id] === r.melhor).length;
  return {
    acertos,
    total: dados.rondas.length,
    erros,
    semFalhas: erros === 0 && acertos === dados.rondas.length,
  };
}

export function corrigirEscada(
  dados: DadosEscada,
  respostas: Escolhas,
  erros: number,
): ResultadoJogo {
  const acertos = dados.degraus.filter((d) => respostas[d.id] === d.certa).length;
  return {
    acertos,
    total: dados.degraus.length,
    erros,
    semFalhas: erros === 0 && acertos === dados.degraus.length,
  };
}

/** A fila que o jovem montou: os ids dos passos, do primeiro ao ultimo. */
export type Ordem = string[];

/** Este passo e mesmo o que falta nesta posicao da fila? */
export function passoCerto(dados: DadosOrdenar, posicao: number, passoId: string): boolean {
  return dados.passos[posicao]?.id === passoId;
}

export function corrigirOrdenar(
  dados: DadosOrdenar,
  ordem: Ordem,
  erros: number,
): ResultadoJogo {
  const acertos = dados.passos.filter((p, i) => ordem[i] === p.id).length;
  return {
    acertos,
    total: dados.passos.length,
    erros,
    semFalhas: erros === 0 && acertos === dados.passos.length,
  };
}

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
export function baralharPassos(
  dados: DadosOrdenar,
  sorte: () => number = Math.random,
): PassoOrdenar[] {
  const fila = [...dados.passos];
  for (let i = fila.length - 1; i > 0; i -= 1) {
    const j = Math.floor(sorte() * (i + 1));
    [fila[i], fila[j]] = [fila[j], fila[i]];
  }

  const naOrdem = fila.every((p, i) => p.id === dados.passos[i]?.id);
  if (naOrdem && fila.length > 1) fila.push(fila.shift() as PassoOrdenar);

  return fila;
}

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
export function bancaDaEscada(dados: DadosEscada, respostas: Escolhas): number {
  let banca = 0;
  let chao = 0;

  for (const degrau of dados.degraus) {
    const resposta = respostas[degrau.id];
    if (resposta === undefined) break;

    if (resposta === degrau.certa) {
      banca = degrau.premio;
      if (degrau.seguro) chao = degrau.premio;
    } else {
      banca = chao;
    }
  }

  return banca;
}

/**
 * Quanto vale este jogo.
 *
 * O servidor faz esta mesma conta antes de somar, e e a dele que manda. Aqui
 * serve para o leitor poder dizer ao jovem o que ganhou sem esperar pela rede.
 */
export function xpDoJogo(bloco: BlocoJogo, resultado: ResultadoJogo): number {
  return bloco.xp + (resultado.semFalhas ? bloco.xp_extra : 0);
}
