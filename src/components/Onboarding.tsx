"use client";

import { useState, useEffect } from "react";

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "Welcome to NewsHub",
    description: "Your intelligent news aggregator powered by AI",
    icon: "✨",
    content: "Discover, organize, and stay informed with personalized news from your favorite sources.",
  },
  {
    title: "Add Your Sources",
    description: "Import RSS feeds from any website",
    icon: "📰",
    content: "Click the Settings icon to add RSS feeds. We support up to 15 feeds from any news source.",
  },
  {
    title: "Filter with Keywords",
    description: "Focus on what matters to you",
    icon: "🔍",
    content: "Use keywords to filter articles. Our AI understands context and shows the most relevant stories.",
  },
  {
    title: "Star Your Favorites",
    description: "Build your personal collection",
    icon: "⭐",
    content: "Click the heart icon to save articles. Our AI learns from your choices to recommend similar content.",
  },
  {
    title: "AI-Powered Recommendations",
    description: "Discover relevant stories automatically",
    icon: "🤖",
    content: "As you star articles, our AI analyzes your preferences and suggests similar stories you'll love.",
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
              background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
            }}
          />
        </div>

        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full text-4xl"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              boxShadow: "0 10px 40px rgba(102, 126, 234, 0.3)",
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
            Skip
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
            className="rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            {currentStep === steps.length - 1 ? "Get Started" : "Next"}
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

