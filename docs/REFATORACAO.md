# Registro da revisão técnica — 10/11/2026

## Escopo e preservação

Refatoração incremental do aplicativo existente, sem reconstrução. `App.tsx`, configuração visual de navegação, sete telas, componentes, tema, estilos e animações foram preservados. Textos pontuais passaram a indicar ausência de avaliação/contagem e estimativas de deslocamento, para não apresentar informações fabricadas ou precisão indevida. Identificadores técnicos do projeto, nomes de arquivos, rotas e chaves de armazenamento não foram renomeados.

Não foi criado backend, site alternativo, repositório remoto, commit ou publicação. A pasta recebida não possui `.git`, portanto não é possível apresentar diff contra o histórico ou afirmar que versões anteriores estão livres de credenciais. Os binários originais de screenshots foram mantidos; nenhum screenshot foi inventado.

## Diagnóstico inicial, antes da refatoração

Foram examinados `package.json`, `App.tsx`, os quatro módulos originais de API, contextos, navegação, telas, utilitários, tipos, README e `.gitignore`.

| Prioridade | Problema identificado | Consequência |
| --- | --- | --- |
| Crítica | Credenciais Google Places e Yelp fixadas nos módulos | Exposição e possível uso indevido; exige rotação externa |
| Alta | API institucional HTTP e autenticação automática sem restrição de origem | Tráfego desprotegido e risco de encaminhar token a outro destino |
| Alta | Notas/quantidades geradas por hash e fallback demonstrativo automático | Dados sem origem real apresentados como turísticos |
| Média | Remoção do cache expirado antes de fallback; memória sem TTL | Falha offline e desatualização indefinida |
| Média | JSON de armazenamento sem validação e gravações concorrentes baseadas em estado antigo | Dados corrompidos e perda de alterações rápidas |
| Média | Coordenadas zero confundidas com ausência; coordenadas inválidas e destinos repetidos | Estimativas ou roteiros inconsistentes |
| Média | `any`, casts de navegação e declaração local que sombreava expo-location | Erros contratuais escondidos pelo sistema de tipos |
| Média | Respostas de API sem validação, logs de corpos/erros externos e timeout que não cobria leitura do corpo | Exceções na tela, exposição de informações e requisições penduradas |
| Média | Funções extensas, sobretudo `getEstabelecimentos`, e persistência duplicada | Dificuldade de revisão e de testar falhas de cache/estado |
| Média | Ausência de testes e dependências nativas incompatíveis com o SDK | Regressões sem detecção automatizada |
| Baixa | README com nome apresentado como oficial, versões e promessas imprecisas | Portfólio pouco verificável |

A instalação confirmou incompatibilidades em expo-linking, expo-location, expo-web-browser, React Native, safe-area-context e screens. As dependências Web necessárias também estavam ausentes. Não foi adotada a estratégia de trocar bibliotecas ou migrar para outro SDK.

## Etapas realizadas e arquivos

### 1. Segurança

- `.gitignore`, `.env.example`: configurações privadas locais ignoradas e exemplo somente com URLs públicas e opção de demonstração.
- `src/api/client.ts`: URL-base configurável com endpoint original como fallback; autenticação limitada à origem institucional HTTPS; Headers normalizados; erros sanitizados; timeout abrangendo corpo, cancelamento e novas tentativas controladas para leituras. Nenhum endpoint HTTPS fictício foi inserido.
- `src/api/googlePlaces.ts`, `src/api/yelp.ts`, novo `src/api/reviewsProxy.ts`: credenciais removidas, chamadas dirigidas exclusivamente ao backend HTTPS configurado, fallback sem configuração, logs sem corpo ou credenciais e IDs codificados nas URLs. Alternativas legadas e modelos de saída preservados. Setters antigos rejeitam chaves privadas no cliente.
- `scripts/check-secrets.mjs`: busca heurística de padrões de segredo sem imprimir valores; não é auditoria do histórico.

A primeira verificação TypeScript após a etapa passou. A necessidade do backend está descrita em [SECURITY.md](SECURITY.md), sem implementação improvisada.

### 2. Qualidade, dados e estado

