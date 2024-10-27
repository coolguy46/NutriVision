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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ChevronRight, Loader2, Utensils } from "lucide-react";
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4 dark:text-white">Weekly Meal Planner</h1>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Personalized meal plans tailored to your nutritional goals and preferences
              </p>
            </div>

            {/* Goals Summary */}
            {goals && (
              <Card className="border-none shadow-lg bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-2xl font-semibold dark:text-white">
                    Daily Nutritional Goals
                  </CardTitle>
                  <CardDescription>Track your progress towards these targets</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-6">
                    {[
                      { label: 'Calories', value: `${goals.calories} kcal`, color: 'bg-blue-100 dark:bg-blue-900' },
                      { label: 'Protein', value: `${goals.protein}g`, color: 'bg-green-100 dark:bg-green-900' },
                      { label: 'Carbs', value: `${goals.carbs}g`, color: 'bg-purple-100 dark:bg-purple-900' },
                      { label: 'Fat', value: `${goals.fat}g`, color: 'bg-orange-100 dark:bg-orange-900' }
                    ].map((item, index) => (
                      <div key={index} className={`${item.color} rounded-xl p-6 text-center transition-transform hover:scale-105`}>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{item.label}</p>
                        <p className="text-2xl font-bold mt-2 dark:text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generator Controls */}
            <Card className="border-none shadow-lg bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold flex items-center gap-2 dark:text-white">
                  <Utensils className="h-6 w-6" />
                  Meal Plan Generator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Cooking Time Preference
                    </label>
                    <Select onValueChange={(value) => setCookingTime(value)} defaultValue={cookingTime}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select cooking time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30 minutes">30 minutes</SelectItem>
                        <SelectItem value="1 hour">1 hour</SelectItem>
                        <SelectItem value="2 hours">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Dietary Restrictions
                    </label>
                    <Input
                      value={dietaryRestrictions}
                      onChange={(e) => setDietaryRestrictions(e.target.value)}
                      placeholder="e.g., vegetarian, gluten-free"
                      className="w-full"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleGenerateClick}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-6"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating Your Personalized Meal Plan
                    </>
                  ) : (
                    <>
                      Generate Weekly Meal Plan
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/20">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="ml-2">{error}</AlertDescription>
              </Alert>
            )}

            {/* Meal Plans */}
            {mealPlans && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold dark:text-white">Your Weekly Meal Plan</h2>
                <Accordion type="single" collapsible className="space-y-4">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    mealPlans[day] && (
                      <AccordionItem
                        value={day}
                        key={day}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                      >
                        <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <span className="text-blue-600 dark:text-blue-300 font-semibold">
                                {day.charAt(0)}
                              </span>
                            </div>
                            <span className="text-lg font-semibold dark:text-white">{day}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 py-4">
                          <div className="grid gap-6">
                            {Object.entries(mealPlans[day]).map(([mealType, meal], index) => (
                              <Card key={index} className="border-none shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-lg font-semibold dark:text-white">
                                    {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="text-xl font-medium dark:text-white">{meal.name}</h4>
                                      <p className="text-gray-600 dark:text-gray-300">{meal.amount}</p>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4">
                                      {[
                                        { label: 'Calories', value: `${meal.calories} kcal` },
                                        { label: 'Protein', value: `${meal.macronutrients.protein}g` },
                                        { label: 'Carbs', value: `${meal.macronutrients.carbs}g` },
                                        { label: 'Fat', value: `${meal.macronutrients.fat}g` }
                                      ].map((item, i) => (
                                        <div key={i} className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                          <p className="text-xs text-gray-600 dark:text-gray-400">{item.label}</p>
                                          <p className="text-sm font-semibold dark:text-white">{item.value}</p>
                                        </div>
                                      ))}
                                    </div>
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
              </div>
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
