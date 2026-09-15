import { pedacosNarraveis, definirNarracao, idDaLinhaDaTabela, REGRA_DO_MOMENTO } from './index';
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

const ferramenta = {
  id: 'b4',
  tipo: 'ferramenta',
  ferramenta: 'catalogo-ideias',
  titulo: 'Filtra pelo que tens',
  instrucao: 'Diz quanto podes juntar e em que cidade estás.',
};

const desafio = {
  id: 'b5',
  tipo: 'desafio',
  titulo: 'Quinze minutos no bairro',
  instrucao: 'Anda quinze minutos sem telemóvel na mão. Anota três problemas.',
  prazo_dias: 2,
  rotulo_resultado: 'Os três problemas',
};

const checklist = {
  id: 'b6',
  tipo: 'checklist',
  titulo: 'Prepara o passeio',
  itens: [
    { id: 'i1', texto: 'Tenho onde escrever' },
    { id: 'i2', texto: 'Escolhi o percurso' },
  ],
};

const formulario = {
  id: 'b7',
  tipo: 'formulario',
  titulo: 'O que viste',
  instrucao: 'Escreve quando voltares.',
  obrigatorio_para_concluir: false,
  campos: [
    { id: 'c1', rotulo: 'Primeiro problema', tipo: 'texto', obrigatorio: false, max_carateres: 200 },
    { id: 'c2', rotulo: 'Segundo problema', tipo: 'texto', obrigatorio: false, max_carateres: 200 },
  ],
};

const tabela = {
  id: 'b8',
  tipo: 'tabela',
  titulo: 'Onde vender',
  colunas: ['Sítio', 'Custo', 'Quem passa'],
  linhas: [
    ['Mercado', '50 MT por dia', 'Muita gente de manhã'],
    ['Porta de casa', 'Nada', 'Só os vizinhos'],
  ],
};

