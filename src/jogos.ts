import type { BlocoJogo, DadosDecidir, DadosSeparar } from './blocos';

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

/**
 * Quanto vale este jogo.
 *
 * O servidor faz esta mesma conta antes de somar, e e a dele que manda. Aqui
 * serve para o leitor poder dizer ao jovem o que ganhou sem esperar pela rede.
 */
export function xpDoJogo(bloco: BlocoJogo, resultado: ResultadoJogo): number {
  return bloco.xp + (resultado.semFalhas ? bloco.xp_extra : 0);
}
