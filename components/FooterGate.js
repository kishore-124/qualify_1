'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

/** Hides the footer inside the full-screen course player. */
export default function FooterGate() {
  const pathname = usePathname();
  if (pathname?.startsWith('/learn/')) return null;
  return <Footer />;
}
