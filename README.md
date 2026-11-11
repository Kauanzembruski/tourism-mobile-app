# Aplicativo de Turismo para Veranópolis e Serra Gaúcha

Aplicativo em React Native, Expo e TypeScript que facilita a descoberta de estabelecimentos, cidades e notícias da região e o planejamento de visitas em dispositivos móveis e Web.

O projeto **consome dados de uma plataforma turística já existente**, por meio da API institucional do AtuaSerra e das mídias de serragaucha.com. Acrescenta favoritos, roteiros, localização e recomendação contextual. Não representa um novo backend nem um produto oficialmente nomeado por essa plataforma. Identificadores técnicos anteriores foram preservados para compatibilidade.

## Problema e objetivos

Reunir informações turísticas regionais em uma interface móvel, facilitar a busca por cidade e categoria e apoiar o planejamento de deslocamentos. O projeto demonstra integração de serviços, persistência local e algoritmos próprios, sem substituir a plataforma de origem.

## Funcionalidades implementadas

- Início com destaques, categorias, cidades e notícias; busca com filtros e ordenação por proximidade.
- Detalhes de estabelecimentos, horários disponíveis, contato, compartilhamento e acesso a aplicativos de navegação.
- Favoritos e roteiro persistidos com AsyncStorage, preservando as chaves e o formato das listas anteriores.
- Localização com `expo-location`, solicitação de permissão e seleção manual de cidade pelo controle de localização.
- “No Momento”: ranking contextual por reputação disponível, funcionamento, período do dia, estação do ano e proximidade; simulação de horários e janela de abertura de 60 minutos.
- Roteiro com heurística do **vizinho mais próximo**, coordenadas geográficas e envio de paradas ao Google Maps; Waze para a primeira parada.
- Cache institucional com validade de 30 minutos e uso de dados reais expirados quando a rede falha.

A recomendação usa regras locais, sem IA generativa. Pesos preservados: reputação 35%, funcionamento 35%, contexto 20% e proximidade 10%. Locais operando ou prestes a abrir têm prioridade sobre os fechados; depois aplica-se a pontuação.

### Dependências externas

Catálogo e notícias dependem da disponibilidade e do contrato da API institucional. Avaliações Google Places e Yelp possuem módulos implementados, mas as chamadas ao vivo exigem um **backend HTTPS seguro configurado separadamente**. A tela de detalhes usa Yelp; o módulo e o componente de Google permanecem disponíveis no código. Sem backend de avaliações, o aplicativo usa os dados já cadastrados e não envia chamadas aos provedores.

### Dados reais, cache e demonstração

O modo normal usa API e cache real; falhas sem cache resultam em listas vazias, detalhes indisponíveis ou dados já recebidos pela tela. Notas e quantidades de avaliações não são geradas. Zero no modelo indica ausência de nota; o componente de estrelas mostra “Sem avaliações”. Contagens de estabelecimentos só são exibidas quando informadas pelo serviço.

As fixtures preexistentes de `src/constants/data.ts` são **demonstrativas**, sem garantia factual. Seu uso como fallback exige `EXPO_PUBLIC_DEMO_MODE=true`; mantenha `false` para uso real e publicação. Esse modo não substitui sistematicamente a API: só habilita as alternativas demonstrativas existentes quando necessário. Categorias, emojis, coordenadas municipais de referência e horários padrão são configurações locais, não informações atualizadas de funcionamento dos estabelecimentos.

## Capturas de tela

Capturas já presentes no repositório, preservadas durante a refatoração. Não constituem evidência de testes atuais em dispositivos.

| Início | No Momento | Roteiro | Notícias |
| --- | --- | --- | --- |
| ![Início](docs/screenshots/home.png) | ![No Momento](docs/screenshots/no_momento.png) | ![Roteiro](docs/screenshots/roteiro_otimizado.png) | ![Notícia](docs/screenshots/noticia_detalhe.png) |

## Tecnologias

| Tecnologia | Uso |
| --- | --- |
| Expo SDK 57 / React Native 0.86.3 / React 19.2.3 | Android, iOS e Web |
| TypeScript, modo estrito | Contratos e verificação estática |
| React Navigation 7 | Native Stack e Bottom Tabs |
| expo-location | Permissões, localização e geocodificação reversa |
| AsyncStorage | Favoritos, roteiros e cache |
| expo-web-browser / Linking | Sites e aplicativos externos |
| Vitest / react-test-renderer | Testes de lógica, integração simulada e persistência |

As versões nativas seguem o verificador do SDK instalado. O lockfile oficial é `pnpm-lock.yaml`.

## Arquitetura

```text
App.tsx                 # Providers e NavigationContainer
src/
  api/                  # Cliente HTTP, serviços, validação e avaliações via proxy
  components/
    cards/              # Cards de cidades, estabelecimentos, roteiro e notícias
    common/             # Estrelas, localização, tags e avaliações
  constants/            # Tema, categorias, referências e fixtures demonstrativas
  context/              # Localização, favoritos e roteiro
  navigation/           # Pilha e abas existentes
  screens/              # Sete telas preservadas
  types/                # Modelos e contratos de navegação
  utils/                # Haversine, recomendação, vizinho mais próximo e navegação
tests/                  # Testes com mocks; sem chamadas reais de API
docs/                   # Segurança, diagnóstico e capturas existentes
```

O hook compartilhado de persistência carrega dados antes das edições e serializa gravações. Dados corrompidos não são apagados nem sobrescritos automaticamente. Falha de gravação preserva o último estado salvo e produz um aviso sem conteúdo sensível.

## Instalação

