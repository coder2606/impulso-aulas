import { describe, expect, it } from 'vitest';
import { corrigirDecidir, corrigirSeparar, xpDoJogo } from './jogos';
import type { BlocoJogo, DadosDecidir, DadosSeparar } from './blocos';

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
