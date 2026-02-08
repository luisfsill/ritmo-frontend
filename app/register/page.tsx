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

const registerSchema = z
    .object({
        business_name: z.string().min(2, 'Nome do negocio e obrigatorio'),
        owner_name: z.string().min(2, 'Seu nome e obrigatorio'),
        email: z.string().email('Email invalido'),
        password: z.string().min(8, 'Senha deve ter no minimo 8 caracteres'),
        confirmPassword: z.string(),
        address: z
            .object({
                street: z.string().max(200).optional(),
                number: z.string().max(50).optional(),
                complement: z.string().max(200).optional(),
                neighborhood: z.string().max(200).optional(),
                city: z.string().max(120).optional(),
                state: z.string().max(80).optional(),
                postal_code: z.string().max(20).optional(),
                country_code: z.string().max(2, 'Pais deve ter 2 letras').optional(),
            })
            .optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Senhas nao coincidem',
        path: ['confirmPassword'],
    });

type RegisterForm = z.infer<typeof registerSchema>;

const normalizeOptionalText = (value: string | undefined): string | null => {
    const trimmed = String(value || '').trim();
    return trimmed || null;
};

const buildAddressPayload = (address: RegisterForm['address']) => {
    if (!address) return null;
    const payload = {
        street: normalizeOptionalText(address.street),
        number: normalizeOptionalText(address.number),
        complement: normalizeOptionalText(address.complement),
        neighborhood: normalizeOptionalText(address.neighborhood),
        city: normalizeOptionalText(address.city),
        state: normalizeOptionalText(address.state),
        postal_code: normalizeOptionalText(address.postal_code),
        country_code: normalizeOptionalText(address.country_code)?.toUpperCase() || null,
    };
    const hasAnyValue = Object.values(payload).some((value) => Boolean(value));
    return hasAnyValue ? payload : null;
};

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

            await api.post<TokenPair>(
                '/api/v1/auth/register',
                {
                    email: data.email,
                    password: data.password,
                    slug,
                    business_name: data.business_name,
                    owner_name: data.owner_name,
                    address: buildAddressPayload(data.address),
                },
                { requiresAuth: false }
            );

            router.push('/register/success');
        } catch (err) {
            const error = err as { message?: string; status?: number };

            if (error.status === 0) {
                setSubmitError('O servico esta fora do ar no momento. Contate o administrador.');
            } else if (error.status === 409) {
                setSubmitError('Este email ja esta cadastrado. Tente fazer login.');
            } else if (error.status === 422) {
                setSubmitError('Dados invalidos. Verifique os campos e tente novamente.');
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
                        <span className={styles.logoIcon}>R</span>
                        <span className={styles.logoText}>Ritmo</span>
                    </div>
                    <h1 className={styles.title}>Crie sua conta</h1>
                    <p className={styles.subtitle}>Comece a automatizar seus agendamentos</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                    {submitError && <div className={styles.errorBanner}>{submitError}</div>}

                    <Input
                        label="Nome do seu negocio"
                        placeholder="Salao da Maria"
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

                    <h3 className={styles.sectionTitle}>Endereco da unidade (opcional)</h3>

                    <Input
                        label="Logradouro"
                        placeholder="Rua, avenida, etc."
                        error={errors.address?.street?.message}
                        {...register('address.street')}
                    />

                    <Input
                        label="Numero"
                        placeholder="123"
                        error={errors.address?.number?.message}
                        {...register('address.number')}
                    />

                    <Input
                        label="Complemento"
                        placeholder="Apto, sala, bloco"
                        error={errors.address?.complement?.message}
                        {...register('address.complement')}
                    />

                    <Input
                        label="Bairro"
                        placeholder="Bairro"
                        error={errors.address?.neighborhood?.message}
                        {...register('address.neighborhood')}
                    />

                    <Input
                        label="Cidade"
                        placeholder="Cidade"
                        error={errors.address?.city?.message}
                        {...register('address.city')}
                    />

                    <Input
                        label="Estado"
                        placeholder="SP"
                        error={errors.address?.state?.message}
                        {...register('address.state')}
                    />

                    <Input
                        label="CEP"
                        placeholder="00000-000"
                        error={errors.address?.postal_code?.message}
                        {...register('address.postal_code')}
                    />

                    <Input
                        label="Pais"
                        placeholder="BR"
                        error={errors.address?.country_code?.message}
                        {...register('address.country_code')}
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
                        placeholder="********"
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
                                    justifyContent: 'center',
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
                        placeholder="********"
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
                                    justifyContent: 'center',
                                }}
                                title={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        }
                        error={errors.confirmPassword?.message}
                        {...register('confirmPassword')}
                    />

                    <Button type="submit" fullWidth isLoading={isLoading} rightIcon={<ArrowRight size={18} />}>
                        Criar conta gratis
                    </Button>

                    <p className={styles.terms}>
                        Ao criar uma conta, voce concorda com nossos <Link href="/terms">Termos de Uso</Link> e{' '}
                        <Link href="/privacy">Politica de Privacidade</Link>.
                    </p>
                </form>

                <div className={styles.footer}>
                    <span className={styles.footerText}>Ja tem uma conta?</span>
                    <Link href="/login" className={styles.loginLink}>
                        Fazer login
                    </Link>
                </div>
            </div>
        </div>
    );
}
