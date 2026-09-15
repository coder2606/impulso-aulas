import { describe, expect, it } from 'vitest';
import {
  aberturaDoJogo,
  bancaDaEscada,
  baralharPassos,
  corrigirAcharErro,
  corrigirOrdenar,
  errosDaCena,
  passoCerto,
  corrigirDecidir,
  corrigirEscada,
  corrigirSeparar,
  REGRA_DO_MOMENTO,
  xpDoJogo,
} from './jogos';
import type {
  BlocoJogo,
  DadosAcharErro,
  DadosDecidir,
  DadosEscada,
  DadosOrdenar,
  DadosSeparar,
} from './blocos';

const SEPARAR: DadosSeparar = {
  grupos: [
    { id: 'g1', rotulo: 'Dinheiro do negócio' },
    { id: 'g2', rotulo: 'Dinheiro da casa' },
  ],
  cartoes: [
    { id: 'c1', texto: 'Comprar farinha para vender', grupo: 'g1' },
    { id: 'c2', texto: 'Pagar a escola do filho', grupo: 'g2' },
    { id: 'c3', texto: 'Trocar o balde da banca', grupo: 'g1' },
    { id: 'c4', texto: 'Comprar peixe para o jantar', grupo: 'g2' },
  ],
};

const DECIDIR: DadosDecidir = {
  unidade: 'MZN',
  rondas: [
    {
      id: 'r1',
      situacao: 'Cada pão custa-te 8 e vendes 50 por dia.',
      pergunta: 'Por quanto vendes cada um?',
      opcoes: [
        { id: 'o1', rotulo: '7 MZN', resultado: -50, explicacao: 'Abaixo do custo, perdes.' },
        { id: 'o2', rotulo: '12 MZN', resultado: 200, explicacao: 'Cobre o custo e sobra.' },
      ],
      melhor: 'o2',
    },
  ],
};

const ESCADA: DadosEscada = {
  unidade: 'MT',
  degraus: [
    {
      id: 'd1',
      pergunta: 'O que é o lucro?',
      opcoes: [
        { id: 'a', rotulo: 'Tudo o que entra', explicacao: 'Isso é a venda, não o lucro.' },
        { id: 'b', rotulo: 'O que sobra depois dos custos', explicacao: 'É isso mesmo.' },
        { id: 'c', rotulo: 'O que está na caixa', explicacao: 'Na caixa também está o troco.' },
      ],
      certa: 'b',
      premio: 100,
    },
    {
      id: 'd2',
      pergunta: 'Vendeste por 500 e gastaste 300. Quanto lucraste?',
      opcoes: [
        { id: 'a', rotulo: '200 MT', explicacao: 'Certo, 500 menos 300.' },
        { id: 'b', rotulo: '500 MT', explicacao: 'Esse é o dinheiro que entrou.' },
        { id: 'c', rotulo: '800 MT', explicacao: 'Somaste em vez de subtrair.' },
      ],
      certa: 'a',
      premio: 300,
      seguro: true,
    },
    {
      id: 'd3',
      pergunta: 'O teu salário sai de onde?',
      opcoes: [
        { id: 'a', rotulo: 'Da caixa, quando precisas', explicacao: 'Assim come-se o capital.' },
        { id: 'b', rotulo: 'De um valor combinado à parte', explicacao: 'É esse o envelope.' },
        { id: 'c', rotulo: 'Do lucro todo', explicacao: 'O negócio fica sem com que crescer.' },
      ],
      certa: 'b',
      premio: 800,
    },
  ],
};

describe('bancaDaEscada', () => {
  it('sobe a cada resposta certa', () => {
    expect(bancaDaEscada(ESCADA, { d1: 'b', d2: 'a', d3: 'b' })).toBe(800);
  });

  it('sem patamar seguro atrás, um erro deixa a zero', () => {
    expect(bancaDaEscada(ESCADA, { d1: 'a' })).toBe(0);
  });

  it('o patamar seguro segura a queda', () => {
    expect(bancaDaEscada(ESCADA, { d1: 'b', d2: 'a', d3: 'a' })).toBe(300);
  });

  it('quem para a meio fica com o que já tinha', () => {
    expect(bancaDaEscada(ESCADA, { d1: 'b' })).toBe(100);
  });

  it('errar no degrau seguro cai ao chão anterior, que ainda não existe', () => {
    expect(bancaDaEscada(ESCADA, { d1: 'b', d2: 'c' })).toBe(0);
  });

  it('depois de cair volta a subir', () => {
    expect(bancaDaEscada(ESCADA, { d1: 'a', d2: 'a', d3: 'b' })).toBe(800);
  });
});

