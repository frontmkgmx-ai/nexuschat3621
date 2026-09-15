# Guia de Configuração e Persistência de Secrets no Nexus Chat

Este documento explica como gerenciar variáveis de ambiente e chaves sensíveis (como `STREAMX_API_KEY`) para garantir a segurança e a correta persistência nos diferentes ambientes de execução da aplicação.

## Diferenças entre os Ambientes (Railway, GitHub e AI Studio)

Não trate Google AI Studio, GitHub e Railway como se fossem o mesmo armazenamento de variáveis. Eles possuem papéis e comportamentos diferentes.

### 1. Railway (Produção)
- **Fonte de Verdade**: O Railway é o ambiente oficial e a fonte de verdade para as variáveis de produção do backend.
- **Configuração**: A API Key (`STREAMX_API_KEY`) deve ser cadastrada **apenas** na aba "Variables" do serviço/backend correto, no ambiente de produção.
- **Aplicação de Mudanças**: **Sempre** que você adicionar ou alterar uma Secret no Railway, é necessário fazer um **redeploy ou restart** do serviço para que a variável seja carregada.
- **Verificação**: Verifique os logs apenas para confirmar que o serviço foi inicializado com sucesso. Nunca exponha o valor da chave imprimindo-o nos logs.

### 2. GitHub (CI/CD)
- As Secrets e Variables do repositório no GitHub pertencem **exclusivamente** ao GitHub Actions e **não** sincronizam automaticamente com o Railway ou com o Google AI Studio.
- **Configuração**: Acesse `Settings > Secrets and variables > Actions > New repository secret` (ou `Settings > Environments > production > Environment secrets` se o seu workflow exigir ambiente específico).
- **Uso Seguro**: 
  Se houver workflows do GitHub Actions, as variáveis devem ser referenciadas com segurança:
  ```yaml
  env:
    STREAMX_API_KEY: ${{ secrets.STREAMX_API_KEY }}
    STREAMX_BUCKET_ID: ${{ vars.STREAMX_BUCKET_ID }}
    STREAMX_BASE_URL: ${{ vars.STREAMX_BASE_URL }}
  ```
- **Regras**: Nunca use o comando `echo` da Secret nos logs. Nunca grave a chave nos arquivos `app/src/main/assets`, `.env`, `.env.production`, README ou commit.

### 3. Google AI Studio (Desenvolvimento/Preview)
- As variáveis inseridas no painel do Google AI Studio podem ser restritas a uma sessão ou visualização, podendo não persistir de forma permanente ou global.
- O Google AI Studio serve para desenvolvimento, mas **não** é o Gerenciador de Secrets oficial da aplicação em produção.
- Caso uma variável de ambiente desapareça do painel do AI Studio após um reload, **não contorne isso injetando a chave diretamente no código**. Ao invés disso, mantenha a chave em seu arquivo local localmente (.env não-commitado) e certifique-se de configurar a variável permanentemente no Railway.

## Regras de Ouro de Segurança

1. **Nunca** inclua segredos reais (como API Keys) no arquivo `.env.example` ou no código fonte versionado. O `.env.example` deve listar apenas nomes e valores públicos:
   ```env
   STREAMX_API_KEY=
   STREAMX_BUCKET_ID=5500ceff-6d51-4f33-aee4-a07e2725ddaf
   STREAMX_BASE_URL=https://streamx.frontmk.online/api/storage/v1
   MYCLOUD_API_KEY=
   ```
2. **Nunca** exporte ou acesse a API Key no bundle do frontend do Vite (e.g., evite variáveis com o prefixo `VITE_STREAMX_API_KEY`). A chave deve ser estritamente gerenciada pelo backend (`server.ts`).
3. O valor de fallback aceitável para o bucket e a URL em desenvolvimento é seguro, contanto que as chamadas passem pelo endpoint proxy do backend (`/api/storage/v1/...`). A API Key não tem fallback para string codificada.
4. Antes de enviar qualquer alteração que modifique fluxos de upload ou Secrets, verifique o health check (`/api/storage/health`) do backend. Ele retornará `true` se estiver devidamente configurado, protegendo a integridade da chave.
