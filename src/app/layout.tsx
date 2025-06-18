import type { Metadata } from 'next';
import { Inter, Roboto, Poppins, Montserrat, Open_Sans, Lato } from 'next/font/google';
import './globals.css';
import { SimpleThemeProvider } from '@/context/SimpleThemeContext';
import { AuthProvider } from '@/context/AuthContext';

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
      </head>
      <body className={`${inter.variable} ${roboto.variable} ${poppins.variable} ${montserrat.variable} ${openSans.variable} ${lato.variable}`}>
        <AuthProvider>
          <SimpleThemeProvider>
            {children}
          </SimpleThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
} 