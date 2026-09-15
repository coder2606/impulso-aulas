// src/blocos.ts
var NOMES_DE_FERRAMENTA = [
  "calc-custo-preco",
  "caderno-contas",
  "calc-orcamento",
  "calc-desconto",
  "calc-credito",
  "catalogo-ideias",
  "plano-pdf",
  "vitrine"
];
var NOMES_DE_JOGO = ["separar", "decidir", "escada", "ordenar"];

// src/validar.ts
var TIPOS_SUPORTADOS = [
  "video",
  "carrossel",
  "passos",
  "desafio",
  "checklist",
  "audio_slides",
  "tabela",
  "autoavaliacao",
  "quiz",
  "formulario",
  "ferramenta",
  "jogo",
  "recompensa"
];
function eObjecto(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function textoNaoVazio(v) {
  return typeof v === "string" && v.trim().length > 0;
}
function inteiroPositivo(v) {
  return typeof v === "number" && Number.isInteger(v) && v > 0;
}
function validarMedia(media, erros) {
  if (!Array.isArray(media)) {
    erros.push({ caminho: "media", mensagem: "media tem de ser uma lista" });
    return [];
  }
  const saida = [];
  media.forEach((m, i) => {
    const c = `media[${i}]`;
    if (!eObjecto(m)) {
      erros.push({ caminho: c, mensagem: "cada entrada de media tem de ser um objecto" });
      return;
    }
    if (!textoNaoVazio(m.chave)) erros.push({ caminho: `${c}.chave`, mensagem: "chave em falta" });
    if (!textoNaoVazio(m.url)) erros.push({ caminho: `${c}.url`, mensagem: "url em falta" });
    if (!inteiroPositivo(m.bytes)) erros.push({ caminho: `${c}.bytes`, mensagem: "bytes tem de ser inteiro positivo" });
    if (textoNaoVazio(m.chave) && textoNaoVazio(m.url) && inteiroPositivo(m.bytes)) {
      saida.push({ chave: m.chave, url: m.url, bytes: m.bytes });
    }
  });
  return saida;
}
function validarNarracao(valor, caminho, chaves, erros) {
  if (valor === void 0) return;
  if (!textoNaoVazio(valor)) {
    erros.push({ caminho, mensagem: "narracao tem de ser uma chave de media" });
    return;
  }
  if (!chaves.has(valor)) {
    erros.push({ caminho, mensagem: `chave sem media correspondente: ${valor}` });
  }
}
function validarNarracaoDasLinhas(valor, quantasLinhas, c, chaves, erros) {
  if (valor === void 0) return;
  if (!eObjecto(valor)) {
    erros.push({ caminho: `${c}.narracao_linhas`, mensagem: "narracao_linhas tem de ser um objecto" });
    return;
  }
  for (const [linha, chave] of Object.entries(valor)) {
    const caminho = `${c}.narracao_linhas.${linha}`;
    const n = /^l([1-9][0-9]*)$/.exec(linha);
    if (!n || Number(n[1]) > quantasLinhas) {
      erros.push({ caminho, mensagem: `a tabela n\xE3o tem a linha ${linha}` });
      continue;
    }
    validarNarracao(chave, caminho, chaves, erros);
  }
}
function validarBloco(b, i, chaves, erros) {
  const c = `blocos[${i}]`;
  if (!eObjecto(b)) {
    erros.push({ caminho: c, mensagem: "cada bloco tem de ser um objecto" });
    return;
  }
  if (!textoNaoVazio(b.id)) erros.push({ caminho: `${c}.id`, mensagem: "id do bloco em falta" });
  if (typeof b.tipo !== "string" || !TIPOS_SUPORTADOS.includes(b.tipo)) {
    erros.push({ caminho: `${c}.tipo`, mensagem: `tipo de bloco n\xE3o suportado: ${String(b.tipo)}` });
    return;
  }
  if (b.tipo === "video") {
    const f = b.fonte;
    if (!eObjecto(f)) {
      erros.push({ caminho: `${c}.fonte`, mensagem: "fonte em falta" });
      return;
    }
    if (!textoNaoVazio(f.chave)) {
      erros.push({ caminho: `${c}.fonte.chave`, mensagem: "chave do v\xEDdeo em falta" });
    } else if (!chaves.has(f.chave) && b.em_breve !== true) {
      erros.push({ caminho: `${c}.fonte.chave`, mensagem: `chave sem media correspondente: ${f.chave}` });
    }
    if (!inteiroPositivo(f.duracao_seg)) {
      erros.push({ caminho: `${c}.fonte.duracao_seg`, mensagem: "duracao_seg tem de ser inteiro positivo" });
    }
    return;
  }
  if (b.tipo === "quiz") {
    if (!inteiroPositivo(b.vidas)) erros.push({ caminho: `${c}.vidas`, mensagem: "vidas tem de ser inteiro positivo" });
    if (!inteiroPositivo(b.tempo_seg)) erros.push({ caminho: `${c}.tempo_seg`, mensagem: "tempo_seg tem de ser inteiro positivo" });
    if (typeof b.xp_por_certa !== "number" || b.xp_por_certa < 0) {
      erros.push({ caminho: `${c}.xp_por_certa`, mensagem: "xp_por_certa tem de ser n\xFAmero n\xE3o negativo" });
    }
    validarNarracao(b.narracao_instrucao, `${c}.narracao_instrucao`, chaves, erros);
    if (!Array.isArray(b.perguntas) || b.perguntas.length === 0) {
      erros.push({ caminho: `${c}.perguntas`, mensagem: "o quiz tem de ter pelo menos uma pergunta" });
      return;
    }
    b.perguntas.forEach((p, j) => {
      const cp = `${c}.perguntas[${j}]`;
      if (!eObjecto(p)) {
        erros.push({ caminho: cp, mensagem: "cada pergunta tem de ser um objecto" });
        return;
      }
      if (!textoNaoVazio(p.id)) erros.push({ caminho: `${cp}.id`, mensagem: "id da pergunta em falta" });
      if (!textoNaoVazio(p.enunciado)) erros.push({ caminho: `${cp}.enunciado`, mensagem: "enunciado em falta" });
      if (!textoNaoVazio(p.explicacao)) erros.push({ caminho: `${cp}.explicacao`, mensagem: "explicacao em falta" });
      validarNarracao(p.narracao, `${cp}.narracao`, chaves, erros);
      if (!Array.isArray(p.opcoes) || p.opcoes.length < 2) {
        erros.push({ caminho: `${cp}.opcoes`, mensagem: "cada pergunta tem de ter pelo menos duas op\xE7\xF5es" });
        return;
      }
      const ids = p.opcoes.map((o) => eObjecto(o) ? o.id : void 0);
      p.opcoes.forEach((o, k) => {
        if (!eObjecto(o) || !textoNaoVazio(o.id) || !textoNaoVazio(o.texto)) {
          erros.push({ caminho: `${cp}.opcoes[${k}]`, mensagem: "op\xE7\xE3o precisa de id e texto" });
          return;
        }
        validarNarracao(o.narracao, `${cp}.opcoes[${k}].narracao`, chaves, erros);
      });
      if (!ids.includes(p.correcta)) {
        erros.push({ caminho: `${cp}.correcta`, mensagem: "a resposta correcta n\xE3o consta das op\xE7\xF5es" });
      }
    });
    return;
  }
  if (b.tipo === "formulario") {
    if (!textoNaoVazio(b.titulo)) erros.push({ caminho: `${c}.titulo`, mensagem: "titulo em falta" });
    if (!textoNaoVazio(b.instrucao)) erros.push({ caminho: `${c}.instrucao`, mensagem: "instrucao em falta" });
    if (typeof b.obrigatorio_para_concluir !== "boolean") {
      erros.push({ caminho: `${c}.obrigatorio_para_concluir`, mensagem: "tem de ser booleano" });
    }
    if (!Array.isArray(b.campos) || b.campos.length === 0) {
      erros.push({ caminho: `${c}.campos`, mensagem: "o formul\xE1rio tem de ter pelo menos um campo" });
      return;
    }
    b.campos.forEach((f, j) => {
      const cf = `${c}.campos[${j}]`;
      if (!eObjecto(f)) {
        erros.push({ caminho: cf, mensagem: "cada campo tem de ser um objecto" });
        return;
      }
      if (!textoNaoVazio(f.id)) erros.push({ caminho: `${cf}.id`, mensagem: "id do campo em falta" });
      if (!textoNaoVazio(f.rotulo)) erros.push({ caminho: `${cf}.rotulo`, mensagem: "rotulo em falta" });
      if (f.tipo !== "texto" && f.tipo !== "numero") {
        erros.push({ caminho: `${cf}.tipo`, mensagem: "tipo do campo tem de ser texto ou numero" });
      }
      if (typeof f.obrigatorio !== "boolean") erros.push({ caminho: `${cf}.obrigatorio`, mensagem: "tem de ser booleano" });
      if (!inteiroPositivo(f.max_carateres)) {
        erros.push({ caminho: `${cf}.max_carateres`, mensagem: "max_carateres tem de ser inteiro positivo" });
      }
      validarNarracao(f.narracao, `${cf}.narracao`, chaves, erros);
    });
    validarNarracao(b.narracao, `${c}.narracao`, chaves, erros);
    return;
  }
  if (b.tipo === "carrossel") {
    if (!textoNaoVazio(b.titulo)) erros.push({ caminho: `${c}.titulo`, mensagem: "titulo em falta" });
    if (!Array.isArray(b.cartoes) || b.cartoes.length === 0) {
      erros.push({ caminho: `${c}.cartoes`, mensagem: "o carrossel tem de ter pelo menos um cart\xE3o" });
      return;
    }
    b.cartoes.forEach((k, j) => {
      const ck = `${c}.cartoes[${j}]`;
      if (!eObjecto(k)) {
        erros.push({ caminho: ck, mensagem: "cada cart\xE3o tem de ser um objecto" });
        return;
      }
      if (!textoNaoVazio(k.id)) erros.push({ caminho: `${ck}.id`, mensagem: "id do cart\xE3o em falta" });
      if (!textoNaoVazio(k.titulo)) erros.push({ caminho: `${ck}.titulo`, mensagem: "titulo do cart\xE3o em falta" });
      if (!textoNaoVazio(k.texto)) erros.push({ caminho: `${ck}.texto`, mensagem: "texto do cart\xE3o em falta" });
      validarNarracao(k.narracao, `${ck}.narracao`, chaves, erros);
      if (k.meta !== void 0) {
        if (!Array.isArray(k.meta)) {
          erros.push({ caminho: `${ck}.meta`, mensagem: "meta tem de ser uma lista" });
          return;
        }
        k.meta.forEach((p, q) => {
          if (!eObjecto(p) || !textoNaoVazio(p.rotulo) || !textoNaoVazio(p.valor)) {
            erros.push({ caminho: `${ck}.meta[${q}]`, mensagem: "cada meta precisa de rotulo e valor" });
          }
        });
      }
    });
    return;
  }
  if (b.tipo === "passos") {
    if (!textoNaoVazio(b.titulo)) erros.push({ caminho: `${c}.titulo`, mensagem: "titulo em falta" });
    if (!Array.isArray(b.passos) || b.passos.length === 0) {
      erros.push({ caminho: `${c}.passos`, mensagem: "o guia tem de ter pelo menos um passo" });
      return;
    }
    b.passos.forEach((p, j) => {
      const cp = `${c}.passos[${j}]`;
      if (!eObjecto(p)) {
        erros.push({ caminho: cp, mensagem: "cada passo tem de ser um objecto" });
        return;
      }
      if (!textoNaoVazio(p.id)) erros.push({ caminho: `${cp}.id`, mensagem: "id do passo em falta" });
      if (!textoNaoVazio(p.titulo)) erros.push({ caminho: `${cp}.titulo`, mensagem: "titulo do passo em falta" });
      if (!textoNaoVazio(p.texto)) erros.push({ caminho: `${cp}.texto`, mensagem: "texto do passo em falta" });
      validarNarracao(p.narracao, `${cp}.narracao`, chaves, erros);
    });
    return;
  }
  if (b.tipo === "desafio") {
    if (!textoNaoVazio(b.titulo)) erros.push({ caminho: `${c}.titulo`, mensagem: "titulo em falta" });
    if (!textoNaoVazio(b.instrucao)) erros.push({ caminho: `${c}.instrucao`, mensagem: "instrucao em falta" });
    if (!inteiroPositivo(b.prazo_dias)) {
      erros.push({ caminho: `${c}.prazo_dias`, mensagem: "prazo_dias tem de ser inteiro positivo" });
    }
    if (!textoNaoVazio(b.rotulo_resultado)) {
      erros.push({ caminho: `${c}.rotulo_resultado`, mensagem: "rotulo_resultado em falta" });
    }
    if (b.obrigatorio_para_concluir !== void 0 && typeof b.obrigatorio_para_concluir !== "boolean") {
      erros.push({ caminho: `${c}.obrigatorio_para_concluir`, mensagem: "tem de ser booleano" });
    }
    validarNarracao(b.narracao, `${c}.narracao`, chaves, erros);
    return;
  }
  if (b.tipo === "checklist") {
    if (!textoNaoVazio(b.titulo)) erros.push({ caminho: `${c}.titulo`, mensagem: "titulo em falta" });
    if (b.obrigatorio_para_concluir !== void 0 && typeof b.obrigatorio_para_concluir !== "boolean") {
      erros.push({ caminho: `${c}.obrigatorio_para_concluir`, mensagem: "tem de ser booleano" });
    }
    if (!Array.isArray(b.itens) || b.itens.length === 0) {
      erros.push({ caminho: `${c}.itens`, mensagem: "a checklist tem de ter pelo menos um item" });
      return;
    }
    b.itens.forEach((t, j) => {
      const ct = `${c}.itens[${j}]`;
      if (!eObjecto(t)) {
        erros.push({ caminho: ct, mensagem: "cada item tem de ser um objecto" });
        return;
      }
      if (!textoNaoVazio(t.id)) erros.push({ caminho: `${ct}.id`, mensagem: "id do item em falta" });
      if (!textoNaoVazio(t.texto)) erros.push({ caminho: `${ct}.texto`, mensagem: "texto do item em falta" });
      validarNarracao(t.narracao, `${ct}.narracao`, chaves, erros);
    });
    validarNarracao(b.narracao, `${c}.narracao`, chaves, erros);
    return;
  }
  if (b.tipo === "audio_slides") {
    if (!textoNaoVazio(b.titulo)) erros.push({ caminho: `${c}.titulo`, mensagem: "titulo em falta" });
    const f = b.fonte;
    if (!eObjecto(f)) {
      erros.push({ caminho: `${c}.fonte`, mensagem: "fonte em falta" });
      return;
    }
    if (!textoNaoVazio(f.chave)) {
      erros.push({ caminho: `${c}.fonte.chave`, mensagem: "chave do \xE1udio em falta" });
    } else if (!chaves.has(f.chave)) {
      erros.push({ caminho: `${c}.fonte.chave`, mensagem: `chave sem media correspondente: ${f.chave}` });
    }
    if (!inteiroPositivo(f.duracao_seg)) {
      erros.push({ caminho: `${c}.fonte.duracao_seg`, mensagem: "duracao_seg tem de ser inteiro positivo" });
    }
    if (!Array.isArray(b.slides) || b.slides.length === 0) {
      erros.push({ caminho: `${c}.slides`, mensagem: "tem de haver pelo menos um slide" });
      return;
    }
    let anterior = 0;
    b.slides.forEach((s, j) => {
      const cs = `${c}.slides[${j}]`;
      if (!eObjecto(s)) {
        erros.push({ caminho: cs, mensagem: "cada slide tem de ser um objecto" });
        return;
      }
      if (!textoNaoVazio(s.chave)) {
        erros.push({ caminho: `${cs}.chave`, mensagem: "chave da imagem em falta" });
      } else if (!chaves.has(s.chave)) {
        erros.push({ caminho: `${cs}.chave`, mensagem: `chave sem media correspondente: ${s.chave}` });
      }
      if (!inteiroPositivo(s.ate_seg)) {
        erros.push({ caminho: `${cs}.ate_seg`, mensagem: "ate_seg tem de ser inteiro positivo" });
      } else if (s.ate_seg <= anterior) {
        erros.push({ caminho: `${cs}.ate_seg`, mensagem: "os slides t\xEAm de estar por ordem crescente de ate_seg" });
      } else {
        anterior = s.ate_seg;
      }
    });
    return;
  }
  if (b.tipo === "tabela") {
    if (!textoNaoVazio(b.titulo)) erros.push({ caminho: `${c}.titulo`, mensagem: "titulo em falta" });
    if (!Array.isArray(b.colunas) || b.colunas.length === 0) {
      erros.push({ caminho: `${c}.colunas`, mensagem: "a tabela tem de ter pelo menos uma coluna" });
      return;
    }
    if (!b.colunas.every((x) => textoNaoVazio(x))) {
      erros.push({ caminho: `${c}.colunas`, mensagem: "cada coluna tem de ser texto n\xE3o vazio" });
    }
    if (!Array.isArray(b.linhas) || b.linhas.length === 0) {
      erros.push({ caminho: `${c}.linhas`, mensagem: "a tabela tem de ter pelo menos uma linha" });
      return;
    }
    b.linhas.forEach((l, j) => {
      if (!Array.isArray(l) || l.length !== b.colunas.length) {
        erros.push({
          caminho: `${c}.linhas[${j}]`,
          mensagem: `a linha tem de ter ${b.colunas.length} c\xE9lulas`
        });
        return;
      }
      if (!l.every((x) => typeof x === "string")) {
        erros.push({ caminho: `${c}.linhas[${j}]`, mensagem: "cada c\xE9lula tem de ser texto" });
      }
    });
    validarNarracao(b.narracao, `${c}.narracao`, chaves, erros);
    validarNarracaoDasLinhas(b.narracao_linhas, b.linhas.length, c, chaves, erros);
    return;
  }
  if (b.tipo === "autoavaliacao") {
    if (!textoNaoVazio(b.titulo)) erros.push({ caminho: `${c}.titulo`, mensagem: "titulo em falta" });
    if (b.obrigatorio_para_concluir !== void 0 && typeof b.obrigatorio_para_concluir !== "boolean") {
      erros.push({ caminho: `${c}.obrigatorio_para_concluir`, mensagem: "tem de ser booleano" });
    }
    validarNarracao(b.narracao_instrucao, `${c}.narracao_instrucao`, chaves, erros);
    if (!Array.isArray(b.perguntas) || b.perguntas.length === 0) {
      erros.push({ caminho: `${c}.perguntas`, mensagem: "tem de haver pelo menos uma pergunta" });
      return;
    }
    b.perguntas.forEach((p, j) => {
      const cp = `${c}.perguntas[${j}]`;
      if (!eObjecto(p)) {
        erros.push({ caminho: cp, mensagem: "cada pergunta tem de ser um objecto" });
        return;
      }
      if (!textoNaoVazio(p.id)) erros.push({ caminho: `${cp}.id`, mensagem: "id da pergunta em falta" });
      if (!textoNaoVazio(p.enunciado)) erros.push({ caminho: `${cp}.enunciado`, mensagem: "enunciado em falta" });
      if (p.correcta !== void 0) {
        erros.push({
          caminho: `${cp}.correcta`,
          mensagem: "a autoavalia\xE7\xE3o n\xE3o tem resposta certa. Se h\xE1 resposta certa, o bloco \xE9 um quiz"
        });
      }
      validarNarracao(p.narracao, `${cp}.narracao`, chaves, erros);
      if (!Array.isArray(p.opcoes) || p.opcoes.length < 2) {
        erros.push({ caminho: `${cp}.opcoes`, mensagem: "cada pergunta tem de ter pelo menos duas op\xE7\xF5es" });
        return;
      }
      p.opcoes.forEach((o, k) => {
        if (!eObjecto(o) || !textoNaoVazio(o.id) || !textoNaoVazio(o.texto)) {
          erros.push({ caminho: `${cp}.opcoes[${k}]`, mensagem: "op\xE7\xE3o precisa de id e texto" });
          return;
        }
        validarNarracao(o.narracao, `${cp}.opcoes[${k}].narracao`, chaves, erros);
      });
    });
    return;
  }
  if (b.tipo === "ferramenta") {
    if (!textoNaoVazio(b.titulo)) erros.push({ caminho: `${c}.titulo`, mensagem: "titulo em falta" });
    if (typeof b.ferramenta !== "string" || !NOMES_DE_FERRAMENTA.includes(b.ferramenta)) {
      erros.push({
        caminho: `${c}.ferramenta`,
        mensagem: `ferramenta desconhecida: ${String(b.ferramenta)}. As dispon\xEDveis s\xE3o ${NOMES_DE_FERRAMENTA.join(", ")}`
      });
    }
    if (b.instrucao !== void 0 && !textoNaoVazio(b.instrucao)) {
      erros.push({ caminho: `${c}.instrucao`, mensagem: "se a instru\xE7\xE3o existir, n\xE3o pode ser vazia" });
    }
    validarNarracao(b.narracao, `${c}.narracao`, chaves, erros);
    if (b.parametros !== void 0) {
      if (!eObjecto(b.parametros)) {
        erros.push({ caminho: `${c}.parametros`, mensagem: "parametros tem de ser um objecto" });
      } else {
        for (const [chave, valor] of Object.entries(b.parametros)) {
          if (typeof valor !== "string" && typeof valor !== "number") {
            erros.push({
              caminho: `${c}.parametros.${chave}`,
              mensagem: "cada par\xE2metro tem de ser texto ou n\xFAmero"
            });
          }
        }
      }
    }
    if (b.obrigatorio_para_concluir !== void 0) {
      erros.push({
        caminho: `${c}.obrigatorio_para_concluir`,
        mensagem: "a ferramenta n\xE3o pode travar a conclus\xE3o. Use um formul\xE1rio ou uma lista de verifica\xE7\xE3o"
      });
    }
    return;
  }
  if (b.tipo === "jogo") {
    if (!textoNaoVazio(b.titulo)) erros.push({ caminho: `${c}.titulo`, mensagem: "titulo em falta" });
    if (typeof b.jogo !== "string" || !NOMES_DE_JOGO.includes(b.jogo)) {
      erros.push({
        caminho: `${c}.jogo`,
        mensagem: `jogo desconhecido: ${String(b.jogo)}. Os dispon\xEDveis s\xE3o ${NOMES_DE_JOGO.join(", ")}`
      });
      return;
    }
    if (b.momento !== "antes" && b.momento !== "depois") {
      erros.push({ caminho: `${c}.momento`, mensagem: "momento tem de ser antes ou depois" });
    }
    for (const campo of ["xp", "xp_extra"]) {
      const v = b[campo];
      if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > 100) {
        erros.push({ caminho: `${c}.${campo}`, mensagem: `${campo} tem de ser um inteiro entre 0 e 100` });
      }
    }
    if (b.instrucao !== void 0 && !textoNaoVazio(b.instrucao)) {
      erros.push({ caminho: `${c}.instrucao`, mensagem: "se a instru\xE7\xE3o existir, n\xE3o pode ser vazia" });
    }
    if (b.regras !== void 0) {
      if (!Array.isArray(b.regras) || b.regras.length === 0 || b.regras.length > 5) {
        erros.push({ caminho: `${c}.regras`, mensagem: "regras tem de ser uma lista de 1 a 5 linhas" });
      } else {
        b.regras.forEach((r, i2) => {
          if (!textoNaoVazio(r)) {
            erros.push({ caminho: `${c}.regras[${i2}]`, mensagem: "regra vazia" });
          }
        });
      }
    }
    validarNarracao(b.narracao, `${c}.narracao`, chaves, erros);
    if (b.obrigatorio_para_concluir !== void 0) {
      erros.push({
        caminho: `${c}.obrigatorio_para_concluir`,
        mensagem: "o jogo n\xE3o pode travar a conclus\xE3o. Use um formul\xE1rio ou uma lista de verifica\xE7\xE3o"
      });
    }
    const dados = b.dados;
    if (!eObjecto(dados)) {
      erros.push({ caminho: `${c}.dados`, mensagem: "dados em falta" });
      return;
    }
    if (b.jogo === "separar") validarSeparar(dados, `${c}.dados`, chaves, erros);
    if (b.jogo === "decidir") validarDecidir(dados, `${c}.dados`, chaves, erros);
    if (b.jogo === "escada") validarEscada(dados, `${c}.dados`, chaves, erros);
    if (b.jogo === "ordenar") validarOrdenar(dados, `${c}.dados`, chaves, erros);
    return;
  }
  if (!textoNaoVazio(b.medalha)) erros.push({ caminho: `${c}.medalha`, mensagem: "medalha em falta" });
  if (typeof b.partilhavel !== "boolean") erros.push({ caminho: `${c}.partilhavel`, mensagem: "tem de ser booleano" });
}
function validarSeparar(d, c, chaves, erros) {
  const grupos = Array.isArray(d.grupos) ? d.grupos : [];
  const cartoes = Array.isArray(d.cartoes) ? d.cartoes : [];
  if (grupos.length < 2 || grupos.length > 4) {
    erros.push({ caminho: `${c}.grupos`, mensagem: "entre dois e quatro grupos" });
  }
  if (cartoes.length < 4 || cartoes.length > 12) {
    erros.push({ caminho: `${c}.cartoes`, mensagem: "entre quatro e doze cart\xF5es" });
  }
  const idsDeGrupo = /* @__PURE__ */ new Set();
  grupos.forEach((g, i) => {
    if (!eObjecto(g) || !textoNaoVazio(g.id) || !textoNaoVazio(g.rotulo)) {
      erros.push({ caminho: `${c}.grupos[${i}]`, mensagem: "grupo precisa de id e r\xF3tulo" });
      return;
    }
    if (idsDeGrupo.has(g.id)) {
      erros.push({ caminho: `${c}.grupos[${i}].id`, mensagem: `id repetido: ${g.id}` });
    }
    idsDeGrupo.add(g.id);
  });
  const usados = /* @__PURE__ */ new Set();
  const idsDeCartao = /* @__PURE__ */ new Set();
  cartoes.forEach((k, i) => {
    if (!eObjecto(k) || !textoNaoVazio(k.id) || !textoNaoVazio(k.texto)) {
      erros.push({ caminho: `${c}.cartoes[${i}]`, mensagem: "cart\xE3o precisa de id e texto" });
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
        mensagem: `o grupo ${String(k.grupo)} n\xE3o existe neste jogo`
      });
      return;
    }
    usados.add(k.grupo);
  });
  for (const g of idsDeGrupo) {
    if (!usados.has(g)) {
      erros.push({ caminho: `${c}.grupos`, mensagem: `o grupo ${g} fica sem cart\xF5es` });
    }
  }
  if (d.porque !== void 0) {
    if (!eObjecto(d.porque)) {
      erros.push({ caminho: `${c}.porque`, mensagem: "porque tem de ser um objecto" });
    } else {
      for (const chave of Object.keys(d.porque)) {
        if (!idsDeCartao.has(chave)) {
          erros.push({ caminho: `${c}.porque.${chave}`, mensagem: "n\xE3o h\xE1 cart\xE3o com este id" });
        }
      }
    }
  }
}
function validarDecidir(d, c, chaves, erros) {
  if (!textoNaoVazio(d.unidade)) {
    erros.push({ caminho: `${c}.unidade`, mensagem: "unidade em falta, por exemplo MZN" });
  }
  const rondas = Array.isArray(d.rondas) ? d.rondas : [];
  if (rondas.length < 1 || rondas.length > 5) {
    erros.push({ caminho: `${c}.rondas`, mensagem: "entre uma e cinco rondas" });
  }
  rondas.forEach((r, i) => {
    const cr = `${c}.rondas[${i}]`;
    if (!eObjecto(r)) {
      erros.push({ caminho: cr, mensagem: "ronda inv\xE1lida" });
      return;
    }
    for (const campo of ["id", "situacao", "pergunta"]) {
      if (!textoNaoVazio(r[campo])) {
        erros.push({ caminho: `${cr}.${campo}`, mensagem: `${campo} em falta` });
      }
    }
    validarNarracao(r.narracao, `${cr}.narracao`, chaves, erros);
    const opcoes = Array.isArray(r.opcoes) ? r.opcoes : [];
    if (opcoes.length < 2 || opcoes.length > 4) {
      erros.push({ caminho: `${cr}.opcoes`, mensagem: "entre duas e quatro op\xE7\xF5es" });
    }
    const ids = /* @__PURE__ */ new Set();
    opcoes.forEach((o, j) => {
      const co = `${cr}.opcoes[${j}]`;
      if (!eObjecto(o) || !textoNaoVazio(o.id) || !textoNaoVazio(o.rotulo) || !textoNaoVazio(o.explicacao)) {
        erros.push({ caminho: co, mensagem: "a op\xE7\xE3o precisa de id, r\xF3tulo e explica\xE7\xE3o" });
        return;
      }
      if (typeof o.resultado !== "number" || !Number.isFinite(o.resultado)) {
        erros.push({ caminho: `${co}.resultado`, mensagem: "resultado tem de ser um n\xFAmero" });
      }
      ids.add(o.id);
    });
    if (!textoNaoVazio(r.melhor) || !ids.has(r.melhor)) {
      erros.push({ caminho: `${cr}.melhor`, mensagem: "melhor tem de ser o id de uma das op\xE7\xF5es" });
    }
  });
}
function validarOrdenar(d, c, chaves, erros) {
  const passos = Array.isArray(d.passos) ? d.passos : [];
  if (passos.length < 3 || passos.length > 6) {
    erros.push({ caminho: `${c}.passos`, mensagem: "entre tres e seis passos" });
  }
  if (d.fio !== void 0 && !textoNaoVazio(d.fio)) {
    erros.push({ caminho: `${c}.fio`, mensagem: "se o fio existir, nao pode ser vazio" });
  }
  const ids = /* @__PURE__ */ new Set();
  const textos = /* @__PURE__ */ new Set();
  passos.forEach((p, i) => {
    const cp = `${c}.passos[${i}]`;
    if (!eObjecto(p) || !textoNaoVazio(p.id) || !textoNaoVazio(p.texto)) {
      erros.push({ caminho: cp, mensagem: "passo precisa de id e texto" });
      return;
    }
    if (ids.has(p.id)) erros.push({ caminho: `${cp}.id`, mensagem: `id repetido: ${p.id}` });
    ids.add(p.id);
    const texto = p.texto.trim().toLowerCase();
    if (textos.has(texto)) {
      erros.push({ caminho: `${cp}.texto`, mensagem: "dois passos com o mesmo texto" });
    }
    textos.add(texto);
    if (p.porque !== void 0 && !textoNaoVazio(p.porque)) {
      erros.push({ caminho: `${cp}.porque`, mensagem: "se o porque existir, nao pode ser vazio" });
    }
    validarNarracao(p.narracao, `${cp}.narracao`, chaves, erros);
  });
}
function validarEscada(d, c, chaves, erros) {
  if (!textoNaoVazio(d.unidade)) {
    erros.push({ caminho: `${c}.unidade`, mensagem: "unidade em falta, por exemplo MT" });
  }
  if (d.ajuda !== void 0 && typeof d.ajuda !== "boolean") {
    erros.push({ caminho: `${c}.ajuda`, mensagem: "ajuda tem de ser verdadeiro ou falso" });
  }
  const degraus = Array.isArray(d.degraus) ? d.degraus : [];
  if (degraus.length < 3 || degraus.length > 8) {
    erros.push({ caminho: `${c}.degraus`, mensagem: "entre tr\xEAs e oito degraus" });
  }
  let anterior = 0;
  degraus.forEach((g, i) => {
    const cg = `${c}.degraus[${i}]`;
    if (!eObjecto(g)) {
      erros.push({ caminho: cg, mensagem: "degrau inv\xE1lido" });
      return;
    }
    for (const campo of ["id", "pergunta"]) {
      if (!textoNaoVazio(g[campo])) {
        erros.push({ caminho: `${cg}.${campo}`, mensagem: `${campo} em falta` });
      }
    }
    validarNarracao(g.narracao, `${cg}.narracao`, chaves, erros);
    if (typeof g.premio !== "number" || !Number.isFinite(g.premio) || g.premio <= 0) {
      erros.push({ caminho: `${cg}.premio`, mensagem: "premio tem de ser um n\xFAmero acima de zero" });
    } else if (g.premio <= anterior) {
      erros.push({
        caminho: `${cg}.premio`,
        mensagem: `premio tem de ser maior do que o do degrau anterior (${anterior})`
      });
    } else {
      anterior = g.premio;
    }
    if (g.seguro !== void 0 && typeof g.seguro !== "boolean") {
      erros.push({ caminho: `${cg}.seguro`, mensagem: "seguro tem de ser verdadeiro ou falso" });
    }
    if (g.seguro === true && i === degraus.length - 1) {
      erros.push({
        caminho: `${cg}.seguro`,
        mensagem: "o \xFAltimo degrau n\xE3o pode ser patamar seguro: j\xE1 n\xE3o h\xE1 de onde cair"
      });
    }
    const opcoes = Array.isArray(g.opcoes) ? g.opcoes : [];
    if (opcoes.length < 3 || opcoes.length > 4) {
      erros.push({ caminho: `${cg}.opcoes`, mensagem: "entre tr\xEAs e quatro op\xE7\xF5es" });
    }
    const ids = /* @__PURE__ */ new Set();
    opcoes.forEach((o, j) => {
      const co = `${cg}.opcoes[${j}]`;
      if (!eObjecto(o) || !textoNaoVazio(o.id) || !textoNaoVazio(o.rotulo) || !textoNaoVazio(o.explicacao)) {
        erros.push({ caminho: co, mensagem: "a op\xE7\xE3o precisa de id, r\xF3tulo e explica\xE7\xE3o" });
        return;
      }
      ids.add(o.id);
    });
    if (!textoNaoVazio(g.certa) || !ids.has(g.certa)) {
      erros.push({ caminho: `${cg}.certa`, mensagem: "certa tem de ser o id de uma das op\xE7\xF5es" });
    }
  });
}
function validarAula(valor) {
  const erros = [];
  if (!eObjecto(valor)) {
    return { ok: false, erros: [{ caminho: "", mensagem: "o conte\xFAdo tem de ser um objecto" }] };
  }
  if (valor.versao !== 1) erros.push({ caminho: "versao", mensagem: "vers\xE3o de conte\xFAdo n\xE3o suportada" });
  if (!textoNaoVazio(valor.sessao)) erros.push({ caminho: "sessao", mensagem: "sessao em falta" });
  if (!textoNaoVazio(valor.titulo)) erros.push({ caminho: "titulo", mensagem: "titulo em falta" });
  if (!inteiroPositivo(valor.duracao_min)) erros.push({ caminho: "duracao_min", mensagem: "duracao_min tem de ser inteiro positivo" });
  const media = validarMedia(valor.media, erros);
  const chaves = new Set(media.map((m) => m.chave));
  if (!Array.isArray(valor.blocos) || valor.blocos.length === 0) {
    erros.push({ caminho: "blocos", mensagem: "a aula tem de ter pelo menos um bloco" });
  } else {
    const vistos = /* @__PURE__ */ new Set();
    valor.blocos.forEach((b, i) => {
      if (eObjecto(b) && typeof b.id === "string") {
        if (vistos.has(b.id)) erros.push({ caminho: `blocos[${i}].id`, mensagem: `id de bloco repetido: ${b.id}` });
        vistos.add(b.id);
      }
      validarBloco(b, i, chaves, erros);
    });
  }
  if (erros.length) return { ok: false, erros };
  return { ok: true, aula: valor };
}
function blocosObrigatorios(aula) {
  return aula.blocos.filter((b) => b.obrigatorio_para_concluir === true).map((b) => b.id);
}
function mediaPorChave(aula) {
  return new Map(aula.media.map((m) => [m.chave, m]));
}

