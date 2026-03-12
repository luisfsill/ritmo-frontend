'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Button, ThemeToggle } from '@/components/ui';
import Link from 'next/link';
import styles from './success.module.css';

export default function RegisterSuccessPage() {
    const router = useRouter();
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push('/login');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [router]);

    return (
        <div className={styles.container}>
            <div className={styles.themeToggleWrapper}>
                <ThemeToggle />
            </div>

            <div className={styles.card}>
                <div className={styles.iconWrapper}>
                    <CheckCircle className={styles.successIcon} size={64} />
                    <Sparkles className={styles.sparkle1} size={24} />
                    <Sparkles className={styles.sparkle2} size={20} />
                </div>

                <h1 className={styles.title}>Conta criada com sucesso!</h1>
                <p className={styles.subtitle}>
                    Seu cadastro foi realizado. Agora você já pode fazer login e começar a usar o Ritmo.
                </p>

                <div className={styles.features}>
                    <div className={styles.feature}>
                        <span className={styles.featureIcon}>📅</span>
                        <span>Gerencie seus agendamentos</span>
                    </div>
                    <div className={styles.feature}>
                        <span className={styles.featureIcon}>👥</span>
                        <span>Cadastre sua equipe</span>
                    </div>
                    <div className={styles.feature}>
                        <span className={styles.featureIcon}>💬</span>
                        <span>Atenda clientes pelo WhatsApp</span>
                    </div>
                </div>

                <Link href="/login" className={styles.buttonLink}>
                    <Button fullWidth rightIcon={<ArrowRight size={18} />}>
                        Fazer login agora
                    </Button>
                </Link>

                <p className={styles.redirect}>
                    Redirecionando para login em <strong>{countdown}</strong> segundos...
                </p>
            </div>
        </div>
    );
}