- Novos `src/api/validation.ts` e `src/api/providerValidation.ts`: validação de dados externos e persistidos antes do uso, com tipos específicos em lugar de `any`.
- `src/api/services.ts`: instituições/cidades/notícias e endpoints auxiliares validados; remoção de avaliações e contagens fabricadas; demonstração somente por opt-in; cache expirado preservado e validado; TTL em memória; busca aplicada no fallback de instituições e notícias; parâmetros codificados. Responsabilidades de validação foram extraídas sem redesenhar o módulo de serviços.
- Novo `src/context/usePersistentEstabelecimentos.ts`, `FavoritesContext.tsx` e `RoteiroContext.tsx`: persistência compartilhada, hidratação antes de edição, fila de gravações, validação e preservação dos dados originais em caso de corrupção. Falhas não fingem uma gravação bem-sucedida no estado da tela.
- `src/context/LocationContext.tsx`: tipos oficiais de expo-location, validação do cache e coordenadas, preservação das permissões/seleção manual, busca atual mesmo quando a última posição não é suportada, proteção contra cache/GPS atrasado sobrescrever cidade manual e compatibilidade com repetição de efeitos em StrictMode.
- `src/utils/geo.ts`: Haversine preservado; coordenadas válidas incluem zero; entradas inválidas retornam `NaN`, nunca uma distância plausível; consumidores usam validação/fallback e o formatador omite números inválidos.
- `src/utils/routeOptimizer.ts`: vizinho mais próximo preservado; deduplicação estável por ID, origem inválida tratada como ausente e validação das coordenadas. Referências municipais/regionais existentes foram preservadas e documentadas como aproximações.
- `src/utils/recommender.ts`: pesos, critérios, sazonalidade e janela de 60 minutos preservados; reputação ausente não é inventada; coordenadas inválidas não entram no cálculo; horários com `09h às 18h` são reconhecidos; fechamento explícito respeitado. Não houve substituição do motor de regras.
- `src/utils/navigationApps.ts`: coordenadas zero/válidas no fallback, Apple Maps por HTTPS e remoção de `destination_place_id` incorreto que recebia nome em vez de Place ID.
- `src/types/index.ts`: contratos de navegação tipados para abas/pilha; parâmetros de notícia/momento e busca coerentes com os consumidores. `src/types/expo-location.d.ts` agora apenas explica que os tipos vêm do SDK, sem sombreá-lo.
- `src/screens/HomeScreen.tsx`, `FavoritosScreen.tsx`, `NoticiaDetalheScreen.tsx`: navegação sem casts `as any`; rotas existentes preservadas.
- `src/screens/DetalheScreen.tsx`: exceções e horários tipados.
- `src/screens/MomentoScreen.tsx`: parâmetros e períodos tipados; atualização do contexto a cada minuto enquanto a tela está montada.
- `src/screens/ListaScreen.tsx`: resultados atrasados não sobrescrevem uma busca mais recente.
- `src/screens/CidadesScreen.tsx`, `src/components/cards/CardCidade.tsx`, `src/components/common/Stars.tsx` e rótulos de métricas em favoritos: ausência de contagem/avaliação sem números inventados; estrelas limitadas a valores válidos e métricas descritas como estimativas. Estilos preservados.
- `package.json`, `pnpm-lock.yaml`, `app.json`: versões alinhadas ao SDK 57, patch Expo 57.0.32, suporte Web, ferramentas de teste e plugin de expo-web-browser recomendado pelo instalador. Renderer de testes fixado em 19.2.3 para corresponder ao React. Dependências transitivas atualizadas dentro dos intervalos compatíveis; um único lockfile pnpm.

A análise final não encontrou `any`, `as any`, `@ts-ignore` ou `@ts-nocheck` em `src`. Os algoritmos extensos foram mantidos quando dividi-los não traria benefício proporcional; persistência e validação tinham responsabilidades compartilhadas claras para extração.

### 3. Testes

Adicionados `vitest.config.mts`, `tests/fixtures.ts` e:

- `tests/algorithms.test.ts`: distâncias conhecidas/iguais/inválidas; roteiros vazios, unitários, múltiplos, repetidos, desempates e ausência de GPS; horários, estações, previsão de abertura, proximidade e reputação ausente.
- `tests/api.test.ts`: JSON válido/inválido, HTTP, rede, retry, timeout, cancelamento, autenticação e validação dos provedores.
- `tests/services.test.ts`: mapeamento real sem reputação inventada, cache fresco/expirado/corrompido, filtros offline, TTL e buscas não contaminando cache completo.
- `tests/persistence.test.tsx`: dados legados, adições rápidas, edição durante hidratação, corrupção e falha/recuperação de gravação.
- `tests/reviews.test.ts`: serviço não configurado, proxy HTTPS, encaminhamento sem chaves e respostas inválidas.
- `tests/location.test.tsx`: permissão negada, cidade manual, coordenadas zero, ausência de last-known no Web, cache corrompido, GPS atrasado e StrictMode.

