import { AnalysisProvider } from '@/context/AnalysisContext';
import Layout from '@/components/layout1';

// Remove "use client" as this should be a server component

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
