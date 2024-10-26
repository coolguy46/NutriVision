"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebaseConfig';
import HeaderMenu from '@/components/HeaderMenu';
import { signInWithPopup, linkWithPopup } from 'firebase/auth';
import '@/app/globals.css';
import Layout from '@/components/layout1';

const SettingsPage: React.FC = () => {
  const { user, initialized } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [oldPassword, setOldPassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const router = useRouter();
  useEffect(() => {
    if (!initialized) return; // Wait for initialization

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
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Settings</h1>

        {user?.providerData.some(provider => provider.providerId === 'google.com') && !user?.providerData.some(provider => provider.providerId === 'password') && (
          <>
            <h2 className="text-xl mb-4">Add Email & Password Sign-In</h2>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700">Email:</label>
              <input
                type="email"
                id="email"
                value={email}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                readOnly
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-700">Password:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <button
              onClick={handleAddEmailPassword}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-600 transition"
            >
              Add Email & Password
            </button>
          </>
        )}

        {user?.providerData.some(provider => provider.providerId === 'password') && (
          <>
            <h2 className="text-xl mb-4">Change Password</h2>
            <div className="mb-4">
              <label htmlFor="oldPassword" className="block text-gray-700">Old Password:</label>
              <input
                type="password"
                id="oldPassword"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-gray-700">New Password:</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <button
              onClick={handleChangePassword}
              className="w-full bg-red-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-red-600 transition"
            >
              Change Password
            </button>
          </>
        )}

        {!(user?.providerData.some(provider => provider.providerId === 'google.com') && user?.providerData.some(provider => provider.providerId === 'password')) && (
          <div className="mt-6">
            <h2 className="text-xl mb-4">Link Google Account</h2>
            <button
              onClick={handleLinkGoogleAccount}
              className="w-full bg-green-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-green-600 transition"
            >
              Link Google Account
            </button>
          </div>
        )}

        {message && <p className="text-green-500 mt-4 text-center">{message}</p>}
        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
      </div>
    </main>
    </Layout>
  );
};

export default SettingsPage;
