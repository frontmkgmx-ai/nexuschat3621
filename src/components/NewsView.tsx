import React from "react";
import { motion } from "motion/react";
import { Zap, Shield, Smartphone, Sparkles, MessageSquare, Globe, Phone, Users } from "lucide-react";

const newsItems = [
  {
    title: "Perfis Públicos e Separação de Canais",
    description: "Você pediu e nós ouvimos! Clicou na foto de um usuário? Agora você é direcionado para uma página de Perfil Público espetacular, isolada do chat, onde pode conferir banner, avatar, sobre mim e os links permitidos. Além disso, os canais de comunidade agora são independentes: eles sumiram da aba global de mensagens e ganharam um espaço VIP somente na aba Comunidades. Muito mais organização para os seus chats!",
    icon: Sparkles,
  },
  {
    title: "Configurações Globais e Comunidades Otimizadas",
    description: "Aprimoramos o menu de configurações para garantir que suas preferências sejam sincronizadas perfeitamente em toda a sua conta. Além disso, as Comunidades receberam um belo upgrade! Agora, os canais criados são exclusivos da comunidade e não misturam conversas de fora. Para dar um toque mais profissional, os chats comunitários exibem ícones únicos ao invés de usar a foto de perfil.",
    icon: Sparkles,
  },
  {
    title: "Novo Perfil de Usuário Arrojado",
    description: "Sua página de perfil de usuário acabou de ficar muito melhor! Reinventamos a estrutura inspirados diretamente nas maiores plataformas de gamers. Agora sua experiência tem um background vibrante, suas conexões expostas em cards modernos e um banner irado. Personalizar seu perfil nunca foi tão gratificante!",
    icon: Sparkles,
  },
  {
    title: "Sincronização Rápida e Perfil Completo",
    description: "Agora você pode acompanhar a sincronização das suas mensagens ao abrir o app no celular, com um novo indicador de progresso super fluido! Além disso, o seu perfil está mais completo: agora exibe o seu número de telefone e o e-mail da sua conta conectada, garantindo mais transparência nas suas informações. E para completar, os vídeos no chat receberam um novo player nativo super rápido.",
    icon: Sparkles,
  },
  {
    title: "S3 Protocol Nativo!",
    description: "Substituímos o envio REST pelo protocolo oficial AWS S3 da Amazon nativo pro Supabase. Resolvemos as permissões que impediam o envio da sua foto de perfil e outros arquivos. O app agora usa @aws-sdk/client-s3 com chaves VIP, fazendo a mídia fluir como nunca antes!",
    icon: Sparkles,
  },
  {
    title: "Migração Concluída para Supabase!",
    description: "Para trazer ultra velocidade na entrega de mídias, o armazenamento agora é Supabase S3.",
    icon: Sparkles,
  },
  {
    title: "Chamadas com Layout Inteligente",
    description: "Você não precisa mais se preocupar com as câmeras dos seus amigos cortadas na tela! Atualizamos o design das chamadas para se adaptar automaticamente.",
    icon: Sparkles,
  },
  {
    title: "Chamadas mais Estáveis e Rápidas",
    description: "Resolvemos um travamento que ocorria durante as conexões de chamadas, onde a medição da qualidade da rede falhava em certas condições, derrubando o app. Agora o aplicativo se mantém firme mesmo sob instabilidades.",
    icon: Sparkles,
  },
  {
    title: "Correção Sólida de Envio de Arquivos",
    description: "Corrigido um erro que exibia mensagens indecifráveis no meio dos uploads, resultando em falhas. O Proxy API nativo agora lida melhor com exceções para que nenhuma foto quebre o fluxo!",
    icon: Sparkles,
  },
  {
    title: "Chamadas P2P Estabilizadas!",
    description: "Redefinimos a arquitetura para garantir que vocês dois entrem perfeitamente sincronizados na mesma sala. Além disso, criadores da chamada agora também podem ver o botão 'Entrar na Chamada' para reconectar sem problemas!",
    icon: Phone,
  },
  {
    title: "Chamadas Nativas e Correção de Avatares",
    description: "Agora todas as ligações de áudio e vídeo exibem botões de `Entrar na Chamada` para os outros usuários. Nós também corrigimos e reforçamos o carregamento de fotos de perfis que não estavam sendo exibidos para terceiros.",
    icon: Sparkles,
  },
  {
    title: "Integração Refinada de Arquivos",
    description: "Implementamos uma correção definitiva para falhas nos uploads! Agora fotos de perfil, imagens, vídeos e arquivos são processados diretamente pelo NodeJs Python Bucket API nativamente.",
    icon: Sparkles,
  },
  {
    title: "Media Embed e iFrames Nativos",
    description: "Visualização e embed de medias com HTTP 206 usando python em alta performance e qualidade ininterrupta, garantindo precisão frame a frame em streams 1080p.",
    icon: Globe,
  },
  {
    title: "Chamadas Avançadas",
    description: "Para entregar conversões e chamadas ultra fluidas, implementamos detecção de qualidade de áudio que indica a sua latência, melhorias drásticas nas configurações em que você pode desligar o cancelamento de ruído, escolher microfones, saídas de som e definir modos de áudio, incluindo Ultra Alta Fidelidade!",
    icon: Sparkles,
  },
  {
    title: "Status Melhorados",
    description: "Você ganhou suporte oficial para personalizar, enviar sua foto e manter contato em tempo real em um 'Inpage' melhorado com UI repaginada.",
    icon: MessageSquare,
  },
  {
    title: "Criptografia de Ponta a Ponta",
    description: "Agora todas as suas conversas são protegidas por criptografia de ponta a ponta. Isso significa que apenas você e a pessoa com quem você está conversando podem ler as mensagens.",
    icon: Shield,
  },
  {
    title: "Aceleração de Hardware",
    description: "Implementamos suporte a aceleração de hardware para melhor desempenho em dispositivos móveis Android. Agora, transições, animações e o processamento de imagens e vídeos são muito mais fluidos e responsivos.",
    icon: Smartphone,
  },
  {
    title: "Interface Fluida com Framer Motion",
    description: "Toda a interface do aplicativo foi repensada com Framer Motion para oferecer uma experiência de navegação nativa e ultra-suave.",
    icon: Zap,
  },
  {
    title: "Comunidades",
    description: "A funcionalidade de Comunidades é o novo espaço para se conectar com pessoas de interesses convergentes. Em sua fase inicial, estamos escalando a infraestrutura.",
    icon: Globe,
  }
];

