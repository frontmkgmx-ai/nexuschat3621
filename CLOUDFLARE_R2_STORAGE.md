# Migração e Configuração do Cloudflare R2

O app Nexus Chat migrou todo o seu armazenamento de mídia (fotos, áudio, vídeos e arquivos de mensagens) do Firebase/Supabase/S3 padrão para o Cloudflare R2. Como este frontend está preparado também para hospedar-se no Cloudflare Pages e usa rotas da API em backend Node.js (via `server.ts`) e suporta `functions/` futuramente, este sistema obedece a regras de segurança restritas para que as credenciais do Cloudflare R2 não vazem.

## Regras de Segurança
* **Nuca coloque credenciais secretas no Frontend:** As chaves de acesso R2 como `R2_ACCESS_KEY_ID` e `R2_SECRET_ACCESS_KEY` **nunca** devem aparecer em arquivos do navegador ou com prefixos `VITE_`.
* **Variável pública permitida:** Apenas `VITE_R2_PUBLIC_URL` é pública e serve para o frontend resolver URLs limpas pelo custom domain configurado `https://storage.cysmk.online`.
* **O Frontend não acessa o R2 diretamente para envio:** Ao invés disso, o app faz um request para a API `POST /api/storage/upload` que funciona como proxy (Option A). Isso ignora e resolve qualquer erro de CORS sem precisar mexer nas permissões públicas do R2 Bucket. O Backend intercepta raw files e sobe para o S3 tranquilamente.
* **O Bucket está acessível para leitura pública via Custom Domain**, então URLs construídas com o prefixo `https://storage.cysmk.online` funcionam com sucesso para requisições de download ou Embed e são rápidas pela CDN do Cloudflare.

## Configuração Cloudflare Pages (Painel de Deploy)

Se seu domínio, backend ou front forem gerenciados pelo **Cloudflare Pages**, você precisa adicionar as variáveis certas diretamente no painel do Cloudflare (Workers Settings / Pages Settings / Environment Variables). 

**Sempre re-faça o Deploy** após a adição/modificação de variáveis de ambiente no Cloudflare Pages para que as alterações entrem em vigor.

### Variáveis Privadas (apenas para o Worker ou Backend Express `server.ts`):
- `CLOUDFLARE_ACCOUNT_ID=7b6b27d12265ebd16b19f2cf1577f778`
- `R2_BUCKET_NAME=nexuschat`
- `R2_ENDPOINT=https://7b6b27d12265ebd16b19f2cf1577f778.r2.cloudflarestorage.com`
- `R2_PUBLIC_URL=https://storage.cysmk.online`
- `R2_ACCESS_KEY_ID` = `colar credencial secreta API Token com Edit`
- `R2_SECRET_ACCESS_KEY` = `colar Secret Key do R2 token`

### Variáveis Públicas (para uso em runtime no browser):
- `VITE_R2_PUBLIC_URL=https://storage.cysmk.online`

### Rotinas para Testes
Após iniciar (`npm run dev` / `node server.ts`), certifique-se de validar os seguintes fluxos nos browsers:
1. **Envio de Mídia:** Abra qualquer chat público ou DM, mande uma foto, um áudio ou GIF. A requisição vai solicitar a criação e envio via `/api/storage/upload?filename=...`, logo depois um XHR PUT enviará o binário bruto para o Node.js / Cloudflare Functions que servirá de ponte direta ao Cloudflare R2 Bucket. O retorno deve vir através de formato URL.
2. **Atualização de Perfil:** Atualize seu avatar nas opções (configurações do perfil).
3. **Leitura e Preview:** Arquivos hospedados no custom domain exibirão imagem/som. Arquivos originários do storage antigo funcionarão também sem falhas baseados em string-matching implementada como ponte fallback.
4. **Exclusões Seguras (API delete):** Ao se emitir exclusões nos recursos, o front enviará a rota `DELETE /api/storage/delete` no Node.js/Worker que chamará o aws-sdk S3 em cloud para remover a chave limpa do Cloudflare R2 validado.
