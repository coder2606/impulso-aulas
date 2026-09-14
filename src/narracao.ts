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

/**
 * A linha de uma tabela nao tem id, so posicao. E daqui que sai o nome dela.
 *
 * Exportado porque o leitor tambem precisa dele: e por este nome que ele vai
 * buscar o clipe de cada linha ao mapa `narracao_linhas`. Com a conta feita
 * dos dois lados, bastava um deles comecar em zero para a tabela toda passar a
 * ler a linha errada em voz alta, e sem erro nenhum a assinalar.
 */
export function idDaLinhaDaTabela(indice: number): string {
  return `l${indice + 1}`;
}

/**
 * Uma linha le-se em pares, com o nome da coluna antes da celula.
 *
 * Sem o nome da coluna, uma linha de tabela dita em voz alta e uma lista de
 * palavras soltas: quem ouve nao sabe se «50 MT» e o custo ou o lucro. Uma
 * celula sem coluna a condizer le-se na mesma, porque ficar calado seria pior.
 */
function textoDaLinha(colunas: string[], linha: string[]): string {
  return linha.map((celula, j) => (colunas[j] ? `${colunas[j]}: ${celula}.` : `${celula}.`)).join(' ');
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

  if (bloco.tipo === 'ferramenta') {
    return [
      {
        chave: `${bloco.id}.mp3`,
        rotulo: `Ferramenta, ${bloco.titulo}`,
        texto: bloco.instrucao ? `${bloco.titulo}. ${bloco.instrucao}` : `${bloco.titulo}.`,
        narracao: bloco.narracao,
      },
    ];
  }

  if (bloco.tipo === 'jogo') {
    // A missao, que se ouve no aviso, e depois uma voz por peca: a carta que
    // esta a frente, ou a ronda que abriu. Sao as mesmas chaves que a lista de
    // verificacao ja usa, e por isso o painel de narracao sabe mostra-las sem
    // aprender nada de novo.
    const missao = {
      chave: `${bloco.id}.mp3`,
      rotulo: `Jogo, ${bloco.titulo}`,
      texto: bloco.instrucao ? `${bloco.titulo}. ${bloco.instrucao}` : `${bloco.titulo}.`,
      narracao: bloco.narracao,
    };

    if (bloco.jogo === 'separar') {
      return [
        missao,
        ...bloco.dados.cartoes.map((c, i) => ({
          chave: `${bloco.id}-${c.id}.mp3`,
          rotulo: `Jogo, carta ${i + 1}`,
          texto: c.texto,
          narracao: c.narracao,
        })),
      ];
    }

    if (bloco.jogo === 'decidir') {
      return [
        missao,
        ...bloco.dados.rondas.map((r, i) => ({
          chave: `${bloco.id}-${r.id}.mp3`,
          rotulo: `Jogo, ronda ${i + 1}`,
          texto: `${r.situacao} ${r.pergunta}`,
          narracao: r.narracao,
        })),
      ];
    }

    // Na escada le-se a pergunta e as opcoes, como quem apresenta um concurso.
    // Ler so a pergunta obrigava a passar a vista pelas respostas, e entao o
    // jogo deixava de servir a quem segue a aula pela voz.
    return [
      missao,
      ...bloco.dados.degraus.map((g, i) => ({
        chave: `${bloco.id}-${g.id}.mp3`,
        rotulo: `Jogo, pergunta ${i + 1}`,
        texto: `${g.pergunta} ${g.opcoes.map((o) => o.rotulo).join('. ')}.`,
        narracao: g.narracao,
      })),
    ];
  }

  if (bloco.tipo === 'desafio') {
    // O prazo e o que se entrega fazem parte do enunciado: um desafio ouvido
    // sem eles deixa o jovem a saber o que fazer e nao ate quando.
    const dias = bloco.prazo_dias === 1 ? '1 dia' : `${bloco.prazo_dias} dias`;
    return [
      {
        chave: `${bloco.id}.mp3`,
        rotulo: `Desafio, ${bloco.titulo}`,
        texto: `${bloco.titulo}. ${bloco.instrucao} Tens ${dias}. No fim escreve: ${bloco.rotulo_resultado}.`,
        narracao: bloco.narracao,
      },
    ];
  }

  if (bloco.tipo === 'checklist') {
    return [
      {
        chave: `${bloco.id}.mp3`,
        rotulo: `Lista, ${bloco.titulo}`,
        texto: `${bloco.titulo}.`,
        narracao: bloco.narracao,
      },
      ...bloco.itens.map((item, i) => ({
        chave: `${bloco.id}-${item.id}.mp3`,
        rotulo: `Lista, item ${i + 1}`,
        texto: item.texto,
        narracao: item.narracao,
      })),
    ];
  }

  if (bloco.tipo === 'formulario') {
    return [
      {
        chave: `${bloco.id}.mp3`,
        rotulo: `Formulário, ${bloco.titulo}`,
        texto: `${bloco.titulo}. ${bloco.instrucao}`,
        narracao: bloco.narracao,
      },
      ...bloco.campos.map((campo, i) => ({
        chave: `${bloco.id}-${campo.id}.mp3`,
        rotulo: `Formulário, campo ${i + 1}, ${campo.rotulo}`,
        texto: campo.rotulo,
        narracao: campo.narracao,
      })),
    ];
  }

  if (bloco.tipo === 'tabela') {
    return [
      {
        chave: `${bloco.id}.mp3`,
        rotulo: `Tabela, ${bloco.titulo}`,
        texto: `${bloco.titulo}.`,
        narracao: bloco.narracao,
      },
      ...bloco.linhas.map((linha, i) => ({
        chave: `${bloco.id}-${idDaLinhaDaTabela(i)}.mp3`,
        rotulo: `Tabela, linha ${i + 1}`,
        texto: textoDaLinha(bloco.colunas, linha),
        narracao: bloco.narracao_linhas?.[idDaLinhaDaTabela(i)],
      })),
    ];
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

    if (bloco.tipo === 'ferramenta' || bloco.tipo === 'desafio') {
      return `${bloco.id}.mp3` === chave ? { ...bloco, narracao: valor } : bloco;
    }

    if (bloco.tipo === 'jogo') {
      if (`${bloco.id}.mp3` === chave) return { ...bloco, narracao: valor };

      if (bloco.jogo === 'separar') {
        if (!bloco.dados.cartoes.some((c) => `${bloco.id}-${c.id}.mp3` === chave)) return bloco;
        return {
          ...bloco,
          dados: {
            ...bloco.dados,
            cartoes: bloco.dados.cartoes.map((c) =>
              `${bloco.id}-${c.id}.mp3` === chave ? { ...c, narracao: valor } : c,
            ),
          },
        };
      }

      if (bloco.jogo === 'decidir') {
        if (!bloco.dados.rondas.some((r) => `${bloco.id}-${r.id}.mp3` === chave)) return bloco;
        return {
          ...bloco,
          dados: {
            ...bloco.dados,
            rondas: bloco.dados.rondas.map((r) =>
              `${bloco.id}-${r.id}.mp3` === chave ? { ...r, narracao: valor } : r,
            ),
          },
        };
      }

      if (!bloco.dados.degraus.some((g) => `${bloco.id}-${g.id}.mp3` === chave)) return bloco;
      return {
        ...bloco,
        dados: {
          ...bloco.dados,
          degraus: bloco.dados.degraus.map((g) =>
            `${bloco.id}-${g.id}.mp3` === chave ? { ...g, narracao: valor } : g,
          ),
        },
      };
    }

    if (bloco.tipo === 'checklist') {
      if (`${bloco.id}.mp3` === chave) return { ...bloco, narracao: valor };
      if (!bloco.itens.some((i) => `${bloco.id}-${i.id}.mp3` === chave)) return bloco;
      return {
        ...bloco,
        itens: bloco.itens.map((i) =>
          `${bloco.id}-${i.id}.mp3` === chave ? { ...i, narracao: valor } : i,
        ),
      };
    }

    if (bloco.tipo === 'formulario') {
      if (`${bloco.id}.mp3` === chave) return { ...bloco, narracao: valor };
      if (!bloco.campos.some((c) => `${bloco.id}-${c.id}.mp3` === chave)) return bloco;
      return {
        ...bloco,
        campos: bloco.campos.map((c) =>
          `${bloco.id}-${c.id}.mp3` === chave ? { ...c, narracao: valor } : c,
        ),
      };
    }

    if (bloco.tipo === 'tabela') {
      if (`${bloco.id}.mp3` === chave) return { ...bloco, narracao: valor };
      const n = bloco.linhas.findIndex((_, i) => `${bloco.id}-${idDaLinhaDaTabela(i)}.mp3` === chave);
      if (n < 0) return bloco;
      // Sem o mapa quando esta vazio: um `narracao_linhas: {}` no conteudo
      // publicado so faz quem le o JSON perguntar-se o que e que la faltava.
      const { narracao_linhas: antes, ...resto } = bloco;
      const linhas = { ...antes };
      if (valor === undefined) delete linhas[idDaLinhaDaTabela(n)];
      else linhas[idDaLinhaDaTabela(n)] = valor;
      return Object.keys(linhas).length > 0 ? { ...resto, narracao_linhas: linhas } : resto;
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
