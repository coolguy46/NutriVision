"use client"
import { AnalysisProvider } from '@/context/AnalysisContext'; // Adjust the path as necessary

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AnalysisProvider>
          {children}
        </AnalysisProvider>
      </body>
    </html>
  );
}