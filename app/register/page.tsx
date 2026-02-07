'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Building2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Button, Input, ThemeToggle } from '@/components/ui';
import { api, TokenPair } from '@/lib/api';
import Link from 'next/link';
import styles from './register.module.css';

const registerSchema = z.object({
    business_name: z.string().min(2, 'Nome do negócio é obrigatório'),
    owner_name: z.string().min(2, 'Seu nome é obrigatório'),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não coincidem',
    path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterForm) => {
        setIsLoading(true);
        setSubmitError(null);

        try {
            const slug = data.business_name
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');

            await api.post<TokenPair>('/api/v1/auth/register', {
                email: data.email,
                password: data.password,
                slug,
                business_name: data.business_name,
                owner_name: data.owner_name,
            }, { requiresAuth: false });

            router.push('/register/success');
        } catch (err) {
            const error = err as { message?: string; status?: number };
            
            if (error.status === 0) {
                setSubmitError('O serviço está fora do ar no momento. Contate o administrador.');
            } else if (error.status === 409) {
                setSubmitError('Este email já está cadastrado. Tente fazer login.');
            } else if (error.status === 422) {
                setSubmitError('Dados inválidos. Verifique os campos e tente novamente.');
            } else {
                setSubmitError(error.message || 'Erro ao criar conta. Tente novamente.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.themeToggleWrapper}>
                <ThemeToggle />
            </div>

            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.logo}>
                        <span className={styles.logoIcon}>📅</span>
                        <span className={styles.logoText}>Ritmo</span>
                    </div>
                    <h1 className={styles.title}>Crie sua conta</h1>
                    <p className={styles.subtitle}>Comece a automatizar seus agendamentos</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                    {submitError && (
                        <div className={styles.errorBanner}>
                            {submitError}
                        </div>
                    )}

                    <Input
                        label="Nome do seu negócio"
                        placeholder="Salão da Maria"
                        leftIcon={<Building2 size={18} />}
                        error={errors.business_name?.message}
                        {...register('business_name')}
                    />

                    <Input
                        label="Seu nome"
                        placeholder="Maria Silva"
                        leftIcon={<User size={18} />}
                        error={errors.owner_name?.message}
                        {...register('owner_name')}
                    />

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

                    <Input
                        label="Confirmar senha"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        leftIcon={<Lock size={18} />}
                        rightIcon={
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                                title={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        }
                        error={errors.confirmPassword?.message}
                        {...register('confirmPassword')}
                    />

                    <Button
                        type="submit"
                        fullWidth
                        isLoading={isLoading}
                        rightIcon={<ArrowRight size={18} />}
                    >
                        Criar conta grátis
                    </Button>

                    <p className={styles.terms}>
                        Ao criar uma conta, você concorda com nossos{' '}
                        <Link href="/terms">Termos de Uso</Link> e{' '}
                        <Link href="/privacy">Política de Privacidade</Link>.
                    </p>
                </form>

                <div className={styles.footer}>
                    <span className={styles.footerText}>Já tem uma conta?</span>
                    <Link href="/login" className={styles.loginLink}>
                        Fazer login
                    </Link>
                </div>
            </div>
        </div>
    );
}
