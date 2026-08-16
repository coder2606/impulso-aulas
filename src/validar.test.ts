// Importa do que o pacote expõe, e não dos ficheiros por dentro: assim os
// testes provam também que o pacote entrega o que promete.
import { validarAula, blocosObrigatorios, mediaPorChave, NOMES_DE_FERRAMENTA } from './index';

const AULA_VALIDA = {
  versao: 1,
  sessao: 'f1-s1',
  titulo: 'Posso ser empreendedor?',
  duracao_min: 15,
  media: [
    { chave: 'historia.mp4', url: 'https://exemplo.b-cdn.net/x/play_720p.mp4', bytes: 8200000 },
    { chave: 'nhelete.mp3', url: 'https://exemplo.b-cdn.net/x/nhelete.mp3', bytes: 1500000 },
  ],
  blocos: [
    { id: 'b1', tipo: 'video', fonte: { chave: 'historia.mp4', duracao_seg: 118 }, legenda: 'A história do Rachide' },
    {
      id: 'b2',
      tipo: 'quiz',
      vidas: 3,
      tempo_seg: 15,
      xp_por_certa: 5,
      perguntas: [
        {
          id: 'p1',
          enunciado: 'O que é preciso para começar?',
          opcoes: [
            { id: 'a', texto: 'Muito dinheiro' },
            { id: 'b', texto: 'Algo que já sabes fazer' },
          ],
          correcta: 'b',
          explicacao: 'Começa-se pelo que já se sabe fazer.',
        },
      ],
    },
    {
      id: 'b3',
      tipo: 'formulario',
      titulo: 'Três coisas que sabes fazer bem',
      instrucao: 'Escreve três coisas.',
      obrigatorio_para_concluir: true,
      campos: [{ id: 'c1', rotulo: 'Sei fazer…', tipo: 'texto', obrigatorio: true, max_carateres: 120 }],
    },
    { id: 'b4', tipo: 'recompensa', medalha: 'primeiro-passo', partilhavel: true },
  ],
};