describe('narração dos blocos de acção', () => {
  it('a ferramenta tem um pedaço, com o título antes da instrução', () => {
    const p = pedacosNarraveis(aula([ferramenta]));
    expect(p).toHaveLength(1);
    expect(p[0].chave).toBe('b4.mp3');
    expect(p[0].texto).toBe('Filtra pelo que tens. Diz quanto podes juntar e em que cidade estás.');
  });

  it('uma ferramenta sem instrução lê-se só pelo título', () => {
    const p = pedacosNarraveis(aula([{ ...ferramenta, instrucao: undefined }]));
    expect(p[0].texto).toBe('Filtra pelo que tens.');
  });

  it('o desafio diz o que fazer, em quantos dias, e o que trazer de volta', () => {
    const p = pedacosNarraveis(aula([desafio]));
    expect(p).toHaveLength(1);
    expect(p[0].chave).toBe('b5.mp3');
    expect(p[0].texto).toBe(
      'Quinze minutos no bairro. Anda quinze minutos sem telemóvel na mão. Anota três problemas. Tens 2 dias. No fim escreve: Os três problemas.',
    );
  });

  it('um desafio de um dia não diz «1 dias»', () => {
    const p = pedacosNarraveis(aula([{ ...desafio, prazo_dias: 1 }]));
    expect(p[0].texto).toContain('Tens 1 dia. ');
  });

  it('a checklist lê o título e depois cada item', () => {
    const p = pedacosNarraveis(aula([checklist]));
    expect(p.map((x) => x.chave)).toEqual(['b6.mp3', 'b6-i1.mp3', 'b6-i2.mp3']);
    expect(p[0].texto).toBe('Prepara o passeio.');
    expect(p[1].texto).toBe('Tenho onde escrever');
  });

  it('o formulário lê o título com a instrução e depois cada campo pelo rótulo', () => {
    const p = pedacosNarraveis(aula([formulario]));
    expect(p.map((x) => x.chave)).toEqual(['b7.mp3', 'b7-c1.mp3', 'b7-c2.mp3']);
    expect(p[0].texto).toBe('O que viste. Escreve quando voltares.');
    expect(p[1].texto).toBe('Primeiro problema');
  });

  it('a tabela lê o título e depois cada linha, coluna a coluna', () => {
    const p = pedacosNarraveis(aula([tabela]));
    expect(p.map((x) => x.chave)).toEqual(['b8.mp3', 'b8-l1.mp3', 'b8-l2.mp3']);
    expect(p[1].texto).toBe('Sítio: Mercado. Custo: 50 MT por dia. Quem passa: Muita gente de manhã.');
  });

  it('uma célula sem coluna a condizer lê-se na mesma', () => {
    const curta = { ...tabela, linhas: [['Mercado', '50 MT por dia', 'De manhã', 'Sobra']] };
    const p = pedacosNarraveis(aula([curta]));
    expect(p[1].texto).toContain('Sobra.');
  });

  it('dá rótulos que se percebem sem ver o JSON', () => {
    const p = pedacosNarraveis(aula([ferramenta, desafio, checklist, formulario, tabela]));
    const rotulos = p.map((x) => x.rotulo);
    expect(rotulos[0]).toBe('Ferramenta, Filtra pelo que tens');
    expect(rotulos[1]).toBe('Desafio, Quinze minutos no bairro');
    expect(rotulos[2]).toBe('Lista, Prepara o passeio');
    expect(rotulos[3]).toBe('Lista, item 1');
    expect(rotulos[6]).toBe('Formulário, campo 1, Primeiro problema');
    expect(rotulos[9]).toBe('Tabela, linha 1');
  });

  it('prende a chave à ferramenta e ao desafio', () => {
    let a = aula([ferramenta, desafio]);
    a = definirNarracao(a, 'b4.mp3', 'b4.mp3');
    a = definirNarracao(a, 'b5.mp3', 'b5.mp3');
    expect(pedacosNarraveis(a).map((x) => x.narracao)).toEqual(['b4.mp3', 'b5.mp3']);
  });

  it('prende a chave ao item certo da checklist, sem tocar no título', () => {
    const a = definirNarracao(aula([checklist]), 'b6-i2.mp3', 'b6-i2.mp3');
    expect(pedacosNarraveis(a).map((x) => x.narracao)).toEqual([undefined, undefined, 'b6-i2.mp3']);
  });

  it('prende a chave ao campo certo do formulário', () => {
    const a = definirNarracao(aula([formulario]), 'b7-c1.mp3', 'b7-c1.mp3');
    expect(pedacosNarraveis(a).map((x) => x.narracao)).toEqual([undefined, 'b7-c1.mp3', undefined]);
  });

  it('prende a chave à linha certa da tabela', () => {
    let a = definirNarracao(aula([tabela]), 'b8.mp3', 'b8.mp3');
    a = definirNarracao(a, 'b8-l2.mp3', 'b8-l2.mp3');
    expect(pedacosNarraveis(a).map((x) => x.narracao)).toEqual([
      'b8.mp3',
      undefined,
      'b8-l2.mp3',
    ]);
  });

  it('desprende a linha da tabela quando o valor é indefinido', () => {
    let a = definirNarracao(aula([tabela]), 'b8-l1.mp3', 'b8-l1.mp3');
    a = definirNarracao(a, 'b8-l1.mp3', undefined);
    expect(pedacosNarraveis(a)[1].narracao).toBeUndefined();
  });

  it('uma chave de linha que não existe deixa a tabela igual', () => {
    const original = aula([tabela]);
    const nova = definirNarracao(original, 'b8-l9.mp3', 'b8-l9.mp3');
    expect(JSON.stringify(nova)).toBe(JSON.stringify(original));
  });
});

describe('idDaLinhaDaTabela', () => {
  it('conta as linhas a partir de um, que é como o rótulo as diz', () => {
    expect(idDaLinhaDaTabela(0)).toBe('l1');
    expect(idDaLinhaDaTabela(2)).toBe('l3');
  });

  it('dá o mesmo nome que a chave do pedaço usa', () => {
    const p = pedacosNarraveis(aula([tabela]));
    expect(p[1].chave).toBe(`b8-${idDaLinhaDaTabela(0)}.mp3`);
  });
});

