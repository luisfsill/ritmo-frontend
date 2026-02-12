import {
  DemoStepSimple,
  FaqData,
  HeroMetric,
  PricingPlan,
  ProblemItem,
  RevenueScenario,
  SolutionItem,
} from './types';

export const heroData = {
  badge: 'Sua agenda no piloto automático',
  title: 'Atenda clientes em <strong>segundos</strong> e mantenha sua agenda <strong>cheia</strong>',
  subtitle:
    'A Ritmo responde no WhatsApp 24h, sugere horários válidos e confirma presença — sem sobrecarregar sua equipe.',
  metrics: [
    {
      value: '2x',
      label: 'Mais rapidez para fechar um horário',
      delta: 'Média das primeiras semanas',
      context: 'Com setup inicial concluído',
    },
    {
      value: '-35%',
      label: 'Menos faltas sem aviso',
      delta: 'Com lembrete em 24h e 1h antes',
      context: 'Pode variar conforme rotina da equipe',
    },
    {
      value: '+18%',
      label: 'Mais horários ocupados na semana',
      delta: 'Após ativar lembretes e remarcação',
      context: 'Base comparada ao período anterior',
    },
  ] as HeroMetric[],
};

export const problemItems: ProblemItem[] = [
  {
    title: 'Demandas operacionais constantemente interrompidas por atendimentos via mensagem',
    description: 'Grande parte das interações envolve dúvidas sobre horário, preço e remarcação, reduzindo o foco nas atividades principais.',
  },
  {
    title: 'Horários ociosos por falta de confirmação estruturada',
    description: 'Sem lembretes automatizados ou processo formal de validação, há aumento de faltas e remarcações tardias.',
  },
  {
    title: 'Distribuição irregular de demanda ao longo das semanas',
    description: 'A ausência de fluxo padronizado de confirmação e remarcação gera picos de sobrecarga seguidos de períodos de baixa ocupação.',
  },
];

export const solutionItems: SolutionItem[] = [
  {
    title: 'Respostas rápidas desde a primeira mensagem',
    description: 'O cliente recebe opções claras e segue para o próximo passo sem espera longa.',
  },
  {
    title: 'Oferta de horário com agenda real',
    description: 'Antes de responder, a Ritmo valida profissional, duração e disponibilidade.',
  },
  {
    title: 'Confirmação automática no momento certo',
    description: 'Lembretes simples reduzem falta e ajudam a equipe a se organizar.',
  },
  {
    title: 'Se precisar, passa para atendente',
    description: 'Quando o caso exige ajuda humana, a conversa segue com contexto completo.',
  },
];

export type TargetSegment = {
  name: string;
  scenario: string;
  outcome: string;
};

export const targetSegments: TargetSegment[] = [
  {
    name: 'Salão de beleza',
    scenario: 'Recepção dividida entre atender telefone, responder WhatsApp e cuidar de quem já está no salão. Horários vagos só aparecem quando é tarde demais.',
    outcome: 'Agenda preenchida automaticamente, sem depender da recepção',
  },
  {
    name: 'Clínica de estética',
    scenario: 'Procedimentos longos e caros. Um horário vazio pesa no faturamento, e remarcar exige ligar para cada cliente da lista de espera.',
    outcome: 'Lista de espera ativada em segundos quando alguém desmarca',
  },
  {
    name: 'Barbearia premium',
    scenario: 'Clientes fiéis que voltam toda semana, mas esquecem de agendar. A equipe gasta tempo mandando lembretes manuais pelo WhatsApp.',
    outcome: 'Lembretes e reagendamento automático para clientes recorrentes',
  },
  {
    name: 'Spa urbano',
    scenario: 'Pacotes com múltiplas sessões e profissionais diferentes. Coordenar disponibilidade vira um quebra-cabeça que consome o dia.',
    outcome: 'Agendamento inteligente que cruza disponibilidade de toda a equipe',
  },
];

