import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface FoodData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

function isValidRecommendations(rec: any): rec is FoodData {
  return (
    typeof rec === 'object' &&
    typeof rec.calories === 'number' &&
    typeof rec.protein === 'number' &&
    typeof rec.carbs === 'number' &&
    typeof rec.fat === 'number'
  );
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(request: Request) {
  console.log('POST request received');
  
  try {
    if (!process.env.GOOGLE_API_KEY) {
      console.error('GOOGLE_API_KEY is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const body = await request.json();
    console.log('Request body:', body);

    const { weight, age, goal, userId } = body;
    if (!weight || !age || !goal || !userId) {
      console.error('Missing required fields');
      return NextResponse.json({ error: 'Weight, age, goal, and userId are required' }, { status: 400 });
    }

    console.log('Preparing to call Google AI');
    const prompt = `Calculate the recommended daily intake of calories, protein, fat, and carbs for a ${age}-year-old with a weight of ${weight} kg who wants to ${goal}. Provide the recommendations in JSON format. Make sure it follows the following food data format : interface FoodData {calories: number protein: number carbs: number fat: number }`;
    
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('Calling Google AI');
    const result = await model.generateContent([prompt]);
    console.log('Received response from Google AI');

    const response = await result.response;
    let text = await response.text();
    console.log('AI response text:', text);

    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch) {
      console.error('No JSON found in AI response');
      return NextResponse.json({ error: 'Unexpected response format', rawResponse: text }, { status: 500 });
    }

    const jsonString = jsonMatch[1];
    console.log('Extracted JSON string:', jsonString);

    let recommendations;
    try {
      recommendations = JSON.parse(jsonString);
      console.log('Parsed recommendations:', recommendations);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return NextResponse.json({ error: 'Failed to parse recommendations', rawResponse: text }, { status: 500 });
    }

    if (!isValidRecommendations(recommendations)) {
      console.error('Invalid recommendations format:', recommendations);
      return NextResponse.json({ error: 'Invalid recommendations format' }, { status: 400 });
    }

    console.log('Recommendations generated successfully');
    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Unhandled error in POST route:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      message: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}
