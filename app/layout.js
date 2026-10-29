// Bootstrap + icons are @imported at the top of globals.css so the theme always loads after them
import './globals.css';

import { Providers } from '@/components/Providers';
import Navbar from '@/components/Navbar';
import FooterGate from '@/components/FooterGate';

export const metadata = {
  title: {
    default: 'Qualify — Learn a skill, earn the certificate',
    template: '%s | Qualify',
  },
  description: 'Video courses in development, design, data and business from working professionals. Finish a course, get a verifiable certificate.',
};

export const viewport = { themeColor: '#1b1f3b' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700;800;900&display=swap"
        />
      </head>
      <body>
        <Providers>
          <Navbar />
          <main>{children}</main>
          <FooterGate />
        </Providers>
      </body>
    </html>
  );
}
