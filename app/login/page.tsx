'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Home } from 'lucide-react';
import { Button, Input, ThemeToggle } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import styles from './login.module.css';

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Senha é obrigatória'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoading } = useAuth();
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isDevelopment, setIsDevelopment] = useState(false);

    useEffect(() => {
        setMounted(true);
        setIsDevelopment(process.env.NODE_ENV === 'development');
    }, []);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const handleDemoLogin = async () => {
        setSubmitError(null);
        try {
            // Criar um JWT fake válido para modo desenvolvimento
            // Header: {"alg":"HS256","typ":"JWT"}
            // Payload: {"sub":"demo-admin","tenant_id":"demo-tenant","email":"admin@admin.com","name":"Admin","exp":9999999999}
            const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '');
            const payload = btoa(JSON.stringify({
                sub: 'demo-admin',
                tenant_id: 'demo-tenant',
                email: 'admin@admin.com',
                name: 'Admin',
                business_name: 'Meu Negócio Demo',
                exp: 9999999999
            })).replace(/=/g, '');
            const signature = 'demo-signature';
            
            const demoAccessToken = `${header}.${payload}.${signature}`;
            const demoTokens = {
                access_token: demoAccessToken,
                refresh_token: 'demo_refresh_' + Date.now(),
                token_type: 'Bearer',
            };
            
            // Salvar tokens usando a API
            const { setTokens } = await import('@/lib/api');
            setTokens(demoTokens);
            
            // Aguardar um pouco para garantir que os cookies foram gravados
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Redirecionar para dashboard usando window.location para forçar reload
            window.location.href = '/dashboard';
        } catch {
            setSubmitError('Erro ao fazer login de demonstração.');
        }
    };

    const onSubmit = async (data: LoginForm) => {
        setSubmitError(null);
        try {
            await login(data.email, data.password);
            router.push('/dashboard');
        } catch (err) {
            const error = err as { message?: string; status?: number };
            
            // Mensagens de erro personalizadas baseadas no status
            if (error.status === 401) {
                setSubmitError('Email ou senha incorretos');
            } else if (error.status === 422) {
                setSubmitError('Dados inválidos. Verifique email e senha.');
            } else if (error.status === 0) {
                // Erro de conexão (banco de dados offline ou servidor indisponível)
                setSubmitError('O serviço está fora do ar no momento. Contate o administrador.');
            } else {
                setSubmitError(error.message || 'Erro ao fazer login. Tente novamente.');
            }
        }
    };

    return (
        <div className={styles.container}>
            <nav className={styles.navbar}>
                <Link href="/" className={styles.navCenter} title="Home" aria-label="Ir para Home">
                    <Home size={20} />
                </Link>
                <div className={styles.navActions}>
                    <ThemeToggle />
                </div>
            </nav>

            <div className={styles.card}>
                <div className={styles.header}>

                    <h1 className={styles.title}>Bem-vindo de volta</h1>
                    <p className={styles.subtitle}>Entre na sua conta para continuar</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                    {submitError && (
                        <div className={styles.errorBanner}>
                            {submitError}
                        </div>
                    )}

                    <Input
                        label="Email"
                        type="email"
                        placeholder="seu@email.com"
                        leftIcon={<Mail size={18} />}
                        error={errors.email?.message}
                        {...register('email')}
                    />

                    <Input
                        label="Senha"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        leftIcon={<Lock size={18} />}
                        rightIcon={
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: '4px',
                                    cursor: 'pointer',
                                    color: 'var(--color-text-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        }
                        error={errors.password?.message}
                        {...register('password')}
                    />

                    <div className={styles.actions}>
                        <Link href="/forgot-password" className={styles.forgotLink}>
                            Esqueceu a senha?
                        </Link>
                        {mounted && isDevelopment && (
                            <button
                                type="button"
                                onClick={handleDemoLogin}
                                className={styles.demoLink}
                                title="Login de demonstração (apenas em desenvolvimento)"
                            >
                                Demo
                            </button>
                        )}
                    </div>

                    <Button
                        type="submit"
                        fullWidth
                        isLoading={isLoading}
                        rightIcon={<ArrowRight size={18} />}
                    >
                        Entrar
                    </Button>
                </form>

                <div className={styles.footer}>
                    <span className={styles.footerText}>Não tem uma conta?</span>
                    <Link href="/register" className={styles.registerLink}>
                        Criar conta
                    </Link>
                </div>
            </div>
        </div>
    );
}
