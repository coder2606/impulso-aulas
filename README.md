# impulso-aulas

O contrato das aulas da plataforma Impulso: os tipos dos onze tipos de bloco e
as regras que dizem se uma aula e valida.

Serve dois consumidores que tem de concordar: o leitor na aplicacao movel, que
valida antes de desenhar, e o construtor no dashboard, que valida antes de
publicar. Se cada um tivesse a sua copia das regras, elas divergiam, e no dia em
que divergissem o construtor aceitava uma aula que o telemovel nao sabe
desenhar.

## Instalar

```bash
npm install impulso-aulas
```

Fixa a versao exacta nos dois lados, sem intervalos. Um intervalo traz de volta
duas reguas, agora com um numero a disfarcar.

## Usar

```ts
import { validarAula } from "impulso-aulas";

const r = validarAula(json);
if (!r.ok) {
  for (const erro of r.erros) console.log(erro.caminho, erro.mensagem);
}
```

## O que expoe

| | |
|---|---|
| `validarAula(valor)` | diz se um JSON cumpre o contrato, e devolve a lista completa de erros quando nao cumpre |
| `blocosObrigatorios(aula)` | ids dos blocos cuja resposta e condicao para concluir a aula |
| `mediaPorChave(aula)` | indexa a media da aula pela chave |
| `versaoDoContrato()` | versao do formato de `aulas.conteudo` |

Mais os tipos de cada bloco, de `ConteudoAula`, e dos resultados de validacao.

## Onde nao mexe

Sem dependencias de execucao, sem React, sem React Native, sem nada do Node. E
essa ausencia que lhe permite correr no telemovel sobre Hermes, no servidor da
Next, e no browser.

## Licenca

MIT
