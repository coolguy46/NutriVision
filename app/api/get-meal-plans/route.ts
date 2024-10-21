import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { goals, cookingTime, dietaryRestrictions } = await request.json();
    console.log('Received data in API:', { goals, cookingTime, dietaryRestrictions });

    if (!goals || !cookingTime) {
      return NextResponse.json({ error: 'Goals and cooking time are required' }, { status: 400 });
    }

    // Format the goals object into a readable string
    const goalsString = `Calories: ${goals.calories} kcal, Protein: ${goals.protein} g, Carbs: ${goals.carbs} g, Fat: ${goals.fat} g`;
    console.log('GoalsString' ,goalsString)

    const prompt = `Generate a meal plan for a week based on the following goals and cooking time:
    Daily Goal: ${goalsString}
    Cooking Time: ${cookingTime}
    Dietary Restrictions: ${dietaryRestrictions}
    Provide a week's worth of meals, including breakfast, lunch, and dinner for each day. Make sure each day has a total within a reasonable amount close to the daily goal. Format the response as JSON with the following structure:
    interface MealPlan {
      day: string;
      meals: {
        breakfast: { name: string, calories: number, amount: string, macronutrients: { protein: number, carbs: number, fat: number } },
        lunch: { name: string, calories: number, amount: string, macronutrients: { protein: number, carbs: number, fat: number } },
        dinner: { name: string, calories: number, amount: string, macronutrients: { protein: number, carbs: number, fat: number } }
      }
    }
    Make sure the response is only in JSON format, without any description of the meal plan.`;
    
    console.log('Generated prompt:', prompt);

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent([prompt]);
    const response = await result.response;
    let text = await response.text();

    console.log('Raw Gemini response:', text);

    text = text.replace(/```json\n?/, '').replace(/\n?```/, '');

    let mealPlans;
    try {
      mealPlans = JSON.parse(text);
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return NextResponse.json({ error: 'Failed to parse meal plans', rawResponse: text }, { status: 500 });
    }

    return NextResponse.json(mealPlans);
  } catch (error: unknown) {
    console.error('Error fetching meal plans:', error);
    let errorMessage = 'Failed to fetch meal plans';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
