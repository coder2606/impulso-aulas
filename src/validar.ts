/**
 * As regras que dizem se uma aula é aceitável.
 *
 * Devolvem a lista completa de erros e não só o primeiro, porque quem monta uma
 * aula prefere corrigir tudo de uma vez a descobrir um problema de cada vez.
 */

import type {
  Bloco,
  ConteudoAula,
  ErroValidacao,
  MediaRef,
  ResultadoValidacao,
} from './blocos';

import { NOMES_DE_FERRAMENTA, NOMES_DE_JOGO } from './blocos';
import { letrasDaPalavra } from './sopa';

/**
 * Tipos previstos pelo currículo completo. Um tipo que não esteja nesta lista é
 * recusado, para não haver conteúdo publicado que o leitor não sabe mostrar.
 */
const TIPOS_SUPORTADOS = [
  'video',
  'carrossel',
  'passos',
  'desafio',
  'checklist',
  'audio_slides',
  'tabela',
  'autoavaliacao',
  'quiz',
  'formulario',
  'ferramenta',
  'jogo',
  'recompensa',
] as const;

function eObjecto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function textoNaoVazio(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function inteiroPositivo(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v > 0;
}

function validarMedia(media: unknown, erros: ErroValidacao[]): MediaRef[] {
  if (!Array.isArray(media)) {
    erros.push({ caminho: 'media', mensagem: 'media tem de ser uma lista' });
    return [];
  }
  const saida: MediaRef[] = [];
  media.forEach((m, i) => {
    const c = `media[${i}]`;
    if (!eObjecto(m)) {
      erros.push({ caminho: c, mensagem: 'cada entrada de media tem de ser um objecto' });
      return;
    }
    if (!textoNaoVazio(m.chave)) erros.push({ caminho: `${c}.chave`, mensagem: 'chave em falta' });
    if (!textoNaoVazio(m.url)) erros.push({ caminho: `${c}.url`, mensagem: 'url em falta' });
    if (!inteiroPositivo(m.bytes)) erros.push({ caminho: `${c}.bytes`, mensagem: 'bytes tem de ser inteiro positivo' });
    if (textoNaoVazio(m.chave) && textoNaoVazio(m.url) && inteiroPositivo(m.bytes)) {
      saida.push({ chave: m.chave, url: m.url, bytes: m.bytes });
    }
  });
  return saida;
}

/**
 * A narracao e opcional, mas escrita e tem de apontar para media declarada.
 *
 * E este cruzamento que justifica o campo existir em vez de se combinar um
 * nome de ficheiro por convencao: uma chave mal escrita fica apanhada aqui, em
 * vez de dar um silencio que ninguem sabe explicar.
 */
function validarNarracao(
  valor: unknown,
  caminho: string,
  chaves: Set<string>,
  erros: ErroValidacao[],
): void {
  if (valor === undefined) return;
  if (!textoNaoVazio(valor)) {
    erros.push({ caminho, mensagem: 'narracao tem de ser uma chave de media' });
    return;
  }
  if (!chaves.has(valor)) {
    erros.push({ caminho, mensagem: `chave sem media correspondente: ${valor}` });
  }
}

/**
 * O audio das linhas de uma tabela, que vem num mapa e nao numa lista.
 *
 * Alem de cada chave ter de existir em `media`, o nome da entrada tem de
 * apontar para uma linha que a tabela tenha mesmo. Uma tabela que perde uma
 * linha ficava com um clipe orfao, e ninguem dava por ele: nao toca em lado
 * nenhum e nao ha erro nenhum a dizer porque.
 */
function validarNarracaoDasLinhas(
  valor: unknown,
  quantasLinhas: number,
  c: string,
  chaves: Set<string>,
  erros: ErroValidacao[],
): void {
  if (valor === undefined) return;
  if (!eObjecto(valor)) {
    erros.push({ caminho: `${c}.narracao_linhas`, mensagem: 'narracao_linhas tem de ser um objecto' });
    return;
  }
  for (const [linha, chave] of Object.entries(valor)) {
    const caminho = `${c}.narracao_linhas.${linha}`;
    const n = /^l([1-9][0-9]*)$/.exec(linha);
    if (!n || Number(n[1]) > quantasLinhas) {
      erros.push({ caminho, mensagem: `a tabela não tem a linha ${linha}` });
      continue;
    }
    validarNarracao(chave, caminho, chaves, erros);
  }
}

function validarBloco(b: unknown, i: number, chaves: Set<string>, erros: ErroValidacao[]): void {
  const c = `blocos[${i}]`;
  if (!eObjecto(b)) {
    erros.push({ caminho: c, mensagem: 'cada bloco tem de ser um objecto' });
    return;
  }
  if (!textoNaoVazio(b.id)) erros.push({ caminho: `${c}.id`, mensagem: 'id do bloco em falta' });
  if (typeof b.tipo !== 'string' || !(TIPOS_SUPORTADOS as readonly string[]).includes(b.tipo)) {
    erros.push({ caminho: `${c}.tipo`, mensagem: `tipo de bloco não suportado: ${String(b.tipo)}` });
    return;
  }

  if (b.tipo === 'video') {
    const f = b.fonte;
    if (!eObjecto(f)) {
      erros.push({ caminho: `${c}.fonte`, mensagem: 'fonte em falta' });
      return;
    }
    // Um vídeo `em_breve` está encomendado e ainda não existe. Declara a chave
    // que vai usar e a duração prevista, e é o único caso em que uma chave pode
    // não ter ficheiro do outro lado. O resto continua a ser exigido: sem chave
    // e sem duração ninguém sabe o que ali vai entrar nem quanto vai pesar.
    if (!textoNaoVazio(f.chave)) {
      erros.push({ caminho: `${c}.fonte.chave`, mensagem: 'chave do vídeo em falta' });
    } else if (!chaves.has(f.chave) && b.em_breve !== true) {
      erros.push({ caminho: `${c}.fonte.chave`, mensagem: `chave sem media correspondente: ${f.chave}` });
    }
    if (!inteiroPositivo(f.duracao_seg)) {
      erros.push({ caminho: `${c}.fonte.duracao_seg`, mensagem: 'duracao_seg tem de ser inteiro positivo' });
    }
    return;
  }

  if (b.tipo === 'quiz') {
    if (!inteiroPositivo(b.vidas)) erros.push({ caminho: `${c}.vidas`, mensagem: 'vidas tem de ser inteiro positivo' });
    if (!inteiroPositivo(b.tempo_seg)) erros.push({ caminho: `${c}.tempo_seg`, mensagem: 'tempo_seg tem de ser inteiro positivo' });
    if (typeof b.xp_por_certa !== 'number' || b.xp_por_certa < 0) {
      erros.push({ caminho: `${c}.xp_por_certa`, mensagem: 'xp_por_certa tem de ser número não negativo' });
    }
    validarNarracao(b.narracao_instrucao, `${c}.narracao_instrucao`, chaves, erros);
    if (!Array.isArray(b.perguntas) || b.perguntas.length === 0) {
      erros.push({ caminho: `${c}.perguntas`, mensagem: 'o quiz tem de ter pelo menos uma pergunta' });
      return;
    }
    b.perguntas.forEach((p: unknown, j: number) => {
      const cp = `${c}.perguntas[${j}]`;
      if (!eObjecto(p)) {
        erros.push({ caminho: cp, mensagem: 'cada pergunta tem de ser um objecto' });
        return;
      }
      if (!textoNaoVazio(p.id)) erros.push({ caminho: `${cp}.id`, mensagem: 'id da pergunta em falta' });
      if (!textoNaoVazio(p.enunciado)) erros.push({ caminho: `${cp}.enunciado`, mensagem: 'enunciado em falta' });
      if (!textoNaoVazio(p.explicacao)) erros.push({ caminho: `${cp}.explicacao`, mensagem: 'explicacao em falta' });
      validarNarracao(p.narracao, `${cp}.narracao`, chaves, erros);
      if (!Array.isArray(p.opcoes) || p.opcoes.length < 2) {
        erros.push({ caminho: `${cp}.opcoes`, mensagem: 'cada pergunta tem de ter pelo menos duas opções' });
        return;
      }
      const ids = p.opcoes.map((o: unknown) => (eObjecto(o) ? o.id : undefined));
      p.opcoes.forEach((o: unknown, k: number) => {
        if (!eObjecto(o) || !textoNaoVazio(o.id) || !textoNaoVazio(o.texto)) {
          erros.push({ caminho: `${cp}.opcoes[${k}]`, mensagem: 'opção precisa de id e texto' });
          return;
        }
        validarNarracao(o.narracao, `${cp}.opcoes[${k}].narracao`, chaves, erros);
      });
      if (!ids.includes(p.correcta)) {
        erros.push({ caminho: `${cp}.correcta`, mensagem: 'a resposta correcta não consta das opções' });
      }
    });
    return;
  }

  if (b.tipo === 'formulario') {
    if (!textoNaoVazio(b.titulo)) erros.push({ caminho: `${c}.titulo`, mensagem: 'titulo em falta' });
    if (!textoNaoVazio(b.instrucao)) erros.push({ caminho: `${c}.instrucao`, mensagem: 'instrucao em falta' });
    if (typeof b.obrigatorio_para_concluir !== 'boolean') {
      erros.push({ caminho: `${c}.obrigatorio_para_concluir`, mensagem: 'tem de ser booleano' });
    }
    if (!Array.isArray(b.campos) || b.campos.length === 0) {
      erros.push({ caminho: `${c}.campos`, mensagem: 'o formulário tem de ter pelo menos um campo' });
      return;
    }
    b.campos.forEach((f: unknown, j: number) => {
      const cf = `${c}.campos[${j}]`;
      if (!eObjecto(f)) {
        erros.push({ caminho: cf, mensagem: 'cada campo tem de ser um objecto' });
        return;
      }
      if (!textoNaoVazio(f.id)) erros.push({ caminho: `${cf}.id`, mensagem: 'id do campo em falta' });
      if (!textoNaoVazio(f.rotulo)) erros.push({ caminho: `${cf}.rotulo`, mensagem: 'rotulo em falta' });
      if (f.tipo !== 'texto' && f.tipo !== 'numero') {
        erros.push({ caminho: `${cf}.tipo`, mensagem: 'tipo do campo tem de ser texto ou numero' });
      }
      if (typeof f.obrigatorio !== 'boolean') erros.push({ caminho: `${cf}.obrigatorio`, mensagem: 'tem de ser booleano' });
      if (!inteiroPositivo(f.max_carateres)) {
        erros.push({ caminho: `${cf}.max_carateres`, mensagem: 'max_carateres tem de ser inteiro positivo' });
      }
      validarNarracao(f.narracao, `${cf}.narracao`, chaves, erros);
    });
    validarNarracao(b.narracao, `${c}.narracao`, chaves, erros);
    return;
  }

  if (b.tipo === 'carrossel') {
    if (!textoNaoVazio(b.titulo)) erros.push({ caminho: `${c}.titulo`, mensagem: 'titulo em falta' });
    if (!Array.isArray(b.cartoes) || b.cartoes.length === 0) {
      erros.push({ caminho: `${c}.cartoes`, mensagem: 'o carrossel tem de ter pelo menos um cartão' });
      return;
    }
    b.cartoes.forEach((k: unknown, j: number) => {
      const ck = `${c}.cartoes[${j}]`;
      if (!eObjecto(k)) {
        erros.push({ caminho: ck, mensagem: 'cada cartão tem de ser um objecto' });
        return;
      }
      if (!textoNaoVazio(k.id)) erros.push({ caminho: `${ck}.id`, mensagem: 'id do cartão em falta' });
      if (!textoNaoVazio(k.titulo)) erros.push({ caminho: `${ck}.titulo`, mensagem: 'titulo do cartão em falta' });
      if (!textoNaoVazio(k.texto)) erros.push({ caminho: `${ck}.texto`, mensagem: 'texto do cartão em falta' });
      validarNarracao(k.narracao, `${ck}.narracao`, chaves, erros);
      if (k.meta !== undefined) {
        if (!Array.isArray(k.meta)) {
          erros.push({ caminho: `${ck}.meta`, mensagem: 'meta tem de ser uma lista' });
          return;
        }
        k.meta.forEach((p: unknown, q: number) => {
          if (!eObjecto(p) || !textoNaoVazio(p.rotulo) || !textoNaoVazio(p.valor)) {
            erros.push({ caminho: `${ck}.meta[${q}]`, mensagem: 'cada meta precisa de rotulo e valor' });
          }
        });
      }
    });
    return;
  }

  if (b.tipo === 'passos') {
    if (!textoNaoVazio(b.titulo)) erros.push({ caminho: `${c}.titulo`, mensagem: 'titulo em falta' });
    if (!Array.isArray(b.passos) || b.passos.length === 0) {
      erros.push({ caminho: `${c}.passos`, mensagem: 'o guia tem de ter pelo menos um passo' });
      return;
    }
    b.passos.forEach((p: unknown, j: number) => {
      const cp = `${c}.passos[${j}]`;
      if (!eObjecto(p)) {
        erros.push({ caminho: cp, mensagem: 'cada passo tem de ser um objecto' });
        return;
      }
      if (!textoNaoVazio(p.id)) erros.push({ caminho: `${cp}.id`, mensagem: 'id do passo em falta' });
      if (!textoNaoVazio(p.titulo)) erros.push({ caminho: `${cp}.titulo`, mensagem: 'titulo do passo em falta' });
      if (!textoNaoVazio(p.texto)) erros.push({ caminho: `${cp}.texto`, mensagem: 'texto do passo em falta' });
      validarNarracao(p.narracao, `${cp}.narracao`, chaves, erros);
    });
    return;
  }

  if (b.tipo === 'desafio') {
    if (!textoNaoVazio(b.titulo)) erros.push({ caminho: `${c}.titulo`, mensagem: 'titulo em falta' });
    if (!textoNaoVazio(b.instrucao)) erros.push({ caminho: `${c}.instrucao`, mensagem: 'instrucao em falta' });
    if (!inteiroPositivo(b.prazo_dias)) {
      erros.push({ caminho: `${c}.prazo_dias`, mensagem: 'prazo_dias tem de ser inteiro positivo' });
    }
    if (!textoNaoVazio(b.rotulo_resultado)) {
      erros.push({ caminho: `${c}.rotulo_resultado`, mensagem: 'rotulo_resultado em falta' });
    }
    if (b.obrigatorio_para_concluir !== undefined && typeof b.obrigatorio_para_concluir !== 'boolean') {
      erros.push({ caminho: `${c}.obrigatorio_para_concluir`, mensagem: 'tem de ser booleano' });
    }
    validarNarracao(b.narracao, `${c}.narracao`, chaves, erros);
    return;
  }

  if (b.tipo === 'checklist') {
    if (!textoNaoVazio(b.titulo)) erros.push({ caminho: `${c}.titulo`, mensagem: 'titulo em falta' });
    if (b.obrigatorio_para_concluir !== undefined && typeof b.obrigatorio_para_concluir !== 'boolean') {
      erros.push({ caminho: `${c}.obrigatorio_para_concluir`, mensagem: 'tem de ser booleano' });
    }
    if (!Array.isArray(b.itens) || b.itens.length === 0) {
      erros.push({ caminho: `${c}.itens`, mensagem: 'a checklist tem de ter pelo menos um item' });
      return;
    }
    b.itens.forEach((t: unknown, j: number) => {
      const ct = `${c}.itens[${j}]`;
      if (!eObjecto(t)) {
        erros.push({ caminho: ct, mensagem: 'cada item tem de ser um objecto' });
        return;
      }
      if (!textoNaoVazio(t.id)) erros.push({ caminho: `${ct}.id`, mensagem: 'id do item em falta' });
      if (!textoNaoVazio(t.texto)) erros.push({ caminho: `${ct}.texto`, mensagem: 'texto do item em falta' });
      validarNarracao(t.narracao, `${ct}.narracao`, chaves, erros);
    });
    validarNarracao(b.narracao, `${c}.narracao`, chaves, erros);
    return;
  }

  if (b.tipo === 'audio_slides') {
    if (!textoNaoVazio(b.titulo)) erros.push({ caminho: `${c}.titulo`, mensagem: 'titulo em falta' });
    const f = b.fonte;
    if (!eObjecto(f)) {
      erros.push({ caminho: `${c}.fonte`, mensagem: 'fonte em falta' });
      return;
    }
    if (!textoNaoVazio(f.chave)) {
      erros.push({ caminho: `${c}.fonte.chave`, mensagem: 'chave do áudio em falta' });
    } else if (!chaves.has(f.chave)) {
      erros.push({ caminho: `${c}.fonte.chave`, mensagem: `chave sem media correspondente: ${f.chave}` });
    }
    if (!inteiroPositivo(f.duracao_seg)) {
      erros.push({ caminho: `${c}.fonte.duracao_seg`, mensagem: 'duracao_seg tem de ser inteiro positivo' });
    }
    if (!Array.isArray(b.slides) || b.slides.length === 0) {
      erros.push({ caminho: `${c}.slides`, mensagem: 'tem de haver pelo menos um slide' });
      return;
    }
    let anterior = 0;
    b.slides.forEach((s: unknown, j: number) => {
      const cs = `${c}.slides[${j}]`;
      if (!eObjecto(s)) {
        erros.push({ caminho: cs, mensagem: 'cada slide tem de ser um objecto' });
        return;
      }
      if (!textoNaoVazio(s.chave)) {
        erros.push({ caminho: `${cs}.chave`, mensagem: 'chave da imagem em falta' });
      } else if (!chaves.has(s.chave)) {
        erros.push({ caminho: `${cs}.chave`, mensagem: `chave sem media correspondente: ${s.chave}` });
      }
      if (!inteiroPositivo(s.ate_seg)) {
        erros.push({ caminho: `${cs}.ate_seg`, mensagem: 'ate_seg tem de ser inteiro positivo' });
      } else if (s.ate_seg <= anterior) {
        erros.push({ caminho: `${cs}.ate_seg`, mensagem: 'os slides têm de estar por ordem crescente de ate_seg' });
      } else {
        anterior = s.ate_seg;
      }
    });
    return;
  }

  if (b.tipo === 'tabela') {
    if (!textoNaoVazio(b.titulo)) erros.push({ caminho: `${c}.titulo`, mensagem: 'titulo em falta' });
    if (!Array.isArray(b.colunas) || b.colunas.length === 0) {
      erros.push({ caminho: `${c}.colunas`, mensagem: 'a tabela tem de ter pelo menos uma coluna' });
      return;
    }
    if (!b.colunas.every((x: unknown) => textoNaoVazio(x))) {
      erros.push({ caminho: `${c}.colunas`, mensagem: 'cada coluna tem de ser texto não vazio' });
    }
    if (!Array.isArray(b.linhas) || b.linhas.length === 0) {
      erros.push({ caminho: `${c}.linhas`, mensagem: 'a tabela tem de ter pelo menos uma linha' });
      return;
    }
    b.linhas.forEach((l: unknown, j: number) => {
      if (!Array.isArray(l) || l.length !== (b.colunas as unknown[]).length) {
        erros.push({
          caminho: `${c}.linhas[${j}]`,
          mensagem: `a linha tem de ter ${(b.colunas as unknown[]).length} células`,
        });
        return;
      }
      if (!l.every((x: unknown) => typeof x === 'string')) {
        erros.push({ caminho: `${c}.linhas[${j}]`, mensagem: 'cada célula tem de ser texto' });
      }
    });
    validarNarracao(b.narracao, `${c}.narracao`, chaves, erros);
    validarNarracaoDasLinhas(b.narracao_linhas, (b.linhas as unknown[]).length, c, chaves, erros);
    return;
  }

  if (b.tipo === 'autoavaliacao') {
    if (!textoNaoVazio(b.titulo)) erros.push({ caminho: `${c}.titulo`, mensagem: 'titulo em falta' });
    if (b.obrigatorio_para_concluir !== undefined && typeof b.obrigatorio_para_concluir !== 'boolean') {
      erros.push({ caminho: `${c}.obrigatorio_para_concluir`, mensagem: 'tem de ser booleano' });
    }
    validarNarracao(b.narracao_instrucao, `${c}.narracao_instrucao`, chaves, erros);
    if (!Array.isArray(b.perguntas) || b.perguntas.length === 0) {
      erros.push({ caminho: `${c}.perguntas`, mensagem: 'tem de haver pelo menos uma pergunta' });
      return;
    }
    b.perguntas.forEach((p: unknown, j: number) => {
      const cp = `${c}.perguntas[${j}]`;
      if (!eObjecto(p)) {
        erros.push({ caminho: cp, mensagem: 'cada pergunta tem de ser um objecto' });
        return;
      }
      if (!textoNaoVazio(p.id)) erros.push({ caminho: `${cp}.id`, mensagem: 'id da pergunta em falta' });
      if (!textoNaoVazio(p.enunciado)) erros.push({ caminho: `${cp}.enunciado`, mensagem: 'enunciado em falta' });
      if (p.correcta !== undefined) {
        erros.push({
          caminho: `${cp}.correcta`,
          mensagem: 'a autoavaliação não tem resposta certa. Se há resposta certa, o bloco é um quiz',
        });
      }
      validarNarracao(p.narracao, `${cp}.narracao`, chaves, erros);
      if (!Array.isArray(p.opcoes) || p.opcoes.length < 2) {
        erros.push({ caminho: `${cp}.opcoes`, mensagem: 'cada pergunta tem de ter pelo menos duas opções' });
        return;
      }
      p.opcoes.forEach((o: unknown, k: number) => {
        if (!eObjecto(o) || !textoNaoVazio(o.id) || !textoNaoVazio(o.texto)) {
          erros.push({ caminho: `${cp}.opcoes[${k}]`, mensagem: 'opção precisa de id e texto' });
          return;
        }
        validarNarracao(o.narracao, `${cp}.opcoes[${k}].narracao`, chaves, erros);
      });
    });
    return;
  }

  if (b.tipo === 'ferramenta') {
    if (!textoNaoVazio(b.titulo)) erros.push({ caminho: `${c}.titulo`, mensagem: 'titulo em falta' });

    if (typeof b.ferramenta !== 'string' || !(NOMES_DE_FERRAMENTA as readonly string[]).includes(b.ferramenta)) {
      erros.push({
        caminho: `${c}.ferramenta`,
        mensagem: `ferramenta desconhecida: ${String(b.ferramenta)}. As disponíveis são ${NOMES_DE_FERRAMENTA.join(', ')}`,
      });
    }

    if (b.instrucao !== undefined && !textoNaoVazio(b.instrucao)) {
      erros.push({ caminho: `${c}.instrucao`, mensagem: 'se a instrução existir, não pode ser vazia' });
    }

    validarNarracao(b.narracao, `${c}.narracao`, chaves, erros);

    if (b.parametros !== undefined) {
      if (!eObjecto(b.parametros)) {
        erros.push({ caminho: `${c}.parametros`, mensagem: 'parametros tem de ser um objecto' });
      } else {
        for (const [chave, valor] of Object.entries(b.parametros)) {
          if (typeof valor !== 'string' && typeof valor !== 'number') {
            erros.push({
              caminho: `${c}.parametros.${chave}`,
              mensagem: 'cada parâmetro tem de ser texto ou número',
            });
          }
        }
      }
    }

    // A base de dados só sabe verificar respostas submetidas, e uma ferramenta
    // não submete nada. Deixar travar aqui daria sessões impossíveis de fechar.
    if (b.obrigatorio_para_concluir !== undefined) {
      erros.push({
        caminho: `${c}.obrigatorio_para_concluir`,
        mensagem: 'a ferramenta não pode travar a conclusão. Use um formulário ou uma lista de verificação',
      });
    }
    return;
  }

  if (b.tipo === 'jogo') {
    if (!textoNaoVazio(b.titulo)) erros.push({ caminho: `${c}.titulo`, mensagem: 'titulo em falta' });

    if (typeof b.jogo !== 'string' || !(NOMES_DE_JOGO as readonly string[]).includes(b.jogo)) {
      erros.push({
        caminho: `${c}.jogo`,
        mensagem: `jogo desconhecido: ${String(b.jogo)}. Os disponíveis são ${NOMES_DE_JOGO.join(', ')}`,
      });
      return;
    }

    if (b.momento !== 'antes' && b.momento !== 'depois') {
      erros.push({ caminho: `${c}.momento`, mensagem: 'momento tem de ser antes ou depois' });
    }

    for (const campo of ['xp', 'xp_extra'] as const) {
      const v = b[campo];
      if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > 100) {
        erros.push({ caminho: `${c}.${campo}`, mensagem: `${campo} tem de ser um inteiro entre 0 e 100` });
      }
    }

    if (b.instrucao !== undefined && !textoNaoVazio(b.instrucao)) {
      erros.push({ caminho: `${c}.instrucao`, mensagem: 'se a instrução existir, não pode ser vazia' });
    }

    // As regras são lidas em voz alta na abertura, uma a seguir à outra. Seis
    // linhas já são meio minuto de instruções antes de se jogar o que quer que
    // seja, e a essa altura ninguém se lembra da primeira.
    if (b.regras !== undefined) {
      if (!Array.isArray(b.regras) || b.regras.length === 0 || b.regras.length > 5) {
        erros.push({ caminho: `${c}.regras`, mensagem: 'regras tem de ser uma lista de 1 a 5 linhas' });
      } else {
        b.regras.forEach((r, i) => {
          if (!textoNaoVazio(r)) {
            erros.push({ caminho: `${c}.regras[${i}]`, mensagem: 'regra vazia' });
          }
        });
      }
    }

    validarNarracao(b.narracao, `${c}.narracao`, chaves, erros);

    // A mesma regra da ferramenta, e pela mesma razão: a base de dados só sabe
    // verificar respostas submetidas, e um jogo não submete nenhuma.
    if (b.obrigatorio_para_concluir !== undefined) {
      erros.push({
        caminho: `${c}.obrigatorio_para_concluir`,
        mensagem: 'o jogo não pode travar a conclusão. Use um formulário ou uma lista de verificação',
      });
    }

    const dados = b.dados;
    if (!eObjecto(dados)) {
      erros.push({ caminho: `${c}.dados`, mensagem: 'dados em falta' });
      return;
    }

    if (b.jogo === 'separar') validarSeparar(dados, `${c}.dados`, chaves, erros);
    if (b.jogo === 'decidir') validarDecidir(dados, `${c}.dados`, chaves, erros);
    if (b.jogo === 'escada') validarEscada(dados, `${c}.dados`, chaves, erros);
    if (b.jogo === 'ordenar') validarOrdenar(dados, `${c}.dados`, chaves, erros);
    if (b.jogo === 'achar-erro') validarAcharErro(dados, `${c}.dados`, chaves, erros);
    if (b.jogo === 'frase') validarFrase(dados, `${c}.dados`, chaves, erros);
    if (b.jogo === 'sopa') validarSopa(b, dados, `${c}.dados`, c, chaves, erros);
    return;
  }

  // recompensa
  if (!textoNaoVazio(b.medalha)) erros.push({ caminho: `${c}.medalha`, mensagem: 'medalha em falta' });
  if (typeof b.partilhavel !== 'boolean') erros.push({ caminho: `${c}.partilhavel`, mensagem: 'tem de ser booleano' });
}

