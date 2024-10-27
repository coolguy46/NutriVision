"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebaseConfig';
import { signInWithPopup, linkWithPopup } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, Mail, Lock } from 'lucide-react';
import { FcGoogle } from "react-icons/fc"
import Layout from '@/components/layout1';
import '@/app/globals.css'

const SettingsPage = () => {
  const { user, initialized } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;
    if (!user) {
      router.push('/signin');
    }
  }, [user, initialized, router]);

  useEffect(() => {
    if (user?.providerData.some(provider => provider.providerId === 'google.com')) {
      setEmail(user.email || '');
    }
  }, [user]);

  const handleAddEmailPassword = async () => {
    setError('');
    setMessage('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      if (!user?.providerData.some(provider => provider.providerId === 'google.com')) {
        await updateEmail(auth.currentUser!, email);
      }
      await updatePassword(auth.currentUser!, password);
      setMessage('Email and password have been added successfully.');
    } catch (err) {
      setError('Failed to update email or password. ' + (err as Error).message);
    }
  };

  const handleLinkGoogleAccount = async () => {
    setError('');
    setMessage('');

    try {
      await linkWithPopup(auth.currentUser!, googleProvider);
      setMessage('Google account linked successfully.');
    } catch (err) {
      setError('Failed to link Google account. ' + (err as Error).message);
    }
  };

  const handleChangePassword = async () => {
    setError('');
    setMessage('');

    if (!oldPassword || !newPassword) {
      setError('Please provide both old and new passwords.');
      return;
    }

    try {
      const userCredential = EmailAuthProvider.credential(user!.email!, oldPassword);
      await reauthenticateWithCredential(auth.currentUser!, userCredential);
      await updatePassword(auth.currentUser!, newPassword);
      setMessage('Password updated successfully.');
    } catch (err) {
      setError('Failed to update password. ' + (err as Error).message);
    }
  };

  return (
    <Layout>
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center space-x-4">
            <Settings className="h-8 w-8 text-gray-700" />
            <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          </div>

          <Tabs defaultValue="authentication" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="authentication" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Authentication
              </TabsTrigger>
              <TabsTrigger value="linked-accounts" className="flex items-center gap-2">
                <FcGoogle className="h-4 w-4" />
                Linked Accounts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="authentication">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Authentication Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {user?.providerData.some(provider => provider.providerId === 'google.com') && 
                   !user?.providerData.some(provider => provider.providerId === 'password') && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Add Email & Password Sign-In</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={email}
                            readOnly
                            className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                          </label>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <button
                          onClick={handleAddEmailPassword}
                          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-150 ease-in-out flex items-center justify-center gap-2"
                        >
                          <Mail className="h-4 w-4" />
                          Add Email and Password
                        </button>
                      </div>
                    </div>
                  )}

                  {user?.providerData.some(provider => provider.providerId === 'password') && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Change Password</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Current Password
                          </label>
                          <input
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Password
                          </label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <button
                          onClick={handleChangePassword}
                          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-150 ease-in-out flex items-center justify-center gap-2"
                        >
                          <Lock className="h-4 w-4" />
                          Update Password
                        </button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="linked-accounts">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FcGoogle className="h-5 w-5" />
                    Linked Accounts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!(user?.providerData.some(provider => provider.providerId === 'google.com') && 
                     user?.providerData.some(provider => provider.providerId === 'password')) && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Link your Google account to enable additional sign in options and enhanced security.
                      </p>
                      <button
                        onClick={handleLinkGoogleAccount}
                        className="w-full bg-white text-gray-700 border border-gray-300 py-2 px-4 rounded-md hover:bg-gray-50 transition duration-150 ease-in-out flex items-center justify-center gap-2"
                      >
                        <FcGoogle className="h-4 w-4" />
                        Link Google Account
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {(message || error) && (
            <Alert variant={message ? "default" : "destructive"}>
              <AlertDescription>
                {message || error}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </main>
    </Layout>
  );
};

export default SettingsPage;