describe('validarAula', () => {
  it('aceita uma aula bem formada', () => {
    const r = validarAula(AULA_VALIDA);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.aula.blocos).toHaveLength(4);
  });

  it('rejeita valor que não é objecto', () => {
    expect(validarAula(null).ok).toBe(false);
    expect(validarAula('texto').ok).toBe(false);
  });

  it('rejeita versão desconhecida', () => {
    const r = validarAula({ ...AULA_VALIDA, versao: 2 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros[0].caminho).toBe('versao');
  });

  it('rejeita lista de blocos vazia', () => {
    const r = validarAula({ ...AULA_VALIDA, blocos: [] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros[0].caminho).toBe('blocos');
  });

  it('rejeita bloco de tipo desconhecido', () => {
    const r = validarAula({ ...AULA_VALIDA, blocos: [{ id: 'x', tipo: 'holograma' }] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros[0].mensagem).toContain('holograma');
  });

  it('rejeita identificadores de bloco repetidos', () => {
    const b = AULA_VALIDA.blocos[3];
    const r = validarAula({ ...AULA_VALIDA, blocos: [b, b] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros[0].mensagem).toContain('repetido');
  });

  it('rejeita vídeo cuja chave não existe na lista de media', () => {
    const r = validarAula({
      ...AULA_VALIDA,
      blocos: [{ id: 'b1', tipo: 'video', fonte: { chave: 'inexistente.mp4', duracao_seg: 10 } }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros[0].mensagem).toContain('inexistente.mp4');
  });

  it('rejeita quiz cuja resposta correcta não está nas opções', () => {
    const quiz = {
      id: 'b2',
      tipo: 'quiz',
      vidas: 3,
      tempo_seg: 15,
      xp_por_certa: 5,
      perguntas: [
        {
          id: 'p1',
          enunciado: 'E?',
          opcoes: [
            { id: 'a', texto: 'A' },
            { id: 'b', texto: 'B' },
          ],
          correcta: 'z',
          explicacao: 'x',
        },
      ],
    };
    const r = validarAula({ ...AULA_VALIDA, blocos: [quiz] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros[0].mensagem).toContain('correcta');
  });

  it('rejeita formulário sem campos', () => {
    const r = validarAula({
      ...AULA_VALIDA,
      blocos: [{ id: 'b3', tipo: 'formulario', titulo: 'T', instrucao: 'I', obrigatorio_para_concluir: true, campos: [] }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros[0].caminho).toContain('campos');
  });

  it('junta vários erros de uma vez', () => {
    const r = validarAula({ versao: 9, sessao: '', titulo: '', duracao_min: 0, media: [], blocos: [] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.length).toBeGreaterThan(1);
  });
});

describe('blocosObrigatorios', () => {
  it('devolve os ids dos blocos que travam a conclusão', () => {
    const r = validarAula(AULA_VALIDA);
    expect(r.ok).toBe(true);
    if (r.ok) expect(blocosObrigatorios(r.aula)).toEqual(['b3']);
  });

  it('considera qualquer tipo de bloco, não só o formulário', () => {
    const aula = {
      ...AULA_VALIDA,
      blocos: [
        {
          id: 'c1',
          tipo: 'checklist',
          titulo: 'Documentos',
          obrigatorio_para_concluir: true,
          itens: [{ id: 'i1', texto: 'Bilhete de identidade' }],
        },
        AULA_VALIDA.blocos[3],
      ],
    };
    const r = validarAula(aula);
    expect(r.ok).toBe(true);
    if (r.ok) expect(blocosObrigatorios(r.aula)).toEqual(['c1']);
  });

  it('devolve lista vazia quando nenhum bloco é obrigatório', () => {
    const aula = { ...AULA_VALIDA, blocos: [AULA_VALIDA.blocos[3]] } as unknown;
    const r = validarAula(aula);
    expect(r.ok).toBe(true);
    if (r.ok) expect(blocosObrigatorios(r.aula)).toEqual([]);
  });
});

describe('mediaPorChave', () => {
  it('indexa a media pela chave', () => {
    const r = validarAula(AULA_VALIDA);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const mapa = mediaPorChave(r.aula);
      expect(mapa.get('historia.mp4')?.bytes).toBe(8200000);
      expect(mapa.get('nao-existe')).toBeUndefined();
    }
  });
});

describe('bloco carrossel', () => {
  const CARROSSEL = {
    id: 'k1',
    tipo: 'carrossel',
    titulo: 'Ideias de negócio em Pemba',
    cartoes: [
      {
        id: 'c1',
        titulo: 'Reparação de telemóveis',
        texto: 'Precisa de ferramentas e de saber abrir aparelhos.',
        meta: [
          { rotulo: 'Capital mínimo', valor: '1.500 MT' },
          { rotulo: 'Lucro por serviço', valor: '150 MT' },
        ],
      },
      { id: 'c2', titulo: 'Venda de comida', texto: 'Precisa de panelas e de um ponto com movimento.' },
    ],
  };

  it('aceita um carrossel bem formado', () => {
    const r = validarAula({ ...AULA_VALIDA, blocos: [CARROSSEL] });
    expect(r.ok).toBe(true);
  });

  it('rejeita carrossel sem cartões', () => {
    const r = validarAula({ ...AULA_VALIDA, blocos: [{ ...CARROSSEL, cartoes: [] }] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros[0].caminho).toContain('cartoes');
  });

  it('rejeita cartão sem título', () => {
    const r = validarAula({
      ...AULA_VALIDA,
      blocos: [{ ...CARROSSEL, cartoes: [{ id: 'c1', texto: 'sem título' }] }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros[0].caminho).toContain('titulo');
  });

  it('rejeita par de meta sem valor', () => {
    const r = validarAula({
      ...AULA_VALIDA,
      blocos: [
        { ...CARROSSEL, cartoes: [{ id: 'c1', titulo: 'T', texto: 'x', meta: [{ rotulo: 'Capital' }] }] },
      ],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros[0].caminho).toContain('meta');
  });
});

describe('bloco passos', () => {
  const PASSOS = {
    id: 'g1',
    tipo: 'passos',
    titulo: 'Fotografia de produto em 5 passos',
    passos: [
      { id: 'p1', titulo: 'Procura luz natural', texto: 'Perto de uma janela, nunca contra o sol.' },
      { id: 'p2', titulo: 'Limpa o fundo', texto: 'Um pano liso chega. Tira o que distrai.' },
    ],
  };

  it('aceita um guia bem formado', () => {
    expect(validarAula({ ...AULA_VALIDA, blocos: [PASSOS] }).ok).toBe(true);
  });

  it('rejeita guia sem passos', () => {
    const r = validarAula({ ...AULA_VALIDA, blocos: [{ ...PASSOS, passos: [] }] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros[0].caminho).toContain('passos');
  });

  it('rejeita passo sem texto', () => {
    const r = validarAula({
      ...AULA_VALIDA,
      blocos: [{ ...PASSOS, passos: [{ id: 'p1', titulo: 'Só título' }] }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros[0].caminho).toContain('texto');
  });
});

describe('bloco desafio', () => {
  const DESAFIO = {
    id: 'd1',
    tipo: 'desafio',
    titulo: 'Sete dias de registos',
    instrucao: 'Regista todas as entradas e saídas do negócio durante sete dias.',
    prazo_dias: 7,
    rotulo_resultado: 'Quanto sobrou ao fim dos sete dias?',
  };

  it('aceita um desafio bem formado', () => {
    expect(validarAula({ ...AULA_VALIDA, blocos: [DESAFIO] }).ok).toBe(true);
  });

  it('rejeita prazo não positivo', () => {
    const r = validarAula({ ...AULA_VALIDA, blocos: [{ ...DESAFIO, prazo_dias: 0 }] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros[0].caminho).toContain('prazo_dias');
  });

  it('rejeita desafio sem rótulo de resultado', () => {
    const { rotulo_resultado, ...sem } = DESAFIO;
    const r = validarAula({ ...AULA_VALIDA, blocos: [sem] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros[0].caminho).toContain('rotulo_resultado');
  });
});

describe('bloco checklist', () => {
  const CHECK = {
    id: 'l1',
    tipo: 'checklist',
    titulo: 'Documentos para o NUIT',
    itens: [
      { id: 'i1', texto: 'Bilhete de identidade' },
      { id: 'i2', texto: 'Comprovativo de residência' },
    ],
  };

  it('aceita uma checklist bem formada', () => {
    expect(validarAula({ ...AULA_VALIDA, blocos: [CHECK] }).ok).toBe(true);
  });

  it('rejeita checklist sem itens', () => {
    const r = validarAula({ ...AULA_VALIDA, blocos: [{ ...CHECK, itens: [] }] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros[0].caminho).toContain('itens');
  });

  it('rejeita item sem texto', () => {
    const r = validarAula({ ...AULA_VALIDA, blocos: [{ ...CHECK, itens: [{ id: 'i1' }] }] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros[0].caminho).toContain('texto');
  });
});

describe('bloco audio_slides', () => {
  const AUDIO = {
    id: 'a1',
    tipo: 'audio_slides',
    titulo: 'A história da Nhelete',
    fonte: { chave: 'nhelete.mp3', duracao_seg: 180 },
    slides: [
      { chave: 'historia.mp4', ate_seg: 60, legenda: 'A Nhelete vendia comida na paragem.' },
      { chave: 'historia.mp4', ate_seg: 180 },
    ],
  };

  it('aceita áudio com imagens bem formado', () => {
    expect(validarAula({ ...AULA_VALIDA, blocos: [AUDIO] }).ok).toBe(true);
  });

  it('rejeita chave de áudio sem media correspondente', () => {
    const r = validarAula({
      ...AULA_VALIDA,
      blocos: [{ ...AUDIO, fonte: { chave: 'inexistente.mp3', duracao_seg: 10 } }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros[0].mensagem).toContain('inexistente.mp3');
  });

  it('rejeita slides fora de ordem crescente', () => {
    const r = validarAula({
      ...AULA_VALIDA,
      blocos: [{ ...AUDIO, slides: [{ chave: 'historia.mp4', ate_seg: 90 }, { chave: 'historia.mp4', ate_seg: 30 }] }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros[0].mensagem).toContain('crescente');
  });

  it('rejeita bloco sem slides', () => {
    const r = validarAula({ ...AULA_VALIDA, blocos: [{ ...AUDIO, slides: [] }] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros[0].caminho).toContain('slides');
  });
});

describe('bloco tabela', () => {
  const TABELA = {
    id: 't1',
    tipo: 'tabela',
    titulo: 'Opções de crédito em Cabo Delgado',
    colunas: ['Opção', 'Vantagem', 'Risco'],
    linhas: [
      ['Xitique', 'Sem juros', 'Depende do grupo'],
      ['Micro-crédito', 'Rápido', 'Juro alto'],
    ],
  };

  it('aceita uma tabela bem formada', () => {
    expect(validarAula({ ...AULA_VALIDA, blocos: [TABELA] }).ok).toBe(true);
  });

  it('rejeita tabela sem colunas', () => {
    const r = validarAula({ ...AULA_VALIDA, blocos: [{ ...TABELA, colunas: [] }] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros[0].caminho).toContain('colunas');
  });

  it('rejeita linha com número de células diferente do de colunas', () => {
    const r = validarAula({ ...AULA_VALIDA, blocos: [{ ...TABELA, linhas: [['Xitique', 'Sem juros']] }] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros[0].mensagem).toContain('3');
  });
});

describe('bloco autoavaliacao', () => {
  const AUTO = {
    id: 'v1',
    tipo: 'autoavaliacao',
    titulo: 'Onde estás hoje?',
    perguntas: [
      {
        id: 'q1',
        enunciado: 'Como te sentes quando pensas em começar um negócio?',
        opcoes: [
          { id: 'a', texto: 'Com medo' },
          { id: 'b', texto: 'Curioso' },
          { id: 'c', texto: 'Pronto para começar' },
        ],
      },
    ],
  };

  it('aceita autoavaliação bem formada', () => {
    expect(validarAula({ ...AULA_VALIDA, blocos: [AUTO] }).ok).toBe(true);
  });

  it('rejeita autoavaliação com resposta certa, que é o que a distingue do quiz', () => {
    const r = validarAula({
      ...AULA_VALIDA,
      blocos: [{ ...AUTO, perguntas: [{ ...AUTO.perguntas[0], correcta: 'a' }] }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros[0].mensagem).toContain('resposta certa');
  });

  it('rejeita pergunta com menos de duas opções', () => {
    const r = validarAula({
      ...AULA_VALIDA,
      blocos: [{ ...AUTO, perguntas: [{ id: 'q1', enunciado: 'E?', opcoes: [{ id: 'a', texto: 'A' }] }] }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros[0].caminho).toContain('opcoes');
  });
});

describe('ferramenta', () => {
  const FERRAMENTA = {
    id: 'b1',
    tipo: 'ferramenta',
    ferramenta: 'calc-custo-preco',
    titulo: 'Calcula o teu preço',
  };

  it('aceita uma ferramenta da lista', () => {
    expect(validarAula({ ...AULA_VALIDA, blocos: [FERRAMENTA] }).ok).toBe(true);
  });

  it('aceita instrução e parâmetros', () => {
    const r = validarAula({
      ...AULA_VALIDA,
      blocos: [
        {
          ...FERRAMENTA,
          instrucao: 'Põe os números do teu negócio',
          parametros: { custo_directo: 450, moeda: 'MZN' },
        },
      ],
    });
    expect(r.ok).toBe(true);
  });

  it('rejeita uma ferramenta que não existe', () => {
    const r = validarAula({
      ...AULA_VALIDA,
      blocos: [{ ...FERRAMENTA, ferramenta: 'calc-inventada' }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.erros[0].caminho).toBe('blocos[0].ferramenta');
      expect(r.erros[0].mensagem).toContain('calc-inventada');
    }
  });

  it('rejeita ferramenta em falta', () => {
    const r = validarAula({ ...AULA_VALIDA, blocos: [{ id: 'b1', tipo: 'ferramenta', titulo: 'Isto' }] });
    expect(r.ok).toBe(false);
  });

  it('rejeita titulo vazio', () => {
    const r = validarAula({ ...AULA_VALIDA, blocos: [{ ...FERRAMENTA, titulo: '  ' }] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.some((e) => e.caminho === 'blocos[0].titulo')).toBe(true);
  });

  it('rejeita parâmetros que não sejam texto nem número', () => {
    const r = validarAula({
      ...AULA_VALIDA,
      blocos: [{ ...FERRAMENTA, parametros: { mau: { aninhado: true } } }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.some((e) => e.caminho === 'blocos[0].parametros.mau')).toBe(true);
  });

  it('rejeita a ferramenta como actividade obrigatória', () => {
    const r = validarAula({
      ...AULA_VALIDA,
      blocos: [{ ...FERRAMENTA, obrigatorio_para_concluir: true }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros[0].mensagem).toContain('formulário');
  });

  it('a lista tem os oito nomes', () => {
    expect(NOMES_DE_FERRAMENTA).toHaveLength(8);
  });
});

describe('narração', () => {
  const MEDIA = [
    ...AULA_VALIDA.media,
    { chave: 'p1.mp3', url: 'https://exemplo.mz/p1.mp3', bytes: 21000 },
    { chave: 'p1-a.mp3', url: 'https://exemplo.mz/p1-a.mp3', bytes: 9000 },
  ];

  const quiz = (narracaoPergunta?: string, narracaoOpcao?: string) => ({
    id: 'b2',
    tipo: 'quiz',
    vidas: 3,
    tempo_seg: 15,
    xp_por_certa: 5,
    perguntas: [
      {
        id: 'p1',
        enunciado: 'O que é preciso para começar?',
        narracao: narracaoPergunta,
        opcoes: [
          { id: 'a', texto: 'Muito dinheiro', narracao: narracaoOpcao },
          { id: 'b', texto: 'Algo que já sabes fazer' },
        ],
        correcta: 'b',
        explicacao: 'Começa-se pelo que já se sabe fazer.',
      },
    ],
  });

  const autoavaliacao = (narracaoPergunta?: string, narracaoOpcao?: string) => ({
    id: 'b4',
    tipo: 'autoavaliacao',
    titulo: 'Três perguntas sobre ti',
    perguntas: [
      {
        id: 'q1',
        enunciado: 'Já vendeste alguma coisa?',
        narracao: narracaoPergunta,
        opcoes: [
          { id: 'a', texto: 'Sim, várias vezes', narracao: narracaoOpcao },
          { id: 'b', texto: 'Ainda não' },
        ],
      },
    ],
  });

  it('é opcional: a aula de sempre continua válida sem narração nenhuma', () => {
    expect(validarAula(AULA_VALIDA).ok).toBe(true);
  });

  it('aceita narração na pergunta e na opção quando as chaves existem em media', () => {
    const r = validarAula({ ...AULA_VALIDA, media: MEDIA, blocos: [quiz('p1.mp3', 'p1-a.mp3')] });
    expect(r.ok).toBe(true);
  });

  it('rejeita narração de pergunta com chave que não está em media', () => {
    const r = validarAula({ ...AULA_VALIDA, media: MEDIA, blocos: [quiz('nao-existe.mp3')] });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.erros[0].caminho).toContain('perguntas[0].narracao');
      expect(r.erros[0].mensagem).toContain('sem media correspondente');
    }
  });

  it('rejeita narração de opção com chave que não está em media', () => {
    const r = validarAula({ ...AULA_VALIDA, media: MEDIA, blocos: [quiz('p1.mp3', 'perdida.mp3')] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros[0].caminho).toContain('opcoes[0].narracao');
  });

  it('vale o mesmo na autoavaliação', () => {
    const bom = validarAula({ ...AULA_VALIDA, media: MEDIA, blocos: [autoavaliacao('p1.mp3', 'p1-a.mp3')] });
    expect(bom.ok).toBe(true);

    const mau = validarAula({ ...AULA_VALIDA, media: MEDIA, blocos: [autoavaliacao('fantasma.mp3')] });
    expect(mau.ok).toBe(false);
    if (!mau.ok) expect(mau.erros[0].caminho).toContain('perguntas[0].narracao');
  });

  it('rejeita narração de opção da autoavaliação com chave desconhecida', () => {
    const r = validarAula({ ...AULA_VALIDA, media: MEDIA, blocos: [autoavaliacao('p1.mp3', 'fantasma.mp3')] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros[0].caminho).toContain('opcoes[0].narracao');
  });

  it('aceita a instrução do bloco, escrita e narrada', () => {
    const bloco = { ...autoavaliacao('p1.mp3'), instrucao: 'Escolhe a que mais se parece contigo.', narracao_instrucao: 'p1-a.mp3' };
    expect(validarAula({ ...AULA_VALIDA, media: MEDIA, blocos: [bloco] }).ok).toBe(true);
  });

  it('rejeita instrução narrada com chave que não está em media', () => {
    const bloco = { ...autoavaliacao('p1.mp3'), narracao_instrucao: 'fantasma.mp3' };
    const r = validarAula({ ...AULA_VALIDA, media: MEDIA, blocos: [bloco] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros[0].caminho).toContain('narracao_instrucao');
  });

  it('a instrução do bloco vale também no quiz', () => {
    const bloco = { ...quiz('p1.mp3'), narracao_instrucao: 'fantasma.mp3' };
    const r = validarAula({ ...AULA_VALIDA, media: MEDIA, blocos: [bloco] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros[0].caminho).toContain('narracao_instrucao');
  });
});
