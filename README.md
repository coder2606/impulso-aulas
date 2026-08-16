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
npm install github:coder2606/impulso-aulas#v1.2.0
```

Instala-se do GitHub, e nao do registo do npm. A etiqueta faz parte do endereco
e nao e opcional: fixa a versao exacta nos dois lados, sem intervalos. Um
intervalo traz de volta duas reguas, agora com um numero a disfarcar.

O `dist` vai commitado de proposito. Assim instalar e copiar e nao compilar, o
que dispensa quem instala de saber construir o contrato e de conseguir
descarregar as dependencias de desenvolvimento dele.

No registo publico do npm ficou um `impulso-aulas@1.0.0` de Agosto de 2026, que
nao voltou a ser tocado. Nao o instales.

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

## Lancar uma versao

Como o `dist` esta em git, a compilacao acontece aqui e nao na maquina de quem
instala. Sao quatro passos, sempre pela mesma ordem:

```bash
npm run verificar                      # tipos, testes e compilacao
git commit -am "..."                   # o src e o dist no mesmo commit
git tag vX.Y.Z
git push origin main --tags
```

Depois muda a etiqueta nos dois consumidores, `Impulso app` e `Impulso web`. Uma
versao so existe quando a etiqueta esta no GitHub, porque e a etiqueta que os
dois lados instalam.

## Licenca

MIT
