"use client";
import { useReducer, useEffect, useCallback } from 'react';
import { auth, db, googleProvider } from '@/lib/firebaseConfig';
import { signInWithPopup, signOut, onAuthStateChanged, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, applyActionCode, UserCredential, sendPasswordResetEmail as firebaseSendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, addDoc } from 'firebase/firestore';
import { setPersistence, browserLocalPersistence } from 'firebase/auth';

interface State {
  user: User | null;
  email: string | null;  // Add email attribute
  total: {
    calories: number;
    fat: number;
    carbs: number;
    protein: number;
  };
  initialized: boolean;
  error: string | null;
}


interface Action {
  type: 'SET_USER' | 'SET_EMAIL' | 'SET_TOTAL' | 'SET_INITIALIZED' | 'SET_ERROR';
  user?: User | null;
  email?: string | null;  // Add email attribute
  total?: {
    calories: number;
    fat: number;
    carbs: number;
    protein: number;
  };
  initialized?: boolean;
  error?: string;
}


const initialState: State = {
  user: null,
  email : null,
  total: {
    calories: 0,
    fat: 0,
    carbs: 0,
    protein: 0,
  },
  initialized: false,
  error: null,
};

const authReducer = (state: State, action: Action): State => {
  console.log('Reducer called with action:', action);
  switch (action.type) {
    case 'SET_USER':
      console.log('Updating user state to:', action.user);
      return { ...state, user: action.user ?? null };
    case 'SET_EMAIL':
      console.log('Updating email state to:', action.email);
      return { ...state, email: action.email ?? null };
    case 'SET_TOTAL':
      return { ...state, total: action.total ?? state.total };
    case 'SET_INITIALIZED':
      return { ...state, initialized: action.initialized ?? state.initialized };
    case 'SET_ERROR':
      return { ...state, error: action.error ?? null };
    default:
      return state;
  }
};


export function useAuth() {
  const [state, dispatch] = useReducer(authReducer, initialState);
  setPersistence(auth, browserLocalPersistence);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Check if email is verified
        if (!currentUser.emailVerified) {
          // Sign out user if email is not verified
          await signOut(auth);
          dispatch({ type: 'SET_USER', user: null });
          dispatch({ type: 'SET_EMAIL', email: null }); // Clear email
          dispatch({ type: 'SET_TOTAL', total: initialState.total });
          return;
        }
  
        dispatch({ type: 'SET_USER', user: currentUser });
        dispatch({ type: 'SET_EMAIL', email: currentUser.email || '' });
  
        const userDoc = doc(db, 'users', currentUser.uid);
  
        try {
          const docSnapshot = await getDoc(userDoc);
          if (docSnapshot.exists()) {
            const userData = docSnapshot.data();
            if (userData && userData.total) {
              dispatch({ type: 'SET_TOTAL', total: userData.total });
            }
          } else {
            console.log('No user data found, setting initial total');
            dispatch({ type: 'SET_TOTAL', total: initialState.total });
          }
        } catch (error) {
          console.error('Error fetching total from Firestore:', error);
          dispatch({ type: 'SET_ERROR', error: 'Failed to fetch user data' });
        }
      } else {
        dispatch({ type: 'SET_USER', user: null });
        dispatch({ type: 'SET_EMAIL', email: null }); // Clear email
        dispatch({ type: 'SET_TOTAL', total: initialState.total });
      }
  
      dispatch({ type: 'SET_INITIALIZED', initialized: true });
    });
  
    return () => unsubscribe();
  }, []);

  const signInWithEmailPassword = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      dispatch({ type: 'SET_EMAIL', email: email || '' });
      const user = userCredential.user;
  
      // Check if the email is verified
      if (!user.emailVerified) {
        throw new Error('Email not verified. Please check your inbox for a verification link.');
      }
  
      console.log('Sign-in successful.');
      return user;
    } catch (error) {
      console.error('Error during sign-in:', error);
      throw error;
    }
  };
  

  const signUpWithEmailPassword = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Send email verification
      await sendEmailVerification(user);
  
      console.log('Sign-up successful. Verification email sent.');
      // Don't automatically log in the user
    } catch (error) {
      console.error('Error during sign-up:', error);
      throw error;
    }
  };

  const verifyEmail = async (oobCode: string) => {
    try {
      await applyActionCode(auth, oobCode);
      const user = auth.currentUser;
      if (user) {
        await user.reload();
        dispatch({ type: 'SET_USER', user: { ...user, emailVerified: true } as User });
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      dispatch({ type: 'SET_USER', user: user });
      dispatch({ type: 'SET_EMAIL', email: user.email || '' });
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      dispatch({ type: 'SET_USER', user: null });
      dispatch({ type: 'SET_TOTAL', total: initialState.total }); // Reset totals on sign-out
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  const sendPasswordResetEmail = async (email: string) => {
    try {
      await firebaseSendPasswordResetEmail(auth, email);
      console.log('Password reset email sent successfully');
    } catch (error) {
      console.error('Error sending password reset email:', error);
      console.log(error)
      throw error;
    }
  };



  const saveTotalToFirestore = useCallback(async (total: {
    calories: number;
    fat: number;
    carbs: number;
    protein: number;
  }) => {
    if (state.user && state.initialized) {  // Add this check
      const userDoc = doc(db, 'users', state.user.uid);
      const now = new Date();

      const totalData = {
        total: {
          calories: total.calories,
          fat: total.fat,
          carbs: total.carbs,
          protein: total.protein,
        },
        lastUpdated: now.toISOString(),
      };

      try {
        await setDoc(userDoc, totalData, { merge: true });
        console.log('Total updated in Firestore:', totalData);
      } catch (error) {
        console.error('Error saving total to Firestore:', error);
      }
    } else {
      console.log('User is not authenticated or state is not initialized');
    }
  }, [state.user, state.initialized]);  // Ensure that the dependency includes state.initialized

  return { 
    user: state.user, 
    total: state.total, 
    email : state.email,
    sendPasswordResetEmail,
    setTotal: (newTotal: { calories: number; fat: number; carbs: number; protein: number }) => dispatch({ type: 'SET_TOTAL', total: newTotal }),
    signInWithEmailPassword, 
    signUpWithEmailPassword, 
    verifyEmail, 
    signInWithGoogle, 
    signOutUser, 
    saveTotalToFirestore, 
    initialized: state.initialized,
    error: state.error,
  };
}
