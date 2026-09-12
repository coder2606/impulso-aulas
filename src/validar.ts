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

import { NOMES_DE_FERRAMENTA } from './blocos';

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

  // recompensa
  if (!textoNaoVazio(b.medalha)) erros.push({ caminho: `${c}.medalha`, mensagem: 'medalha em falta' });
  if (typeof b.partilhavel !== 'boolean') erros.push({ caminho: `${c}.partilhavel`, mensagem: 'tem de ser booleano' });
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
