import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

interface MealPlan {
  day: string;
  meals: {
    breakfast: {
      name: string;
      calories: number;
      amount: string;
      macronutrients: {
        protein: number;
        carbs: number;
        fat: number;
      };
    };
    lunch: {
      name: string;
      calories: number;
      amount: string;
      macronutrients: {
        protein: number;
        carbs: number;
        fat: number;
      };
    };
    dinner: {
      name: string;
      calories: number;
      amount: string;
      macronutrients: {
        protein: number;
        carbs: number;
        fat: number;
      };
    };
  };
}

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();
const auth = getAuth();

export async function POST(request: Request) {
  try {
    // Extract the ID token from the Authorization header
    const authorizationHeader = request.headers.get('Authorization');
    if (!authorizationHeader) {
      return NextResponse.json(
        { error: 'Authorization token is required' },
        { status: 401 }
      );
    }

    const idToken = authorizationHeader.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json(
        { error: 'Invalid Authorization header format' },
        { status: 401 }
      );
    }

    // Verify the ID token and get the user info
    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid } = decodedToken;
    console.log('Authenticated UID:', uid);

    // Parse and validate the request body
    const mealPlans: MealPlan[] = await request.json();

    if (!Array.isArray(mealPlans)) {
      return NextResponse.json(
        { error: 'Meal plans should be an array of objects' },
        { status: 400 }
      );
    }

    const mealPlansObject = mealPlans.reduce((acc, plan) => {
      acc[plan.day] = plan.meals;
      return acc;
    }, {} as Record<string, any>);


    // Define the path to save the meal plans
    const mealPlansRef = db.collection('users').doc(uid).collection('mealPlans').doc('weekly');

    // Save meal plans to Firestore
    await mealPlansRef.set({
      mealPlans : mealPlansObject,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Return a success response
    return NextResponse.json({ message: 'Meal plans saved successfully', mealPlansObject });
  } catch (error) {
    // Log and return an error response
    console.error('Error saving meal plans:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to save meal plans', message: errorMessage },
      { status: 500 }
    );
  }
}
