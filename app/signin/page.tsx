"use client"

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FcGoogle } from "react-icons/fc"
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import '@/app/globals.css'

export default function SignIn() {
  const { user, signInWithGoogle, signInWithEmailPassword, sendPasswordResetEmail } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  useEffect(() => {
    if (user === undefined) return;
    if (user) router.replace('/');
  }, [user, router]);

  const handleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailPassword(email, password);
      router.replace('/');
    } catch (error) {
      setError('Sign-in failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    try {
      await sendPasswordResetEmail(email);
      setResetEmailSent(true);
      setError(null);
    } catch (error) {
      setError('Failed to send password reset email. Please try again.');
    }
  };

  const FeatureCard = () => (
    <div className="max-w-md text-white space-y-8 w-full">
      <div className="bg-blue-800/30 rounded-lg p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm opacity-70">Daily Calories</span>
            <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">Active</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold">1,850</span>
            <span className="text-sm opacity-70 mb-1">kcal</span>
          </div>
          <div className="w-full bg-blue-700/30 rounded-full h-2">
            <div className="bg-green-400 h-2 rounded-full" style={{ width: '70%' }}></div>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <p className="text-xl font-medium">&ldquo;Tracking nutrition has never been easier with AI-powered food recognition.&rdquo;</p>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/10"></div>
          <div>
            <p className="font-medium">Sarah Johnson</p>
            <p className="text-sm opacity-70">Nutrition Expert</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 p-4 sm:p-8 flex items-center justify-center bg-white">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">NutriVision</h1>
            <p className="mt-2 text-sm text-gray-600">Welcome back! Please enter your details</p>
          </div>

          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2 py-4 sm:py-6 border-2"
            onClick={signInWithGoogle}
          >
            <FcGoogle className="h-5 w-5" />
            <span>Log in with Google</span>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">or</span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSignIn(); }}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-4 sm:py-6"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-4 sm:py-6"
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

            <div className="flex items-center justify-end">
              <Button 
                type="button"
                variant="link" 
                className="text-sm text-blue-600 hover:text-blue-800"
                onClick={handleForgotPassword}
              >
                Forgot password?
              </Button>
            </div>

            <Button 
              type="submit"
              className="w-full py-4 sm:py-6 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {resetEmailSent && (
            <Alert>
              <AlertDescription>Password reset email sent. Please check your inbox.</AlertDescription>
            </Alert>
          )}

          <p className="text-center text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Button 
              type="button"
              variant="link" 
              className="text-blue-600 hover:text-blue-800 font-semibold"
              onClick={() => router.push('/signup')}
            >
              Sign up
            </Button>
          </p>
        </div>
      </div>

      {/* Right Side - Feature Highlight */}
      <div className="w-full lg:w-1/2 bg-blue-900 p-4 sm:p-8 flex items-center justify-center">
        <FeatureCard />
      </div>
    </main>
  );
}
