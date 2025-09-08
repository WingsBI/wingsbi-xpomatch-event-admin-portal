import type { Metadata, Viewport } from 'next';
import { Inter, Roboto, Poppins, Montserrat, Open_Sans, Lato } from 'next/font/google';
import './globals.css';
import { ApiThemeProvider } from '@/context/ApiThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { RoleAccessProvider } from '@/context/RoleAccessContext';
import ReduxProvider from '@/providers/ReduxProvider';
import ThemeWrapper from '@/components/providers/ThemeWrapper';
import FavoritesCleanupProvider from '@/components/providers/FavoritesCleanupProvider';
import NotificationProvider from '@/components/providers/NotificationProvider';

// Configure all fonts
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const roboto = Roboto({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto',
  display: 'swap',
});

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

const montserrat = Montserrat({ 
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});

const openSans = Open_Sans({ 
  subsets: ['latin'],
  variable: '--font-opensans',
  display: 'swap',
});

const lato = Lato({ 
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-lato',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Event Management Portal',
  description: 'Manage your events and connect participants',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#1976d2',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
        <meta name="theme-color" content="#1976d2" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={`${inter.variable} ${roboto.variable} ${poppins.variable} ${montserrat.variable} ${openSans.variable} ${lato.variable}`}>
        <ReduxProvider>
          <AuthProvider>
            <RoleAccessProvider>
              <ThemeWrapper>
                <NotificationProvider>
                  <FavoritesCleanupProvider>
                    {children}
                  </FavoritesCleanupProvider>
                </NotificationProvider>
              </ThemeWrapper>
            </RoleAccessProvider>
          </AuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
} 