import { pedacosNarraveis, definirNarracao } from './index';
import type { ConteudoAula } from './index';

const aula = (blocos: unknown[]): ConteudoAula =>
  ({ versao: 1, sessao: 'f1-s0', titulo: 'T', duracao_min: 5, media: [], blocos }) as ConteudoAula;

const guia = {
  id: 'b1',
  tipo: 'passos',
  titulo: 'Antes de começar',
  passos: [
    { id: 'p1', titulo: 'Olá', texto: 'Bem-vindo.' },
    { id: 'p2', titulo: 'Depois', texto: 'Segue em frente.' },
  ],
};

const carrossel = {
  id: 'b3',
  tipo: 'carrossel',
  titulo: 'Dez negócios',
  cartoes: [
    {
      id: 'c1',
      titulo: 'Comida preparada',
      texto: 'Vende-se todos os dias.',
      meta: [
        { rotulo: 'Capital mínimo', valor: '300 a 800 MT' },
        { rotulo: 'Onde falha', valor: 'Cozinhar de mais' },
      ],
    },
    { id: 'c2', titulo: 'Costura', texto: 'Começa por bainhas.' },
  ],
};

const perguntas = {
  id: 'b2',
  tipo: 'autoavaliacao',
  titulo: 'Três perguntas',
  instrucao: 'Escolhe uma.',
  perguntas: [
    {
      id: 'q1',
      enunciado: 'Já vendeste?',
      opcoes: [
        { id: 'a', texto: 'Sim' },
        { id: 'b', texto: 'Ainda não' },
      ],
    },
  ],
};

describe('pedacosNarraveis', () => {
  it('dá um pedaço por passo do guia, com o título e o texto juntos', () => {
    const p = pedacosNarraveis(aula([guia]));
    expect(p).toHaveLength(2);
    expect(p[0].chave).toBe('b1-p1.mp3');
    expect(p[0].texto).toBe('Olá. Bem-vindo.');
  });

  it('lê uma pergunta pela ordem: enunciado, alternativas, e a instrução no fim', () => {
    const p = pedacosNarraveis(aula([perguntas]));
    expect(p.map((x) => x.chave)).toEqual([
      'b2-q1.mp3',
      'b2-q1-a.mp3',
      'b2-q1-b.mp3',
      'b2-instrucao.mp3',
    ]);
  });

  it('a instrução aparece uma vez só, mesmo com várias perguntas', () => {
    const doisQ = {
      ...perguntas,
      perguntas: [perguntas.perguntas[0], { ...perguntas.perguntas[0], id: 'q2' }],
    };
    const p = pedacosNarraveis(aula([doisQ]));
    expect(p.filter((x) => x.chave.endsWith('-instrucao.mp3'))).toHaveLength(1);
  });

  it('dá um pedaço por cartão do carrossel', () => {
    const p = pedacosNarraveis(aula([carrossel]));
    expect(p.map((x) => x.chave)).toEqual(['b3-c1.mp3', 'b3-c2.mp3']);
  });

  it('lê o meta do cartão a seguir ao texto, que é onde estão os números', () => {
    const p = pedacosNarraveis(aula([carrossel]));
    expect(p[0].texto).toBe(
      'Comida preparada. Vende-se todos os dias. Capital mínimo: 300 a 800 MT. Onde falha: Cozinhar de mais.',
    );
  });

  it('um cartão sem meta lê-se só com o título e o texto', () => {
    const p = pedacosNarraveis(aula([carrossel]));
    expect(p[1].texto).toBe('Costura. Começa por bainhas.');
  });

  it('o rótulo do cartão diz a posição e o nome', () => {
    const p = pedacosNarraveis(aula([carrossel]));
    expect(p[0].rotulo).toBe('Cartão 1, Comida preparada');
  });

  it('não inventa pedaços em blocos que não se narram', () => {
    const recompensa = { id: 'b9', tipo: 'recompensa', medalha: 'm', partilhavel: true };
    expect(pedacosNarraveis(aula([recompensa]))).toEqual([]);
  });

  it('sem instrução escrita não há pedaço de instrução', () => {
    const semInstrucao = { ...perguntas, instrucao: undefined };
    const p = pedacosNarraveis(aula([semInstrucao]));
    expect(p.some((x) => x.chave.endsWith('-instrucao.mp3'))).toBe(false);
  });

  it('diz qual a narração já atribuída', () => {
    const comAudio = {
      ...guia,
      passos: [{ ...guia.passos[0], narracao: 'b1-p1.mp3' }, guia.passos[1]],
    };
    const p = pedacosNarraveis(aula([comAudio]));
    expect(p[0].narracao).toBe('b1-p1.mp3');
    expect(p[1].narracao).toBeUndefined();
  });

  it('dá a cada pedaço um rótulo que se percebe sem ver o JSON', () => {
    const p = pedacosNarraveis(aula([perguntas]));
    expect(p[0].rotulo).toContain('Pergunta 1');
    expect(p[1].rotulo).toContain('A');
    expect(p[3].rotulo.toLowerCase()).toContain('instru');
  });
});

describe('definirNarracao', () => {
  it('prende a chave ao passo certo', () => {
    const nova = definirNarracao(aula([guia]), 'b1-p2.mp3', 'b1-p2.mp3');
    const p = pedacosNarraveis(nova);
    expect(p[1].narracao).toBe('b1-p2.mp3');
    expect(p[0].narracao).toBeUndefined();
  });

  it('prende ao enunciado, à alternativa e à instrução', () => {
    let a = aula([perguntas]);
    a = definirNarracao(a, 'b2-q1.mp3', 'b2-q1.mp3');
    a = definirNarracao(a, 'b2-q1-b.mp3', 'b2-q1-b.mp3');
    a = definirNarracao(a, 'b2-instrucao.mp3', 'b2-instrucao.mp3');
    const p = pedacosNarraveis(a);
    expect(p.map((x) => x.narracao)).toEqual([
      'b2-q1.mp3',
      undefined,
      'b2-q1-b.mp3',
      'b2-instrucao.mp3',
    ]);
  });

  it('prende a chave ao cartão certo do carrossel', () => {
    const nova = definirNarracao(aula([carrossel]), 'b3-c2.mp3', 'b3-c2.mp3');
    const p = pedacosNarraveis(nova);
    expect(p[1].narracao).toBe('b3-c2.mp3');
    expect(p[0].narracao).toBeUndefined();
  });

  it('desprende quando o valor é indefinido', () => {
    let a = definirNarracao(aula([guia]), 'b1-p1.mp3', 'b1-p1.mp3');
    a = definirNarracao(a, 'b1-p1.mp3', undefined);
    expect(pedacosNarraveis(a)[0].narracao).toBeUndefined();
  });

  it('não mexe na aula que recebeu', () => {
    const original = aula([guia]);
    definirNarracao(original, 'b1-p1.mp3', 'b1-p1.mp3');
    expect(pedacosNarraveis(original)[0].narracao).toBeUndefined();
  });

  it('uma chave que não existe deixa a aula igual', () => {
    const original = aula([guia]);
    const nova = definirNarracao(original, 'fantasma.mp3', 'fantasma.mp3');
    expect(JSON.stringify(nova)).toBe(JSON.stringify(original));
  });
});
