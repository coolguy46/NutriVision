"use client";
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { useEffect, useState, Suspense } from 'react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyEmail } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verify = async () => {
      const oobCode = searchParams.get('oobCode');
      if (!oobCode) {
        setError('Invalid verification code');
        setLoading(false);
        return;
      }

      try {
        await verifyEmail(oobCode);
        router.replace('/signin');
      } catch (error) {
        setError('Email verification failed. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [searchParams, router, verifyEmail]);

  return (
    <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden p-8 text-center">
      <h1 className="text-3xl font-bold mb-6">Verifying Email...</h1>
      {loading && <p className="text-lg">Please wait while we verify your email.</p>}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-500 to-indigo-700 flex items-center justify-center p-8">
      <Suspense fallback={<p className="text-lg">Loading...</p>}>
        <VerifyEmailContent />
      </Suspense>
    </main>
  );
}
