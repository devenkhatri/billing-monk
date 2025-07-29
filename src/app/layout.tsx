import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { NotificationProvider } from "@/lib/notification-context";
import { KeyboardShortcutsProvider } from "@/components/layout/keyboard-shortcuts-provider";
import { ThemeProvider } from "@/lib/theme-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Billing Monk",
  description: "A comprehensive invoice management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <ErrorBoundary>
          <ThemeProvider>
            <NotificationProvider>
              <KeyboardShortcutsProvider>
                {children}
              </KeyboardShortcutsProvider>
            </NotificationProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
