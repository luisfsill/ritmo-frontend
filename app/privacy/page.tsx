'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/ui';
import styles from './privacy.module.css';

export default function PrivacyPage() {
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
                <h1 className={styles.title}>Política de Privacidade</h1>
                <p className={styles.lastUpdate}>Última atualização: 27 de dezembro de 2025</p>

                <section className={styles.section}>
                    <h2>1. Introdução</h2>
                    <p>
                        O Ritmo Agendamento está comprometido em proteger sua privacidade. Esta política 
                        descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais 
                        quando você utiliza nossa plataforma.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>2. Dados que Coletamos</h2>
                    <p>
                        Coletamos os seguintes tipos de informações:
                    </p>
                    <h3>2.1 Dados de Cadastro</h3>
                    <ul>
                        <li>Nome completo</li>
                        <li>Endereço de email</li>
                        <li>Telefone</li>
                        <li>Nome do negócio</li>
                    </ul>
                    <h3>2.2 Dados de Uso</h3>
                    <ul>
                        <li>Informações de agendamentos</li>
                        <li>Dados de clientes cadastrados</li>
                        <li>Histórico de serviços realizados</li>
                        <li>Logs de acesso e atividades</li>
                    </ul>
                    <h3>2.3 Dados Técnicos</h3>
                    <ul>
                        <li>Endereço IP</li>
                        <li>Tipo de navegador</li>
                        <li>Sistema operacional</li>
                        <li>Cookies e tecnologias similares</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>3. Como Usamos seus Dados</h2>
                    <p>
                        Utilizamos suas informações para:
                    </p>
                    <ul>
                        <li>Fornecer e manter nossos serviços</li>
                        <li>Processar e gerenciar agendamentos</li>
                        <li>Enviar notificações e lembretes</li>
                        <li>Melhorar e personalizar a experiência do usuário</li>
                        <li>Comunicar atualizações e novidades</li>
                        <li>Garantir a segurança da plataforma</li>
                        <li>Cumprir obrigações legais</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>4. Compartilhamento de Dados</h2>
                    <p>
                        Não vendemos suas informações pessoais. Podemos compartilhar dados apenas em:
                    </p>
                    <ul>
                        <li><strong>Com prestadores de serviço:</strong> empresas que nos auxiliam na operação (hospedagem, email, etc.)</li>
                        <li><strong>Por obrigação legal:</strong> quando exigido por lei ou autoridades competentes</li>
                        <li><strong>Com seu consentimento:</strong> em outras situações, mediante autorização expressa</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>5. Armazenamento e Segurança</h2>
                    <p>
                        Seus dados são armazenados em servidores seguros com as seguintes medidas de proteção:
                    </p>
                    <ul>
                        <li>Criptografia de dados em trânsito e em repouso</li>
                        <li>Controle de acesso restrito</li>
                        <li>Monitoramento contínuo de segurança</li>
                        <li>Backups regulares</li>
                        <li>Conformidade com padrões de segurança</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>6. Seus Direitos (LGPD)</h2>
                    <p>
                        De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
                    </p>
                    <ul>
                        <li><strong>Acesso:</strong> solicitar uma cópia dos seus dados pessoais</li>
                        <li><strong>Correção:</strong> corrigir dados incompletos ou desatualizados</li>
                        <li><strong>Exclusão:</strong> solicitar a exclusão dos seus dados</li>
                        <li><strong>Portabilidade:</strong> receber seus dados em formato estruturado</li>
                        <li><strong>Revogação:</strong> retirar consentimento a qualquer momento</li>
                        <li><strong>Oposição:</strong> opor-se a determinados tratamentos</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>7. Cookies</h2>
                    <p>
                        Utilizamos cookies para:
                    </p>
                    <ul>
                        <li>Manter você conectado à sua conta</li>
                        <li>Lembrar suas preferências</li>
                        <li>Analisar o uso da plataforma</li>
                        <li>Melhorar nossos serviços</li>
                    </ul>
                    <p>
                        Você pode gerenciar cookies através das configurações do seu navegador.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>8. Retenção de Dados</h2>
                    <p>
                        Mantemos seus dados enquanto sua conta estiver ativa ou conforme necessário para 
                        fornecer nossos serviços. Após o cancelamento da conta, os dados são retidos por 
                        30 dias para possível recuperação e depois permanentemente excluídos, exceto quando 
                        a retenção for exigida por lei.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>9. Alterações nesta Política</h2>
                    <p>
                        Podemos atualizar esta política periodicamente. Alterações significativas serão 
                        comunicadas por email ou através de aviso na plataforma. Recomendamos revisar 
                        esta página regularmente.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>10. Contato</h2>
                    <p>
                        Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, entre em contato:
                    </p>
                    <ul>
                        <li>Email: <a href="mailto:privacidade@ritmo.app">privacidade@ritmo.app</a></li>
                        <li>Encarregado de Dados (DPO): <a href="mailto:dpo@ritmo.app">dpo@ritmo.app</a></li>
                    </ul>
                </section>
            </article>
        </div>
    );
}