/**
 * O jogo de separar: grupos com nome, cartões que apontam para um deles, e
 * nenhum grupo vazio.
 *
 * Um grupo sem cartões não é um erro de escrita distraída: é uma coluna que o
 * jovem vê e nunca consegue encher, e no ecrã parece avaria.
 */
function validarSeparar(
  d: Record<string, unknown>,
  c: string,
  chaves: Set<string>,
  erros: ErroValidacao[],
): void {
  const grupos = Array.isArray(d.grupos) ? d.grupos : [];
  const cartoes = Array.isArray(d.cartoes) ? d.cartoes : [];

  if (grupos.length < 2 || grupos.length > 4) {
    erros.push({ caminho: `${c}.grupos`, mensagem: 'entre dois e quatro grupos' });
  }
  if (cartoes.length < 4 || cartoes.length > 12) {
    erros.push({ caminho: `${c}.cartoes`, mensagem: 'entre quatro e doze cartões' });
  }

  const idsDeGrupo = new Set<string>();
  grupos.forEach((g, i) => {
    if (!eObjecto(g) || !textoNaoVazio(g.id) || !textoNaoVazio(g.rotulo)) {
      erros.push({ caminho: `${c}.grupos[${i}]`, mensagem: 'grupo precisa de id e rótulo' });
      return;
    }
    if (idsDeGrupo.has(g.id)) {
      erros.push({ caminho: `${c}.grupos[${i}].id`, mensagem: `id repetido: ${g.id}` });
    }
    idsDeGrupo.add(g.id);
  });

  const usados = new Set<string>();
  const idsDeCartao = new Set<string>();
  cartoes.forEach((k, i) => {
    if (!eObjecto(k) || !textoNaoVazio(k.id) || !textoNaoVazio(k.texto)) {
      erros.push({ caminho: `${c}.cartoes[${i}]`, mensagem: 'cartão precisa de id e texto' });
      return;
    }
    if (idsDeCartao.has(k.id)) {
      erros.push({ caminho: `${c}.cartoes[${i}].id`, mensagem: `id repetido: ${k.id}` });
    }
    idsDeCartao.add(k.id);
    validarNarracao(k.narracao, `${c}.cartoes[${i}].narracao`, chaves, erros);
    if (!textoNaoVazio(k.grupo) || !idsDeGrupo.has(k.grupo)) {
      erros.push({
        caminho: `${c}.cartoes[${i}].grupo`,
        mensagem: `o grupo ${String(k.grupo)} não existe neste jogo`,
      });
      return;
    }
    usados.add(k.grupo);
  });

  for (const g of idsDeGrupo) {
    if (!usados.has(g)) {
      erros.push({ caminho: `${c}.grupos`, mensagem: `o grupo ${g} fica sem cartões` });
    }
  }

  if (d.porque !== undefined) {
    if (!eObjecto(d.porque)) {
      erros.push({ caminho: `${c}.porque`, mensagem: 'porque tem de ser um objecto' });
    } else {
      for (const chave of Object.keys(d.porque)) {
        if (!idsDeCartao.has(chave)) {
          erros.push({ caminho: `${c}.porque.${chave}`, mensagem: 'não há cartão com este id' });
        }
      }
    }
  }
}

