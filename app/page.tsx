"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ResultsDisplay from '@/components/ResultsDisplay';
import Footer from '@/components/Footer';
import { useAuth } from '@/app/hooks/useAuth';
import { useAnalysis } from '@/context/AnalysisContext';
import { FoodData } from '@/components/types';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, deleteDoc, addDoc } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import HeaderMenu from '@/components/HeaderMenu';
import { db } from '@/lib/firebaseConfig';
import DailyProgress from '@/components/DailyProgress';
import '@/app/globals.css';
import { ArrowLeft, Moon, Sun } from 'lucide-react';
import Darkmodebutton from '@/components/darkmodebutton'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader } from '@/components/loader';
import { ScrollArea } from "@/components/ui/scroll-area";

import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Upload } from 'lucide-react';
import NutriVisionLoading from '@/components/NutriVisionLoading';
import { DarkModeProvider, useDarkMode } from '@/components/DarkModeContext';



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

interface ExtendedFoodData extends FoodData {
  id?: string;
  imageUrl?: string;
  timestamp?: number;
  imageFile?: File;
}

interface PastAnalysis extends ExtendedFoodData {
  id: string;
  imageUrl: string;
  timestamp: number;
}

const HomeContent = () => {
  const { analysisResult, setAnalysisResult } = useAnalysis();
  const { user, total, setTotal, saveTotalToFirestore } = useAuth();
  const { initialized } = useAuth();
  const router = useRouter();
  const [pastAnalyses, setPastAnalyses] = useState<PastAnalysis[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<PastAnalysis | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<ExtendedFoodData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState<ExtendedFoodData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [isSavingMealPlan, setIsSavingMealPlan] = useState(false);
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const storage = getStorage();
  const [recommendedMeals, setRecommendedMeals] = useState<{ [key: string]: Meal | null }>({
    breakfast: null,
    lunch: null,
    dinner: null
  });

  const loadTotalFromFirestore = async () => {
    if (user) {
      try {
        const userDoc = doc(db, 'users', user.uid);
        const docSnapshot = await getDoc(userDoc);
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          if (data) {
            setTotal({
              calories: data.total?.calories || 0,
              fat: data.total?.fat || 0,
              carbs: data.total?.carbs || 0,
              protein: data.total?.protein || 0,
            });
          }
        } else {
          console.warn('No document found for this user');
        }
      } catch (error) {
        console.error('Error loading data from Firestore:', error);
      }
    }
  };
  

  useEffect(() => {
    if (!initialized) return;

    if (!user) {
      router.push('/signin');
    } else {
      loadTotalFromFirestore().then(() => {
        fetchPastAnalyses().then(() => {
          deleteOldAnalyses().then(() => {
            // Set a timeout to simulate a minimum loading time
            setTimeout(() => {
              setIsLoading(false);
            }, 5000); // Adjust this value as needed
          });
        });
      });
    }
  }, [user, initialized, router]);

  const fetchRecommendedMeals = async () => {
    if (user) {
      const mealPlansRef = doc(db, 'users', user.uid, 'mealPlans', 'weekly');
      const mealPlansDoc = await getDoc(mealPlansRef);
      if (mealPlansDoc.exists()) {
        const mealPlansData = mealPlansDoc.data();
        console.log("meal plan data:", mealPlansData);
        const mealPlansDat = mealPlansData.mealPlans
        const today = new Date().toLocaleString('en-us', {weekday: 'long'});
        const todayMeals = mealPlansDat[today];
        if (todayMeals) {
          setRecommendedMeals({
            breakfast: todayMeals.breakfast || null,
            lunch: todayMeals.lunch || null,
            dinner: todayMeals.dinner || null
          });
        }
      }
    }
  };

  useEffect(() => {
    fetchRecommendedMeals();
  }, [user]);

  useEffect(() => {
    if (initialized && user) {
      saveTotalToFirestore(total);
    }
  }, [total, initialized, user]);

  function isFirebaseError(error: unknown): error is FirebaseError {
    return (error as FirebaseError).code !== undefined;
  }

  const fetchPastAnalyses = async () => {
    if (user) {
      const analysesRef = collection(db, 'users', user.uid, 'analyses');
      const querySnapshot = await getDocs(analysesRef);
      const analyses = await Promise.all(querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        let imageUrl = data.imageUrl;
        
        // If the imageUrl is a storage path, get the download URL
        if (imageUrl && imageUrl.startsWith('gs://')) {
          const storage = getStorage();
          const imageRef = ref(storage, imageUrl);
          try {
            imageUrl = await getDownloadURL(imageRef);
          } catch (error) {
            console.error('Error getting download URL:', error);
            imageUrl = '/placeholder-image.jpg'; // Use placeholder if download fails
          }
        }
        
        return {
          id: doc.id,
          ...data,
          imageUrl: imageUrl || '/placeholder-image.jpg',
          quantity: data.quantity || 1
        } as PastAnalysis;
      }));
      setPastAnalyses(analyses.sort((a, b) => b.timestamp - a.timestamp));
    }
  };

  
  const deleteOldAnalyses = async () => {
    if (user) {
      const storage = getStorage();
      const userDocRef = doc(db, 'users', user.uid);
      const docSnapshot = await getDoc(userDocRef);
      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
      const analysesRef = collection(db, 'users', user.uid, 'analyses');
      const querySnapshot = await getDocs(analysesRef);

      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        if (data) {
            const lastResetTimestamp = data.lastResetTimestamp?.toDate() || new Date(0);
            const now = new Date();
            const hoursDiff = (now.getTime() - lastResetTimestamp.getTime()) / (1000 * 3600);
            for (const doc of querySnapshot.docs) {
              if (hoursDiff >= 24) {
                const analysis = doc.data() as PastAnalysis;
             if (analysis.timestamp < twentyFourHoursAgo) {
          // Delete the document from Firestore
          await deleteDoc(doc.ref);

          // Delete the image from Firebase Storage
          if (analysis.imageUrl) {
            const imageRef = ref(storage, analysis.imageUrl);
            try {
              await deleteObject(imageRef);
            } catch (error) {
              console.error('Error deleting image:', error);
            }
          }

        }
              }
        }
      }
      }

      for (const doc of querySnapshot.docs) {
        const analysis = doc.data() as PastAnalysis;
        if (analysis.timestamp < twentyFourHoursAgo) {
          // Delete the document from Firestore
          await deleteDoc(doc.ref);

          // Delete the image from Firebase Storage
          if (analysis.imageUrl) {
            const imageRef = ref(storage, analysis.imageUrl);
            try {
              await deleteObject(imageRef);
            } catch (error) {
              console.error('Error deleting image:', error);
            }
          }

        }
      }

      // Refresh the past analyses
      await fetchPastAnalyses();
    }
  }


  const removeAnalysis = async (analysis: PastAnalysis) => {
    if (user) {
      // Remove from Firestore
      await deleteDoc(doc(db, 'users', user.uid, 'analyses', analysis.id));

      // Update total
      const newTotal = {
        calories: total.calories - analysis.calories,
        fat: total.fat - analysis.fat,
        carbs: total.carbs - analysis.carbs,
        protein: total.protein - analysis.protein,
      };

      setTotal(newTotal);
      await saveTotalToFirestore(newTotal);

      // Update state
      setPastAnalyses(prev => prev.filter(a => a.id !== analysis.id));
    }
  };

  const handleViewAnalysis = (analysis: PastAnalysis) => {
    setSelectedAnalysis(analysis);
    setCurrentAnalysis({
      ...analysis,
      initialQuantity: analysis.quantity || 1 // Ensure initialQuantity is set
    });
    setIsDialogOpen(true);
  };
  
  



  useEffect(() => {
    if (initialized && user) {
      fetchPastAnalyses();
      deleteOldAnalyses();

      // Set up an interval to check and delete old analyses every hour
      const intervalId = setInterval(deleteOldAnalyses, 24 * 60 * 60 * 1000);

      // Clean up the interval on component unmou
      return () => clearInterval(intervalId);
    }
  }, [initialized, user]);



  const openCamera = () => {
    fileInputRef.current?.click();
  };

  
  const handleAnalysisComplete = async (result: FoodData, file: File) => {
    const resultWithQuantity = {
      ...result,
      quantity: result.quantity || 1 // Assuming the API returns a 'quantity' field
    };
    setCurrentAnalysis({ ...resultWithQuantity, imageFile: file });
    setIsDialogOpen(true);
  };

  const updateAnalysis = async (result: ExtendedFoodData) => {
    if (result && user && result.id) {
      const newTotal = {
        calories: total.calories + (result.calories - (currentAnalysis?.calories || 0)),
        fat: total.fat + (result.fat - (currentAnalysis?.fat || 0)),
        carbs: total.carbs + (result.carbs - (currentAnalysis?.carbs || 0)),
        protein: total.protein + (result.protein - (currentAnalysis?.protein || 0)),
      };

      setTotal(newTotal);
      await saveTotalToFirestore(newTotal);

      // Update analysis in Firestore
      const analysisRef = doc(db, 'users', user.uid, 'analyses', result.id);
      await updateDoc(analysisRef, {
        name: result.name,
        calories: result.calories,
        fat: result.fat,
        carbs: result.carbs,
        protein: result.protein,
        quantity: result.quantity || 1
      });

      // Update the pastAnalyses state
      setPastAnalyses(prevAnalyses => 
        prevAnalyses.map(analysis => 
          analysis.id === result.id ? { ...analysis, ...result } : analysis
        )
      );

      // Update the currentAnalysis state
      setCurrentAnalysis(result);
    }
  };

  const addNewAnalysis = async (result: ExtendedFoodData) => {
    if (result && user) {
      const quantity = result.quantity || 1;
  const newTotal = {
    calories: total.calories + (result.calories * quantity),
    fat: total.fat + (result.fat * quantity),
    carbs: total.carbs + (result.carbs * quantity),
    protein: total.protein + (result.protein * quantity),
  };

      setTotal(newTotal);
      await saveTotalToFirestore(newTotal);

      let imageUrl = result.imageUrl || "placeholder_url";

    // If we have a file, upload it and get a permanent URL
    if (result.imageFile) {
      const storage = getStorage();
      const imageRef = ref(storage, `user-images/${user.uid}/${Date.now()}-${result.imageFile.name}`);
      await uploadBytes(imageRef, result.imageFile);
      imageUrl = await getDownloadURL(imageRef);
    }

    // Save analysis to Firestore with the permanent URL
    const analysesRef = collection(db, 'users', user.uid, 'analyses');
    const docRef = await addDoc(analysesRef, {
      name: result.name,
      calories: result.calories,
      fat: result.fat,
      carbs: result.carbs,
      protein: result.protein,
      imageUrl: imageUrl,
      timestamp: Date.now(),
      quantity: result.quantity || 1
    });
      // Create the new analysis object
      const newAnalysis = {
        ...result,
        id: docRef.id,
        imageUrl: imageUrl,
        timestamp: Date.now()
      };

      // Update the pastAnalyses state
      setPastAnalyses(prevAnalyses => [newAnalysis, ...prevAnalyses]);

      // Update the currentAnalysis state
      setCurrentAnalysis(newAnalysis);

      setTempImageUrl(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const formData = new FormData();
      formData.append('image', selectedFile);
  
      setIsAnalyzing(true);
  
      try {
        // Create a temporary URL for preview
        const tempUrl = URL.createObjectURL(selectedFile);
        setTempImageUrl(tempUrl);
  
        const response = await fetch('/api/analyze', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
  
        if (response.ok) {
          console.log('Analysis result:', data);
          // Pass the selectedFile to handleAnalysisComplete
          await handleAnalysisComplete({...data, imageFile: selectedFile}, selectedFile);
        } else {
          console.error('Error:', data.error);
          if (data.rawResponse) {
            console.log('Raw Gemini response:', data.rawResponse);
          }
        }
      } catch (error) {
        console.error('Error uploading image:', error);
      } finally {
        setIsAnalyzing(false);
        // Clean up the temporary URL
      }
    }
  };

  


  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedAnalysis(null);
    setCurrentAnalysis(null);
  };
  

  

  if (!initialized) {
    <NutriVisionLoading />
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="dark:bg-gray-900 dark:text-white min-h-screen">
        <HeaderMenu />
        <main className="pt-24 min-h-screen bg-gradient-to-b from-blue-100 to-white dark:from-gray-800 dark:to-gray-900 flex flex-col items-center justify-start p-4">
          <div className="w-full text-center mb-8 relative">
            
            <Darkmodebutton />
            <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-800 dark:text-white mb-4 mt-8">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-500 to-gray-500 dark:from-gray-300 dark:to-gray-300">
                NutriVision
              </span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 font-light">
              Visualize Your Nutrition Journey
            </p>
          </div>

        <div className="max-w-7xl w-full space-y-8">
          {/* Daily Progress */}
          <Card className="shadow-lg dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-2xl font-bold dark:text-white">Daily Progress</CardTitle>
              <CardDescription className="dark:text-gray-300">Track your nutritional intake today</CardDescription>
            </CardHeader>
            <CardContent>
              <DailyProgress />
            </CardContent>
          </Card>

          {/* Past Analyses */}
          <Card className="shadow-lg dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-2xl font-bold dark:text-white">Past Analyses</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] sm:h-[400px] pr-4">
                {pastAnalyses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {pastAnalyses.map((analysis) => (
                      <Card key={analysis.id} className="shadow-sm hover:shadow-md transition-shadow duration-200 dark:bg-gray-700">
                        <CardContent className="p-4">
                          <div className="relative w-full pb-[75%] mb-2">
                            <img 
                              src={analysis.imageUrl} 
                              alt={analysis.name} 
                              className="absolute top-0 left-0 w-full h-full object-cover rounded-lg"
                            />
                          </div>
                          <h3 className="font-semibold text-lg mb-1 truncate dark:text-white" title={analysis.name}>{analysis.name}</h3>
                          <div className="grid grid-cols-2 gap-1 text-xs text-gray-600 dark:text-gray-300 mb-2">
                            <p>Calories: {analysis.calories} kcal</p>
                            <p>Fat: {analysis.fat} g</p>
                            <p>Carbs: {analysis.carbs} g</p>
                            <p>Protein: {analysis.protein} g</p>
                          </div>
                          <div className="flex justify-between mt-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewAnalysis(analysis)}
                              className="dark:bg-gray-600 dark:text-white"
                            >
                              View
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => removeAnalysis(analysis)}
                            >
                              Remove
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No past analyses available. Please upload a photo in the bottom right corner.</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Today's Recommended Meals */}
          <Card className="shadow-lg dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-2xl font-bold dark:text-white">Todays Recommended Meals</CardTitle>
              <CardDescription className="dark:text-gray-300">Based on your meal plan for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(recommendedMeals).map(([mealType, meal]) => (
                  <Card key={mealType} className="dark:bg-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold capitalize dark:text-white">{mealType}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {meal ? (
                        <>
                          <p className="font-medium dark:text-white">{meal.name}</p>
                          <p className="dark:text-gray-300">Calories: {meal.calories} kcal</p>
                          <p className="dark:text-gray-300">Amount: {meal.amount}</p>
                          <div className="mt-2">
                            <p className="font-medium dark:text-white">Macronutrients:</p>
                            <p className="dark:text-gray-300">Protein: {meal.macronutrients.protein}g</p>
                            <p className="dark:text-gray-300">Carbs: {meal.macronutrients.carbs}g</p>
                            <p className="dark:text-gray-300">Fat: {meal.macronutrients.fat}g</p>
                          </div>
                        </>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">No meal recommended</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
  <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] overflow-y-auto p-0 dark:bg-gray-800">
    <div className="relative w-full h-64">
      <img 
        src={selectedAnalysis?.imageUrl || tempImageUrl || '/placeholder-image.jpg'} 
        alt={selectedAnalysis?.name || 'Food analysis'} 
        className="w-full h-full object-cover"
      />
      <Button 
        className="absolute top-4 left-4 bg-white/80 hover:bg-white/90 text-black rounded-full p-2 dark:bg-gray-800/80 dark:hover:bg-gray-800/90 dark:text-white"
        onClick={() => setIsDialogOpen(false)}
      >
        <ArrowLeft className="w-6 h-6" />
      </Button>
    </div>
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 dark:text-white">
        {selectedAnalysis?.name || 'Analysis Results'}
      </h2>
      {currentAnalysis && (
        <ResultsDisplay 
          foodData={currentAnalysis} 
          setAnalysisResult={(result) => {
            if (result.id) {
              updateAnalysis(result);
            } else {
              addNewAnalysis(result);
            }
            setIsDialogOpen(false);
          }}
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </div>
  </DialogContent>
</Dialog>
      <button
        onClick={openCamera}
        className="fixed bottom-4 right-4 p-4 rounded-full shadow-lg bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
      >
        <Upload className="w-6 h-6 text-white" />
      </button>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept="image/*"
      />

<Footer />
      </div>
    </div>
  );
};

export default function Home() {
  return (
    <DarkModeProvider>
      <HomeContent />
    </DarkModeProvider>
  );
}
