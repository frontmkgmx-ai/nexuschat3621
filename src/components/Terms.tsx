import React from "react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 py-12 px-4 sm:px-6 lg:px-8 font-sans overflow-y-auto">
      <div className="max-w-4xl mx-auto bg-zinc-900 border border-zinc-800 rounded-xl p-8 md:p-12 shadow-2xl">
        <h1 className="text-3xl font-bold text-zinc-100 mb-2">TERMOS E CONDIÇÕES DE USO — NEXUS CHAT</h1>
        <p className="text-zinc-500 text-sm mb-8">Última atualização: 03 de maio de 2026</p>

        <div className="prose prose-invert prose-zinc max-w-none text-zinc-400 space-y-6">
          <p>
            Vigência: estes Termos permanecerão válidos enquanto o Nexus Chat estiver em operação, até o encerramento definitivo da empresa, da plataforma ou dos serviços, salvo substituição por versão posterior.<br />
            Aplicação principal: Brasil, com aplicação internacional quando o usuário acessar ou utilizar o serviço fora do território brasileiro.
          </p>

          <p>
            Estes Termos e Condições de Uso regulam o acesso e o uso do aplicativo, plataforma, sistemas, APIs, serviços, recursos e funcionalidades relacionados ao Nexus Chat, incluindo o Nexus Login, mensagens diretas, contatos, autenticação, chamadas de voz e vídeo, compartilhamento de tela, envio de mídias, armazenamento de arquivos, denúncias e demais funcionalidades disponibilizadas.
          </p>

          <p>
            O Nexus Chat é operado por pessoa jurídica inscrita no CNPJ nº 64.044.799/0001-09, doravante denominada simplesmente “Nexus Chat”, “Nexus”, “nós” ou “plataforma”.
          </p>

          <p>
            Ao criar conta, acessar, instalar, utilizar ou continuar utilizando o Nexus Chat, o usuário declara que leu, compreendeu e aceitou integralmente estes Termos, bem como a Política de Privacidade, Política de Segurança, Política de Denúncias e demais documentos aplicáveis.
          </p>

          <p>
            O tratamento de dados pessoais no Brasil deve observar a Lei Geral de Proteção de Dados Pessoais — LGPD, Lei nº 13.709/2018, que regula o tratamento de dados pessoais em meios físicos e digitais, e o uso da internet no Brasil é disciplinado pelo Marco Civil da Internet, Lei nº 12.965/2014, que estabelece princípios, garantias, direitos e deveres para o uso da internet no país.
          </p>

          <hr className="border-zinc-800 my-8" />

          <h2 className="text-xl font-semibold text-zinc-200 mt-8 mb-4">1. Definições</h2>
          <p>Para fins destes Termos:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong className="text-zinc-300">Nexus Chat</strong>: aplicativo e serviço de mensagens diretas, comunicação privada, chamadas, compartilhamento de tela, envio de mídias e gerenciamento de contatos.</li>
            <li><strong className="text-zinc-300">Nexus Login</strong>: sistema de autenticação e acesso do Nexus Chat, que pode incluir login por número de telefone, login com Google, autenticação via Firebase e outros métodos futuramente implementados.</li>
            <li><strong className="text-zinc-300">Usuário</strong>: qualquer pessoa que acesse, crie conta, envie mensagens, realize chamadas, compartilhe mídias ou utilize qualquer recurso do Nexus Chat.</li>
            <li><strong className="text-zinc-300">Conta</strong>: cadastro individual vinculado a dados como número de telefone, conta Google, identificadores técnicos, dispositivos e demais informações necessárias ao funcionamento do serviço.</li>
            <li><strong className="text-zinc-300">Mensagens privadas</strong>: comunicações enviadas entre usuários, incluindo texto, áudio, imagens, vídeos, documentos, chamadas, links, reações e demais conteúdos.</li>
            <li><strong className="text-zinc-300">Conteúdo do usuário</strong>: qualquer dado, arquivo, mídia, imagem, vídeo, texto, áudio, mensagem, contato, nome, foto de perfil ou informação inserida, enviada, compartilhada ou armazenada pelo usuário.</li>
            <li><strong className="text-zinc-300">Criptografia</strong>: conjunto de técnicas de proteção destinadas a impedir acesso não autorizado ao conteúdo das comunicações, conforme a arquitetura técnica disponível no serviço.</li>
            <li><strong className="text-zinc-300">Denúncia</strong>: comunicação feita por usuário ou sistema indicando possível violação destes Termos, abuso, fraude, spam, conteúdo ilegal, ameaça, assédio ou outro uso indevido.</li>
          </ul>

          <h2 className="text-xl font-semibold text-zinc-200 mt-8 mb-4">2. Aceitação dos Termos</h2>
          <p>Ao utilizar o Nexus Chat, o usuário concorda com estes Termos e declara possuir capacidade legal para contratar e utilizar serviços digitais.</p>
          <p>Caso o usuário não concorde com qualquer disposição destes Termos, deverá interromper imediatamente o uso do Nexus Chat, excluir sua conta, quando disponível, e cessar qualquer acesso à plataforma.</p>
          <p>O uso contínuo do Nexus Chat após alterações nestes Termos será considerado aceitação da nova versão.</p>

          <h2 className="text-xl font-semibold text-zinc-200 mt-8 mb-4">3. Alteração dos Termos</h2>
          <p>O Nexus Chat poderá alterar, atualizar, complementar, remover ou substituir estes Termos a qualquer momento, por motivos jurídicos, técnicos, comerciais, operacionais, regulatórios, de segurança ou melhoria dos serviços.</p>
          <p>As alterações poderão ser comunicadas dentro do aplicativo, por e-mail, notificação, página oficial, aviso no login ou outro meio razoável.</p>
          <p>Quando a alteração for relevante, o Nexus Chat poderá solicitar novo aceite. O uso contínuo após a atualização significará concordância com os novos Termos.</p>

          <h2 className="text-xl font-semibold text-zinc-200 mt-8 mb-4">4. Descrição dos Serviços</h2>
          <p>O Nexus Chat oferece, entre outros recursos:</p>
          <ul className="list-[lower-alpha] pl-6 space-y-2">
            <li>mensagens diretas entre usuários;</li>
            <li>gerenciamento de contatos;</li>
            <li>identificação por número de telefone;</li>
            <li>login com Google;</li>
            <li>autenticação e serviços integrados ao Firebase;</li>
            <li>armazenamento de arquivos e mídias em bucket Cloudflare ou serviços equivalentes;</li>
            <li>envio e recebimento de imagens, vídeos, áudios, documentos e outras mídias;</li>
            <li>chamadas de voz;</li>
            <li>chamadas de vídeo;</li>
            <li>chamadas em grupo, quando disponíveis;</li>
            <li>compartilhamento de tela;</li>
            <li>recursos de denúncia, bloqueio e moderação;</li>
            <li>sincronização de mensagens, contatos e dados técnicos necessários;</li>
            <li>recursos adicionais que possam ser implementados futuramente.</li>
          </ul>
          <p>O Nexus Chat poderá modificar, suspender, limitar ou remover funcionalidades a qualquer momento, especialmente por razões de segurança, manutenção, abuso, ordem legal, inviabilidade técnica ou alteração no modelo do serviço.</p>

          <h2 className="text-xl font-semibold text-zinc-200 mt-8 mb-4">5. Cadastro, Conta e Nexus Login</h2>
          <p>Para utilizar determinados recursos, o usuário poderá precisar criar uma conta por meio do Nexus Login.</p>
          <p>O cadastro poderá exigir:</p>
          <ul className="list-[lower-alpha] pl-6 space-y-2">
            <li>número de telefone;</li>
            <li>conta Google;</li>
            <li>nome de exibição;</li>
            <li>foto de perfil;</li>
            <li>contatos;</li>
            <li>identificadores de dispositivo;</li>
            <li>permissões de câmera, microfone, contatos, arquivos, notificações e armazenamento;</li>
            <li>dados técnicos necessários ao funcionamento da conta.</li>
          </ul>
          <p>O usuário é responsável por fornecer informações verdadeiras, atualizadas e legítimas.</p>
          <p>O Nexus Chat poderá recusar, suspender ou encerrar contas que contenham dados falsos, uso abusivo, tentativa de fraude, uso automatizado indevido, violação de direitos de terceiros ou descumprimento destes Termos.</p>
          <p>O usuário é responsável por proteger o acesso ao seu dispositivo, conta Google, número de telefone e demais meios de autenticação.</p>

          <h2 className="text-xl font-semibold text-zinc-200 mt-8 mb-4">6. Uso de Número de Telefone</h2>
          <p>O número de telefone poderá ser usado para:</p>
          <ul className="list-[lower-alpha] pl-6 space-y-2">
            <li>criar ou recuperar conta;</li>
            <li>identificar o usuário perante seus contatos;</li>
            <li>permitir que outros usuários encontrem o perfil, quando aplicável;</li>
            <li>prevenir fraude, spam e abuso;</li>
            <li>autenticação por código, SMS, chamada, provedor externo ou outro método;</li>
            <li>sincronização de contatos.</li>
          </ul>
          <p>O usuário declara que é titular ou possui autorização legítima para usar o número informado. O Nexus Chat não se responsabiliza por perda de acesso decorrente de troca de número, perda do chip, portabilidade, bloqueio pela operadora, clonagem de dispositivo ou falha externa fora do controle razoável da plataforma.</p>

          <h2 className="text-xl font-semibold text-zinc-200 mt-8 mb-4">7. Login com Google</h2>
          <p>O Nexus Chat poderá permitir login por conta Google. Ao usar esse recurso, o usuário concorda que determinados dados fornecidos pelo Google poderão ser utilizados para autenticação, identificação da conta e funcionamento do serviço, como nome, e-mail, foto de perfil e identificador da conta, conforme permissões concedidas pelo próprio usuário.</p>
          <p>O uso de serviços Google também está sujeito aos termos, políticas e controles da própria Google, que são independentes do Nexus Chat. O Nexus Chat não controla falhas, bloqueios, indisponibilidades, alterações de API, políticas de OAuth, suspensões ou decisões tomadas pela Google.</p>

          <h2 className="text-xl font-semibold text-zinc-200 mt-8 mb-4">8. Integração com Firebase</h2>
          <p>O Nexus Chat poderá utilizar Firebase para autenticação, banco de dados, notificações, monitoramento, análise, segurança, sincronização, hospedagem ou recursos técnicos. O Firebase poderá processar dados técnicos e operacionais necessários ao funcionamento do aplicativo, conforme a configuração da plataforma e as permissões concedidas.</p>
          <p>O usuário reconhece que determinados dados poderão trafegar ou ser armazenados em infraestrutura de terceiros contratados para viabilizar o serviço.</p>

          <h2 className="text-xl font-semibold text-zinc-200 mt-8 mb-4">9. Armazenamento em Bucket Cloudflare</h2>
          <p>O Nexus Chat poderá utilizar bucket Cloudflare ou infraestrutura equivalente para armazenar mídias, arquivos, imagens, vídeos, documentos, anexos, backups temporários, thumbnails, metadados técnicos e dados necessários ao funcionamento do serviço. O armazenamento poderá incluir dados em servidores localizados fora do Brasil, conforme arquitetura do provedor.</p>
          <p>O usuário autoriza o uso de provedores de infraestrutura, nuvem, CDN, banco de dados e armazenamento para operação do Nexus Chat, desde que observadas medidas razoáveis de segurança, privacidade e proteção de dados.</p>

          <h2 className="text-xl font-semibold text-zinc-200 mt-8 mb-4">10. Privacidade das Conversas e Criptografia</h2>
          <p>O Nexus Chat foi projetado para proteger a privacidade das comunicações dos usuários. As conversas, dados e comunicações privadas poderão ser protegidas por criptografia, conforme a tecnologia disponível e implementada na plataforma. Quando a criptografia de ponta a ponta estiver ativa, o conteúdo das mensagens privadas não poderá ser lido por administradores, operadores, dono da plataforma ou terceiros não autorizados.</p>
          <p>O usuário reconhece, entretanto, que determinados dados técnicos e metadados poderão ser necessários para funcionamento do serviço, segurança, entrega de mensagens, notificações, sincronização, prevenção de abuso, cumprimento legal e suporte técnico. Exemplos de metadados:</p>
          <ul className="list-[lower-alpha] pl-6 space-y-2">
            <li>identificador de conta; número de telefone; nome de usuário; foto de perfil;</li>
            <li>horários de envio e recebimento; informações de dispositivo; endereço IP;</li>
            <li>registros de login; status de entrega; informações de chamada;</li>
            <li>contatos sincronizados; identificadores técnicos de arquivos; registros de denúncia e bloqueio.</li>
          </ul>
          <p>O Nexus Chat não se responsabiliza por acesso indevido causado por perda de dispositivo, captura de tela, gravação externa, compartilhamento voluntário, malware, engenharia social, invasão do aparelho do usuário ou exposição feita por outro participante da conversa.</p>

          <h2 className="text-xl font-semibold text-zinc-200 mt-8 mb-4">11. Chamadas de Voz, Vídeo e Compartilhamento de Tela</h2>
          <p>O Nexus Chat poderá permitir chamadas de voz, chamadas de vídeo e compartilhamento de tela entre usuários. O usuário declara estar ciente de que, ao iniciar ou aceitar uma chamada, poderá conceder acesso ao microfone, câmera, alto-falante, tela, janelas, aplicativos ou conteúdos exibidos no dispositivo. O usuário é o único responsável por verificar o que está exibindo ou compartilhando antes e durante o compartilhamento de tela.</p>
          <p>É proibido usar chamadas ou compartilhamento de tela para: gravar terceiros sem autorização quando exigida por lei; transmitir conteúdo ilegal; praticar assédio, ameaça ou extorsão; compartilhar dados sensíveis de terceiros sem permissão; transmitir conteúdo sexual envolvendo menores; cometer fraude, golpe ou engenharia social; violar direitos autorais, privacidade ou imagem.</p>
          <p>O Nexus Chat poderá limitar, suspender ou encerrar recursos de chamada em caso de abuso, denúncia, ordem legal, instabilidade técnica ou risco à segurança.</p>

          <h2 className="text-xl font-semibold text-zinc-200 mt-8 mb-4">12. Compartilhamento de Mídias Privadas</h2>
          <p>O Nexus Chat permite o envio de imagens, vídeos, áudios, documentos, GIFs, links, arquivos e outras mídias. O usuário é responsável por todo conteúdo enviado, compartilhado, armazenado ou transmitido por sua conta.</p>
          <p>É proibido enviar ou compartilhar: conteúdo ilegal; conteúdo que viole direitos autorais; pornografia infantil ou exploração sexual de menores; ameaças, perseguição, chantagem ou extorsão; imagens íntimas de terceiros sem consentimento; discurso de ódio; golpes, phishing ou malware; spam; dados pessoais de terceiros sem autorização; conteúdo que incentive violência, terrorismo ou crime; arquivos maliciosos.</p>
          <p>O fato de a conversa ser privada não autoriza o usuário a praticar atos ilícitos.</p>

          <h2 className="text-xl font-semibold text-zinc-200 mt-8 mb-4">13. Contatos e Sincronização</h2>
          <p>O Nexus Chat poderá solicitar acesso aos contatos do dispositivo para facilitar identificação de usuários, exibição de nomes, sincronização de lista de contatos, convites e comunicação entre pessoas conhecidas. O usuário declara possuir base legítima ou autorização para permitir a sincronização de contatos armazenados em seu dispositivo.</p>
          <p>O Nexus Chat poderá exibir número de telefone quando o contato não estiver salvo, quando não houver nome disponível ou quando o recurso fizer parte da funcionalidade do serviço.</p>

          <h2 className="text-xl font-semibold text-zinc-200 mt-8 mb-4">14. Denúncias, Bloqueios e Moderação</h2>
          <p>O Nexus Chat poderá disponibilizar mecanismo de denúncia contra usuários, mensagens, mídias, contas, comportamento abusivo ou violação destes Termos. Ao receber denúncia, o Nexus Chat poderá adotar medidas como: bloquear temporária ou definitivamente; restringir mensagens/chamadas; impedir criação de contas; comunicar autoridades; negar suporte.</p>
          <p>Quando protegido por criptografia de ponta a ponta, a análise pode se basear em metadados, informações fornecidas pelo denunciante e comportamento da conta. O usuário denunciado poderá ser bloqueado preventivamente. O Nexus Chat não é obrigado a restabelecer contas envolvidas em abuso, fraude, crime ou violação grave.</p>

          <h2 className="text-xl font-semibold text-zinc-200 mt-8 mb-4">15. Condutas Proibidas</h2>
          <p>O usuário não poderá:</p>
          <ul className="list-[lower-alpha] pl-6 space-y-2">
            <li>usar o Nexus Chat para fins ilegais; criar contas falsas ou automatizadas; tentar acessar conta de terceiros; realizar engenharia reversa;</li>
            <li>enviar spam, golpes, phishing ou malware; usar bots não autorizados; vender ou alugar conta sem autorização;</li>
            <li>usar a plataforma para assédio, ameaça ou perseguição; compartilhar conteúdo íntimo sem consentimento; violar privacidade;</li>
            <li>usar o serviço para exploração sexual, tráfico, terrorismo ou crimes; burlar bloqueios;</li>
            <li>prejudicar servidores, APIs, Firebase, Cloudflare ou infraestrutura do Nexus Chat; sobrecarregar a plataforma com requisições abusivas;</li>
            <li>usar marcas de terceiros sem autorização; coletar dados de usuários sem permissão; violar leis aplicáveis.</li>
          </ul>

          <h2 className="text-xl font-semibold text-zinc-200 mt-8 mb-4">16. Suspensão, Bloqueio e Encerramento de Conta</h2>
          <p>O Nexus Chat poderá suspender, bloquear ou encerrar contas sem aviso prévio em caso de: violação destes Termos, denúncia grave, suspeita de fraude, risco à segurança, ordem judicial, uso abusivo, tentativa de invasão, uso para crime, violação de direitos, necessidade técnica ou encerramento do serviço.</p>
          <p>O bloqueio poderá afetar mensagens, chamadas, contatos, mídias e login.</p>

          <h2 className="text-xl font-semibold text-zinc-200 mt-8 mb-4">17. Responsabilidade do Usuário</h2>
          <p>O usuário é integralmente responsável pelo conteúdo que envia, mídias que compartilha, chamadas que realiza, segurança do dispositivo, manutenção do número e conta Google, cumprimento de leis, respeito a terceiros e permissões concedidas. O Nexus Chat não se responsabiliza por danos causados por uso indevido da conta.</p>

          <h2 className="text-xl font-semibold text-zinc-200 mt-8 mb-4">18. Responsabilidade da Plataforma</h2>
          <p>O Nexus Chat empregará esforços razoáveis para manter o serviço seguro e funcional, mas não garante funcionamento ininterrupto, livre de erros, de ataques ou compatível com todas as redes ou operadoras. A responsabilidade da plataforma é limitada ao máximo permitido por lei, respeitado o Código de Defesa do Consumidor brasileiro.</p>

          <h2 className="text-xl font-semibold text-zinc-200 mt-8 mb-4">19. Isenção de Responsabilidade por Conteúdo</h2>
          <p>O Nexus Chat não cria, edita ou assume responsabilidade automática pelo conteúdo dos usuários. Cada um é responsável pelo que envia. O Nexus Chat agirá para restringir conteúdo ilícito ou abusivo, quando técnica e juridicamente cabível, mediante denúncia ou risco.</p>

          <h2 className="text-xl font-semibold text-zinc-200 mt-8 mb-4">20. Dados Pessoais e Proteção de Dados (LGPD)</h2>
          <p>O tratamento de dados (conta, Google, telefone, contatos, logs, IPs, etc.) serve para o funcionamento do app, prevenção de fraudes, segurança e cumprimento legal. O usuário poderá solicitar confirmação, acesso, correção, exclusão e portabilidade aplicáveis, respeitados os dados mantidos por obrigação legal, segurança ou ordem judicial.</p>

          <h2 className="text-xl font-semibold text-zinc-200 mt-8 mb-4">21. Marco Civil da Internet e Logs</h2>
          <p>O Nexus Chat poderá manter logs de acesso, IPs e registros técnicos para segurança e cumprimento legal. O Marco Civil da Internet prevê guarda, proteção e transparência desses dados. Registros podem ser preservados em caso de investigação, denúncia ou ordem judicial.</p>

          <h2 className="text-xl font-semibold text-zinc-200 mt-8 mb-4">22. Transferência Internacional de Dados</h2>
          <p>Usamos provedores globais (Google Firebase, Cloudflare). Dados podem ser arquivados ou processados fora do Brasil. O usuário reconhece a transferência internacional necessária à operação técnica, respeitadas medidas legais de segurança.</p>

          <h2 className="text-xl font-semibold text-zinc-200 mt-8 mb-4">23. Segurança</h2>
          <p>Empregamos criptografia, controles de acesso e monitoramento, mas o usuário deve manter seu dispositivo protegido, evitar instalar malwares e preservar dados de login e tela em sigilo.</p>

          <h2 className="text-xl font-semibold text-zinc-200 mt-8 mb-4">24. Permissões do Dispositivo</h2>
          <p>O app solicitará permissões (câmera, microfone, contatos, notificações, armazenamento). Negá-las poderá impedir o uso integral das ferramentas e funcionalidades referidas.</p>

          <h2 className="text-xl font-semibold text-zinc-200 mt-8 mb-4">25. Propriedade Intelectual</h2>
          <p>Os direitos do software, APIs e design pertencem ao Nexus Chat ou respectivos donos. O usuário recebe apenas licença limitada para uso. É proibido copiar, revender, clonar ou modificar.</p>

          <h2 className="text-xl font-semibold text-zinc-200 mt-8 mb-4">26. Licença sobre Conteúdo do Usuário</h2>
          <p>O usuário mantém direitos de seus envios. O app recebe licença estritamente técnica (armazenar, transmitir, criptografar e exibir ao destino) necessária ao funcionamento, não transferindo a propriedade.</p>

          <h2 className="text-xl font-semibold text-zinc-200 mt-8 mb-4">27. Conteúdo Sensível e Ilegal</h2>
          <p>Tolerância zero para pornografia infantil, exploração sexual, ameaças reais, fraudes, terrorismo e malware. Bloqueio conta e relato à autoridade é feito quando detectado.</p>

          <h2 className="text-xl font-semibold text-zinc-200 mt-8 mb-4">28. Menores de Idade</h2>
          <p>Sem uso por menores sem o consentimento dos responsáveis, passível de bloqueios da conta.</p>

          <h2 className="text-xl font-semibold text-zinc-200 mt-8 mb-4">29. Serviços de Terceiros e 30. Disponibilidade</h2>
          <p>O app não se responsabiliza por falhas de terceiros (Google, provedores de nuvem, etc). Pode haver paradas não programadas ou atualizações.</p>

          <h2 className="text-xl font-semibold text-zinc-200 mt-8 mb-4">31/32. Encerramento e Exclusão</h2>
          <p>A exclusão de conta remove a base ativa. Algumas conversas chegam a outros dispostivos e metadados servem a garantias de lei.</p>

          <h2 className="text-xl font-semibold text-zinc-200 mt-8 mb-4">Demais Termos</h2>
          <p>O Nexus Chat não renuncia seus direitos se falhar em punir ações no imediato. Eventual nulidade de cláusulas não invalida o resto.</p>
          <p><strong>Foro:</strong> Leis do Brasil, respeitando domicílio de consumidor aplicável.</p>

          <div className="bg-zinc-800 p-6 rounded-lg mt-12 border border-zinc-700">
            <h3 className="text-lg font-bold text-zinc-200 mb-2">Aviso Importante</h3>
            <p className="text-sm">Ao criar sua conta, você concorda com os Termos de Uso e a Política de Privacidade do Nexus Chat. Suas conversas privadas podem ser protegidas por criptografia, e denúncias de abuso podem gerar bloqueio da conta.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