/**
 * O jogo de decidir: rondas com opções, cada uma com o resultado escrito.
 *
 * O resultado é um número posto por quem faz a aula, e não uma conta feita na
 * hora: o conteúdo ensina números concretos de negócios concretos, e uma
 * expressão avaliada em tempo de execução seria uma segunda fonte de verdade.
 */
function validarDecidir(
  d: Record<string, unknown>,
  c: string,
  chaves: Set<string>,
  erros: ErroValidacao[],
): void {
  if (!textoNaoVazio(d.unidade)) {
    erros.push({ caminho: `${c}.unidade`, mensagem: 'unidade em falta, por exemplo MZN' });
  }

  const rondas = Array.isArray(d.rondas) ? d.rondas : [];
  if (rondas.length < 1 || rondas.length > 5) {
    erros.push({ caminho: `${c}.rondas`, mensagem: 'entre uma e cinco rondas' });
  }

  rondas.forEach((r, i) => {
    const cr = `${c}.rondas[${i}]`;
    if (!eObjecto(r)) {
      erros.push({ caminho: cr, mensagem: 'ronda inválida' });
      return;
    }
    for (const campo of ['id', 'situacao', 'pergunta'] as const) {
      if (!textoNaoVazio(r[campo])) {
        erros.push({ caminho: `${cr}.${campo}`, mensagem: `${campo} em falta` });
      }
    }

    validarNarracao(r.narracao, `${cr}.narracao`, chaves, erros);

    const opcoes = Array.isArray(r.opcoes) ? r.opcoes : [];
    if (opcoes.length < 2 || opcoes.length > 4) {
      erros.push({ caminho: `${cr}.opcoes`, mensagem: 'entre duas e quatro opções' });
    }

    const ids = new Set<string>();
    opcoes.forEach((o, j) => {
      const co = `${cr}.opcoes[${j}]`;
      if (!eObjecto(o) || !textoNaoVazio(o.id) || !textoNaoVazio(o.rotulo) || !textoNaoVazio(o.explicacao)) {
        erros.push({ caminho: co, mensagem: 'a opção precisa de id, rótulo e explicação' });
        return;
      }
      if (typeof o.resultado !== 'number' || !Number.isFinite(o.resultado)) {
        erros.push({ caminho: `${co}.resultado`, mensagem: 'resultado tem de ser um número' });
      }
      ids.add(o.id);
    });

    if (!textoNaoVazio(r.melhor) || !ids.has(r.melhor)) {
      erros.push({ caminho: `${cr}.melhor`, mensagem: 'melhor tem de ser o id de uma das opções' });
    }
  });
}

