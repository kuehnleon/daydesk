import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import { AuthProvider } from "@/components/auth-provider";
import { ToastProvider } from "@/components/ui/toast";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { NotificationScheduler } from "@/components/notification-scheduler";
import { ErrorBoundary } from "@/components/error-boundary";
import { OfflineBanner } from "@/components/offline-banner";
import { LocaleSync } from "@/components/locale-sync";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#3B5BDB',
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata')
  return {
    title: t('title'),
    description: t('description'),
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: 'daydesk',
    },
    icons: {
      icon: [
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      ],
      apple: '/apple-touch-icon.png',
    },
    other: {
      'mobile-web-app-capable': 'yes',
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegister />
        <NotificationScheduler />
        <AuthProvider>
          <LocaleSync />
          <NextIntlClientProvider locale={locale} messages={messages}>
            <ToastProvider>
              <ConfirmProvider>
                <OfflineBanner />
                <ErrorBoundary>{children}</ErrorBoundary>
              </ConfirmProvider>
            </ToastProvider>
          </NextIntlClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