describe('corrigirEscada', () => {
  it('conta as respostas certas', () => {
    expect(corrigirEscada(ESCADA, { d1: 'b', d2: 'a', d3: 'b' }, 0)).toEqual({
      acertos: 3,
      total: 3,
      erros: 0,
      semFalhas: true,
    });
  });

  it('uma falhada tira o sem falhas', () => {
    expect(corrigirEscada(ESCADA, { d1: 'b', d2: 'c', d3: 'b' }, 1)).toEqual({
      acertos: 2,
      total: 3,
      erros: 1,
      semFalhas: false,
    });
  });
});

describe('corrigirSeparar', () => {
  it('conta os cartões no grupo certo', () => {
    const r = corrigirSeparar(SEPARAR, { c1: 'g1', c2: 'g2', c3: 'g1', c4: 'g2' }, 0);
    expect(r).toEqual({ acertos: 4, total: 4, erros: 0, semFalhas: true });
  });

  it('um cartão no grupo errado não conta', () => {
    const r = corrigirSeparar(SEPARAR, { c1: 'g2', c2: 'g2', c3: 'g1', c4: 'g2' }, 1);
    expect(r).toEqual({ acertos: 3, total: 4, erros: 1, semFalhas: false });
  });

  it('cartões por colocar contam como não acertados', () => {
    const r = corrigirSeparar(SEPARAR, { c1: 'g1' }, 0);
    expect(r.acertos).toBe(1);
    expect(r.total).toBe(4);
  });

  it('um erro pelo caminho tira o sem falhas, mesmo acabando tudo certo', () => {
    const r = corrigirSeparar(SEPARAR, { c1: 'g1', c2: 'g2', c3: 'g1', c4: 'g2' }, 2);
    expect(r.semFalhas).toBe(false);
  });
});

describe('corrigirDecidir', () => {
  it('a melhor opção conta como acerto', () => {
    expect(corrigirDecidir(DECIDIR, { r1: 'o2' }, 0)).toEqual({
      acertos: 1,
      total: 1,
      erros: 0,
      semFalhas: true,
    });
  });

  it('a outra opção não conta', () => {
    expect(corrigirDecidir(DECIDIR, { r1: 'o1' }, 1).acertos).toBe(0);
  });

  it('ronda sem escolha não conta', () => {
    expect(corrigirDecidir(DECIDIR, {}, 0).acertos).toBe(0);
  });
});

describe('xpDoJogo', () => {
  const bloco = {
    id: 'b1',
    tipo: 'jogo',
    jogo: 'separar',
    momento: 'depois',
    titulo: 'Onde vai cada dinheiro',
    xp: 30,
    xp_extra: 10,
    dados: SEPARAR,
  } as BlocoJogo;

  it('paga o XP base por terminar, mesmo com erros', () => {
    expect(xpDoJogo(bloco, { acertos: 1, total: 4, erros: 3, semFalhas: false })).toBe(30);
  });

  it('junta o extra a quem acaba sem falhas', () => {
    expect(xpDoJogo(bloco, { acertos: 4, total: 4, erros: 0, semFalhas: true })).toBe(40);
  });
});

describe('aberturaDoJogo', () => {
  const base = {
    id: 'jogo-envelopes',
    tipo: 'jogo',
    jogo: 'separar',
    titulo: 'Ajuda a Nhelete',
    xp: 10,
    xp_extra: 5,
    dados: SEPARAR,
  } as const;

  it('apresenta o jogo pelo nome antes de mais nada', () => {
    const texto = aberturaDoJogo({ ...base, momento: 'depois' } as BlocoJogo);
    expect(texto.startsWith('Agora vamos a um jogo. Chama-se Ajuda a Nhelete.')).toBe(true);
  });

  it('lê a história, depois as regras, e no fim o que acontece ao errar', () => {
    const texto = aberturaDoJogo({
      ...base,
      momento: 'depois',
      instrucao: 'A Nhelete vende comida junto à paragem',
      regras: ['Arrasta a carta para o envelope', 'Podes tentar as vezes que quiseres'],
    } as BlocoJogo);

    expect(texto).toBe(
      'Agora vamos a um jogo. Chama-se Ajuda a Nhelete. ' +
        'A Nhelete vende comida junto à paragem. ' +
        'Como se joga. Arrasta a carta para o envelope. Podes tentar as vezes que quiseres. ' +
        REGRA_DO_MOMENTO.depois,
    );
  });

  it('avisa que o jogo de antes não corrige, que é a regra que mais confunde', () => {
    const texto = aberturaDoJogo({ ...base, momento: 'antes' } as BlocoJogo);
    expect(texto).toContain('No fim da aula jogamos outra vez');
  });

  it('não deixa regras sem ponto colarem-se umas às outras', () => {
    const texto = aberturaDoJogo({
      ...base,
      momento: 'depois',
      regras: ['Uma', 'Duas'],
    } as BlocoJogo);
    expect(texto).toContain('Como se joga. Uma. Duas.');
  });

  it('dispensa história e regras sem ficar sem apresentação', () => {
    const texto = aberturaDoJogo({ ...base, momento: 'depois' } as BlocoJogo);
    expect(texto).toBe(`Agora vamos a um jogo. Chama-se Ajuda a Nhelete. ${REGRA_DO_MOMENTO.depois}`);
  });
});