As APIs e AsyncStorage são simulados; os testes não fazem chamadas reais aos serviços turísticos ou de avaliações.

### 4. Documentação

`README.md` refeito com descrição neutra, origem dos dados, recursos implementados/externos/planejados, screenshots existentes, arquitetura, instalação, configuração, testes, limitações e próximos passos. Adicionados este registro e `docs/SECURITY.md`, incluindo contrato de backend e publicação segura. Nenhuma avaliação de usabilidade ou aceitação foi anunciada como realizada.

## Evidências executadas

Ambiente: Windows/PowerShell, Node 24.16.0, pnpm 12.18.0.

| Verificação | Resultado |
| --- | --- |
| Instalação `pnpm install --frozen-lockfile` | Concluída com o lockfile atualizado |
| `pnpm typecheck` / `tsc --noEmit` | Sem erros, incluindo os testes |
| `pnpm test` / `vitest run` | **76 testes passando em 6 arquivos** |
| `expo install --check` | Dependências compatíveis com o SDK instalado |
| `expo-doctor` | **21/21 verificações aprovadas** após atualização/deduplicação |
| `check:secrets` | Nenhum padrão conhecido encontrado na árvore local; sem auditoria de histórico |
| Exportação Metro Web, Android e iOS | Bundles gerados para as três plataformas; saída ignorada pelo Git em `dist/` |
| Auditoria final pnpm | **2 alertas moderados; 0 altos/críticos**, detalhados abaixo |

Os nomes de rotas e imports/exports são verificados por TypeScript e pelos bundles. Isso não confirma navegação interativa nem aparência em execução. Não foram executados build de binários nativos, instalação, navegação em dispositivo/emulador ou testes visuais em navegador. Integrações reais não foram testadas contra os provedores; não se afirma disponibilidade do servidor institucional.

## Pendências e limites

- Rotação/revogação das credenciais antigas e revisão de cobrança dependem do titular das contas. Nenhum segredo privado foi mantido no código atual; essa afirmação não cobre histórico ausente, cópias externas ou credenciais não reconhecidas pelo scanner heurístico.
- TLS/CORS institucional e backend seguro de avaliações dependem dos respectivos operadores. A aplicação não contorna políticas de cleartext/mixed content. Com API offline, pode iniciar com listas vazias.
- O pnpm audit final identifica `glob` 13.0.7 e `minimatch` 10.2.6, usados na cadeia de fingerprint do Expo, com risco de negação de serviço no processamento de padrões/travessia. Veja os avisos [glob GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) e [minimatch GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249). Não foram forçadas versões principais incompatíveis nem downgrade do SDK para zerar o relatório. O total é o de avisos do pnpm, não deve ser confundido com contagem de pacotes afetados de outro auditor.
- Horários especiais, pernoite, fuso do aparelho, trânsito e limites de waypoints continuam sujeitos às limitações descritas no README. A heurística não garante uma rota globalmente ótima.
- Cache e dados pessoais antigos foram preservados; notas históricas salvas antes da revisão não têm origem retrospectivamente verificável. Dados corrompidos bloqueiam gravação naquela sessão, com aviso, mas ainda não possuem fluxo visual próprio de recuperação.
- AsyncStorage não é criptografado. Política de privacidade, retenção de localização, revisão de direitos dos dados/imagens e usabilidade são trabalhos futuros para distribuição pública.

## Próximos passos opcionais

Validar manualmente as sete telas em Android/iOS/Web, permissões recusadas, seleção manual, favoritos/roteiro após reiniciar e links externos; disponibilizar TLS; implementar o backend de avaliações conforme contrato revisado; acompanhar correções oficiais das dependências transitivas; adicionar testes visuais/E2E e tratamento de horários especiais. A publicação deve seguir [SECURITY.md](SECURITY.md#publicação-no-github), após rotação das credenciais e revisão do conteúdo do commit.
