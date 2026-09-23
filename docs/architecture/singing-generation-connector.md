# Singing Generation Connector — Architecture Sketch

## Problema

Character OS existe para responder: *como um personagem permanece o mesmo
personagem, geração após geração?* Este documento estende essa pergunta ao
domínio de áudio: como um personagem **canta** — com ritmo e melodia de uma
música de referência, em versões/tons/idiomas diferentes — permanecendo
reconhecível como a mesma identidade vocal.

## Escopo

- **Entrada**: uma faixa de referência (áudio) + o personagem alvo.
- **Saída**: áudio (opcionalmente vídeo, com lip-sync) do personagem
  cantando aquela melodia, preservando sua identidade vocal.
- **Fora de escopo v1**: composição musical original, performance
  ao vivo/streaming em tempo real, duetos multi-personagem.

## Pipeline

Implementado como um novo adapter em `/generation-connectors`, seguindo o
mesmo contrato dos conectores visuais existentes (entrada → representação
intermediária neutra → backend generativo plugável → gate de validação →
saída).

```
Ingest → Separação de Fontes → Extração Melódica → Voice Fingerprint + SVC
       → Canon Validation Gate → Masterização → (opcional) Lip-Sync → Output
```

1. **Ingest** — recebe a faixa de origem e valida metadados de direito de
   uso. Isso é uma preocupação de nível Canon: não se gera um cover sem
   confirmar que o uso é permitido.
2. **Separação de fontes** (ex.: Demucs) — isola o stem vocal do
   instrumental da faixa de referência.
3. **Extração melódica** (ex.: CREPE, Basic Pitch, librosa) — converte o
   stem vocal em uma **Performance Score**: curva de pitch, timing e
   fonemas. Essa é a representação intermediária neutra do conector —
   equivalente a um esqueleto de pose para geração de imagem.
4. **Voice Fingerprint** — análogo de áudio ao Fingerprint já definido no
   kernel para identidade visual. Derivado de amostras de voz consentidas
   do personagem (faladas e cantadas): timbre, tessitura, assinatura de
   vibrato, proveniência/consentimento.
5. **Singing Voice Conversion (SVC)** — backend plugável (ex.: RVC,
   so-vits-svc, DiffSinger) que consome Performance Score + Voice
   Fingerprint e produz o vocal cantado convertido. Backend é
   intercambiável, como os backends de imagem/vídeo já são.
6. **Canon Validation Gate** — a Authority do kernel valida a saída contra
   as regras de Canon do personagem (gênero musical permitido, limites de
   consentimento) antes de aceitar o resultado — reaproveitando o
   mecanismo de Authority/Canon já existente, sem lógica paralela.
7. **Masterização** — remixa o vocal convertido com o stem instrumental
   (original licenciado ou re-sintetizado) e normaliza loudness.
8. **Lip-Sync (opcional)** — conector separado (ex.: Wav2Lip, SadTalker)
   que consome o Fingerprint visual canônico do personagem + o áudio final
   para saída em vídeo.

## Pontos de integração com o kernel

| Componente | Extensão necessária |
|---|---|
| Fingerprints | Novo tipo `VoiceFingerprint` (timbre, tessitura, vibrato, proveniência de consentimento) |
| Authority | Novo hook de política para "direitos de performance" (o personagem pode interpretar esta obra específica) — distinto das checagens de Canon visual |
| Canon | Limites de estilo/gênero vocal definidos da mesma forma que limites de estilo visual já são |

## Superfície de API/SDK

- `POST /characters/{id}/performances` — `{ sourceTrackRef, targetKey?, targetLanguage? }` → handle de job assíncrono.
- SDK: `character.performances.create(track, options)` — acompanha status do job, retorna referências aos assets de áudio/vídeo gerados.

## Decisões que precisam virar ADR

1. Qual backend de SVC padronizar na v1 (RVC vs. so-vits-svc vs.
   DiffSinger) — trade-off entre qualidade, licenciamento e custo de dados
   de treino.
2. Modelo de direitos/consentimento: como registrar e impor que (a) a voz
   do personagem pode ser clonada para canto (não só fala) e (b) a música
   de origem pode legalmente ser coberta/renderizada.
3. Onde vive o dado de treino do `VoiceFingerprint` e quem pode
   adicioná-lo — mesma camada de governança de dados que os assets
   canônicos visuais.

## Não-objetivos v1

- Composição/autoria musical original.
- Latência de performance em tempo real.
- Harmonização entre múltiplos personagens.
