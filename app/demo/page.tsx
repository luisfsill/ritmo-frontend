'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  ArrowLeft,
  Sun, 
  Moon, 
  Target, 
  Users, 
  Shield, 
  CheckCircle,
  Clock,
  TrendingUp,
  MessageCircle,
  Calendar,
  Bell,
  BarChart3,
  ChefHat,
  Brain,
  Heart,
  Zap,
  Eye,
  Sparkles,
  Home
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import styles from './page.module.css';

interface CardData {
  id: number;
  type: 'intro' | 'pain' | 'solution' | 'experience' | 'differential' | 'analogy' | 'closing';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  bgGradient: string;
}

export default function DemoPage() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [currentCard, setCurrentCard] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isAnimating, setIsAnimating] = useState(false);

  const cards: CardData[] = [
    // Card 1: Elevator Pitch
    {
      id: 0,
      type: 'intro',
      title: 'Transforme seu WhatsApp',
      subtitle: 'em um balcão que nunca fecha',
      icon: <Sparkles size={48} />,
      bgGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      content: (
        <div className={styles.introContent}>
          <p className={styles.introPitch}>
            Uma agenda inteligente que gerencia seus clientes <strong>sozinha</strong>, 
            enquanto você foca no serviço.
          </p>
          <div className={styles.introHighlight}>
            <Shield size={24} />
            <span>Não é apenas um chatbot — é um sistema <strong>blindado contra erros</strong></span>
          </div>
        </div>
      ),
    },
    // Card 2: Para Quem é
    {
      id: 1,
      type: 'pain',
      title: 'Isso é para você?',
      subtitle: 'Veja se você se identifica...',
      icon: <Target size={48} />,
      bgGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      content: (
        <div className={styles.painContent}>
          <div className={styles.painCard}>
            <div className={styles.painIconBox}><Clock size={24} /></div>
            <p>Interrompe o serviço para responder <strong>&quot;tem horário?&quot;</strong></p>
          </div>
          <div className={styles.painCard}>
            <div className={styles.painIconBox}><TrendingUp size={24} /></div>
            <p>Perde dinheiro com <strong>no-shows</strong></p>
          </div>
          <div className={styles.painCard}>
            <div className={styles.painIconBox}><MessageCircle size={24} /></div>
            <p>Medo de robô falar <strong>besteira</strong></p>
          </div>
        </div>
      ),
    },
    // Card 3: Solução Operacional
    {
      id: 2,
      type: 'solution',
      title: 'Para sua Sanidade',
      subtitle: 'O lado operacional',
      icon: <Brain size={48} />,
      bgGradient: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      content: (
        <div className={styles.solutionContent}>
          <div className={styles.solutionItem}>
            <div className={styles.solutionIcon}><Clock size={24} /></div>
            <div>
              <strong>Auto-gestão</strong>
              <p>Cliente agenda, remarca e cancela sozinho</p>
            </div>
          </div>
          <div className={styles.solutionItem}>
            <div className={styles.solutionIcon}><Users size={24} /></div>
            <div>
              <strong>Organização de Equipe</strong>
              <p>Cada profissional tem sua agenda</p>
            </div>
          </div>
          <div className={styles.solutionItem}>
            <div className={styles.solutionIcon}><Shield size={24} /></div>
            <div>
              <strong>Resiliência</strong>
              <p>Se falhar, cai para fluxo manual</p>
            </div>
          </div>
        </div>
      ),
    },
    // Card 4: Solução Financeira
    {
      id: 3,
      type: 'solution',
      title: 'Para seu Bolso',
      subtitle: 'O lado financeiro',
      icon: <TrendingUp size={48} />,
      bgGradient: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
      content: (
        <div className={styles.solutionContent}>
          <div className={styles.solutionItem}>
            <div className={styles.solutionIcon}><Calendar size={24} /></div>
            <div>
              <strong>Fim dos Buracos</strong>
              <p>Lembretes automáticos reduzem no-shows</p>
            </div>
          </div>
          <div className={styles.solutionItem}>
            <div className={styles.solutionIcon}><BarChart3 size={24} /></div>
            <div>
              <strong>Visão de Dono</strong>
              <p>Receita, ocupação, serviços mais vendidos</p>
            </div>
          </div>
          <div className={styles.solutionItem}>
            <div className={styles.solutionIcon}><Bell size={24} /></div>
            <div>
              <strong>Reengajamento</strong>
              <p>&quot;Faz X tempo sem agendar&quot; automático</p>
            </div>
          </div>
        </div>
      ),
    },
    // Card 5: Experiência do Cliente
    {
      id: 4,
      type: 'experience',
      title: 'Seu Cliente Ama',
      subtitle: 'A experiência que fideliza',
      icon: <Heart size={48} />,
      bgGradient: 'linear-gradient(135deg, #c31432 0%, #240b36 100%)',
      content: (
        <div className={styles.experienceContent}>
          <div className={styles.experienceItem}>
            <MessageCircle size={28} />
            <span><strong>Zero Fricção</strong> — Tudo no WhatsApp</span>
          </div>
          <div className={styles.experienceItem}>
            <Zap size={28} />
            <span><strong>Resposta Rápida</strong> — Sem espera</span>
          </div>
          <div className={styles.experienceItem}>
            <Calendar size={28} />
            <span><strong>Sugestões Inteligentes</strong> — Horários reais</span>
          </div>
          <div className={styles.experienceItem}>
            <Eye size={28} />
            <span><strong>Transparência</strong> — Política clara</span>
          </div>
        </div>
      ),
    },
    // Card 6: O Diferencial
    {
      id: 5,
      type: 'differential',
      title: 'O Superpoder',
      subtitle: 'Por que somos diferentes',
      icon: <Shield size={48} />,
      bgGradient: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
      content: (
        <div className={styles.differentialContent}>
          <div className={styles.differentialQuote}>
            <p>A maioria das IAs <span className={styles.strike}>&quot;acha&quot;</span> que sabe o preço.</p>
            <p className={styles.highlightText}>A nossa <strong>consulta o catálogo</strong> antes de falar.</p>
          </div>
          <div className={styles.differentialPoints}>
            <div className={styles.checkItem}>
              <CheckCircle size={20} />
              <span>A IA é a interface, não a chefe</span>
            </div>
            <div className={styles.checkItem}>
              <CheckCircle size={20} />
              <span>Preço e horário vêm do banco de dados</span>
            </div>
            <div className={styles.checkItem}>
              <CheckCircle size={20} />
              <span>Risco zero de promessa errada</span>
            </div>
          </div>
        </div>
      ),
    },
    // Card 7: Analogia
    {
      id: 6,
      type: 'analogy',
      title: 'O Garçom e o Chef',
      subtitle: 'Uma analogia que explica tudo',
      icon: <ChefHat size={48} />,
      bgGradient: 'linear-gradient(135deg, #834d9b 0%, #d04ed6 100%)',
      content: (
        <div className={styles.analogyContent}>
          <div className={styles.analogyBox}>
            <div className={styles.analogyBad}>
              <span className={styles.analogyEmoji}>❌</span>
              <p><strong>Outros chatbots:</strong> Garçom que tenta cozinhar</p>
            </div>
            <div className={styles.analogyGood}>
              <span className={styles.analogyEmoji}>✅</span>
              <p><strong>Ritmo:</strong> Garçom perfeito + Chef no comando</p>
            </div>
          </div>
          <p className={styles.analogyConclusion}>
            O Garçom nunca inventa um prato que o Chef não autorizou.
          </p>
        </div>
      ),
    },
    // Card 8: Fechamento
    {
      id: 7,
      type: 'closing',
      title: 'O Que Você Ganha',
      subtitle: 'Não é só um robô...',
      icon: <Sparkles size={48} />,
      bgGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      content: (
        <div className={styles.closingContent}>
          <div className={styles.closingBenefits}>
            <div className={styles.closingBenefit}>
              <Clock size={32} />
              <span>Tempo</span>
            </div>
            <span className={styles.closingPlus}>+</span>
            <div className={styles.closingBenefit}>
              <TrendingUp size={32} />
              <span>Previsibilidade</span>
            </div>
            <span className={styles.closingPlus}>+</span>
            <div className={styles.closingBenefit}>
              <Heart size={32} />
              <span>Paz Mental</span>
            </div>
          </div>
          <p className={styles.closingText}>
            Seu negócio rodando 24/7, mesmo quando você está de folga.
          </p>
          <Link href="/register" className={styles.closingCta}>
            Começar Agora <ArrowRight size={20} />
          </Link>
        </div>
      ),
    },
  ];

  const goToNext = useCallback(() => {
    if (isAnimating || currentCard >= cards.length - 1) return;
    setIsAnimating(true);
    setDirection('next');
    setTimeout(() => {
      setCurrentCard(prev => prev + 1);
      setIsAnimating(false);
    }, 300);
  }, [isAnimating, currentCard, cards.length]);

  const goToPrev = useCallback(() => {
    if (isAnimating || currentCard <= 0) return;
    setIsAnimating(true);
    setDirection('prev');
    setTimeout(() => {
      setCurrentCard(prev => prev - 1);
      setIsAnimating(false);
    }, 300);
  }, [isAnimating, currentCard]);

  const goToCard = (index: number) => {
    if (isAnimating || index === currentCard) return;
    setIsAnimating(true);
    setDirection(index > currentCard ? 'next' : 'prev');
    setTimeout(() => {
      setCurrentCard(index);
      setIsAnimating(false);
    }, 300);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev]);

  // Touch/Swipe support
  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          goToNext();
        } else {
          goToPrev();
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [goToNext, goToPrev]);

  const card = cards[currentCard];
  const progress = ((currentCard + 1) / cards.length) * 100;

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <Link href="/" className={styles.homeButton}>
          <Home size={20} />
        </Link>
        
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className={styles.progressText}>{currentCard + 1} / {cards.length}</span>
        </div>

        <div className={styles.headerActions}>
          <button 
            onClick={toggleTheme} 
            className={styles.themeToggle}
            aria-label="Alternar tema"
          >
            {resolvedTheme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <Link href="/register" className={styles.skipButton}>
            Pular <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* Card Display */}
      <main className={styles.cardContainer}>
        {/* Seta Esquerda - Desktop */}
        <button 
          onClick={goToPrev}
          disabled={currentCard === 0}
          className={styles.sideNavButton}
          aria-label="Card anterior"
        >
          <ArrowLeft size={24} />
        </button>

        <div 
          className={`${styles.card} ${isAnimating ? (direction === 'next' ? styles.cardExitLeft : styles.cardExitRight) : styles.cardEnter}`}
          style={{ background: card.bgGradient }}
        >
          <div className={styles.cardInner}>
            <div className={styles.cardIcon}>
              {card.icon}
            </div>
            <h1 className={styles.cardTitle}>{card.title}</h1>
            {card.subtitle && (
              <p className={styles.cardSubtitle}>{card.subtitle}</p>
            )}
            <div className={styles.cardContent}>
              {card.content}
            </div>
          </div>
        </div>

        {/* Seta Direita - Desktop */}
        <button 
          onClick={goToNext}
          disabled={currentCard === cards.length - 1}
          className={styles.sideNavButton}
          aria-label="Próximo card"
        >
          <ArrowRight size={24} />
        </button>
      </main>

      {/* Navigation */}
      <footer className={styles.navigation}>
        <button 
          onClick={goToPrev}
          disabled={currentCard === 0}
          className={styles.navButton}
        >
          <ArrowLeft size={24} />
        </button>

        <div className={styles.dots}>
          {cards.map((_, index) => (
            <button
              key={index}
              onClick={() => goToCard(index)}
              className={`${styles.dot} ${index === currentCard ? styles.dotActive : ''}`}
              aria-label={`Ir para card ${index + 1}`}
            />
          ))}
        </div>

        <button 
          onClick={currentCard === cards.length - 1 ? undefined : goToNext}
          disabled={currentCard === cards.length - 1}
          className={`${styles.navButton} ${styles.navButtonPrimary}`}
        >
          <ArrowRight size={24} />
        </button>
      </footer>

      {/* Keyboard hint */}
      <div className={styles.keyboardHint}>
        Use <kbd>◀</kbd> <kbd>▶</kbd> ou deslize para navegar
      </div>
    </div>
  );
}
