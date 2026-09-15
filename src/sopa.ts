import type { DadosSopa } from './blocos';
import type { ResultadoJogo } from './jogos';

/**
 * A grelha da sopa de letras, montada a partir das palavras.
 *
 * A grelha nao se escreve a mao no JSON da aula, de proposito. Quem monta a
 * aula escreve as palavras e mais nada: uma grelha escrita a mao e doze linhas
 * de letras onde ninguem ve um erro, e onde mudar uma palavra obriga a
 * redesenhar tudo. Aqui as palavras sao os dados e a grelha e uma consequencia.
 *
 * Vive no contrato, e nao em cada leitor, pela mesma razao que a correccao: a
 * grelha e o que o jovem ve no telemovel, o que ve no browser e o que o
 * construtor mostra a quem escreve. Tres montagens dariam tres grelhas
 * diferentes para a mesma aula.
 */

/** So horizontal e vertical. Diagonais num ecra de telemovel sao cacadas as cegas. */
export type DireccaoDaSopa = 'horizontal' | 'vertical';

export type Celula = { linha: number; coluna: number };

export type PalavraPosta = {
  id: string;
  /** Onde comeca a palavra. */
  inicio: Celula;
  /** Onde acaba. E a celula da ultima letra, e nao a seguinte. */
  fim: Celula;
  direccao: DireccaoDaSopa;
  /** As letras como foram postas: maiusculas e sem acentos. */
  letras: string;
};

export type Sopa = {
  lado: number;
  /** As letras, linha a linha. */
  grelha: string[][];
  postas: PalavraPosta[];
};

/** O alfabeto do enchimento, sem acentos e sem as letras que ca nao se usam. */
const ALFABETO = 'ABCDEFGHIJLMNOPQRSTUVXZ';

/**
 * A palavra como ela vive na grelha: maiusculas, sem acentos, sem espacos.
 *
 * «Preco» e «preço» tem de ser a mesma coisa na grelha, senao o C cedilhado
 * ficava numa celula sozinho e a palavra nunca se achava. O que se mostra na
 * lista continua a ser o que quem escreveu a aula escreveu.
 */
export function letrasDaPalavra(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase();
}

/**
 * Quantas letras de lado, quando a aula nao diz.
 *
 * Tem de caber a palavra mais comprida e sobrar espaco para as outras nao se
 * atropelarem todas. O tecto e doze porque acima disso a celula fica mais
 * pequena do que um dedo.
 */
export function ladoDaSopa(dados: DadosSopa): number {
  const palavras = dados.palavras.map((p) => letrasDaPalavra(p.texto));
  const maior = palavras.reduce((m, p) => Math.max(m, p.length), 0);
  const letras = palavras.reduce((t, p) => t + p.length, 0);
  const porArea = Math.ceil(Math.sqrt(letras * 2.2));
  const escolhido = Math.max(8, maior, porArea);
  return Math.min(12, Math.max(maior, Math.min(12, escolhido)));
}

function vazia(lado: number): (string | null)[][] {
  return Array.from({ length: lado }, () => Array.from({ length: lado }, () => null));
}

/** Se a palavra cabe aqui sem discutir com nenhuma letra ja posta. */
function cabe(
  grelha: (string | null)[][],
  letras: string,
  linha: number,
  coluna: number,
  direccao: DireccaoDaSopa,
): boolean {
  const lado = grelha.length;
  if (direccao === 'horizontal' && coluna + letras.length > lado) return false;
  if (direccao === 'vertical' && linha + letras.length > lado) return false;

  for (let i = 0; i < letras.length; i++) {
    const l = direccao === 'vertical' ? linha + i : linha;
    const c = direccao === 'horizontal' ? coluna + i : coluna;
    const posta = grelha[l][c];
    // Cruzar noutra palavra e bom, desde que a letra seja a mesma.
    if (posta !== null && posta !== letras[i]) return false;
  }
  return true;
}

function por(
  grelha: (string | null)[][],
  letras: string,
  linha: number,
  coluna: number,
  direccao: DireccaoDaSopa,
): void {
  for (let i = 0; i < letras.length; i++) {
    const l = direccao === 'vertical' ? linha + i : linha;
    const c = direccao === 'horizontal' ? coluna + i : coluna;
    grelha[l][c] = letras[i];
  }
}

/**
 * Monta a grelha.
 *
 * Tenta ao acaso um numero de vezes e, se nao acertar, varre a grelha por
 * ordem e fica no primeiro sitio que sirva. A varredura e o que garante que
 * isto nunca sai sem uma palavra: uma sopa a que falte uma das palavras da
 * lista e um jogo que nao se pode acabar.
 *
 * A fonte de sorte entra de fora para os testes poderem fixa-la, e para o
 * construtor poder mostrar sempre a mesma grelha enquanto se escreve.
 */
