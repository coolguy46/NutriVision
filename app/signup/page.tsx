"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FcGoogle } from "react-icons/fc"
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function SignUp() {
  const { signUpWithEmailPassword, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleSignUp = async () => {
    setError(null);
    setLoading(true);
    try {
      await signUpWithEmailPassword(email, password);
      router.push('/check-email');
    } catch (error) {
      setError('Sign-up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex">
      {/* Left Side - Sign Up Form */}
      <div className="w-1/2 p-8 flex items-center justify-center bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">NutriVision</h1>
            <p className="mt-2 text-sm text-gray-600">Create an account to get started</p>
          </div>

          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2 py-6 border-2"
            onClick={signInWithGoogle}
          >
            <FcGoogle className="h-5 w-5" />
            <span>Sign up with Google</span>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">or</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-6"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-6"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button 
              className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSignUp}
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Button 
                variant="link" 
                className="text-blue-600 hover:text-blue-800 font-semibold"
                onClick={() => router.push('/signin')}
              >
                Sign in
              </Button>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Feature Highlight */}
      <div className="w-1/2 bg-blue-900 p-8 flex items-center justify-center">
        <div className="max-w-md text-white space-y-8">
          <div className="bg-blue-800/30 rounded-lg p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-70">Features</span>
                <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">AI Powered</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">✓</div>
                  <span>Instant food recognition</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">✓</div>
                  <span>Detailed nutritional insights</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">✓</div>
                  <span>Personalized meal planning</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-xl font-medium">Join thousands of users who have transformed their nutrition journey with NutriVision.</p>
            <div className="flex items-center gap-3">
              
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