/**
 * A sopa de letras: palavras que a fase ja ensinou, escondidas numa grelha.
 *
 * Duas regras que nao se adivinham. A primeira: a sopa nao pode ser jogo de
 * antes da licao. Achar uma palavra numa grelha ou se acha ou nao se acha, e
 * nao ha nada para esconder; um jogo de antes promete ao jovem que nao lhe diz
 * se acertou, e aqui essa promessa era mentira. A segunda: as letras da grelha
 * sao sem acentos, e por isso as palavras validam-se pelas letras que
 * sobrevivem a isso.
 */
function validarSopa(
  b: Record<string, unknown>,
  d: Record<string, unknown>,
  c: string,
  cBloco: string,
  chaves: Set<string>,
  erros: ErroValidacao[],
): void {
  if (b.momento === 'antes') {
    erros.push({
      caminho: `${cBloco}.momento`,
      mensagem: 'a sopa de letras nao se joga antes da licao: nao ha correccao para esconder',
    });
  }

  const palavras = Array.isArray(d.palavras) ? d.palavras : [];
  if (palavras.length < 3 || palavras.length > 8) {
    erros.push({ caminho: `${c}.palavras`, mensagem: 'entre tres e oito palavras' });
  }

  if (d.lado !== undefined) {
    if (typeof d.lado !== 'number' || !Number.isInteger(d.lado) || d.lado < 8 || d.lado > 12) {
      erros.push({ caminho: `${c}.lado`, mensagem: 'lado tem de ser um inteiro entre 8 e 12' });
    }
  }
  const lado = typeof d.lado === 'number' ? d.lado : 12;

  const ids = new Set<string>();
  const letrasVistas = new Set<string>();
  let totalDeLetras = 0;

  palavras.forEach((p, i) => {
    const cp = `${c}.palavras[${i}]`;
    if (!eObjecto(p) || !textoNaoVazio(p.id) || !textoNaoVazio(p.texto)) {
      erros.push({ caminho: cp, mensagem: 'a palavra precisa de id e texto' });
      return;
    }
    if (ids.has(p.id)) erros.push({ caminho: `${cp}.id`, mensagem: `id repetido: ${p.id}` });
    ids.add(p.id);

    const letras = letrasDaPalavra(p.texto);
    if (letras.length < 3) {
      erros.push({ caminho: `${cp}.texto`, mensagem: 'a palavra precisa de ao menos tres letras' });
    }
    if (letras.length > lado) {
      erros.push({
        caminho: `${cp}.texto`,
        mensagem: `a palavra tem ${letras.length} letras e a grelha so tem ${lado} de lado`,
      });
    }
    if (letrasVistas.has(letras)) {
      erros.push({ caminho: `${cp}.texto`, mensagem: 'duas palavras iguais na grelha' });
    }
    letrasVistas.add(letras);
    totalDeLetras += letras.length;

    if (p.significado !== undefined && !textoNaoVazio(p.significado)) {
      erros.push({
        caminho: `${cp}.significado`,
        mensagem: 'se o significado existir, nao pode ser vazio',
      });
    }
    validarNarracao(p.narracao, `${cp}.narracao`, chaves, erros);
  });

  // Meia grelha cheia de palavras deixa de ter enchimento onde esconde-las, e
  // a sopa passa a ler-se de uma vista de olhos.
  if (totalDeLetras > lado * lado * 0.5) {
    erros.push({
      caminho: `${c}.palavras`,
      mensagem: 'palavras a mais para esta grelha: aumenta o lado ou tira palavras',
    });
  }
}

