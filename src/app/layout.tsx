import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KV CompLens",
  description: "Deterministic comparable property valuation agent for Alberta residential underwriting."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