const jogo = {
  id: 'b9',
  tipo: 'jogo',
  jogo: 'separar',
  momento: 'depois',
  titulo: 'Ajuda a Nhelete',
  instrucao: 'Põe cada gasto no envelope certo.',
  xp: 20,
  xp_extra: 10,
  dados: {
    grupos: [
      { id: 'g1', rotulo: 'Negócio' },
      { id: 'g2', rotulo: 'Casa' },
    ],
    cartoes: [
      { id: 'c1', texto: 'Farinha para vender', grupo: 'g1' },
      { id: 'c2', texto: 'Escola do filho', grupo: 'g2' },
      { id: 'c3', texto: 'Balde da banca', grupo: 'g1' },
      { id: 'c4', texto: 'Peixe do jantar', grupo: 'g2' },
    ],
  },
};

describe('jogo', () => {
  it('lê a missão e depois cada carta', () => {
    const p = pedacosNarraveis(aula([jogo]));
    expect(p.map((x) => x.chave)).toEqual([
      'b9.mp3',
      'b9-c1.mp3',
      'b9-c2.mp3',
      'b9-c3.mp3',
      'b9-c4.mp3',
    ]);
    // A abertura apresenta o jogo pelo nome e acaba a dizer o que acontece ao
    // errar. Ver aberturaDoJogo, em jogos.ts.
    expect(p[0].texto).toBe(
      'Agora vamos a um jogo. Chama-se Ajuda a Nhelete. Põe cada gasto no envelope certo. ' +
        REGRA_DO_MOMENTO.depois,
    );
    expect(p[1].texto).toBe('Farinha para vender');
  });

  it('a voz de uma carta guarda-se dentro da carta', () => {
    const nova = definirNarracao(aula([jogo]), 'b9-c2.mp3', 'b9-c2.mp3');
    const b = nova.blocos[0] as unknown as { dados: { cartoes: { narracao?: string }[] } };
    expect(b.dados.cartoes[1].narracao).toBe('b9-c2.mp3');
    expect(b.dados.cartoes[0].narracao).toBeUndefined();
  });

  it('a missão guarda-se no bloco', () => {
    const nova = definirNarracao(aula([jogo]), 'b9.mp3', 'b9.mp3');
    expect((nova.blocos[0] as unknown as { narracao?: string }).narracao).toBe('b9.mp3');
  });
});

const escada = {
  id: 'b10',
  tipo: 'jogo',
  jogo: 'escada',
  momento: 'depois',
  titulo: 'A escada do dinheiro',
  instrucao: 'Sobe enquanto acertares.',
  xp: 25,
  xp_extra: 15,
  dados: {
    unidade: 'MT',
    degraus: [
      {
        id: 'd1',
        pergunta: 'O que é o lucro?',
        opcoes: [
          { id: 'a', rotulo: 'Tudo o que entra', explicacao: 'Isso é a venda.' },
          { id: 'b', rotulo: 'O que sobra dos custos', explicacao: 'É isso.' },
          { id: 'c', rotulo: 'O que está na caixa', explicacao: 'Lá também está o troco.' },
        ],
        certa: 'b',
        premio: 100,
      },
      {
        id: 'd2',
        pergunta: 'Quanto lucraste?',
        opcoes: [
          { id: 'a', rotulo: '200 MT', explicacao: 'Certo.' },
          { id: 'b', rotulo: '500 MT', explicacao: 'Esse é o que entrou.' },
          { id: 'c', rotulo: '800 MT', explicacao: 'Somaste.' },
        ],
        certa: 'a',
        premio: 300,
      },
      {
        id: 'd3',
        pergunta: 'De onde sai o teu salário?',
        opcoes: [
          { id: 'a', rotulo: 'Da caixa', explicacao: 'Come-se o capital.' },
          { id: 'b', rotulo: 'De um valor à parte', explicacao: 'É esse o envelope.' },
          { id: 'c', rotulo: 'Do lucro todo', explicacao: 'O negócio não cresce.' },
        ],
        certa: 'b',
        premio: 800,
      },
    ],
  },
};