// src/jogos.ts
var REGRA_DO_MOMENTO = {
  antes: "Neste n\xE3o te digo se acertaste. Quero ver o que j\xE1 sabes. No fim da aula jogamos outra vez, e a\xED digo.",
  depois: "Aqui digo-te logo o que est\xE1 certo e o que n\xE3o est\xE1."
};
function terminada(linha) {
  return /[.!?]$/.test(linha.trim()) ? linha.trim() : `${linha.trim()}.`;
}
function aberturaDoJogo(bloco) {
  const partes = [`Agora vamos a um jogo. Chama-se ${terminada(bloco.titulo)}`];
  if (bloco.instrucao) partes.push(terminada(bloco.instrucao));
  if (bloco.regras && bloco.regras.length > 0) {
    partes.push(`Como se joga. ${bloco.regras.map(terminada).join(" ")}`);
  }
  partes.push(REGRA_DO_MOMENTO[bloco.momento]);
  return partes.join(" ");
}
function cartaoCerto(dados, cartaoId, grupoId) {
  const cartao = dados.cartoes.find((c) => c.id === cartaoId);
  return cartao !== void 0 && cartao.grupo === grupoId;
}
function corrigirSeparar(dados, colocacoes, erros) {
  const acertos = dados.cartoes.filter((c) => colocacoes[c.id] === c.grupo).length;
  return {
    acertos,
    total: dados.cartoes.length,
    erros,
    semFalhas: erros === 0 && acertos === dados.cartoes.length
  };
}
function corrigirDecidir(dados, escolhas, erros) {
  const acertos = dados.rondas.filter((r) => escolhas[r.id] === r.melhor).length;
  return {
    acertos,
    total: dados.rondas.length,
    erros,
    semFalhas: erros === 0 && acertos === dados.rondas.length
  };
}
function corrigirEscada(dados, respostas, erros) {
  const acertos = dados.degraus.filter((d) => respostas[d.id] === d.certa).length;
  return {
    acertos,
    total: dados.degraus.length,
    erros,
    semFalhas: erros === 0 && acertos === dados.degraus.length
  };
}
function passoCerto(dados, posicao, passoId) {
  return dados.passos[posicao]?.id === passoId;
}
function corrigirOrdenar(dados, ordem, erros) {
  const acertos = dados.passos.filter((p, i) => ordem[i] === p.id).length;
  return {
    acertos,
    total: dados.passos.length,
    erros,
    semFalhas: erros === 0 && acertos === dados.passos.length
  };
}
function baralharPassos(dados, sorte = Math.random) {
  const fila = [...dados.passos];
  for (let i = fila.length - 1; i > 0; i -= 1) {
    const j = Math.floor(sorte() * (i + 1));
    [fila[i], fila[j]] = [fila[j], fila[i]];
  }
  const naOrdem = fila.every((p, i) => p.id === dados.passos[i]?.id);
  if (naOrdem && fila.length > 1) fila.push(fila.shift());
  return fila;
}
function bancaDaEscada(dados, respostas) {
  let banca = 0;
  let chao = 0;
  for (const degrau of dados.degraus) {
    const resposta = respostas[degrau.id];
    if (resposta === void 0) break;
    if (resposta === degrau.certa) {
      banca = degrau.premio;
      if (degrau.seguro) chao = degrau.premio;
    } else {
      banca = chao;
    }
  }
  return banca;
}
function xpDoJogo(bloco, resultado) {
  return bloco.xp + (resultado.semFalhas ? bloco.xp_extra : 0);
}

