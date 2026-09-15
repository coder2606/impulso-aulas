import { describe, expect, it } from 'vitest';
import {
  acharNaSopa,
  celulasDoRisco,
  corrigirSopa,
  ladoDaSopa,
  letrasDaPalavra,
  montarSopa,
} from './sopa';
import type { DadosSopa } from './blocos';

const SOPA: DadosSopa = {
  palavras: [
    { id: 'w1', texto: 'Capital', significado: 'O dinheiro que fica no negócio.' },
    { id: 'w2', texto: 'Poupança' },
    { id: 'w3', texto: 'Salário' },
    { id: 'w4', texto: 'Cliente' },
    { id: 'w5', texto: 'Lucro' },
    { id: 'w6', texto: 'Preço' },
  ],
};

/** Uma fonte de sorte que se repete, para a grelha sair igual em cada corrida. */
function sorteFixa(semente = 1) {
  let x = semente;
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
}

describe('letrasDaPalavra', () => {
  it('tira os acentos e a cedilha, que na grelha não existem', () => {
    expect(letrasDaPalavra('Poupança')).toBe('POUPANCA');
    expect(letrasDaPalavra('Preço')).toBe('PRECO');
    expect(letrasDaPalavra('Salário')).toBe('SALARIO');
  });

  it('deixa cair espaços e pontuação', () => {
    expect(letrasDaPalavra('conta corrente!')).toBe('CONTACORRENTE');
  });
});

describe('ladoDaSopa', () => {
  it('nunca sai mais pequena do que a palavra mais comprida', () => {
    const lado = ladoDaSopa({ palavras: [{ id: 'a', texto: 'financiamento' }] });
    expect(lado).toBeGreaterThanOrEqual(12);
  });

  it('não passa de doze, que é o que cabe num telemóvel', () => {
    const muitas = Array.from({ length: 8 }, (_, i) => ({ id: `w${i}`, texto: 'orcamento' }));
    expect(ladoDaSopa({ palavras: muitas })).toBeLessThanOrEqual(12);
  });
});

describe('montarSopa', () => {
  it('põe todas as palavras na grelha', () => {
    const sopa = montarSopa(SOPA, sorteFixa());
    expect(sopa.postas.map((p) => p.id).sort()).toEqual(['w1', 'w2', 'w3', 'w4', 'w5', 'w6']);
  });

  it('a grelha fica quadrada e sem buracos', () => {
    const sopa = montarSopa(SOPA, sorteFixa());
    expect(sopa.grelha).toHaveLength(sopa.lado);
    for (const linha of sopa.grelha) {
      expect(linha).toHaveLength(sopa.lado);
      for (const letra of linha) expect(letra).toMatch(/^[A-Z]$/);
    }
  });

  it('cada palavra lê-se mesmo nas células onde ficou', () => {
    const sopa = montarSopa(SOPA, sorteFixa(7));
    for (const posta of sopa.postas) {
      const lido = celulasDoRisco(posta.inicio, posta.fim)
        .map((c) => sopa.grelha[c.linha][c.coluna])
        .join('');
      // As células vêm sempre do canto superior esquerdo para o outro lado, e
      // a palavra pode ter sido posta ao contrário. Serve qualquer sentido.
      expect([lido, [...lido].reverse().join('')]).toContain(posta.letras);
    }
  });

  it('a mesma sorte dá a mesma grelha', () => {
    const a = montarSopa(SOPA, sorteFixa(3));
    const b = montarSopa(SOPA, sorteFixa(3));
    expect(a.grelha).toEqual(b.grelha);
  });

  it('respeita o lado escrito na aula', () => {
    expect(montarSopa({ ...SOPA, lado: 11 }, sorteFixa()).lado).toBe(11);
  });
});

describe('acharNaSopa', () => {
  it('conhece a palavra pelo risco de ponta a ponta', () => {
    const sopa = montarSopa(SOPA, sorteFixa(5));
    const posta = sopa.postas[0];
    expect(acharNaSopa(sopa, posta.inicio, posta.fim)).toBe(posta.id);
  });

  it('serve nos dois sentidos, que é como as pessoas riscam', () => {
    const sopa = montarSopa(SOPA, sorteFixa(5));
    const posta = sopa.postas[1];
    expect(acharNaSopa(sopa, posta.fim, posta.inicio)).toBe(posta.id);
  });

  it('um risco a meio da palavra não conta', () => {
    const sopa = montarSopa(SOPA, sorteFixa(5));
    const posta = sopa.postas.find((p) => p.letras.length > 4)!;
    const quaseFim =
      posta.direccao === 'horizontal'
        ? { linha: posta.fim.linha, coluna: posta.fim.coluna - 1 }
        : { linha: posta.fim.linha - 1, coluna: posta.fim.coluna };
    expect(acharNaSopa(sopa, posta.inicio, quaseFim)).toBeNull();
  });

  it('um risco às diagonais não apanha nada', () => {
    const sopa = montarSopa(SOPA, sorteFixa(5));
    expect(acharNaSopa(sopa, { linha: 0, coluna: 0 }, { linha: 3, coluna: 3 })).toBeNull();
  });
});

describe('celulasDoRisco', () => {
  it('conta as células de ponta a ponta, as duas incluídas', () => {
    expect(celulasDoRisco({ linha: 2, coluna: 1 }, { linha: 2, coluna: 4 })).toEqual([
      { linha: 2, coluna: 1 },
      { linha: 2, coluna: 2 },
      { linha: 2, coluna: 3 },
      { linha: 2, coluna: 4 },
    ]);
  });

  it('uma célula só é um risco de uma célula', () => {
    expect(celulasDoRisco({ linha: 1, coluna: 1 }, { linha: 1, coluna: 1 })).toHaveLength(1);
  });
});

describe('corrigirSopa', () => {
  it('conta as palavras achadas', () => {
    expect(corrigirSopa(SOPA, ['w1', 'w2'], 0).acertos).toBe(2);
  });

  it('a mesma palavra duas vezes conta uma', () => {
    expect(corrigirSopa(SOPA, ['w1', 'w1'], 0).acertos).toBe(1);
  });

  it('achar tudo com riscos a esmo pelo caminho não é sem falhas', () => {
    const todas = SOPA.palavras.map((p) => p.id);
    expect(corrigirSopa(SOPA, todas, 4).semFalhas).toBe(false);
    expect(corrigirSopa(SOPA, todas, 0).semFalhas).toBe(true);
  });
});
