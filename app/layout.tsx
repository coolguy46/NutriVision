"use client"
import { AnalysisProvider } from '@/context/AnalysisContext';
import Layout from '@/components/layout1';
import { usePathname } from 'next/navigation';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const noLayoutRoutes = ['/signin', '/signup', '/check-email', '/verify-email'];

  if (noLayoutRoutes.includes(pathname)) {
    return (
      <html lang="en">
        <body>
          {children}
        </body>
      </html>
    )
  }
  
  return (
    <html lang="en">
      <body>
        <Layout>
          <AnalysisProvider>
            {children}
          </AnalysisProvider>
        </Layout>
      </body>
    </html>
  );
}