export const demoSteps: DemoStepSimple[] = [
  {
    id: 'entrada',
    title: '1. Novo contato chega no WhatsApp',
    userSituation: 'Roberta manda mensagem <strong>às 23h</strong> pedindo horário — <strong>fora do expediente</strong>, sem dizer dia nem profissional.',
    ritmoAction: 'Mesmo de madrugada, a Ritmo responde <strong>em segundos</strong>. Puxa o histórico da Roberta, vê que ela faz limpeza de pele com a Jessica <strong>toda quinta</strong>, e já <strong>sugere o próximo horário livre</strong>.',
    outcome: 'Atendimento <strong>24h</strong>, agendamento feito <strong>em uma troca</strong> — sem perder cliente por demora.',
    preview: [
      { author: 'Cliente', text: 'Oi, quero marcar limpeza de pele essa semana 😊' },
      { author: 'Ritmo', text: 'Oi Roberta! Vi que você sempre agenda com a Jessica, quinta às 17h. Essa quinta ela tem 17h livre. Confirmo pra você?' },
      { author: 'Cliente', text: 'Isso mesmo, confirma!' },
      { author: 'Ritmo', text: 'Pronto! Quinta 17h, Limpeza de Pele com a Jessica. Te mando lembrete na véspera ✨' },
    ],
    ctaLabel: 'Simular atendimento no WhatsApp',
  },
  {
    id: 'oferta',
    title: '2. Horário pedido não está livre',
    userSituation: 'Roberta quer terça às 16h com a Jessica, mas o horário está ocupado.',
    ritmoAction: 'Em vez de só dizer "não disponível", a Ritmo <strong>mostra por quê</strong>, oferece o <strong>horário mais próximo</strong> com a mesma profissional, e dá uma segunda opção caso ela prefira antecipar.',
    outcome: 'Cliente <strong>nunca recebe um "não" seco</strong> — sempre recebe alternativas inteligentes.',
    preview: [
      { author: 'Cliente', text: 'Consigo terça às 16h com a Jessica?' },
      { author: 'Ritmo', text: 'A Jessica está ocupada das 15h30 às 16h15. O mais próximo seria 16h30 com ela, ou quarta 14h. O que fica melhor?' },
      { author: 'Cliente', text: 'Terça 16h30!' },
      { author: 'Ritmo', text: 'Confirmado! Terça 16h30, Limpeza de Pele com a Jessica na unidade Centro 💜' },
    ],
    ctaLabel: 'Simular ajuste de horário',
  },
  {
    id: 'confirmacao',
    title: '3. Confirmação e reagendamento',
    userSituation: 'Faltam 24h para o horário da Roberta e surgiu um imprevisto.',
    ritmoAction: 'A Ritmo envia lembrete com <strong>contexto completo</strong>. Se a Roberta não puder ir, <strong>reagenda na hora</strong> com a mesma profissional — sem precisar ligar. Se algo fugir do esperado, passa para você com todo o histórico.',
    outcome: '<strong>Menos no-show</strong>, reagendamento sem atrito, e você <strong>só intervém quando realmente precisa</strong>.',
    preview: [
      { author: 'Ritmo', text: 'Oi Roberta! Amanhã quinta 17h, Limpeza de Pele com a Jessica na unidade Centro. Tudo certo?' },
      { author: 'Cliente', text: 'Surgiu um imprevisto 😕' },
      { author: 'Ritmo', text: 'Sem problema! A Jessica tem sexta 10h ou segunda 17h. Quer reagendar?' },
      { author: 'Cliente', text: 'Segunda 17h!' },
      { author: 'Ritmo', text: 'Reagendado! Segunda 17h com a Jessica. Até lá! 😊' },
    ],
    ctaLabel: 'Simular confirmação automática',
  },
];

export const revenueScenarios: RevenueScenario[] = [
  {
    id: 'reativacao',
    icon: 'user-round-search',
    title: 'Cliente sumiu? A Ritmo traz de volta',
    description: 'Quando alguém não agenda há <strong>mais de 30 dias</strong>, a Ritmo manda mensagem automática — <strong>sem você precisar lembrar</strong>.',
    preview: [
      { author: 'Ritmo', text: 'Oi Lucia! Faz tempo que você não agenda com a gente. A Jessica tem horários livres essa semana pra Limpeza de Pele. Quer que eu reserve um pra você? 😊' },
      { author: 'Cliente', text: 'Oi! Nossa, verdade. Pode ser quinta 15h?' },
      { author: 'Ritmo', text: 'Confirmado! Quinta 15h com a Jessica. Bem-vinda de volta! ✨' },
    ],
    metric: '+22%',
    metricLabel: 'clientes inativos reativados por mês',
  },
  {
    id: 'lista-espera',
    icon: 'bell-ring',
    title: 'Cancelou? Quem espera já recebe aviso',
    description: 'Quando um horário abre por cancelamento, a Ritmo <strong>avisa automaticamente</strong> quem estava na lista de espera — <strong>zero horário vazio</strong>.',
    preview: [
      { author: 'Ritmo', text: 'Oi Camila! Abriu uma vaga amanhã quinta 15h com a Jessica pra Design de Sobrancelha. Quer confirmar? É sua se quiser! 💜' },
      { author: 'Cliente', text: 'Quero sim!!' },
      { author: 'Ritmo', text: 'Pronto, confirmado! Quinta 15h, Design de Sobrancelha com a Jessica na unidade Centro.' },
    ],
    metric: '60%',
    metricLabel: 'dos cancelamentos preenchidos pela lista de espera',
  },
  {
    id: 'horario-ocioso',
    icon: 'calendar-clock',
    title: 'Horário vazio amanhã? A Ritmo preenche',
    description: 'O sistema <strong>detecta buracos na agenda</strong> e envia ofertas para clientes com perfil compatível — <strong>automaticamente, sem desconto</strong>.',
    preview: [
      { author: 'Ritmo', text: 'Oi Fernanda! Amanhã sexta tem um horário às 14h livre com a Jessica. Perfeito pra aquela Hidratação que você faz todo mês. Quer aproveitar?' },
      { author: 'Cliente', text: 'Boa! Confirma pra mim 🙌' },
      { author: 'Ritmo', text: 'Feito! Sexta 14h, Hidratação com a Jessica. Te mando lembrete de manhã!' },
    ],
    metric: '+18%',
    metricLabel: 'de ocupação semanal com preenchimento proativo',
  },
];

