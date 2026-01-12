'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Calendar, Users, DollarSign, Clock, BarChart3, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import styles from './analytics.module.css';

interface RevenueReport {
    days: number;
    revenue_cents: number;
}

interface OccupancyReport {
    days: number;
    appointments_total: number;
    appointments_completed: number;
}

interface ServiceMixItem {
    service: string;
    count: number;
}

interface DashboardSummary {
    bookings_last_days: number;
    upcoming: number;
    clients: number;
}

export default function AnalyticsPage() {
    const [period, setPeriod] = useState('month');
    const [loading, setLoading] = useState(true);
    const [revenue, setRevenue] = useState<RevenueReport | null>(null);
    const [occupancy, setOccupancy] = useState<OccupancyReport | null>(null);
    const [topServices, setTopServices] = useState<ServiceMixItem[]>([]);
    const [summary, setSummary] = useState<DashboardSummary | null>(null);

    const getDaysFromPeriod = (p: string) => {
        switch (p) {
            case 'week': return 7;
            case 'month': return 30;
            case 'quarter': return 90;
            case 'year': return 365;
            default: return 30;
        }
    };

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            const days = getDaysFromPeriod(period);

            try {
                const [revenueRes, occupancyRes, serviceMixRes, summaryRes] = await Promise.all([
                    api.get<RevenueReport>(`/api/v1/dashboard/analytics/revenue?days=${days}`).catch(() => null),
                    api.get<OccupancyReport>(`/api/v1/dashboard/analytics/occupancy?days=${days}`).catch(() => null),
                    api.get<ServiceMixItem[]>(`/api/v1/dashboard/analytics/service-mix?days=${days}`).catch(() => []),
                    api.get<DashboardSummary>(`/api/v1/dashboard/summary?days=${days}`).catch(() => null)
                ]);

                setRevenue(revenueRes);
                setOccupancy(occupancyRes);
                setTopServices(Array.isArray(serviceMixRes) ? serviceMixRes : []);
                setSummary(summaryRes && typeof summaryRes === 'object' ? summaryRes : null);
            } catch (err) {
                const error = err as { message?: string; status?: number };
                console.error('Erro ao carregar analytics:', error.status === 0 ? 'Serviço fora do ar' : err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [period]);

    const formatCurrency = (valueReais: number | undefined | null) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valueReais ?? 0);
    };

    const revenueValue = (revenue?.revenue_cents ?? 0) / 100;
    const occupancyRate = occupancy && occupancy.appointments_total > 0
        ? (occupancy.appointments_completed / occupancy.appointments_total) * 100
        : 0;

    const revenueData = revenue ? [{ period: `${revenue.days}d`, value: revenueValue }] : [];
    const occupancyData = occupancy ? [{ day: `${occupancy.days}d`, value: occupancyRate }] : [];
    const maxRevenue = revenueData.length > 0 ? Math.max(...revenueData.map(d => d.value)) : 1;
    const maxOccupancy = 100;

    const metrics = summary ? [
        { 
            label: 'Receita Total', 
            value: formatCurrency(revenueValue), 
            change: '—', 
            positive: true, 
            icon: DollarSign 
        },
        { 
            label: 'Agendamentos', 
            value: (summary.bookings_last_days ?? 0).toString(), 
            change: '—', 
            positive: true, 
            icon: Calendar 
        },
        { 
            label: 'Clientes', 
            value: (summary.clients ?? 0).toString(), 
            change: '—', 
            positive: true, 
            icon: Users 
        },
        { 
            label: 'Taxa de Ocupação', 
            value: `${occupancyRate.toFixed(1)}%`, 
            change: '—', 
            positive: true, 
            icon: Clock 
        },
    ] : [];

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.loadingState}>
                    <Loader2 size={32} className={styles.spinner} />
                    <p>Carregando relatórios...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Relatórios</h1>
                    <p className={styles.subtitle}>Análise de desempenho do seu negócio</p>
                </div>
                <select value={period} onChange={(e) => setPeriod(e.target.value)} className={styles.periodSelect}>
                    <option value="week">Esta semana</option>
                    <option value="month">Este mês</option>
                    <option value="quarter">Este trimestre</option>
                    <option value="year">Este ano</option>
                </select>
            </div>

            {summary && metrics.length > 0 && (
                <div className={styles.metricsGrid}>
                    {metrics.map(metric => {
                        const Icon = metric.icon;
                        return (
                            <div key={metric.label} className={styles.metricCard}>
                                <div className={styles.metricHeader}>
                                    <div className={styles.metricIcon}><Icon size={20} /></div>
                                    <span className={`${styles.metricChange} ${metric.positive ? styles.positive : styles.negative}`}>
                                        {metric.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                        {metric.change}
                                    </span>
                                </div>
                                <div className={styles.metricValue}>{metric.value}</div>
                                <div className={styles.metricLabel}>{metric.label}</div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className={styles.chartsGrid}>
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <h2 className={styles.chartTitle}>Receita</h2>
                        <BarChart3 size={20} className={styles.chartIcon} />
                    </div>
                    {revenueData.length === 0 ? (
                        <div className={styles.emptyChart}>
                            <p>Sem dados de receita para o período</p>
                        </div>
                    ) : (
                        <div className={styles.barChart}>
                            {revenueData.map(item => (
                                <div key={item.period} className={styles.barItem}>
                                    <div className={styles.barContainer}>
                                        <div
                                            className={styles.bar}
                                            style={{ height: `${(item.value / maxRevenue) * 100}%` }}
                                        />
                                    </div>
                                    <span className={styles.barLabel}>{item.period}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <h2 className={styles.chartTitle}>Ocupação por Dia</h2>
                    </div>
                    {occupancyData.length === 0 ? (
                        <div className={styles.emptyChart}>
                            <p>Sem dados de ocupação para o período</p>
                        </div>
                    ) : (
                        <div className={styles.barChart}>
                            {occupancyData.map(item => (
                                <div key={item.day} className={styles.barItem}>
                                    <div className={styles.barContainer}>
                                        <div
                                            className={`${styles.bar} ${item.value > 90 ? styles.barHigh : ''}`}
                                            style={{ height: `${(item.value / maxOccupancy) * 100}%` }}
                                        />
                                    </div>
                                    <span className={styles.barLabel}>{item.day}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <h2 className={styles.chartTitle}>Serviços Mais Populares</h2>
                    </div>
                    {topServices.length === 0 ? (
                        <div className={styles.emptyChart}>
                            <p>Sem dados de serviços para o período</p>
                        </div>
                    ) : (
                        <div className={styles.servicesList}>
                            {topServices.map((service, index) => (
                                <div key={service.service} className={styles.serviceItem}>
                                    <div className={styles.serviceRank}>{index + 1}</div>
                                    <div className={styles.serviceInfo}>
                                        <span className={styles.serviceName}>{service.service}</span>
                                        <span className={styles.serviceCount}>{service.count} agendamentos</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
