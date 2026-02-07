'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  Calendar,
  Loader2,
  Save,
  Trash2,
  MessageSquare,
  Users,
  MapPin,
  Globe,
  FileText,
  Bot,
} from 'lucide-react';
import Link from 'next/link';
import styles from './edit.module.css';

interface Tenant {
  id: string;
  business_name: string;
  owner_name: string;
  email: string;
  phone: string;
  document: string;
  address: string;
  city: string;
  state: string;
  website: string;
  status: 'active' | 'inactive' | 'suspended' | 'trial';
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  whatsapp_connected: boolean;
  users_count: number;
  created_at: string;
  notes: string;
}

export default function EditTenantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Simula carregamento do tenant
    setTimeout(() => {
      // Dados mockados - em produção viria da API
      setTenant({
        id: id,
        business_name: 'Salão Bella Vista',
        owner_name: 'Maria Silva',
        email: 'maria@bellavista.com',
        phone: '(11) 99999-9999',
        document: '12.345.678/0001-90',
        address: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
        website: 'www.bellavista.com.br',
        status: 'active',
        plan: 'pro',
        whatsapp_connected: true,
        users_count: 5,
        created_at: '2024-01-15',
        notes: 'Cliente desde janeiro. Migrado do plano básico em março.',
      });
      setLoading(false);
    }, 500);
  }, [id]);

  const handleSave = async () => {
    if (!tenant) return;
    
    setSaving(true);
    setMessage(null);

    try {
      // Simula salvamento
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'Alterações salvas com sucesso!' });
    } catch {
      setMessage({ type: 'error', text: 'Erro ao salvar alterações.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      // Simula exclusão
      await new Promise((resolve) => setTimeout(resolve, 500));
      router.push('/admin/tenants');
    } catch {
      setMessage({ type: 'error', text: 'Erro ao excluir empresa.' });
    }
  };

  const updateField = (field: keyof Tenant, value: string) => {
    if (tenant) {
      setTenant({ ...tenant, [field]: value });
    }
  };

  if (loading || !tenant) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={32} className={styles.spinner} />
        <p>Carregando dados da empresa...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/admin/tenants" className={styles.backButton}>
          <ArrowLeft size={20} />
          Voltar
        </Link>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>Editar Empresa</h1>
          <p className={styles.subtitle}>ID: {tenant.id}</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.deleteButton} onClick={handleDelete}>
            <Trash2 size={18} />
            Excluir
          </button>
          <button className={styles.saveButton} onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={18} className={styles.spinner} /> : <Save size={18} />}
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.content}>
        {/* Info Cards */}
        <div className={styles.infoCards}>
          <div className={styles.infoCard}>
            <Users size={24} />
            <div>
              <span className={styles.infoValue}>{tenant.users_count}</span>
              <span className={styles.infoLabel}>Usuários</span>
            </div>
          </div>
          <div className={styles.infoCard}>
            <MessageSquare size={24} />
            <div>
              <span className={styles.infoValue}>
                {tenant.whatsapp_connected ? 'Conectado' : 'Desconectado'}
              </span>
              <span className={styles.infoLabel}>WhatsApp</span>
            </div>
          </div>
          <div className={styles.infoCard}>
            <Calendar size={24} />
            <div>
              <span className={styles.infoValue}>
                {new Date(tenant.created_at).toLocaleDateString('pt-BR')}
              </span>
              <span className={styles.infoLabel}>Criado em</span>
            </div>
          </div>
          <Link href={`/admin/tenants/${id}/ai`} className={styles.infoCardLink}>
            <Bot size={24} />
            <div>
              <span className={styles.infoValue}>Configurar</span>
              <span className={styles.infoLabel}>Agente IA</span>
            </div>
          </Link>
        </div>

        {/* Form Sections */}
        <div className={styles.formGrid}>
          {/* Business Info */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Building2 size={20} />
              Dados da Empresa
            </h2>
            <div className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Nome da Empresa</label>
                <input
                  type="text"
                  className={styles.input}
                  value={tenant.business_name}
                  onChange={(e) => updateField('business_name', e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  <FileText size={14} />
                  CNPJ/CPF
                </label>
                <input
                  type="text"
                  className={styles.input}
                  value={tenant.document}
                  onChange={(e) => updateField('document', e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  <Globe size={14} />
                  Website
                </label>
                <input
                  type="text"
                  className={styles.input}
                  value={tenant.website}
                  onChange={(e) => updateField('website', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Owner Info */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <User size={20} />
              Dados do Proprietário
            </h2>
            <div className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Nome do Proprietário</label>
                <input
                  type="text"
                  className={styles.input}
                  value={tenant.owner_name}
                  onChange={(e) => updateField('owner_name', e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  <Mail size={14} />
                  Email
                </label>
                <input
                  type="email"
                  className={styles.input}
                  value={tenant.email}
                  onChange={(e) => updateField('email', e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  <Phone size={14} />
                  Telefone
                </label>
                <input
                  type="tel"
                  className={styles.input}
                  value={tenant.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Address */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <MapPin size={20} />
              Endereço
            </h2>
            <div className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Endereço</label>
                <input
                  type="text"
                  className={styles.input}
                  value={tenant.address}
                  onChange={(e) => updateField('address', e.target.value)}
                />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Cidade</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={tenant.city}
                    onChange={(e) => updateField('city', e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Estado</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={tenant.state}
                    onChange={(e) => updateField('state', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Status & Plan */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Calendar size={20} />
              Status e Plano
            </h2>
            <div className={styles.form}>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Status</label>
                  <select
                    className={styles.select}
                    value={tenant.status}
                    onChange={(e) => updateField('status', e.target.value)}
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="suspended">Suspenso</option>
                    <option value="trial">Trial</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Plano</label>
                  <select
                    className={styles.select}
                    value={tenant.plan}
                    onChange={(e) => updateField('plan', e.target.value)}
                  >
                    <option value="free">Gratuito</option>
                    <option value="basic">Básico</option>
                    <option value="pro">Profissional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Observações</label>
                <textarea
                  className={styles.textarea}
                  rows={4}
                  value={tenant.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Notas internas sobre esta empresa..."
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