export const pricingPlans: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    originalPrice: 'R$ 480',
    currentPrice: 'R$ 319',
    billing: '/mês',
    description: 'Para organizar o primeiro fluxo de agendamento.',
    fitLabel: 'Ideal para operação menor ou em fase inicial.',
    features: ['1 número de WhatsApp', 'Agendamento + confirmação', 'Relatórios essenciais'],
    ctaLabel: 'Escolher Starter',
  },
  {
    id: 'growth',
    name: 'Growth',
    originalPrice: 'R$ 870',
    currentPrice: 'R$ 697',
    billing: '/mês',
    description: 'Para equipes com maior volume de atendimento.',
    fitLabel: 'Ideal para reduzir faltas e ocupar mais horários com consistência.',
    features: ['Equipe multiprofissional', 'Campanhas para chamar clientes de volta', 'Onboarding assistido'],
    ctaLabel: 'Escolher Growth',
    isRecommended: true,
  },
  {
    id: 'scale',
    name: 'Scale Enterprise',
    currentPrice: 'O modelo ideal para operações com múltiplas unidades',
    billing: '',
    description: 'Para operações com várias unidades.',
    fitLabel: 'Ideal para padronizar processo e acompanhar desempenho por unidade.',
    features: ['Gestão multiunidade', 'Relatórios de ocupação e receita', 'Suporte prioritário'],
    ctaLabel: 'Falar sobre Enterprise',
  },
];

export const faqData: FaqData = {
  kicker: 'Perguntas frequentes',
  title: 'Dúvidas comuns antes de começar',
  description: 'Respostas diretas para decidir rápido e sem surpresa.',
  items: [
    {
      id: 'faq-servicos',
      question: 'Funciona para qualquer serviço com agendamento?',
      answer:
        'Sim, desde que exista agenda recorrente. O setup adapta serviço, profissional e horários ao seu negócio.',
    },
    {
      id: 'faq-migracao',
      question: 'Preciso trocar tudo para começar?',
      answer:
        'Não. A implantação por fases ativa o essencial primeiro e evolui com segurança.',
    },
    {
      id: 'faq-whatsapp',
      question: 'Como o WhatsApp entra no processo?',
      answer:
        'Ele vira o canal principal para novos contatos, confirmação e remarcação. Se necessário, passa para atendente.',
    },
    {
      id: 'faq-multiunidade',
      question: 'Atende operação com mais de uma unidade?',
      answer:
        'Sim. A Ritmo trabalha com unidades separadas, mantendo organização de agenda e acesso por equipe.',
    },
    {
      id: 'faq-suporte',
      question: 'Existe suporte durante a implantação?',
      answer:
        'Sim. Você recebe acompanhamento em cada etapa para a equipe adotar o processo com tranquilidade.',
    },
  ],
  ctaLabel: 'Ainda com dúvida? Falar no WhatsApp',
  ctaSupport: 'Resposta comercial focada no seu cenário.',
};

export const finalCtaData = {
  title: 'Comece a organizar seu agendamento no WhatsApp hoje',
  subtitle:
    'Receba um plano personalizado para sua operação e veja como a Ritmo pode ajudar a manter sua agenda cheia!',
  supportingText:
    'Início gradual, sem interromper sua rotina. Primeiros resultados visíveis em 2–3 semanas.',
  secondaryCtaLabel: 'Criar conta grátis',
};

export const defaultWhatsappMessage =
  'Oi! Quero organizar meus agendamentos no WhatsApp com a Ritmo.';
