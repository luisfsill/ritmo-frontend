'use client';

export default function PrivacyPolicyPage() {
    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <h1>Política de Privacidade</h1>
            <p><strong>Última atualização: 4 de janeiro de 2026</strong></p>

            <h2>1. Introdução</h2>
            <p>
                A Ritmo Agendamento (&quot;nós&quot;, &quot;nosso&quot; ou &quot;nos&quot;) está comprometida em proteger sua privacidade. 
                Esta Política de Privacidade explica como coletamos, usamos, divulgamos e salvaguardamos suas informações 
                quando você usa nossa plataforma de agendamento.
            </p>

            <h2>2. Informações que Coletamos</h2>
            <p>Coletamos informações que você fornece diretamente, como:</p>
            <ul>
                <li>Nome completo e email</li>
                <li>Número de telefone</li>
                <li>Informações de endereço</li>
                <li>Dados de agendamentos e serviços</li>
                <li>Informações de pagamento (processadas por terceiros)</li>
            </ul>

            <h2>3. Como Usamos Suas Informações</h2>
            <p>Usamos as informações coletadas para:</p>
            <ul>
                <li>Fornecer e manter nossa plataforma</li>
                <li>Processar agendamentos e pagamentos</li>
                <li>Enviar notificações sobre agendamentos</li>
                <li>Melhorar nossos serviços</li>
                <li>Cumprir obrigações legais</li>
            </ul>

            <h2>4. Compartilhamento de Informações</h2>
            <p>
                Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, 
                exceto quando necessário para fornecer nossos serviços ou cumprir a lei.
            </p>

            <h2>5. Segurança de Dados</h2>
            <p>
                Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações pessoais 
                contra acesso não autorizado, alteração, divulgação ou destruição.
            </p>

            <h2>6. Seus Direitos</h2>
            <p>Você tem o direito de:</p>
            <ul>
                <li>Acessar suas informações pessoais</li>
                <li>Corrigir informações imprecisas</li>
                <li>Solicitar a exclusão de seus dados</li>
                <li>Opor-se ao processamento de seus dados</li>
            </ul>

            <h2>7. Integrações com Terceiros</h2>
            <p>
                Nossa plataforma integra-se com serviços como Google Calendar. 
                Quando você autoriza essas integrações, você concorda com o acesso ao calendário e dados relacionados 
                necessários para sincronizar agendamentos. Cada serviço terceirizado possui sua própria política de privacidade.
            </p>

            <h2>8. Contato</h2>
            <p>
                Se você tiver dúvidas sobre esta Política de Privacidade, entre em contato conosco em: 
                <strong> suporte@ritmo-agendamento.com</strong>
            </p>

            <hr style={{ margin: '2rem 0' }} />
            <p style={{ fontSize: '0.9rem', color: '#666' }}>
                Esta política pode ser atualizada periodicamente. Continuando a usar a plataforma após mudanças, 
                você concorda com a política revisada.
            </p>
        </div>
    );
}