/**
 * O jogo de montar a frase: encaixes com pedacos a escolha, um deles melhor.
 *
 * Um pedaco repetido dentro do mesmo encaixe seria uma escolha impossivel de
 * explicar: o jovem escolhe uma das duas frases iguais, o jogo recusa, e o que
 * ele le na recusa e exactamente o que escolheu. Dois encaixes nao fazem frase
 * nenhuma, e cinco ja e mais texto do que cabe num telemovel com as opcoes
 * todas a vista.
 */
function validarFrase(
  d: Record<string, unknown>,
  c: string,
  chaves: Set<string>,
  erros: ErroValidacao[],
): void {
  if (!textoNaoVazio(d.suporte)) {
    erros.push({
      caminho: `${c}.suporte`,
      mensagem: 'suporte em falta, por exemplo a tua publicacao no WhatsApp',
    });
  }

  const encaixes = Array.isArray(d.encaixes) ? d.encaixes : [];
  if (encaixes.length < 3 || encaixes.length > 5) {
    erros.push({ caminho: `${c}.encaixes`, mensagem: 'entre tres e cinco encaixes' });
  }

  const idsDeEncaixe = new Set<string>();
  encaixes.forEach((e, i) => {
    const ce = `${c}.encaixes[${i}]`;
    if (!eObjecto(e) || !textoNaoVazio(e.id) || !textoNaoVazio(e.rotulo)) {
      erros.push({ caminho: ce, mensagem: 'o encaixe precisa de id e rotulo' });
      return;
    }
    if (idsDeEncaixe.has(e.id)) {
      erros.push({ caminho: `${ce}.id`, mensagem: `id repetido: ${e.id}` });
    }
    idsDeEncaixe.add(e.id);

    validarNarracao(e.narracao, `${ce}.narracao`, chaves, erros);

    const opcoes = Array.isArray(e.opcoes) ? e.opcoes : [];
    if (opcoes.length < 2 || opcoes.length > 4) {
      erros.push({ caminho: `${ce}.opcoes`, mensagem: 'entre dois e quatro pedacos' });
    }

    const ids = new Set<string>();
    const textos = new Set<string>();
    opcoes.forEach((o, j) => {
      const co = `${ce}.opcoes[${j}]`;
      if (!eObjecto(o) || !textoNaoVazio(o.id) || !textoNaoVazio(o.texto)) {
        erros.push({ caminho: co, mensagem: 'o pedaco precisa de id e texto' });
        return;
      }
      if (ids.has(o.id)) erros.push({ caminho: `${co}.id`, mensagem: `id repetido: ${o.id}` });
      ids.add(o.id);

      const texto = o.texto.trim().toLowerCase();
      if (textos.has(texto)) {
        erros.push({ caminho: `${co}.texto`, mensagem: 'dois pedacos iguais no mesmo encaixe' });
      }
      textos.add(texto);

      if (o.porque !== undefined && !textoNaoVazio(o.porque)) {
        erros.push({ caminho: `${co}.porque`, mensagem: 'se o porque existir, nao pode ser vazio' });
      }
    });

    if (!textoNaoVazio(e.melhor) || !ids.has(e.melhor)) {
      erros.push({ caminho: `${ce}.melhor`, mensagem: 'melhor tem de ser o id de um dos pedacos' });
    }
  });
}

