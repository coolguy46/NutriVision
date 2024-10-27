"use client"

import { AnalysisProvider } from '@/context/AnalysisContext';
import Layout from '@/components/layout1';
import { usePathname } from 'next/navigation';

// Add global styles to reset margins and padding
import '@/app/globals.css'  // Make sure this exists

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const noLayoutRoutes = ['/signin', '/signup', '/check-email', '/verify-email'];

  // Check if the current route matches any of the excluded routes
  if (noLayoutRoutes.includes(pathname)) {
    return (
      <html lang="en">
        <body className="m-0 p-0">
          {children}
        </body>
      </html>
    )
  }
  
  return (
    <html lang="en" className="h-full">
      <body className="m-0 p-0 min-h-screen overflow-x-hidden">
        <div className="flex min-h-screen">
          <Layout>
            <AnalysisProvider>
              <div className="w-full">
                {children}
              </div>
            </AnalysisProvider>
          </Layout>
        </div>
      </body>
    </html>
  );
}
