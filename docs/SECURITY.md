# Segurança e publicação

## Credenciais anteriormente expostas

Foram encontradas credenciais fixadas nos módulos Google Places e Yelp. Os valores foram removidos e não são reproduzidos neste documento. Considere ambas comprometidas: revogue/rotacione no painel de cada provedor, revise uso e cobrança e aplique limites e restrições adequados. A remoção do arquivo atual não remove cópias, forks, históricos ou bundles publicados. A rotação precisa ser realizada pelo titular da conta; não foi executada nesta revisão.

Não coloque segredos em `.env.example`, arquivos TypeScript, configurações Expo, documentação ou variáveis `EXPO_PUBLIC_*`. O `.gitignore` agora ignora `.env` e suas variantes, preservando somente o exemplo sem segredos. Isso não retira arquivos já rastreados do Git.

O Expo explica que [variáveis públicas são incorporadas ao aplicativo](https://docs.expo.dev/guides/environment-variables/). Uma chave de SDK nativo ou navegador especificamente projetada para uso público pode ser distribuída com restrições de aplicativo/site, API e cotas. Isso não torna pública uma credencial privada de web service. A integração REST atual do Google Places e o bearer do Yelp devem ser intermediados pelo servidor. Consulte a [orientação de segurança do Google Maps](https://developers.google.com/maps/api-security-best-practices).

Os símbolos `GOOGLE_PLACES_API_KEY`, `YELP_API_KEY` e seus setters foram mantidos apenas para compatibilidade de importação. Constantes são vazias e setters rejeitam chaves não vazias com erro explicativo. Nenhum consumidor atual do projeto usa esses setters. Configurar uma chave no cliente deixou de ser um caminho permitido.

## Backend de avaliações: contrato esperado, sem implementação

Configure `EXPO_PUBLIC_REVIEWS_PROXY_URL` com a base HTTPS de um backend sob seu controle, sem usuário/senha, query ou fragmento na URL. Sem ela, as funções retornam os dados base, `null` ou listas vazias e não fazem chamadas aos provedores. O cliente aplica timeout de 15 segundos por chamada, incluindo leitura do corpo.

Os sufixos abaixo são um contrato proposto para esse backend; não são endpoints já existentes no servidor institucional:

| Provedor | Requisição do aplicativo para o backend |
| --- | --- |
| Google searchText | `POST {base}/google/v1/places:searchText` |
| Google detalhes | `GET {base}/google/v1/places/{placeId}?languageCode=pt-BR` |
| Google busca legada, fallback | `GET {base}/google-legacy/maps/api/place/findplacefromtext/json?...` |
| Google detalhes legados, fallback | `GET {base}/google-legacy/maps/api/place/details/json?...` |
| Yelp busca | `GET {base}/yelp/v3/businesses/search?...` |
| Yelp avaliações | `GET {base}/yelp/v3/businesses/{id}/reviews?...` |
| Yelp detalhes | `GET {base}/yelp/v3/businesses/{id}` |

O backend deve guardar as credenciais no ambiente do servidor, adicionar autenticação dos provedores e devolver os respectivos corpos JSON e códigos HTTP. O mapeamento para os modelos existentes permanece no aplicativo, incluindo a alternativa legada do Google. Não altere esses contratos sem adaptar os consumidores.

O servidor precisa restringir caminhos, métodos, parâmetros e field masks aceitos, validar IDs e buscas, aplicar autenticação/autorização quando necessária, cotas, rate limiting, CORS adequado e limites de corpo/tempo. Não aceite uma URL arbitrária para encaminhamento; esse serviço não deve ser um proxy aberto. Cache, atribuição e retenção de avaliações devem seguir os termos dos provedores. Tokens privados de servidor não pertencem a esse contrato público. Autenticação de usuário, se necessária, requer integração própria; não existe um token compartilhado embutido no cliente.

O módulo de Google preserva cache por sessão. O módulo Yelp preserva busca e detalhes em memória. Sem serviço configurado, dados já salvos não são anunciados como novos dados ao vivo. A implementação não constitui validação contratual contra provedores reais; os testes usam fixtures.

## API institucional e HTTP

Endpoint original preservado: `http://atuaserra.vps-kinghost.net:8000/api`. Não há comprovação nesta revisão de um substituto HTTPS funcional, por isso nenhuma URL foi inventada ou trocada automaticamente. O operador deve disponibilizar certificado TLS válido e um endpoint equivalente em HTTPS, mantendo os contratos, e configurar CORS para a versão Web. Depois disso, configure `EXPO_PUBLIC_API_BASE_URL` e valide todas as plataformas.

O cliente mantém timeout de 45 segundos e até duas novas tentativas para leituras com falha de conexão, timeout, HTTP 429 ou 5xx. Não repete mutações automaticamente nem insiste em erros 4xx comuns ou JSON inválido. Aceita cancelamento do chamador. Mensagens não incluem corpos de erro, URLs completas nem objetos de exceção da rede.

`setApiAuthToken` conserva token apenas em memória. O cliente só adiciona esse token à origem institucional em HTTPS; não o envia pelo endpoint HTTP original nem a outros domínios. Um header Authorization explícito fora dessa condição é rejeitado. Não use HTTP para informações privadas. Políticas de transporte Android/iOS e mixed content de páginas HTTPS podem bloquear esse endpoint; não foram relaxadas para contornar a limitação do servidor.

## Dados locais

As chaves de favoritos, roteiro, localização e cache foram preservadas. Não houve limpeza nem migração destrutiva. AsyncStorage não é um cofre: não armazene credenciais nele. A localização persistida pode revelar informações pessoais no próprio dispositivo; uma política de retenção/remoção e informações de privacidade são próximos passos antes de distribuição pública.

Listas pessoais ilegíveis não são sobrescritas automaticamente. As operações ficam bloqueadas para aquela sessão e produzem aviso; recupere/inspecione os dados originais antes de decidir qualquer remoção. Falhas de gravação mantêm o último estado salvo. Essas situações ainda não têm uma interface específica de recuperação.

## Publicação no GitHub

1. Revogue/rotacione as credenciais expostas e confira uso/cobrança. Faça isso mesmo que ainda não exista repositório público.
2. Se houver histórico anterior, examine-o com uma ferramenta de detecção de segredos. Limpeza de histórico requer coordenação com quem mantém cópias; não basta apagar linhas do arquivo atual. Esta pasta não continha `.git`, portanto esse histórico não foi auditado.
3. Execute `pnpm typecheck`, `pnpm test`, `pnpm check:secrets`, `pnpm exec expo install --check`, `pnpm dlx expo-doctor` e `pnpm audit`. Leia as limitações do registro de revisão.
4. Confira `.env.example` e mantenha `.env` fora do commit. Não inclua `node_modules`, `.expo`, `dist`, credenciais nativas, dados privados nem dumps locais. Confirme direitos de uso das imagens e dados externos.
5. Se for iniciar um repositório nesta pasta, use `git init`, confira `git status --short` e `git check-ignore .env`, prepare os arquivos e revise `git diff --cached` antes do commit. Em histórico existente, use `git ls-files` para conferir se configurações privadas já estavam rastreadas; ignorá-las não basta.
6. Crie o repositório remoto desejado, faça o commit revisado e envie. Não foi criado repositório nem efetuado push nesta tarefa. Habilite secret scanning e push protection quando disponíveis para a conta/repositório.

O scanner local só procura padrões conhecidos e relata nomes de arquivos, sem mostrar possíveis credenciais. Não garante a ausência de todo tipo de segredo nem examina o histórico Git.