const ORDENAR: DadosOrdenar = {
  fio: 'Do bom dia ao dinheiro na mão',
  passos: [
    { id: 'p1', texto: 'Cumprimenta o cliente' },
    { id: 'p2', texto: 'Pergunta para que é que ele precisa' },
    { id: 'p3', texto: 'Mostra um produto de cada vez' },
    { id: 'p4', texto: 'Fecha a venda com uma pergunta' },
  ],
};

describe('corrigirOrdenar', () => {
  it('conta cada passo que ficou no seu lugar', () => {
    const r = corrigirOrdenar(ORDENAR, ['p1', 'p2', 'p3', 'p4'], 0);
    expect(r).toEqual({ acertos: 4, total: 4, erros: 0, semFalhas: true });
  });

  it('dois passos trocados custam os dois lugares, e não um', () => {
    const r = corrigirOrdenar(ORDENAR, ['p2', 'p1', 'p3', 'p4'], 0);
    expect(r.acertos).toBe(2);
    expect(r.semFalhas).toBe(false);
  });

  it('uma fila por acabar não inventa acertos', () => {
    expect(corrigirOrdenar(ORDENAR, ['p1', 'p2'], 0).acertos).toBe(2);
  });

  it('a fila certa montada com tropeções pelo caminho não é sem falhas', () => {
    expect(corrigirOrdenar(ORDENAR, ['p1', 'p2', 'p3', 'p4'], 2).semFalhas).toBe(false);
  });
});

describe('passoCerto', () => {
  it('conhece o passo que falta em cada posição', () => {
    expect(passoCerto(ORDENAR, 0, 'p1')).toBe(true);
    expect(passoCerto(ORDENAR, 0, 'p3')).toBe(false);
  });

  it('uma posição além do fim da fila não é certa a ninguém', () => {
    expect(passoCerto(ORDENAR, 9, 'p1')).toBe(false);
  });
});

describe('baralharPassos', () => {
  it('devolve os mesmos passos, todos', () => {
    const fila = baralharPassos(ORDENAR, () => 0.5);
    expect(fila.map((p) => p.id).sort()).toEqual(['p1', 'p2', 'p3', 'p4']);
  });

  it('nunca começa com o jogo resolvido, mesmo que a sorte o resolva', () => {
    // Com sorte nula o Fisher-Yates devolve tudo no sítio onde estava.
    const fila = baralharPassos(ORDENAR, () => 0);
    expect(fila.map((p) => p.id)).not.toEqual(['p1', 'p2', 'p3', 'p4']);
  });

  it('não mexe nos dados da aula', () => {
    baralharPassos(ORDENAR, () => 0.9);
    expect(ORDENAR.passos.map((p) => p.id)).toEqual(['p1', 'p2', 'p3', 'p4']);
  });
});

const CENA: DadosAcharErro = {
  cena: 'A página de segunda-feira do caderno da Nhelete',
  itens: [
    { id: 'i1', texto: 'Vendi 30 bolos, 300 meticais', errado: false },
    { id: 'i2', texto: 'Tirei 200 da caixa para a escola do filho', errado: true },
    { id: 'i3', texto: 'Comprei farinha, 150 meticais', errado: false },
    { id: 'i4', texto: 'Vendi à vizinha, depois escrevo', errado: true },
  ],
};

describe('corrigirAcharErro', () => {
  it('conta os erros apanhados, e não as linhas todas', () => {
    const r = corrigirAcharErro(CENA, ['i2', 'i4'], 0);
    expect(r).toEqual({ acertos: 2, total: 2, erros: 0, semFalhas: true });
  });

  it('uma linha certa marcada não conta como acerto', () => {
    const r = corrigirAcharErro(CENA, ['i1', 'i2'], 1);
    expect(r.acertos).toBe(1);
    expect(r.semFalhas).toBe(false);
  });

  it('quem não marca nada acaba a zero, e não a menos', () => {
    expect(corrigirAcharErro(CENA, [], 0).acertos).toBe(0);
  });

  it('apanhar tudo com tropeções pelo caminho não é sem falhas', () => {
    expect(corrigirAcharErro(CENA, ['i2', 'i4'], 1).semFalhas).toBe(false);
  });

  it('diz quais são as linhas erradas, pela ordem da cena', () => {
    expect(errosDaCena(CENA)).toEqual(['i2', 'i4']);
  });
});
