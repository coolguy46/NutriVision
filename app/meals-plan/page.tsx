"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { db } from '@/lib/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import HeaderMenu from '@/components/HeaderMenu';
import '@/app/globals.css';
import { useDarkMode, DarkModeProvider } from '@/components/DarkModeContext';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import Darkmodebutton from "@/components/darkmodebutton"
import Layout from '@/components/layout1';

interface GOALS {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Macronutrients {
  protein: number;
  carbs: number;
  fat: number;
}

interface Meal {
  name: string;
  calories: number;
  amount: string;
  macronutrients: Macronutrients;
}

interface DayMealPlan {
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
}

const MealPlansPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [goals, setGoals] = useState<GOALS | null>(null);
  const [cookingTime, setCookingTime] = useState<string>('30 minutes');
  const [mealPlans, setMealPlans] = useState<{ [day: string]: DayMealPlan } | null>(null);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string>('');
  const { isDarkMode } = useDarkMode();
  

  useEffect(() => {
    const fetchGoalsAndMealPlans = async () => {
      if (user) {
        try {
          // Fetch user goals
          const userDocRef = doc(db, 'users', user.uid, 'recommendations', 'daily');
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const goals = userDoc.data() as GOALS;
            setGoals(goals);
            console.log('User goals:', goals);
          }

          // Fetch meal plans
          const mealPlansDocRef = doc(db, 'users', user.uid, 'mealPlans', 'weekly');
          const mealPlansDoc = await getDoc(mealPlansDocRef);
          if (mealPlansDoc.exists()) {
            const mealPlansData = mealPlansDoc.data().mealPlans as { [day: string]: DayMealPlan };
            setMealPlans(mealPlansData);
            console.log('Loaded meal plans from Firestore:', mealPlansData);
          }
        } catch (error: unknown) {
          console.error('Error fetching goals or meal plans:', error);
          setError('Failed to fetch data.');
        }
      }
    };

    fetchGoalsAndMealPlans();
  }, [user]);

  // Function to save meal plans to Firestore
  const saveMealPlansToFirestore = async (mealPlansData: { [day: string]: DayMealPlan }) => {
    if (user) {
      try {
        const mealPlansDocRef = doc(db, 'users', user.uid, 'mealPlans', 'weekly');
        await setDoc(mealPlansDocRef, {
          mealPlans: mealPlansData,
          createdAt: new Date(),
        });
        console.log('Meal plans saved to Firestore');
      } catch (error: unknown) {
        console.error('Error saving meal plans to Firestore:', error);
      }
    }
  };

  // Ensure meal plans are saved before navigating away from the page
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (mealPlans) {
        await saveMealPlansToFirestore(mealPlans);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload); // Handle page reload

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload(); // Save data when component unmounts (e.g., navigating away)
    };
  }, [mealPlans]);

  const fetchMealPlans = async () => {
    if (goals) {
      try {
        setLoading(true);
        console.log('Fetching meal plans with:', { goals, cookingTime, dietaryRestrictions });

        const response = await axios.post('/api/get-meal-plans', {
          goals,
          cookingTime,
          dietaryRestrictions,
        });

        console.log('Meal plans response:', response.data);

        // Ensure response.data is an array
        const mealPlansArray = Array.isArray(response.data) ? response.data : [response.data];

        const mealPlansData: { [day: string]: DayMealPlan } = {};

        mealPlansArray.forEach((dayPlan, index) => {
          if (dayPlan.day && dayPlan.meals) {
            mealPlansData[dayPlan.day] = dayPlan.meals;
          } else {
            console.error(`Invalid dayPlan format at index ${index}:`, dayPlan);
          }
        });

        if (Object.keys(mealPlansData).length > 0) {
          setMealPlans(mealPlansData);
          await saveMealPlansToFirestore(mealPlansData); // Save meal plans immediately after generating
        } else {
          console.error('No valid meal plans found in the response');
          setError('No valid meal plans found in the API response.');
        }
      } catch (error: unknown) {
        console.error('Error fetching meal plans:', error);
        setError('Failed to fetch meal plans.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGenerateClick = () => {
    fetchMealPlans();
  };

  const toggleDay = (day: string) => {
    setExpandedDay(expandedDay === day ? null : day);
  };
  const { initialized } = useAuth();
  if (!initialized) {
    return <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : ''}`}>Loading...</div>;
  }

  return (
    <Layout>
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-b from-blue-100 to-white'}`}>
      
    <main className="min-h-screen bg-white p-4 dark:bg-gray-800">
      <div className="max-w-4xl mx-auto mt-16">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Meal Plans Generator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label htmlFor="cookingTime" className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">Cooking Time:</label>
                <Select onValueChange={(value) => setCookingTime(value)} defaultValue={cookingTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cooking time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30 minutes">30 minutes</SelectItem>
                    <SelectItem value="1 hour">1 hour</SelectItem>
                    <SelectItem value="2 hours">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="dietaryRestrictions" className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">Dietary Restrictions:</label>
                <Input
                  id="dietaryRestrictions"
                  value={dietaryRestrictions}
                  onChange={(e) => setDietaryRestrictions(e.target.value)}
                  placeholder="Enter any dietary restrictions"
                />
              </div>

              <Button
                onClick={handleGenerateClick}
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Meal Plans
                  </>
                ) : (
                  'Generate Meal Plans'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {goals && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-semibold dark:text-white">Your Current Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium dark:text-white">Calories:</p>
                  <p>{goals.calories} kcal</p>
                </div>
                <div>
                  <p className="font-medium dark:text-white">Protein:</p>
                  <p>{goals.protein} g</p>
                </div>
                <div>
                  <p className="font-medium dark:text-white">Carbs:</p>
                  <p>{goals.carbs} g</p>
                </div>
                <div>
                  <p className="font-medium dark:text-white">Fat:</p>
                  <p>{goals.fat} g</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {mealPlans && (
          <Accordion type="single" collapsible className="space-y-4">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
              mealPlans[day] && (
                <AccordionItem value={day} key={day}>
                  <AccordionTrigger className="text-lg font-semibold dark:text-white">{day}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {Object.entries(mealPlans[day]).map(([mealType, meal], index) => (
                        <Card key={index}>
                          <CardHeader>
                            <CardTitle className="text-md font-semibold dark:text-white">{mealType.charAt(0).toUpperCase() + mealType.slice(1)}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="font-medium dark:text-white">{meal.name}</p>
                            <p>Calories: {meal.calories} kcal</p>
                            <p>Amount: {meal.amount}</p>
                            <div className="mt-2">
                              <p className="font-medium dark:text-white">Macronutrients:</p>
                              <p>Protein: {meal.macronutrients.protein}g</p>
                              <p>Carbs: {meal.macronutrients.carbs}g</p>
                              <p>Fat: {meal.macronutrients.fat}g</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            ))}
          </Accordion>
        )}
      </div>
    </main>
    </div>
    </Layout>
  );
};

const MealPlansPage1: React.FC = () => {
  return (
    <DarkModeProvider>
      <MealPlansPage />
    </DarkModeProvider>
  )
}


export default MealPlansPage1;