export function montarSopa(dados: DadosSopa, sorte: () => number = Math.random): Sopa {
  const lado = dados.lado ?? ladoDaSopa(dados);
  const grelha = vazia(lado);
  const postas: PalavraPosta[] = [];

  // As compridas primeiro: sao as que tem menos sitios onde caber.
  const porOrdem = [...dados.palavras]
    .map((p) => ({ id: p.id, letras: letrasDaPalavra(p.texto) }))
    .sort((a, b) => b.letras.length - a.letras.length);

  for (const palavra of porOrdem) {
    if (palavra.letras.length === 0 || palavra.letras.length > lado) continue;

    let pousada: { linha: number; coluna: number; direccao: DireccaoDaSopa } | null = null;

    for (let tentativa = 0; tentativa < 120 && pousada === null; tentativa++) {
      const direccao: DireccaoDaSopa = sorte() < 0.5 ? 'horizontal' : 'vertical';
      const linha = Math.floor(sorte() * lado);
      const coluna = Math.floor(sorte() * lado);
      if (cabe(grelha, palavra.letras, linha, coluna, direccao)) {
        pousada = { linha, coluna, direccao };
      }
    }

    if (pousada === null) {
      for (const direccao of ['horizontal', 'vertical'] as DireccaoDaSopa[]) {
        for (let linha = 0; linha < lado && pousada === null; linha++) {
          for (let coluna = 0; coluna < lado && pousada === null; coluna++) {
            if (cabe(grelha, palavra.letras, linha, coluna, direccao)) {
              pousada = { linha, coluna, direccao };
            }
          }
        }
        if (pousada !== null) break;
      }
    }

    if (pousada === null) continue;

    por(grelha, palavra.letras, pousada.linha, pousada.coluna, pousada.direccao);
    const ultimo = palavra.letras.length - 1;
    postas.push({
      id: palavra.id,
      inicio: { linha: pousada.linha, coluna: pousada.coluna },
      fim: {
        linha: pousada.direccao === 'vertical' ? pousada.linha + ultimo : pousada.linha,
        coluna: pousada.direccao === 'horizontal' ? pousada.coluna + ultimo : pousada.coluna,
      },
      direccao: pousada.direccao,
      letras: palavra.letras,
    });
  }

  // O enchimento sai das letras das proprias palavras mais o alfabeto. So com
  // o alfabeto apareciam K, W e Y no meio de palavras portuguesas, e as
  // palavras saltavam a vista sem se procurar nada.
  const caldo = postas.map((p) => p.letras).join('') + ALFABETO;
  const cheia: string[][] = grelha.map((linha) =>
    linha.map((letra) => letra ?? caldo[Math.floor(sorte() * caldo.length)]),
  );

  return { lado, grelha: cheia, postas };
}

/** As duas celulas estao na mesma linha, na mesma coluna, ou em nenhuma das duas? */
function alinhadas(a: Celula, b: Celula): DireccaoDaSopa | null {
  if (a.linha === b.linha) return 'horizontal';
  if (a.coluna === b.coluna) return 'vertical';
  return null;
}

/**
 * Que palavra e que este risco apanhou, se apanhou alguma.
 *
 * O risco tem de bater certo com a palavra inteira, de ponta a ponta, e nao
 * com um pedaco dela. Serve nos dois sentidos: quem risca da ultima letra para
 * a primeira achou a palavra na mesma, e dizer-lhe que nao seria uma regra que
 * ninguem percebia.
 */
export function acharNaSopa(sopa: Sopa, a: Celula, b: Celula): string | null {
  if (alinhadas(a, b) === null) return null;

  for (const posta of sopa.postas) {
    const iguais =
      (posta.inicio.linha === a.linha &&
        posta.inicio.coluna === a.coluna &&
        posta.fim.linha === b.linha &&
        posta.fim.coluna === b.coluna) ||
      (posta.inicio.linha === b.linha &&
        posta.inicio.coluna === b.coluna &&
        posta.fim.linha === a.linha &&
        posta.fim.coluna === a.coluna);
    if (iguais) return posta.id;
  }
  return null;
}

/** As celulas que um risco cobre, do principio ao fim. */
export function celulasDoRisco(a: Celula, b: Celula): Celula[] {
  const direccao = alinhadas(a, b);
  if (direccao === null) return [];

  const de = direccao === 'horizontal' ? Math.min(a.coluna, b.coluna) : Math.min(a.linha, b.linha);
  const ate = direccao === 'horizontal' ? Math.max(a.coluna, b.coluna) : Math.max(a.linha, b.linha);

  const celulas: Celula[] = [];
  for (let i = de; i <= ate; i++) {
    celulas.push(
      direccao === 'horizontal' ? { linha: a.linha, coluna: i } : { linha: i, coluna: a.coluna },
    );
  }
  return celulas;
}

/**
 * A conta da sopa.
 *
 * Os erros sao os riscos dados que nao apanharam palavra nenhuma. Nao ha
 * penalizacao por procurar: quem risca a esmo acaba a sopa na mesma, so nao
 * leva o extra de a ter feito sem falhar.
 */
export function corrigirSopa(
  dados: DadosSopa,
  achadas: string[],
  erros: number,
): ResultadoJogo {
  const ids = new Set(dados.palavras.map((p) => p.id));
  const acertos = [...new Set(achadas)].filter((id) => ids.has(id)).length;
  return {
    acertos,
    total: dados.palavras.length,
    erros,
    semFalhas: erros === 0 && acertos === dados.palavras.length,
  };
}
