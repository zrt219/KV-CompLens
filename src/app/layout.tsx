import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PracticeModeProvider } from "../../hooks/usePracticeMode";
import { PracticeCoachOverlay } from "../components/practice/PracticeCoachOverlay";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"]
});

export const metadata: Metadata = {
  title: "KV CompLens | AI Comparable Property Valuation",
  description:
    "Deterministic 5-step comparable-property review workflow with source scan, comparable review, adjustments, export, and verified Review Intelligence V2 artifacts.",
  keywords: ["property valuation", "comparable analysis", "real estate", "comp review", "KV Capital"],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg"
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="dark" />
      </head>
      <body>
        <PracticeModeProvider>
          {children}
          <PracticeCoachOverlay />
        </PracticeModeProvider>
      </body>
    </html>
  );
}
