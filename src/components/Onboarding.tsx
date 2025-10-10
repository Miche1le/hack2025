"use client";

import { useState, useEffect } from "react";

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "Добро пожаловать в NewsHub",
    description: "Ваш интеллектуальный агрегатор новостей на базе ИИ",
    icon: "✨",
    content: "Открывайте, организуйте и будьте в курсе персонализированных новостей из ваших любимых источников.",
  },
  {
    title: "Добавьте источники",
    description: "Импортируйте RSS-ленты с любых сайтов",
    icon: "📰",
    content: "Нажмите на иконку настроек, чтобы добавить RSS-ленты. Поддерживается до 15 источников новостей.",
  },
  {
    title: "Фильтруйте по ключевым словам",
    description: "Сосредоточьтесь на том, что важно для вас",
    icon: "🔍",
    content: "Используйте ключевые слова для фильтрации статей. Наш ИИ понимает контекст и показывает самые релевантные истории.",
  },
  {
    title: "Сохраняйте избранное",
    description: "Создайте свою личную коллекцию",
    icon: "⭐",
    content: "Нажмите на иконку сердца, чтобы сохранить статьи. Наш ИИ учится на ваших выборах и рекомендует похожий контент.",
  },
  {
    title: "Рекомендации на базе ИИ",
    description: "Автоматически находите релевантные истории",
    icon: "🤖",
    content: "Когда вы сохраняете статьи, наш ИИ анализирует ваши предпочтения и предлагает похожие истории, которые вам понравятся.",
  },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsVisible(false);
      setTimeout(onComplete, 300);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(onComplete, 300);
  };

  if (!isVisible) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
      style={{ animation: "fadeIn 0.3s ease-out" }}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl p-8 shadow-2xl"
        style={{
          background: "var(--card-bg)",
          animation: "slideUp 0.4s ease-out",
        }}
      >
        {/* Progress Bar */}
        <div className="mb-8 h-1 w-full overflow-hidden rounded-full" style={{ background: "var(--surface)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: "var(--accent)",
            }}
          />
        </div>

        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-2xl text-4xl transition-all duration-300 hover:scale-110"
            style={{
              background: "var(--surface)",
              border: "2px solid var(--border)",
              boxShadow: "0 4px 24px rgba(0, 0, 0, 0.1)",
            }}
          >
            {step.icon}
          </div>
        </div>

        {/* Content */}
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {step.title}
          </h2>
          <p className="mb-4 text-sm font-medium" style={{ color: "var(--accent)" }}>
            {step.description}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {step.content}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handleSkip}
            className="rounded-xl px-6 py-3 text-sm font-semibold transition hover:opacity-60"
            style={{ color: "var(--text-secondary)" }}
          >
            Пропустить
          </button>

          <div className="flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className="h-2 w-2 rounded-full transition-all"
                style={{
                  background: index === currentStep ? "var(--accent)" : "var(--surface)",
                  width: index === currentStep ? "24px" : "8px",
                }}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl"
            style={{
              background: "var(--accent)",
              color: "white",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
            }}
          >
            {currentStep === steps.length - 1 ? "Начать" : "Далее"}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

