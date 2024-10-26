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
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-b from-blue-100 to-white'}`}>
      
      <main className="container mx-auto px-4 py-8 mt-16">
        <div className="max-w-4xl mx-auto">
        
          <h1 className={`text-4xl font-bold text-center mb-8 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Set Your Fitness Goals</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className={isDarkMode ? 'bg-gray-800 text-white' : ''}>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <Darkmodebutton />
              </CardHeader>
              <CardContent>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      type="number"
                      id="weight"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      required
                      className={isDarkMode ? 'bg-gray-700 text-white' : ''}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="age">Age (years)</Label>
                    <Input
                      type="number"
                      id="age"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      required
                      className={isDarkMode ? 'bg-gray-700 text-white' : ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="goal">Goal</Label>
                    <Select value={goal} onValueChange={setGoal}>
                      <SelectTrigger className={isDarkMode ? 'bg-gray-700 text-white' : ''}>
                        <SelectValue placeholder="Select a goal" />
                      </SelectTrigger>
                      <SelectContent className={isDarkMode ? 'bg-gray-800 text-white' : ''}>
                        <SelectItem value="maintain weight">Maintain Weight</SelectItem>
                        <SelectItem value="lose weight">Lose Weight</SelectItem>
                        <SelectItem value="gain weight">Gain Weight</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className={`w-full ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : ''}`} disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Goals'}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            <Card className={isDarkMode ? 'bg-gray-800 text-white' : ''}>
              <CardHeader>
                <CardTitle>Daily Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                {recommendations ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="calories">Calories</Label>
                      <Input
                        type="number"
                        id="calories"
                        value={recommendations.calories}
                        onChange={(e) => setRecommendations({
                          ...recommendations,
                          calories: parseFloat(e.target.value),
                        })}
                        className={isDarkMode ? 'bg-gray-700 text-white' : ''}
                      />
                    </div>
                    <div>
                      <Label htmlFor="protein">Protein (g)</Label>
                      <Input
                        type="number"
                        id="protein"
                        value={recommendations.protein}
                        onChange={(e) => setRecommendations({
                          ...recommendations,
                          protein: parseFloat(e.target.value),
                        })}
                        className={isDarkMode ? 'bg-gray-700 text-white' : ''}
                      />
                    </div>
                    <div>
                      <Label htmlFor="carbs">Carbs (g)</Label>
                      <Input
                        type="number"
                        id="carbs"
                        value={recommendations.carbs}
                        onChange={(e) => setRecommendations({
                          ...recommendations,
                          carbs: parseFloat(e.target.value),
                        })}
                        className={isDarkMode ? 'bg-gray-700 text-white' : ''}
                      />
                    </div>
                    <div>
                      <Label htmlFor="fat">Fat (g)</Label>
                      <Input
                        type="number"
                        id="fat"
                        value={recommendations.fat}
                        onChange={(e) => setRecommendations({
                          ...recommendations,
                          fat: parseFloat(e.target.value),
                        })}
                        className={isDarkMode ? 'bg-gray-700 text-white' : ''}
                      />
                    </div>
                    <Button onClick={handleUpdateRecommendations} className={`w-full ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : ''}`}>
                      Update Recommendations
                    </Button>
                  </div>
                ) : (
                  <p className={`text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Submit your goals to see recommendations</p>
                )}
              </CardContent>
            </Card>
          </div>

          {(error || success) && (
            <Alert className={`mt-8 ${error ? (isDarkMode ? 'bg-red-900 text-white' : 'bg-red-100') : (isDarkMode ? 'bg-green-900 text-white' : 'bg-green-100')}`}>
              <AlertDescription>{error || success}</AlertDescription>
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
