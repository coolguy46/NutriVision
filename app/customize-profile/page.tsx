"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { storage } from '@/lib/firebaseConfig'; // Import storage correctly
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig'; // Ensure correct import for Firestore
import HeaderMenu from '@/components/HeaderMenu';
import { useRouter } from 'next/navigation';
import '@/app/globals.css';
import { DarkModeProvider, useDarkMode } from '@/components/DarkModeContext';

const CustomizeProfile: React.FC = () => {
  const { user, initialized } = useAuth();
  const [bio, setBio] = useState<string>('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [currentProfilePicture, setCurrentProfilePicture] = useState<string | null>(null);
  const router = useRouter();
  const { isDarkMode, toggleDarkMode } = useDarkMode();


  useEffect(() => {
    if (!initialized) return; // Wait for initialization

    if (!user) {
      router.push('/signin');
    }
    }, [user, initialized, router]);

  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            setBio(data.bio || '');
            setCurrentProfilePicture(data.profilePicture || null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      };

      fetchUserData();
    }
  }, [user]);


  if (!initialized) {
    return <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : ''}`}>Loading...</div>;
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setProfilePicture(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!profilePicture || !user) return;

    setUploading(true);

    const storageRef = ref(storage, `profile_pictures/${user.uid}/${profilePicture.name}`);
    const uploadTask = uploadBytesResumable(storageRef, profilePicture);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error('Upload failed:', error);
        setUploading(false);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          // Save the URL and bio to Firestore
          const userDocRef = doc(db, 'users', user.uid);
          await updateDoc(userDocRef, { profilePicture: downloadURL, bio });
          setUploading(false);
          alert('Profile updated successfully');
          setCurrentProfilePicture(downloadURL); // Update the current profile picture URL
        } catch (error) {
          console.error('Failed to get download URL:', error);
          setUploading(false);
        }
      }
    );
  };

  return (
    <main className="min-h-screen bg-gray-100 p-8">
        <HeaderMenu />
      <h1 className="text-3xl font-bold mb-4">Customize Your Profile</h1>
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
        <div className="mb-4">
          <label className="block text-gray-700">Profile Picture:</label>
          {currentProfilePicture && (
            <img
              src={currentProfilePicture}
              alt="Current Profile"
              className="w-32 h-32 object-cover rounded-full mb-2"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="mt-2"
          />
          {uploading && <p className="text-blue-500">Upload Progress: {uploadProgress.toFixed(2)}%</p>}
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Bio:</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <button
          onClick={handleUpload}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg"
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Update Profile'}
        </button>
      </div>
    </main>
  );
};

const Goalspage: React.FC = () => {
  return (
    <DarkModeProvider>
      <CustomizeProfile />
    </DarkModeProvider>
  )
}

export default Goalspage;
