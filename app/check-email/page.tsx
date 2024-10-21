// app/check-email/page.tsx (or app/check-email.tsx if using a different setup)

"use client";
import { useRouter } from 'next/navigation';
import '@/app/globals.css';

export default function CheckEmail() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-500 to-indigo-700 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden p-8 text-center">
        <h1 className="text-3xl font-bold mb-6">Check Your Email</h1>
        <p className="text-lg mb-6">
          A verification email has been sent to your email address. Please check your inbox and follow the instructions to verify your email.
        </p>
        <button
          onClick={() => router.push('/signin')}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-600 transition"
        >
          Go to Sign In
        </button>
      </div>
    </main>
  );
}