// src/narracao.ts
function textoDoPasso(p) {
  return `${p.titulo}. ${p.texto}`;
}
function textoDoCartao(c) {
  const partes = [textoDoPasso(c)];
  for (const m of c.meta ?? []) partes.push(`${m.rotulo}: ${m.valor}.`);
  return partes.join(" ");
}
function idDaLinhaDaTabela(indice) {
  return `l${indice + 1}`;
}
function textoDaLinha(colunas, linha) {
  return linha.map((celula, j) => colunas[j] ? `${colunas[j]}: ${celula}.` : `${celula}.`).join(" ");
}
function pedacosDoBloco(bloco) {
  if (bloco.tipo === "passos") {
    return bloco.passos.map((p, i) => ({
      chave: `${bloco.id}-${p.id}.mp3`,
      rotulo: `Passo ${i + 1}, ${p.titulo}`,
      texto: textoDoPasso(p),
      narracao: p.narracao
    }));
  }
  if (bloco.tipo === "carrossel") {
    return bloco.cartoes.map((c, i) => ({
      chave: `${bloco.id}-${c.id}.mp3`,
      rotulo: `Cart\xE3o ${i + 1}, ${c.titulo}`,
      texto: textoDoCartao(c),
      narracao: c.narracao
    }));
  }
  if (bloco.tipo === "ferramenta") {
    return [
      {
        chave: `${bloco.id}.mp3`,
        rotulo: `Ferramenta, ${bloco.titulo}`,
        texto: bloco.instrucao ? `${bloco.titulo}. ${bloco.instrucao}` : `${bloco.titulo}.`,
        narracao: bloco.narracao
      }
    ];
  }
  if (bloco.tipo === "jogo") {
    const missao = {
      chave: `${bloco.id}.mp3`,
      rotulo: `Jogo, ${bloco.titulo}`,
      // A abertura sai inteira do contrato: e um jogo, chama-se assim, e disto,
      // joga-se assim, e isto acontece quando se erra. Ver aberturaDoJogo.
      texto: aberturaDoJogo(bloco),
      narracao: bloco.narracao
    };
    if (bloco.jogo === "separar") {
      return [
        missao,
        ...bloco.dados.cartoes.map((c, i) => ({
          chave: `${bloco.id}-${c.id}.mp3`,
          rotulo: `Jogo, carta ${i + 1}`,
          texto: c.texto,
          narracao: c.narracao
        }))
      ];
    }
    if (bloco.jogo === "decidir") {
      return [
        missao,
        ...bloco.dados.rondas.map((r, i) => ({
          chave: `${bloco.id}-${r.id}.mp3`,
          rotulo: `Jogo, ronda ${i + 1}`,
          texto: `${r.situacao} ${r.pergunta}`,
          narracao: r.narracao
        }))
      ];
    }
    if (bloco.jogo === "ordenar") {
      return [
        missao,
        ...bloco.dados.passos.map((p, i) => ({
          chave: `${bloco.id}-${p.id}.mp3`,
          rotulo: `Jogo, passo ${i + 1}`,
          texto: p.texto,
          narracao: p.narracao
        }))
      ];
    }
    return [
      missao,
      ...bloco.dados.degraus.map((g, i) => ({
        chave: `${bloco.id}-${g.id}.mp3`,
        rotulo: `Jogo, pergunta ${i + 1}`,
        texto: `${g.pergunta} ${g.opcoes.map((o) => o.rotulo).join(". ")}.`,
        narracao: g.narracao
      }))
    ];
  }
  if (bloco.tipo === "desafio") {
    const dias = bloco.prazo_dias === 1 ? "1 dia" : `${bloco.prazo_dias} dias`;
    return [
      {
        chave: `${bloco.id}.mp3`,
        rotulo: `Desafio, ${bloco.titulo}`,
        texto: `${bloco.titulo}. ${bloco.instrucao} Tens ${dias}. No fim escreve: ${bloco.rotulo_resultado}.`,
        narracao: bloco.narracao
      }
    ];
  }
  if (bloco.tipo === "checklist") {
    return [
      {
        chave: `${bloco.id}.mp3`,
        rotulo: `Lista, ${bloco.titulo}`,
        texto: `${bloco.titulo}.`,
        narracao: bloco.narracao
      },
      ...bloco.itens.map((item, i) => ({
        chave: `${bloco.id}-${item.id}.mp3`,
        rotulo: `Lista, item ${i + 1}`,
        texto: item.texto,
        narracao: item.narracao
      }))
    ];
  }
  if (bloco.tipo === "formulario") {
    return [
      {
        chave: `${bloco.id}.mp3`,
        rotulo: `Formul\xE1rio, ${bloco.titulo}`,
        texto: `${bloco.titulo}. ${bloco.instrucao}`,
        narracao: bloco.narracao
      },
      ...bloco.campos.map((campo, i) => ({
        chave: `${bloco.id}-${campo.id}.mp3`,
        rotulo: `Formul\xE1rio, campo ${i + 1}, ${campo.rotulo}`,
        texto: campo.rotulo,
        narracao: campo.narracao
      }))
    ];
  }
  if (bloco.tipo === "tabela") {
    return [
      {
        chave: `${bloco.id}.mp3`,
        rotulo: `Tabela, ${bloco.titulo}`,
        texto: `${bloco.titulo}.`,
        narracao: bloco.narracao
      },
      ...bloco.linhas.map((linha, i) => ({
        chave: `${bloco.id}-${idDaLinhaDaTabela(i)}.mp3`,
        rotulo: `Tabela, linha ${i + 1}`,
        texto: textoDaLinha(bloco.colunas, linha),
        narracao: bloco.narracao_linhas?.[idDaLinhaDaTabela(i)]
      }))
    ];
  }
  if (bloco.tipo !== "quiz" && bloco.tipo !== "autoavaliacao") return [];
  const saida = [];
  bloco.perguntas.forEach((p, i) => {
    saida.push({
      chave: `${bloco.id}-${p.id}.mp3`,
      rotulo: `Pergunta ${i + 1}`,
      texto: p.enunciado,
      narracao: p.narracao
    });
    for (const o of p.opcoes) {
      saida.push({
        chave: `${bloco.id}-${p.id}-${o.id}.mp3`,
        rotulo: `Pergunta ${i + 1}, resposta ${o.id.toUpperCase()}`,
        texto: o.texto,
        narracao: o.narracao
      });
    }
  });
  if (bloco.instrucao) {
    saida.push({
      chave: `${bloco.id}-instrucao.mp3`,
      rotulo: "Instru\xE7\xE3o, ouve-se no fim de cada pergunta",
      texto: bloco.instrucao,
      narracao: bloco.narracao_instrucao
    });
  }
  return saida;
}
function pedacosNarraveis(aula) {
  return aula.blocos.flatMap(pedacosDoBloco);
}
function definirNarracao(aula, chave, valor) {
  const blocos = aula.blocos.map((bloco) => {
    if (bloco.tipo === "passos") {
      if (!bloco.passos.some((p) => `${bloco.id}-${p.id}.mp3` === chave)) return bloco;
      return {
        ...bloco,
        passos: bloco.passos.map(
          (p) => `${bloco.id}-${p.id}.mp3` === chave ? { ...p, narracao: valor } : p
        )
      };
    }
    if (bloco.tipo === "carrossel") {
      if (!bloco.cartoes.some((c) => `${bloco.id}-${c.id}.mp3` === chave)) return bloco;
      return {
        ...bloco,
        cartoes: bloco.cartoes.map(
          (c) => `${bloco.id}-${c.id}.mp3` === chave ? { ...c, narracao: valor } : c
        )
      };
    }
    if (bloco.tipo === "ferramenta" || bloco.tipo === "desafio") {
      return `${bloco.id}.mp3` === chave ? { ...bloco, narracao: valor } : bloco;
    }
    if (bloco.tipo === "jogo") {
      if (`${bloco.id}.mp3` === chave) return { ...bloco, narracao: valor };
      if (bloco.jogo === "separar") {
        if (!bloco.dados.cartoes.some((c) => `${bloco.id}-${c.id}.mp3` === chave)) return bloco;
        return {
          ...bloco,
          dados: {
            ...bloco.dados,
            cartoes: bloco.dados.cartoes.map(
              (c) => `${bloco.id}-${c.id}.mp3` === chave ? { ...c, narracao: valor } : c
            )
          }
        };
      }
      if (bloco.jogo === "decidir") {
        if (!bloco.dados.rondas.some((r) => `${bloco.id}-${r.id}.mp3` === chave)) return bloco;
        return {
          ...bloco,
          dados: {
            ...bloco.dados,
            rondas: bloco.dados.rondas.map(
              (r) => `${bloco.id}-${r.id}.mp3` === chave ? { ...r, narracao: valor } : r
            )
          }
        };
      }
      if (bloco.jogo === "ordenar") {
        if (!bloco.dados.passos.some((p) => `${bloco.id}-${p.id}.mp3` === chave)) return bloco;
        return {
          ...bloco,
          dados: {
            ...bloco.dados,
            passos: bloco.dados.passos.map(
              (p) => `${bloco.id}-${p.id}.mp3` === chave ? { ...p, narracao: valor } : p
            )
          }
        };
      }
      if (!bloco.dados.degraus.some((g) => `${bloco.id}-${g.id}.mp3` === chave)) return bloco;
      return {
        ...bloco,
        dados: {
          ...bloco.dados,
          degraus: bloco.dados.degraus.map(
            (g) => `${bloco.id}-${g.id}.mp3` === chave ? { ...g, narracao: valor } : g
          )
        }
      };
    }
    if (bloco.tipo === "checklist") {
      if (`${bloco.id}.mp3` === chave) return { ...bloco, narracao: valor };
      if (!bloco.itens.some((i) => `${bloco.id}-${i.id}.mp3` === chave)) return bloco;
      return {
        ...bloco,
        itens: bloco.itens.map(
          (i) => `${bloco.id}-${i.id}.mp3` === chave ? { ...i, narracao: valor } : i
        )
      };
    }
    if (bloco.tipo === "formulario") {
      if (`${bloco.id}.mp3` === chave) return { ...bloco, narracao: valor };
      if (!bloco.campos.some((c) => `${bloco.id}-${c.id}.mp3` === chave)) return bloco;
      return {
        ...bloco,
        campos: bloco.campos.map(
          (c) => `${bloco.id}-${c.id}.mp3` === chave ? { ...c, narracao: valor } : c
        )
      };
    }
    if (bloco.tipo === "tabela") {
      if (`${bloco.id}.mp3` === chave) return { ...bloco, narracao: valor };
      const n = bloco.linhas.findIndex((_, i) => `${bloco.id}-${idDaLinhaDaTabela(i)}.mp3` === chave);
      if (n < 0) return bloco;
      const { narracao_linhas: antes, ...resto } = bloco;
      const linhas = { ...antes };
      if (valor === void 0) delete linhas[idDaLinhaDaTabela(n)];
      else linhas[idDaLinhaDaTabela(n)] = valor;
      return Object.keys(linhas).length > 0 ? { ...resto, narracao_linhas: linhas } : resto;
    }
    if (bloco.tipo !== "quiz" && bloco.tipo !== "autoavaliacao") return bloco;
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
        opcoes: p.opcoes.map(
          (o) => `${bloco.id}-${p.id}-${o.id}.mp3` === chave ? { ...o, narracao: valor } : o
        )
      };
    });
    return mexeu ? { ...bloco, perguntas } : bloco;
  });
  return { ...aula, blocos };
}

// src/index.ts
function versaoDoContrato() {
  return 1;
}
export {
  NOMES_DE_FERRAMENTA,
  NOMES_DE_JOGO,
  REGRA_DO_MOMENTO,
  aberturaDoJogo,
  bancaDaEscada,
  baralharPassos,
  blocosObrigatorios,
  cartaoCerto,
  corrigirDecidir,
  corrigirEscada,
  corrigirOrdenar,
  corrigirSeparar,
  definirNarracao,
  idDaLinhaDaTabela,
  mediaPorChave,
  passoCerto,
  pedacosNarraveis,
  validarAula,
  versaoDoContrato,
  xpDoJogo
};
//# sourceMappingURL=index.js.map