/**
 * O jogo de achar o erro: uma cena com linhas certas e linhas erradas.
 *
 * Uma cena sem nenhuma linha errada nao tem jogo nenhum, e uma so com linhas
 * erradas ensina a carregar em tudo, que e o contrario do que se quer treinar.
 * Por isso exigem-se as duas coisas.
 */
function validarAcharErro(
  d: Record<string, unknown>,
  c: string,
  chaves: Set<string>,
  erros: ErroValidacao[],
): void {
  if (!textoNaoVazio(d.cena)) {
    erros.push({ caminho: `${c}.cena`, mensagem: 'cena em falta, por exemplo a pagina do caderno' });
  }

  const itens = Array.isArray(d.itens) ? d.itens : [];
  if (itens.length < 4 || itens.length > 8) {
    erros.push({ caminho: `${c}.itens`, mensagem: 'entre quatro e oito linhas' });
  }

  const ids = new Set<string>();
  let errados = 0;
  let certos = 0;
  itens.forEach((i, n) => {
    const ci = `${c}.itens[${n}]`;
    if (!eObjecto(i) || !textoNaoVazio(i.id) || !textoNaoVazio(i.texto)) {
      erros.push({ caminho: ci, mensagem: 'a linha precisa de id e texto' });
      return;
    }
    if (ids.has(i.id)) erros.push({ caminho: `${ci}.id`, mensagem: `id repetido: ${i.id}` });
    ids.add(i.id);

    if (typeof i.errado !== 'boolean') {
      erros.push({ caminho: `${ci}.errado`, mensagem: 'errado tem de ser verdadeiro ou falso' });
    } else if (i.errado) errados += 1;
    else certos += 1;

    if (i.porque !== undefined && !textoNaoVazio(i.porque)) {
      erros.push({ caminho: `${ci}.porque`, mensagem: 'se o porque existir, nao pode ser vazio' });
    }
    validarNarracao(i.narracao, `${ci}.narracao`, chaves, erros);
  });

  if (errados === 0) {
    erros.push({ caminho: `${c}.itens`, mensagem: 'tem de haver ao menos uma linha errada' });
  }
  if (certos === 0) {
    erros.push({ caminho: `${c}.itens`, mensagem: 'tem de haver ao menos uma linha certa' });
  }
}

