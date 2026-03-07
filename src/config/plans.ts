export interface Plan {
    id: string;
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    popular?: boolean;
    stripeLink: string;
    billing?: string;
}

export const BOOST_PLANS: Plan[] = [
    {
        id: 'monthly',
        name: 'Mensal',
        price: '59,90',
        period: '/mês',
        description: 'Acesso completo para impulsionar suas criações.',
        features: [
            'Roteirista & Storytelling IA',
            'Insights de Audiência Profundos',
            'Anúncios de Alta Conversão',
            'Acesso a todos os templates',
            'Saldos renovados mensalmente',
        ],
        stripeLink: 'https://buy.stripe.com/test_3cI9AS31N2GJglx4jGfEk00',
    },
    {
        id: 'quarterly',
        name: 'Trimestral',
        price: '55,00',
        period: '/mês',
        billing: 'cobrado R$ 165,00/trimestre',
        description: 'Economia garantida com o plano trimestral.',
        popular: true,
        features: [
            'Tudo do plano Mensal',
            'Economia de R$ 14,70/mês',
            'Suporte prioritário',
            'Acesso antecipado a novos recursos',
        ],
        stripeLink: 'https://buy.stripe.com/9B628r7DI3Ny4meaJq5sA01',
    },
    {
        id: 'annual',
        name: 'Anual',
        price: '52,00',
        period: '/mês',
        billing: 'cobrado R$ 624,00/ano',
        description: 'O melhor custo-benefício para criadores profissionais.',
        features: [
            'Tudo do plano Trimestral',
            'Economia de R$ 94,80 vs mensal',
            'Sessão de mentoria exclusiva',
            'Acesso vitalício às atualizações',
        ],
        stripeLink: 'https://buy.stripe.com/eVq8wPcY24RCdWOaJq5sA02',
    },
];

export const Blent_PLANS: Plan[] = [
    {
        id: 'monthly',
        name: 'Mensal',
        price: '49,90',
        period: '/mês',
        description: 'Crie estáticos e carrosséis profissionais em segundos.',
        features: [
            'Acesso à todas as features',
            'Downloads ilimitados',
            'Biblioteca de Ativos Exclusiva',
            'Suporte prioritário',
            'Organizador de Tarefas (Planner)',
        ],
        stripeLink: 'https://buy.stripe.com/9B6fZh3ns83Og4W5p65sA05', // Placeholder, needs actual Stripe link
    },
    {
        id: 'quarterly',
        name: 'Trimestral',
        price: '43,30',
        period: '/mês',
        billing: 'cobrado R$ 129,90/trimestre',
        description: 'Economia inteligente para criadores consistentes.',
        popular: true,
        features: [
            'Tudo do plano Mensal',
            'Bom custo-benefício',
            'Suporte Premium',
            'Acesso antecipado a novos recursos',
        ],
        stripeLink: 'https://buy.stripe.com/9B628r7DI3Ny4meaJq5sA01', // Placeholder
    },
    {
        id: 'annual',
        name: 'Anual',
        price: '41,41',
        period: '/mês',
        billing: 'cobrado R$ 497,90/ano',
        description: 'O melhor valor para profissionais que pensam no longo prazo.',
        features: [
            'Todos os benefícios anteriores',
            'Melhor custo-benefício',
            'Acesso antecipado a novas funcionalidades',
            'Versão com IA aprimorada dos recursos',
        ],
        stripeLink: 'https://buy.stripe.com/eVq8wPcY24RCdWOaJq5sA02', // Placeholder
    },
];