export default function NewsView() {
  return (
    <motion.div 
      key="news"
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full absolute inset-0 w-full pt-4 bg-[#111214]"
    >
      <div className="px-5 py-4 shrink-0 border-b border-[#2B2D31]">
        <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Changelog <span className="text-sm font-normal text-zinc-500 bg-[#2B2D31] px-2 py-0.5 rounded-full">v1.1.32</span></h2>
        <p className="text-zinc-500 text-sm mt-1">Acompanhe as últimas melhorias e correções.</p>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-20 px-5 pt-8 space-y-8">
        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Autenticação Totalmente Renovada</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - <strong>Layout Inteligente e Profissional:</strong> A tela de login, o cadastro do SMS e a construção do seu Perfil foram reescritas com fluidez da tecnologia Framer Motion e ícones super imersivos. Mais moderno, responsivo, e rápido.
            - <strong>Feedbacks em Tela:</strong> Telas informativas e loadings animados, te avisando momento a momento para garantir clareza no app inteiro. Autenticar sua conta via Google e número de telefone acabou de se tornar algo fenomenal e fácil.
          </p>
        </div>
        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Comunidades Totalmente Funcionais</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - <strong>Organização Completa:</strong> A aba de Comunidades deixou de ser apenas visual! Agora você pode criar sua própria comunidade real, adicionar os seus grupos, criar canais de aviso e organizar todos os seus membros de forma integrada e segura, aproveitando toda a criptografia ponta a ponta do Nexus.
          </p>
        </div>
        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Aba Comunidades Implementada</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - <strong>Página Comunidades:</strong> O tab de comunidades agora tem um design incrível, unindo a organização de servidores detalhados e robustos com a vibe dos grupos super focados.
          </p>
        </div>

        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Reprodução de Vídeo Melhorada</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - <strong>Sincronização Perfeita:</strong> Consertamos os bugs relatados no novo player de vídeo, removendo totalmente a necessidade de realizar cliques duplos/vários cliques para dar play ou pause no vídeo. A interface ficou ultra-responsiva.
          </p>
        </div>

        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Melhoria e Robustez no Backend API</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - <strong>Revisão Total da Camada de Rede:</strong> O arquivo fonte (File API) que lida com todos os anexos no app foi reescrito para ser muito mais robusto e performático. Adicionamos documentação inteligente (JSDoc), tipos estritos nativos para upload, e um sistema forte anti-falhas e Timeouts.
          </p>
        </div>

        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Remoção de Proxys</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - <strong>Arquitetura Direta:</strong> Foram totalmente removidos os proxys de chamadas e mídias no backend, mantendo o App mais coeso, leve, responsivo e menos custoso com renderização e tráfego. O processamento direto no frontend voltou a atuar por padrão.
          </p>
        </div>

        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Novo Player de Vídeo Personalizado</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - <strong>Experiência Premium:</strong> Substituímos o player de vídeo nativo padrão dos navegadores por um reprodutor customizado e muito mais bonito, estilo YouTube! Ele integra menu para download, botão de Picture-in-Picture e ajustes rápidos como velocidade de reprodução para facilitar ainda mais o consumo das mídias enviadas no chat.
          </p>
        </div>

        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Segurança de Mídia Avançada</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - <strong>Proxy de Mídia e Ocultação de Links:</strong> Todas as requisições de mídias (imagens, vídeos e GIFs) agora são carregadas através de um proxy no backend (<code>/api/media/</code>) usando algoritmos de ofuscação síncrona. Isso evita o vazamento dos links reais dos buckets de armazenamento no console de rede sem prejudicar a velocidade e a compatibilidade de carregamento do conteúdo!
          </p>
        </div>

        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Reestruturação do Backend para Chamadas (Call API)</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - <strong>Mover Chamadas API (Call API) para o Backend:</strong> Migramos toda as estruturas da 'Call API' para o ambiente nativo backend! O Node.js/Express agora suporta e trata as mais de 100 requisições (testes de gravação, dispositivos, qualidade de tela e manipulação de salas WEBRTC) que anteriormente estavam isoladas, parando os avisos falsos de `404` do frontend de vez e fornecendo muito mais potencial para escalabilidade nativa.
          </p>
        </div>

        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Aprimoramento nas Chamadas Em Grupo / 1v1</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - <strong>Bloqueio de Múltiplas Chamadas:</strong> Agora, ao iniciar uma ligação em um chat, o outro usuário não pode iniciar uma nova até que a atual seja encerrada; ele será redirecionado automaticamente para entrar na chamada ativa.
            - <strong>Status de Chamada Integrado:</strong> Apenas mensagens de ligação ativas poderão ser "entradas". Identificadores mostrarão explicitamente <em>"Chamada Encerrada"</em> quando todos os participantes tiverem saído da ligação, prevenindo mensagens confusas de entrar em ligações inativas.
          </p>
        </div>

        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Limpeza e Otimização do Aplicativo</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - <strong>Remoção da Gravação de Voz:</strong> O recurso de gravação nativa de voz foi retirado do chat de mensagens com intuito de simplificar o fluxo de conversas em texto e otimizar componentes do sistema.
          </p>
        </div>

        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Comunicação em Tempo Real Máxima</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - <strong>Entrega Global (Delivered):</strong> Implementamos hooks silenciosos para exibir a confirmação de entrega imediata no app inteiro mesmo que o usuário esteja navegando em outras telas.
            - <strong>Status de Digitação (RTDB):</strong> Visualização instantânea na Sidebar e no ChatWindow enquanto os contatos enviam mensagens (estilo "Digitando..."), proporcionando ritmo de conversa ao vivo e responsivo.
            - <strong>Múltiplos Sincronismos:</strong> O painel esquerdo atualiza as pré-visualizações perfeitamente com todas as métricas unificadas em tempo real pelas capacidades avançadas da Firebase.
          </p>
        </div>

        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Compatibilidade Total com Cloudflare Pages</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - <strong>Integração Proxy Cloudflare:</strong> Foram implementados padrões HTTP dinâmicos e adaptativos para o ambiente de proxy do Cloudflare. Isso resolve os problemas de requisição CORS no envio de mídias/áudio que bloqueavam em cloudflare pages.
            - <strong>Conexão Websocket Resiliente:</strong> A injeção nativa multitarefas do `transports: ['websocket', 'polling']` melhora o handshake do Socket.IO através dos Firewalls do Cloudflare, deixando as ligações muito mais velozes e estáveis.
            - <strong>Compatibilidade Serverless Aprimorada:</strong> Atualização com _redirects na build para que chamadas WebSocket ou Fetch utilizem corretamente proxies transparentes (proxy HTTP 200).
          </p>
        </div>

        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Aprimoramento de Conexão (WebRTC) e Compartilhamento de Telas</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - <strong>Conexão Ampliada Fora do Preview:</strong> Introduzida infraestrutura com múltiplos servidores STUN robustos para garantir que ligações de áudio e vídeo funcionem em 100% dos ambientes sem falhas de NAT ou rede restrita.
            - <strong>Telas 100% Funcionais:</strong> Aprimorada a lógica de renegotiation e track management para que o compartilhamento de tela de desktops seja recebido do outro lado de forma cristalina.
            - <strong>Ajuste de Visualização Dinâmico:</strong> Mudamos o enquadramento de vídeos e telas minimizadas (agora usa "Contain") impedindo o corte (cropping) de conteúdos importantes em monitor de tela ultrawide.
          </p>
        </div>

        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Notificações Inteligentes "Nexus Notifify" e Efeitos Sonoros</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - <strong>Sons Imersivos de Qualidade:</strong> Adicionado feedback sonoro nítido para todas as interações principais. Isso inclui sons específicos ao enviar e receber mensagens, e até mesmo ao deletar ou responder mensagens para tornar tudo muito mais tangível e tátil.
            - <strong>Nexus Notifify:</strong> Um robusto painel de integração "background push" e avisos real-time. Quando uma nova atualização é efetuada no sistema, você receberá a notificação contendo o título da atualização global ao vivo em tela!
            - <strong>Web Push FCM & Browser Notifications:</strong> O sistema Cloud Messaging foi integrado e os certificados push (VAPID) atrelados, entregando suas mensagens mesmo fora de foco através das janelas interativas do seu Sistema Operacional.
            - <strong>Comunicação de Chamadas:</strong> Novos tons dedicados ao iniciar ligações (entrada de áudio), desligar (saída) e ao mutar microfones com indicadores sutis. Totalmente protegido por criptografia no canal e hardware acceleration no mobile.
          </p>
        </div>
        
        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Qualidade de Áudio e Duplicidade</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - Melhoria na qualidade do áudio gravado (taxa de amostragem aumentada e cancelamento de ruído aprimorado).
            - Corrigido problema que causava eco/voz duplicada devido ao modo de toque duplo.
            - Corrigido bug de carregamento do player nativo em arquivos já enviados, garantindo reprodução contínua.
          </p>
        </div>
        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Correção na Gravação de Áudio</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - Corrigido um problema com o gravador de áudio que fazia o áudio desaparecer imediatamente ou reiniciar após soltar o dedo/mouse finalizando a gravação. O preview para revisão antes do envio agora permanece corretamente na tela.
          </p>
        </div>
        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Mensagens de Áudio</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - Agora você pode enviar mensagens de voz facilmente! Basta pressionar ou segurar o botão de microfone novo adicionado no chat.
            - Novo visual de gravação interativo com contador e pré-visualização para que você ouça seu áudio ou descarte antes de enviá-lo.
            - Total suporte a plataformas mobile e desktop.
            - Novo player imersivo integrado nas próprias mensagens com barra de progresso em tempo real e melhorias no desempenho do histórico do chat.
          </p>
        </div>
        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Sincronização de Contatos Otimizada Integrada ao Firebase Auth</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - Integramos completamente a "Sincronização de contatos" do Google na nova malha segura do Firebase Auth, assim como a vinculação de conta, contornando o erro fatal 400 (invalid_request) enfrentado pelos usuários anteriormente associado com URIs antigas ou domínios rígidos; isso trará mais rapidez para acessar seus contatos de forma local no seu perfil sem repassar acesso adicional ao backend.
          </p>
        </div>
        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Melhorias na Autenticação e Experiência de Login</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - Migramos completamente a vinculação e a inicialização de contas do Google a partir do Login e das Configurações do perfil para o ecossistema rápido e seguro do Google Firebase Auth, garantindo que não há mais problemas de janelas pop-up cortadas ou falhas de redirecionamento durante a vinculação, operando perfeitamente e consistentemente em ambiente de produção.
            - Consertamos a validação de segurança do código de acesso na inicialização de login, fixando em exatos 6 dígitos estritamente estruturados como números e ativando automaticamente o teclado numérico de dispositivos móveis, prevenindo possíveis falhas de simulação.
            - O carregamento da sincronização dos contatos do Google permanece isolado na chave de autorização robusta original providenciando mais segurança com os dados importados.
          </p>
        </div>
        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Compatibilidade de Domínio e Ligações Resolvidas</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - Corrigido um problema crítico que impedia o login via conta Google de concluir a autenticação fora do ambiente de desenvolvimento. O fluxo de mensagens com janelas aninhadas (postMessage) foi relaxado de forma segura para focar em validar se o sucesso da comunicação ocorreu, ao invés de barrar hard-coded urls/domínios.
            - O sistema de chamadas de Áudio e Vídeo foi completamente consertado para funcionar corretamente no domínio oficial (`nexuschat-55d.pages.dev`). Adicionamos uma nova ponte dinâmica que reconhece dinâmicamente as instâncias de backend ou as variáveis adequadas de produção e re-rota de forma autônoma as conexões WebRTC e Websocket API.
          </p>
        </div>
        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Alertas e Confirmações Integrados</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - Removemos as antigas e intrusivas caixas de alerta padrão do navegador (janelas popups de erro ou confirmação).
            - Desenvolvemos e incorporamos um novo sistema de notificações (toasts) no topo da tela e modais de confirmação 100% visuais, nativos e integrados ao design do próprio aplicativo, promovendo imersão, usabilidade transparente e visual fluido, preservando a imersão na interface sem bloquar o navegador sem aviso.
          </p>
        </div>
        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Sincronização de Domínio no Login Google</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - Ajuste crítico no sistema de callback do login provido via conta Google. O aplicativo agora reconhece unicamente os domínios Cloudflare como origem de requisição oficial: nexuschat-55d.pages.dev.
            - A exibição do Erro 400 (invalid_request) por divergência do redirect_uri foi completamente eliminada para a atual URL do aplicativo.
          </p>
        </div>
        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Login e Sincronização Google Restaurados</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - Corrigimos o fluxo de login e a sincronização de contatos com a sua conta Google que não estavam finalizando corretamente ao usar o aplicativo por um domínio ou site personalizado.
            - Todo o gerenciamento de autenticação da tela de login e janela flutuante foi reconstruído para ser mais inteligente e aceitar domínios diversificados sem derrubar sua conexão. 
            - As ligações e chamadas estão ainda mais rápidas após otimizações de pareamento de rede.
          </p>
        </div>
        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Ajuste de Densidade nas Chamadas</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - Reduzimos o zoom geral em 20% no layout para Computador nas salas de ligação, deixando a densidade visual e espaçamento mais limpos para telas grandes.
            - O background das chamadas agora integra a imagem secundária (banner) do usuário de maneira mais nítida e marcante.
          </p>
        </div>
        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Conexão de Chamadas Resolvida</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - Resolvemos o problema que deixava as chamadas presas no estado "Conectando..." infinitamente.
            - Agora, as informações de pareamento da ligação (WebRTC) correm fluidamente através de um sistema nativo unificado no servidor.
            - Refinamento adicional na conexão P2P garantindo que você se conecte cirurgicamente ao usuário correto sem interferências.
          </p>
        </div>
        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Correção Extrema de Roteamento de Origem na Autenticação (Pop-ups / Telas de Erro 404 Google)</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - Resolvido gravíssimo problema que causava uma tela de 'Page not found' (404) dentro do aistudio.google.com durante a abertura da tela de login pelo celular ou pop-ups bloqueados.
            - Agora, a origem de callback (redirecionamento) é calculada perfeitamente na raiz do próprio servidor Cloud Run backend, protegendo contra erros de Iframe e contêineres Google!
          </p>
        </div>
        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Suporte a Configurações de Nuvem para Autenticação</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - Preparamos o sistema de login com o Google para aceitar as origens autorizadas (JavaScript Origins) e as rotas de callback de redirecionamento. Assim, seu ambiente em Cloud Run funciona de forma correta sem bloqueios do Google!
          </p>
        </div>
        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Novo Login e Segurança Aprimorada</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - O sistema de vinculação com contas Google foi reconstruído do zero, trazendo mais estabilidade e usando o provedor nativo sem expor dados desnecessários ou bloqueios estranhos de pop-up antigos.
            - Total proteção e respeito à sua privacidade: o tratamento de chave criptografada de comunicação de serviços de contatos foi inteiramente realocado da interface para os sistemas internos do App, te blindando ainda mais de problemas na web!
          </p>
        </div>
        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Sincronização com API People</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - A integração da sincronização agora suporta vinculação de Contatos do Google com a API oficial do People! Puxando facilmente todos os nomes, emails e números verdadeiros via backend de forma segura e criptografada (chaves Keys escondidas para maior proteção).
          </p>
        </div>
        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Personalização Avancada e Integração Google</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - Menu de Chat (Click Direito/Segurar): Exportar PDF/TXT, Arquivar, Excluir, e Adicionar até 5 pessoas! (A transformação para grupo agora é fácil e rápida).
            - As logotipos no menu lateral de desktop ganharam animações e vida extra.
            - A integração da sincronização agora suporta vinculação de Contatos do Google, puxando facilmente todos que você conhece!
            - Sincronização de perfil melhorada garantindo que troca de perfis aplique na hora em todos chats e as mensagens permaneçam totalmente coesivas na tela.
          </p>
        </div>
        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Novo Layout de Ligações</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - Tivemos uma grande atualização visual nas chamadas (áudio e vídeo) para Computador.
            - Agora, a tela de ligação aproveita melhor o seu monitor, com controles flutuantes mais elegantes.
            - Adicionamos suporte ao banner do perfil na tela de chamada: mesmo com a câmera desligada, a tela vai ficar com a sua cara (sua imagem de fundo aparecerá levemente desfocada).
          </p>
        </div>
        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Vídeos no Status Corrigidos</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - Corrigido o bug onde os vídeos dos status eram interrompidos precocemente.
            - O status agora dura o tempo exato do seu vídeo postado!
          </p>
        </div>
        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Novo Layout Deslumbrante de Criação de Status</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - Interface de criação dividida no Computador, tornando tudo mais organizado e fácil.
            - Visualização em tela cheia no celular para imersão total enquanto você edita suas fotos/vídeos.
            - Nova experiência visual das opções, mantendo o ambiente mais limpo e amigável.
            - Agora suportamos corte de imagens exclusivo e nativo no celular.
          </p>
        </div>
        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Smartphone className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Ajuste de Mídia no Status</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - Imagens e vídeos publicados no status agora se adaptam automaticamente ao tamanho da tela (usando object-contain).
            - Fim das imagens cortadas ou distorcidas no preview e na visualização principal.
          </p>
        </div>
        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Smartphone className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Gestos de Navegação e Zoom</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - Navegue pelos status deslizando a tela (swipe).
            - Pause a visualização segurando a tela.
            - Controle de som para vídeos nos status.
            - Amplie as imagens nos status (zoom) e sinta-se mais próximo.
            - Cortador de fotos exclusivo para dispositivos móveis antes mesmo de postar.
          </p>
        </div>
        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Novo Upload de Mídia nos Status</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - Agora você pode selecionar imagens ou vídeos para publicar nos seus Status.
            - Novo design refinado e imersivo para visualização das mídias.
            - Inclua textos e legendas junto às suas fotos e vídeos, tudo organizado e muito fácil de usar.
          </p>
        </div>
        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <Users className="w-4 h-4" />
            <h3 className="font-semibold text-zinc-200">Novo Módulo de Contatos</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            - Agora é possível adicionar contatos facilmente usando o número de telefone ou endereço de e-mail.
            - Visualização aprimorada de sua lista de contatos em português.
            - Facilidade para começar uma nova conversa diretamente da página de contatos.
          </p>
        </div>
        <div className="relative pl-8 border-l border-[#2B2D31] group">
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
          <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
            <h3 className="font-semibold text-zinc-200">Aprimoramento de Segurança e Build</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            Preparação para deploy no Cloudflare Pages:
            - Remoção de chaves expostas (Secret e public Keys) do frontend.
            - Autenticação com bucket AWS/Supabase agora acontece nativamente no backend via Presigned URLs.
            - Remoção de proxies em desuso, permitindo o correto build direto com Vite.
          </p>
        </div>
        {newsItems.map((item, index) => (
          <div key={index} className="relative pl-8 border-l border-[#2B2D31] group">
            <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e1f22] border-2 border-[#2B2D31] group-hover:border-indigo-500 transition-colors" />
            
            <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
              <item.icon className="w-4 h-4" />
              <h3 className="font-semibold text-zinc-200">
                {item.title}
              </h3>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
