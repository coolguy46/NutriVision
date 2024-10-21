"use client"

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FcGoogle } from "react-icons/fc"
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import '@/app/globals.css'

export default function SignIn() {
  const { user, signInWithGoogle, signInWithEmailPassword, sendPasswordResetEmail } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [resetEmailSent, setResetEmailSent] = useState<boolean>(false);

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">NutriVision</CardTitle>
          <CardDescription className="text-center">Sign in to access your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <Button 
            className="w-full" 
            onClick={handleSignIn}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
          <div className="text-sm text-center">
            <Button 
              variant="link" 
              className="p-0 h-auto font-normal" 
              onClick={handleForgotPassword}
            >
              Forgot your password?
            </Button>
          </div>
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
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={signInWithGoogle}>
            <FcGoogle className="mr-2 h-4 w-4" /> Google
          </Button>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-center w-full">
            Dont have an account?{' '}
            <Button 
              variant="link" 
              className="p-0 h-auto font-normal" 
              onClick={() => router.push('/signup')}
            >
              Sign Up
            </Button>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}