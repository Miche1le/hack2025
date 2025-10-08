import "./globals.css";
import type { Metadata } from "next";
import type { PropsWithChildren } from "react";

export const metadata: Metadata = {
  title: "Hack2025 News Aggregator",
  description: "Personal news summaries aggregated from your favourite RSS sources.",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors">
        {children}
      </body>
    </html>
  );
}
