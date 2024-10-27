"use client"

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useDarkMode, DarkModeProvider } from '@/components/DarkModeContext';
import HeaderMenu from '@/components/HeaderMenu';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import '@/app/globals.css';
import Darkmodebutton from "@/components/darkmodebutton"
import Layout from '@/components/layout1';
import { Activity, BarChart, Scale, Target } from 'lucide-react';

interface Recommendations {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const Goalscontent: React.FC = () => {
  const [weight, setWeight] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [goal, setGoal] = useState<string>('maintain weight');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const { user, initialized } = useAuth();
  const router = useRouter();
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    if (!initialized) return;
    if (!user) {
      router.push('/signin');
    } else {
      fetchRecommendations();
    }
  }, [user, initialized, router]);

  const fetchRecommendations = async () => {
    if (user) {
      try {
        const recommendationsDoc = doc(db, 'users', user.uid, 'recommendations', 'daily');
        const recommendationsSnapshot = await getDoc(recommendationsDoc);
        if (recommendationsSnapshot.exists()) {
          setRecommendations(recommendationsSnapshot.data() as Recommendations);
        }
      } catch (error) {
        console.error("Error fetching data from Firestore:", error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to submit goals.');
      return;
    }
    if (!weight || !age || !goal) {
      setError('All fields are required.');
      return;
    }
    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/goals-route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          weight: parseFloat(weight),
          age: parseInt(age, 10),
          goal,
          userId: user.uid,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to submit goals.');
      }
      const data = await response.json();
      await fetch('/api/save-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId: user.uid,
          recommendations: data,
        }),
      });
      setSuccess('Goals submitted successfully.');
      setError(null);
      fetchRecommendations();
    } catch (error) {
      setError(`Error: ${(error as Error).message}`);
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRecommendations = async () => {
    if (!recommendations) {
      setError('No recommendations to update.');
      return;
    }
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/save-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId: user?.uid,
          recommendations,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to update recommendations.');
      }
      setSuccess('Recommendations updated successfully.');
      setError(null);
    } catch (error) {
      setError(`Error: ${(error as Error).message}`);
      setSuccess(null);
    }
  };

  if (!initialized) {
    return <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : ''}`}>Loading...</div>;
  }

  return (
    <Layout>
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-blue-50'}`}>
        <main className="container mx-auto px-4 py-12 mt-16">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="text-center space-y-4 mb-12">
              <h1 className={`text-5xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Your Fitness Journey
              </h1>
              <p className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Set your goals and track your progress
              </p>
            </div>

            {/* Stats Overview */}
            {recommendations && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} transform hover:scale-105 transition-transform duration-200`}>
                  <CardContent className="p-6 flex items-center space-x-4">
                    <BarChart className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Daily Calories</p>
                      <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {recommendations?.calories}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} transform hover:scale-105 transition-transform duration-200`}>
                  <CardContent className="p-6 flex items-center space-x-4">
                    <Activity className={`w-8 h-8 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Protein</p>
                      <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {recommendations?.protein}g
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} transform hover:scale-105 transition-transform duration-200`}>
                  <CardContent className="p-6 flex items-center space-x-4">
                    <Target className={`w-8 h-8 ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`} />
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Carbs</p>
                      <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {recommendations?.carbs}g
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} transform hover:scale-105 transition-transform duration-200`}>
                  <CardContent className="p-6 flex items-center space-x-4">
                    <Scale className={`w-8 h-8 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Fat</p>
                      <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {recommendations?.fat}g
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Goals Form Card */}
              <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
                <CardHeader className="space-y-1">
                  <CardTitle className={`text-2xl ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    Set Your Goals
                  </CardTitle>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Enter your details to get personalized recommendations
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="weight" className={isDarkMode ? 'text-gray-300' : ''}>
                        Weight (kg)
                      </Label>
                      <Input
                        type="number"
                        id="weight"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        required
                        className={`${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : ''} h-11`}
                        placeholder="Enter your weight"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="age" className={isDarkMode ? 'text-gray-300' : ''}>
                        Age (years)
                      </Label>
                      <Input
                        type="number"
                        id="age"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        required
                        className={`${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : ''} h-11`}
                        placeholder="Enter your age"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="goal" className={isDarkMode ? 'text-gray-300' : ''}>
                        Goal
                      </Label>
                      <Select value={goal} onValueChange={setGoal}>
                        <SelectTrigger className={`${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : ''} h-11`}>
                          <SelectValue placeholder="Select your goal" />
                        </SelectTrigger>
                        <SelectContent className={isDarkMode ? 'bg-gray-800 text-white' : ''}>
                          <SelectItem value="maintain weight">Maintain Weight</SelectItem>
                          <SelectItem value="lose weight">Lose Weight</SelectItem>
                          <SelectItem value="gain weight">Gain Weight</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className={`w-full h-11 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors duration-200`} 
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : 'Calculate Recommendations'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Recommendations Card */}
              <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
                <CardHeader className="space-y-1">
                  <CardTitle className={`text-2xl ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    Daily Recommendations
                  </CardTitle>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Adjust your targets based on your progress
                  </p>
                </CardHeader>
                <CardContent>
                  {recommendations ? (
                    <div className="space-y-6">
                      {Object.entries(recommendations).map(([key, value]) => (
                        <div key={key} className="space-y-2">
                          <Label htmlFor={key} className={`capitalize ${isDarkMode ? 'text-gray-300' : ''}`}>
                            {key} {key !== 'calories' && '(g)'}
                          </Label>
                          <Input
                            type="number"
                            id={key}
                            value={value}
                            onChange={(e) => setRecommendations({
                              ...recommendations,
                              [key]: parseFloat(e.target.value),
                            })}
                            className={`${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : ''} h-11`}
                          />
                        </div>
                      ))}
                      
                      <Button 
                        onClick={handleUpdateRecommendations} 
                        className={`w-full h-11 ${isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white transition-colors duration-200`}
                      >
                        Save Changes
                      </Button>
                    </div>
                  ) : (
                    <div className={`flex flex-col items-center justify-center h-64 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Target className="w-12 h-12 mb-4" />
                      <p className="text-center">Submit your goals to see personalized recommendations</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Alerts */}
            {(error || success) && (
              <Alert className={`mt-8 ${error 
                ? (isDarkMode ? 'bg-red-900/50 border-red-800' : 'bg-red-50 border-red-200') 
                : (isDarkMode ? 'bg-green-900/50 border-green-800' : 'bg-green-50 border-green-200')}`}
              >
                <AlertDescription className={error ? 'text-red-200' : 'text-green-200'}>
                  {error || success}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </main>
      </div>
    </Layout>
  );
};

const Goalspage: React.FC = () => {
  return (
    <DarkModeProvider>
      <Goalscontent />
    </DarkModeProvider>
  )
}
export default Goalspage
