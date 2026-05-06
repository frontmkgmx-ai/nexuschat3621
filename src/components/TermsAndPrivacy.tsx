import React from 'react';

/**
 * Componente para exibição dos Termos e Condições e Política de Privacidade.
 * O texto é longo e foi estruturado para ser legível em um contêiner com rolagem.
 */
export default function TermsAndPrivacy() {
  return (
    <div className="space-y-6 text-zinc-300 text-sm leading-relaxed p-4">
      <div className="bg-[#111214] rounded-2xl p-6 border border-[#2B2D31] shadow-inner">
        <h2 className="text-xl font-bold text-white mb-4">TERMOS E CONDIÇÕES DE USO E POLÍTICA DE PRIVACIDADE — NEXUS CHAT</h2>
        <p className="text-xs text-zinc-500 mb-6">Última atualização: 03 de maio de 2026</p>

        <div className="space-y-4">
          <section>
            <h3 className="font-bold text-white">1. Aceitação dos Termos</h3>
            <p>Ao utilizar o Nexus Chat, o usuário concorda com estes Termos e declara possuir capacidade legal para contratar e utilizar serviços digitais. Caso não concorde, interrompa o uso imediatamente.</p>
          </section>

          <section>
            <h3 className="font-bold text-white">2. Privacidade e LGPD</h3>
            <p>O tratamento de dados pessoais observa a Lei Geral de Proteção de Dados Pessoais (LGPD). Seus dados podem ser tratados para autenticação, entrega de mensagens e segurança.</p>
          </section>
          
          <section>
            <h3 className="font-bold text-white">3. Criptografia</h3>
            <p>Utilizamos criptografia para proteger comunicações. Conteúdos de mensagens privadas podem não ser acessíveis ao Nexus Chat, respeitando a privacidade dos usuários.</p>
          </section>

          <section>
            <h3 className="font-bold text-white">4. Condutas Proibidas</h3>
            <p>É proibido o uso da plataforma para artes ilícitas, spam, fraudes, assédio, ou qualquer atividade que viole a legislação brasileira.</p>
          </section>

          <section>
             <h3 className="font-bold text-white">Mais informações</h3>
             <p>Este é um resumo. A versão completa do Contrato e Política de Privacidade rege todo o uso da plataforma.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