/**
 * O jogo de ordenar: os passos escritos pela ordem certa, e nada mais.
 *
 * Dois passos com o mesmo texto seriam o unico erro impossivel de corrigir no
 * ecra: o jovem poe um deles no sitio, o jogo recusa, e a carta que ele tem na
 * mao le-se exactamente como a que estava certa. Apanha-se aqui, que e onde
 * quem escreve a aula ainda o pode arranjar.
 *
 * Dois passos nao chegam para uma ordem: ou esta certa a primeira ou e a
 * outra, e isso e uma moeda ao ar. Sete ja nao cabem num telemovel sem a fila
 * ficar mais alta do que o ecra.
 */
function validarOrdenar(
  d: Record<string, unknown>,
  c: string,
  chaves: Set<string>,
  erros: ErroValidacao[],
): void {
  const passos = Array.isArray(d.passos) ? d.passos : [];
  if (passos.length < 3 || passos.length > 6) {
    erros.push({ caminho: `${c}.passos`, mensagem: 'entre tres e seis passos' });
  }

  if (d.fio !== undefined && !textoNaoVazio(d.fio)) {
    erros.push({ caminho: `${c}.fio`, mensagem: 'se o fio existir, nao pode ser vazio' });
  }

  const ids = new Set<string>();
  const textos = new Set<string>();
  passos.forEach((p, i) => {
    const cp = `${c}.passos[${i}]`;
    if (!eObjecto(p) || !textoNaoVazio(p.id) || !textoNaoVazio(p.texto)) {
      erros.push({ caminho: cp, mensagem: 'passo precisa de id e texto' });
      return;
    }
    if (ids.has(p.id)) erros.push({ caminho: `${cp}.id`, mensagem: `id repetido: ${p.id}` });
    ids.add(p.id);

    const texto = p.texto.trim().toLowerCase();
    if (textos.has(texto)) {
      erros.push({ caminho: `${cp}.texto`, mensagem: 'dois passos com o mesmo texto' });
    }
    textos.add(texto);

    if (p.porque !== undefined && !textoNaoVazio(p.porque)) {
      erros.push({ caminho: `${cp}.porque`, mensagem: 'se o porque existir, nao pode ser vazio' });
    }
    validarNarracao(p.narracao, `${cp}.narracao`, chaves, erros);
  });
}

