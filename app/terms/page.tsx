'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/ui';
import styles from './terms.module.css';

export default function TermsPage() {
    return (
        <div className={styles.container}>
            <nav className={styles.navbar}>
                <Link href="/" className={styles.backLink}>
                    <ArrowLeft size={20} />
                    <span>Voltar</span>
                </Link>
                <ThemeToggle />
            </nav>

            <article className={styles.content}>
                <h1 className={styles.title}>Termos de Uso</h1>
                <p className={styles.lastUpdate}>Última atualização: 27 de dezembro de 2025</p>

                <section className={styles.section}>
                    <h2>1. Aceitação dos Termos</h2>
                    <p>
                        Ao acessar e utilizar o Ritmo Agendamento, você concorda em cumprir e estar 
                        vinculado aos seguintes termos e condições de uso. Se você não concordar com 
                        qualquer parte destes termos, não deverá usar nossos serviços.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>2. Descrição do Serviço</h2>
                    <p>
                        O Ritmo Agendamento é uma plataforma de gerenciamento de agendamentos que permite:
                    </p>
                    <ul>
                        <li>Criação e gerenciamento de agendamentos online</li>
                        <li>Cadastro de clientes e histórico de atendimentos</li>
                        <li>Gestão de serviços e profissionais</li>
                        <li>Notificações e lembretes automáticos</li>
                        <li>Relatórios e análises de desempenho</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>3. Cadastro e Conta</h2>
                    <p>
                        Para utilizar nossos serviços, você deve:
                    </p>
                    <ul>
                        <li>Fornecer informações verdadeiras, precisas e completas durante o cadastro</li>
                        <li>Manter suas credenciais de acesso em sigilo</li>
                        <li>Ser responsável por todas as atividades realizadas em sua conta</li>
                        <li>Notificar imediatamente sobre qualquer uso não autorizado</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>4. Uso Aceitável</h2>
                    <p>
                        Você concorda em não utilizar o serviço para:
                    </p>
                    <ul>
                        <li>Violar leis ou regulamentos aplicáveis</li>
                        <li>Transmitir conteúdo ilegal, difamatório ou prejudicial</li>
                        <li>Interferir no funcionamento adequado da plataforma</li>
                        <li>Coletar dados de outros usuários sem autorização</li>
                        <li>Revender ou redistribuir o serviço sem autorização</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>5. Propriedade Intelectual</h2>
                    <p>
                        Todo o conteúdo presente na plataforma, incluindo mas não limitado a textos, 
                        gráficos, logos, ícones, imagens e software, é propriedade do Ritmo Agendamento 
                        ou de seus licenciadores e está protegido por leis de propriedade intelectual.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>6. Limitação de Responsabilidade</h2>
                    <p>
                        O Ritmo Agendamento é fornecido &quot;como está&quot; e &quot;conforme disponível&quot;. Não garantimos 
                        que o serviço será ininterrupto, livre de erros ou completamente seguro. Em nenhuma 
                        circunstância seremos responsáveis por danos indiretos, incidentais ou consequenciais.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>7. Modificações dos Termos</h2>
                    <p>
                        Reservamos o direito de modificar estes termos a qualquer momento. Alterações 
                        significativas serão notificadas por email ou através da plataforma. O uso 
                        continuado após as alterações constitui aceitação dos novos termos.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>8. Cancelamento</h2>
                    <p>
                        Você pode cancelar sua conta a qualquer momento através das configurações da 
                        plataforma. Após o cancelamento, seus dados serão mantidos por 30 dias para 
                        possível recuperação, sendo permanentemente excluídos após este período.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>9. Contato</h2>
                    <p>
                        Para dúvidas sobre estes termos, entre em contato conosco através do email: 
                        <a href="mailto:suporte@ritmo.app"> suporte@ritmo.app</a>
                    </p>
                </section>
            </article>
        </div>
    );
}
