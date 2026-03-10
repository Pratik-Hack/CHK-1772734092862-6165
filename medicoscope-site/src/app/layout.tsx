import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/shared/ThemeProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MedicoScope - AI-Powered Healthcare Platform",
  description:
    "Advanced AI-powered medical diagnostics, vitals monitoring, mental health support, and more.",
  keywords: [
    "healthcare",
    "AI diagnostics",
    "medical",
    "vitals monitoring",
    "mental health",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "var(--surface)",
                color: "var(--foreground)",
                border: "1px solid rgba(255,107,53,0.2)",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