describe('jogo da escada', () => {
  it('lê a missão e depois cada pergunta com as suas opções', () => {
    const p = pedacosNarraveis(aula([escada]));
    expect(p.map((x) => x.chave)).toEqual(['b10.mp3', 'b10-d1.mp3', 'b10-d2.mp3', 'b10-d3.mp3']);
    expect(p[1].texto).toBe(
      'O que é o lucro? Tudo o que entra. O que sobra dos custos. O que está na caixa.',
    );
  });

  it('a voz de um degrau guarda-se dentro do degrau', () => {
    const nova = definirNarracao(aula([escada]), 'b10-d2.mp3', 'b10-d2.mp3');
    const b = nova.blocos[0] as unknown as { dados: { degraus: { narracao?: string }[] } };
    expect(b.dados.degraus[1].narracao).toBe('b10-d2.mp3');
    expect(b.dados.degraus[0].narracao).toBeUndefined();
  });
});

const ordenar = {
  id: 'b11',
  tipo: 'jogo',
  jogo: 'ordenar',
  momento: 'antes',
  titulo: 'A venda da Sauda',
  instrucao: 'Põe os passos da venda pela ordem.',
  xp: 10,
  xp_extra: 5,
  dados: {
    fio: 'Do bom dia ao dinheiro na mão',
    passos: [
      { id: 'p1', texto: 'Cumprimenta o cliente' },
      { id: 'p2', texto: 'Pergunta para que é que ele precisa' },
      { id: 'p3', texto: 'Fecha com uma pergunta' },
    ],
  },
};

describe('jogo de ordenar', () => {
  it('lê a missão e depois cada passo, um clipe por carta', () => {
    const p = pedacosNarraveis(aula([ordenar]));
    expect(p.map((x) => x.chave)).toEqual(['b11.mp3', 'b11-p1.mp3', 'b11-p2.mp3', 'b11-p3.mp3']);
    expect(p[2].texto).toBe('Pergunta para que é que ele precisa');
    expect(p[2].rotulo).toBe('Jogo, passo 2');
  });

  it('a voz de um passo guarda-se dentro do passo', () => {
    const nova = definirNarracao(aula([ordenar]), 'b11-p3.mp3', 'b11-p3.mp3');
    const b = nova.blocos[0] as unknown as { dados: { passos: { narracao?: string }[] } };
    expect(b.dados.passos[2].narracao).toBe('b11-p3.mp3');
    expect(b.dados.passos[0].narracao).toBeUndefined();
  });
});

const cena = {
  id: 'b12',
  tipo: 'jogo',
  jogo: 'achar-erro',
  momento: 'depois',
  titulo: 'O caderno da Nhelete',
  instrucao: 'Acha o que está mal nesta página.',
  xp: 20,
  xp_extra: 10,
  dados: {
    cena: 'A página de segunda-feira',
    itens: [
      { id: 'i1', texto: 'Vendi 30 bolos, 300 meticais', errado: false },
      { id: 'i2', texto: 'Tirei 200 da caixa para a escola', errado: true },
      { id: 'i3', texto: 'Comprei farinha, 150 meticais', errado: false },
      { id: 'i4', texto: 'Vendi à vizinha, depois escrevo', errado: true },
    ],
  },
};

describe('jogo de achar o erro', () => {
  it('lê a missão e depois cada linha da cena, uma a uma', () => {
    const p = pedacosNarraveis(aula([cena]));
    expect(p.map((x) => x.chave)).toEqual([
      'b12.mp3',
      'b12-i1.mp3',
      'b12-i2.mp3',
      'b12-i3.mp3',
      'b12-i4.mp3',
    ]);
    expect(p[2].rotulo).toBe('Jogo, linha 2');
  });

  it('a voz de uma linha guarda-se dentro da linha', () => {
    const nova = definirNarracao(aula([cena]), 'b12-i4.mp3', 'b12-i4.mp3');
    const b = nova.blocos[0] as unknown as { dados: { itens: { narracao?: string }[] } };
    expect(b.dados.itens[3].narracao).toBe('b12-i4.mp3');
    expect(b.dados.itens[0].narracao).toBeUndefined();
  });
});