Recomendado: **Node.js 24 LTS (24.3 ou superior)** e **pnpm 12.18.0**. Também são aceitas as versões de Node declaradas em `package.json`. Os comandos abaixo funcionam em PowerShell e terminais usuais após instalar Node e pnpm.

```sh
npm install --global pnpm@12.18.0
pnpm install --frozen-lockfile
```

Não misture lockfiles de gerenciadores diferentes. Para usar pnpm sem instalação global, substitua `pnpm` por `npx --yes pnpm@12.18.0`.

## Configuração

Copie `.env.example` para `.env` (`Copy-Item .env.example .env` no PowerShell, ou `cp .env.example .env` no macOS/Linux).

| Variável pública | Finalidade |
| --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | URL-base institucional; se ausente, preserva o endpoint HTTP original |
| `EXPO_PUBLIC_REVIEWS_PROXY_URL` | URL HTTPS do backend de avaliações; vazia desabilita chamadas ao vivo |
| `EXPO_PUBLIC_DEMO_MODE` | `false` por padrão; `true` permite fallback demonstrativo explícito |

**Todas essas variáveis são públicas e podem aparecer no bundle. Nunca coloque chaves privadas, tokens ou senhas nelas.** O endpoint institucional original usa HTTP, com limitações de segurança e de execução no navegador/dispositivo. Não foi substituído por uma URL HTTPS não verificada. Veja [segurança e contrato do proxy](docs/SECURITY.md).

Reinicie o Expo após alterar as variáveis; para limpar cache do bundler, use `pnpm start --clear`.

## Desenvolvimento

```sh
pnpm start
pnpm android
pnpm ios
pnpm web
```

Android requer emulador ou dispositivo configurado. O simulador iOS requer macOS e Xcode. Use uma versão de Expo Go compatível com o SDK 57 ou uma development build. No navegador, geolocalização depende de permissão e contexto seguro (HTTPS ou localhost); geocodificação reversa e abertura de aplicativos têm comportamento específico por plataforma.

## Testes e verificação

```sh
pnpm typecheck
pnpm test
pnpm test:watch
pnpm check:secrets
pnpm exec expo install --check
pnpm dlx expo-doctor
pnpm audit
```

Os testes cobrem Haversine, entradas inválidas, vizinho mais próximo e estabilidade, horários e ranking, erros HTTP, timeout, cancelamento, respostas inválidas, proxy não configurado, cache e gravações concorrentes. APIs e AsyncStorage são simulados; não são consumidas cotas de provedores. O scanner local é uma verificação heurística e não substitui revisão do histórico Git ou ferramentas de detecção de segredos.

Para verificar a geração de bundles:

```sh
pnpm exec expo export --platform web --output-dir dist/web
pnpm exec expo export --platform android --platform ios --output-dir dist/native
```

Exportar JavaScript não equivale a compilar binários nativos, instalar em dispositivos ou testar a navegação visual. Resultados e pendências estão em [registro da refatoração](docs/REFATORACAO.md).

## Limitações conhecidas

- HTTP institucional transmite dados sem proteção TLS; pode ser bloqueado por mixed content, ATS e políticas de cleartext. A correção depende do operador do servidor, além de CORS adequado para Web.
- Google/Yelp exigem backend HTTPS separado, cotas e conformidade com os termos de cada provedor. Nenhum backend foi criado nesta revisão.
- Haversine fornece distância em linha reta; tempo usa referência de 45 km/h. O vizinho mais próximo não garante solução ótima do problema do caixeiro viajante. Valores exibidos são **estimativas**, sem trânsito nem malha viária.
- Sem coordenadas válidas, preserva-se a referência do município e, em último caso, Bento Gonçalves. Não corresponde à posição exata do estabelecimento. Confira o destino no aplicativo de mapas. Google Maps pode limitar a quantidade de waypoints aceita.
- Funcionamento usa horários disponíveis e heurísticas de categoria; exceções de abertura são consultadas nos detalhes, mas não entram no ranking. Horários especiais, virada de dia e fuso do aparelho exigem validação adicional; não há garantia de abertura real.
- Sem GPS, o roteiro parte do primeiro destino; cidade manual representa o centro municipal, não GPS preciso. Localização é armazenada localmente sem criptografia por AsyncStorage.
- Dados antigos de favoritos/roteiros são preservados, inclusive avaliações salvas antes da revisão; não há como atribuir retrospectivamente sua origem com segurança.
- O cache pode estar desatualizado quando utilizado offline. Respostas paginadas ou alterações no contrato institucional exigem adaptação explícita.
- Não foram realizadas avaliações de usabilidade/aceitação nem testes em dispositivo/emulador nesta revisão. Há alertas moderados pendentes na cadeia de ferramentas do Expo, detalhados no registro.

## Próximos passos planejados

Disponibilizar TLS no servidor institucional, integrar um backend de avaliações com autorização e limites de uso, testar Android/iOS/Web em dispositivos reais, validar horários especiais/fusos e conduzir avaliação de usabilidade. Essas atividades não são apresentadas como concluídas.

## Publicação segura no GitHub

Siga [o checklist de publicação](docs/SECURITY.md#publicação-no-github). Revogue as credenciais anteriormente expostas antes de publicar, revise os arquivos preparados para commit e habilite secret scanning/push protection quando disponível. Esta pasta foi recebida sem `.git`; o histórico anterior não pôde ser inspecionado.

## Licença

Veja [LICENSE](LICENSE). Confira separadamente permissões de redistribuição de dados, imagens e marcas das plataformas de origem; a licença do código não concede automaticamente esses direitos.
