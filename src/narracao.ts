/**
 * Onde e que uma aula leva voz.
 *
 * Vive no contrato, e nao no guiao que grava nem no construtor do dashboard,
 * porque os dois precisam da mesma resposta: quais sao os pedacos, por que
 * ordem se ouvem, e com que nome fica cada ficheiro. Com duas copias desta
 * lista, um clipe gravado pelo guiao deixava de ser encontrado pelo painel na
 * primeira vez que alguem mexesse num dos lados.
 */
import type { Bloco, ConteudoAula } from './blocos';

export type PedacoNarravel = {
  /** O nome que o ficheiro deve ter, derivado de onde o pedaco vive. */
  chave: string;
  /** Onde vive, escrito para uma pessoa: «Pergunta 2, resposta B». */
  rotulo: string;
  /** O que ha para dizer em voz alta. */
  texto: string;
  /** A chave ja atribuida, quando este pedaco ja tem audio. */
  narracao?: string;
};

/** Um guia le-se com o titulo antes do paragrafo, que e como se anuncia o assunto. */
function textoDoPasso(p: { titulo: string; texto: string }): string {
  return `${p.titulo}. ${p.texto}`;
}

/**
 * Um cartao le-se todo, o meta incluido.
 *
 * O meta parece detalhe de ecra, mas e onde estao os numeros: o capital minimo
 * de um negocio, onde e que ele costuma falhar. Quem ouve em vez de ler ficava
 * com a parte bonita do cartao e sem a parte que decide.
 */
function textoDoCartao(c: {
  titulo: string;
  texto: string;
  meta?: { rotulo: string; valor: string }[];
}): string {
  const partes = [textoDoPasso(c)];
  for (const m of c.meta ?? []) partes.push(`${m.rotulo}: ${m.valor}.`);
  return partes.join(' ');
}

function pedacosDoBloco(bloco: Bloco): PedacoNarravel[] {
  if (bloco.tipo === 'passos') {
    return bloco.passos.map((p, i) => ({
      chave: `${bloco.id}-${p.id}.mp3`,
      rotulo: `Passo ${i + 1}, ${p.titulo}`,
      texto: textoDoPasso(p),
      narracao: p.narracao,
    }));
  }

  if (bloco.tipo === 'carrossel') {
    return bloco.cartoes.map((c, i) => ({
      chave: `${bloco.id}-${c.id}.mp3`,
      rotulo: `Cartão ${i + 1}, ${c.titulo}`,
      texto: textoDoCartao(c),
      narracao: c.narracao,
    }));
  }

  if (bloco.tipo !== 'quiz' && bloco.tipo !== 'autoavaliacao') return [];

  const saida: PedacoNarravel[] = [];
  bloco.perguntas.forEach((p, i) => {
    saida.push({
      chave: `${bloco.id}-${p.id}.mp3`,
      rotulo: `Pergunta ${i + 1}`,
      texto: p.enunciado,
      narracao: p.narracao,
    });
    for (const o of p.opcoes) {
      saida.push({
        chave: `${bloco.id}-${p.id}-${o.id}.mp3`,
        rotulo: `Pergunta ${i + 1}, resposta ${o.id.toUpperCase()}`,
        texto: o.texto,
        narracao: o.narracao,
      });
    }
  });

  // Uma so por bloco, no fim: ouve-se depois das alternativas de cada pergunta,
  // mas grava-se uma vez.
  if (bloco.instrucao) {
    saida.push({
      chave: `${bloco.id}-instrucao.mp3`,
      rotulo: 'Instrução, ouve-se no fim de cada pergunta',
      texto: bloco.instrucao,
      narracao: bloco.narracao_instrucao,
    });
  }
  return saida;
}

/** Tudo o que numa aula pode ser lido em voz alta, pela ordem em que se ouve. */
export function pedacosNarraveis(aula: ConteudoAula): PedacoNarravel[] {
  return aula.blocos.flatMap(pedacosDoBloco);
}

/**
 * Prende, ou solta, o audio de um pedaco.
 *
 * Encontra o pedaco pela chave, que e unica dentro de uma aula porque vem do id
 * do bloco e do que la esta dentro. Devolve uma aula nova: quem chama isto e
 * quase sempre um ecra a reagir a um clique, e mudar o objecto por baixo dele
 * daria um ecra que nao se redesenha.
 */
export function definirNarracao(
  aula: ConteudoAula,
  chave: string,
  valor: string | undefined,
): ConteudoAula {
  const blocos = aula.blocos.map((bloco) => {
    if (bloco.tipo === 'passos') {
      if (!bloco.passos.some((p) => `${bloco.id}-${p.id}.mp3` === chave)) return bloco;
      return {
        ...bloco,
        passos: bloco.passos.map((p) =>
          `${bloco.id}-${p.id}.mp3` === chave ? { ...p, narracao: valor } : p,
        ),
      };
    }

    if (bloco.tipo === 'carrossel') {
      if (!bloco.cartoes.some((c) => `${bloco.id}-${c.id}.mp3` === chave)) return bloco;
      return {
        ...bloco,
        cartoes: bloco.cartoes.map((c) =>
          `${bloco.id}-${c.id}.mp3` === chave ? { ...c, narracao: valor } : c,
        ),
      };
    }

    if (bloco.tipo !== 'quiz' && bloco.tipo !== 'autoavaliacao') return bloco;

    if (chave === `${bloco.id}-instrucao.mp3`) {
      return { ...bloco, narracao_instrucao: valor };
    }

    let mexeu = false;
    const perguntas = bloco.perguntas.map((p) => {
      if (`${bloco.id}-${p.id}.mp3` === chave) {
        mexeu = true;
        return { ...p, narracao: valor };
      }
      if (!p.opcoes.some((o) => `${bloco.id}-${p.id}-${o.id}.mp3` === chave)) return p;
      mexeu = true;
      return {
        ...p,
        opcoes: p.opcoes.map((o) =>
          `${bloco.id}-${p.id}-${o.id}.mp3` === chave ? { ...o, narracao: valor } : o,
        ),
      };
    });
    return mexeu ? ({ ...bloco, perguntas } as Bloco) : bloco;
  });

  return { ...aula, blocos: blocos as Bloco[] };
}