/**
 * O jogo da escada: perguntas que valem cada vez mais, e patamares seguros.
 *
 * Os prémios têm de subir degrau a degrau. Uma escada que desce a meio deixava
 * de ser escada, e o número que aparece no ecrã passaria a contradizer o que o
 * jogo diz que está a acontecer. O último degrau nunca é patamar seguro: no fim
 * já não há de onde cair, e marcá-lo só criava uma promessa sem efeito.
 */
function validarEscada(
  d: Record<string, unknown>,
  c: string,
  chaves: Set<string>,
  erros: ErroValidacao[],
): void {
  if (!textoNaoVazio(d.unidade)) {
    erros.push({ caminho: `${c}.unidade`, mensagem: 'unidade em falta, por exemplo MT' });
  }
  if (d.ajuda !== undefined && typeof d.ajuda !== 'boolean') {
    erros.push({ caminho: `${c}.ajuda`, mensagem: 'ajuda tem de ser verdadeiro ou falso' });
  }

  const degraus = Array.isArray(d.degraus) ? d.degraus : [];
  if (degraus.length < 3 || degraus.length > 8) {
    erros.push({ caminho: `${c}.degraus`, mensagem: 'entre três e oito degraus' });
  }

  let anterior = 0;
  degraus.forEach((g, i) => {
    const cg = `${c}.degraus[${i}]`;
    if (!eObjecto(g)) {
      erros.push({ caminho: cg, mensagem: 'degrau inválido' });
      return;
    }
    for (const campo of ['id', 'pergunta'] as const) {
      if (!textoNaoVazio(g[campo])) {
        erros.push({ caminho: `${cg}.${campo}`, mensagem: `${campo} em falta` });
      }
    }

    validarNarracao(g.narracao, `${cg}.narracao`, chaves, erros);

    if (typeof g.premio !== 'number' || !Number.isFinite(g.premio) || g.premio <= 0) {
      erros.push({ caminho: `${cg}.premio`, mensagem: 'premio tem de ser um número acima de zero' });
    } else if (g.premio <= anterior) {
      erros.push({
        caminho: `${cg}.premio`,
        mensagem: `premio tem de ser maior do que o do degrau anterior (${anterior})`,
      });
    } else {
      anterior = g.premio;
    }

    if (g.seguro !== undefined && typeof g.seguro !== 'boolean') {
      erros.push({ caminho: `${cg}.seguro`, mensagem: 'seguro tem de ser verdadeiro ou falso' });
    }
    if (g.seguro === true && i === degraus.length - 1) {
      erros.push({
        caminho: `${cg}.seguro`,
        mensagem: 'o último degrau não pode ser patamar seguro: já não há de onde cair',
      });
    }

    const opcoes = Array.isArray(g.opcoes) ? g.opcoes : [];
    if (opcoes.length < 3 || opcoes.length > 4) {
      erros.push({ caminho: `${cg}.opcoes`, mensagem: 'entre três e quatro opções' });
    }

    const ids = new Set<string>();
    opcoes.forEach((o, j) => {
      const co = `${cg}.opcoes[${j}]`;
      if (!eObjecto(o) || !textoNaoVazio(o.id) || !textoNaoVazio(o.rotulo) || !textoNaoVazio(o.explicacao)) {
        erros.push({ caminho: co, mensagem: 'a opção precisa de id, rótulo e explicação' });
        return;
      }
      ids.add(o.id);
    });

    if (!textoNaoVazio(g.certa) || !ids.has(g.certa)) {
      erros.push({ caminho: `${cg}.certa`, mensagem: 'certa tem de ser o id de uma das opções' });
    }
  });
}

/** Valida o JSON de uma aula e devolve-o tipado, ou a lista completa de erros. */
export function validarAula(valor: unknown): ResultadoValidacao {
  const erros: ErroValidacao[] = [];

  if (!eObjecto(valor)) {
    return { ok: false, erros: [{ caminho: '', mensagem: 'o conteúdo tem de ser um objecto' }] };
  }
  if (valor.versao !== 1) erros.push({ caminho: 'versao', mensagem: 'versão de conteúdo não suportada' });
  if (!textoNaoVazio(valor.sessao)) erros.push({ caminho: 'sessao', mensagem: 'sessao em falta' });
  if (!textoNaoVazio(valor.titulo)) erros.push({ caminho: 'titulo', mensagem: 'titulo em falta' });
  if (!inteiroPositivo(valor.duracao_min)) erros.push({ caminho: 'duracao_min', mensagem: 'duracao_min tem de ser inteiro positivo' });

  const media = validarMedia(valor.media, erros);
  const chaves = new Set(media.map((m) => m.chave));

  if (!Array.isArray(valor.blocos) || valor.blocos.length === 0) {
    erros.push({ caminho: 'blocos', mensagem: 'a aula tem de ter pelo menos um bloco' });
  } else {
    const vistos = new Set<string>();
    valor.blocos.forEach((b, i) => {
      if (eObjecto(b) && typeof b.id === 'string') {
        if (vistos.has(b.id)) erros.push({ caminho: `blocos[${i}].id`, mensagem: `id de bloco repetido: ${b.id}` });
        vistos.add(b.id);
      }
      validarBloco(b, i, chaves, erros);
    });
  }

  if (erros.length) return { ok: false, erros };
  return { ok: true, aula: valor as unknown as ConteudoAula };
}

/**
 * Ids dos blocos cuja resposta é condição para a aula poder ser concluída.
 * Qualquer tipo de bloco pode carregar a marca. É a mesma leitura que a função
 * `concluir_aula` faz do lado da base de dados, e as duas têm de concordar.
 */
export function blocosObrigatorios(aula: ConteudoAula): string[] {
  return aula.blocos
    .filter((b) => (b as { obrigatorio_para_concluir?: boolean }).obrigatorio_para_concluir === true)
    .map((b) => b.id);
}

/** Indexa a media da aula pela chave, para os blocos resolverem os seus ficheiros. */
export function mediaPorChave(aula: ConteudoAula): Map<string, MediaRef> {
  return new Map(aula.media.map((m) => [m.chave, m]));
}
