import { NextResponse } from 'next/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

interface RecommendationsRequest {
  userId: string;
  recommendations: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
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
    const body: RecommendationsRequest = await request.json();
    const { userId, recommendations } = body;
    console.log('Request userId:', userId);

    if (userId !== uid) {
      return NextResponse.json(
        { error: 'User ID does not match authenticated user' },
        { status: 403 }
      );
    }

    if (!recommendations || typeof recommendations !== 'object') {
      return NextResponse.json(
        { error: 'Recommendations object is required' },
        { status: 400 }
      );
    }

    const { calories, protein, carbs, fat } = recommendations;
    if (
      typeof calories !== 'number' ||
      typeof protein !== 'number' ||
      typeof carbs !== 'number' ||
      typeof fat !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Invalid recommendations format. All fields must be numbers.' },
        { status: 400 }
      );
    }

    // Define the path to save the recommendations
    const docRef = db.collection('users').doc(userId).collection('recommendations').doc('daily');
    
    // Save recommendations to Firestore
    await docRef.set({
      ...recommendations,
      updatedAt: FieldValue.serverTimestamp()
    });

    // Return a success response
    return NextResponse.json({ message: 'Recommendations saved successfully' });
  } catch (error) {
    // Log and return an error response
    console.error('Error saving recommendations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to save recommendations', message: errorMessage },
      { status: 500 }
    );
  }
}